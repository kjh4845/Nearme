import { ensurePlacesIndex, esClient } from '../lib/elasticsearch';
import type { Place } from '../types';

type BBox = { south: number; west: number; north: number; east: number };

type OverpassElement = {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type PlaceDocument = Omit<Place, 'id'> & { source_id: string };

const OVERPASS_URL = process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter';
const AMENITY_FILTERS = ['cafe', 'restaurant', 'fast_food', 'convenience', 'hairdresser', 'beauty'];
const SHOP_FILTERS = ['convenience', 'supermarket', 'bakery', 'department_store', 'hairdresser', 'beauty'];
const RETRIES_PER_BBOX = 4;
const BASE_DELAY_MS = parseInt(process.env.OVERPASS_DELAY_MS || '8000', 10); // slow default to avoid rate limit
// South Korea nationwide grid (roughly 6 lat bands x 7 lon bands)
const LAT_BANDS: Array<{ south: number; north: number }> = [
  { south: 33.0, north: 34.0 },
  { south: 34.0, north: 35.0 },
  { south: 35.0, north: 36.0 },
  { south: 36.0, north: 37.0 },
  { south: 37.0, north: 38.0 },
  { south: 38.0, north: 38.8 },
];

const LON_BANDS: Array<{ west: number; east: number }> = [
  { west: 124.5, east: 125.5 },
  { west: 125.5, east: 126.5 },
  { west: 126.5, east: 127.5 },
  { west: 127.5, east: 128.5 },
  { west: 128.5, east: 129.5 },
  { west: 129.5, east: 130.5 },
  { west: 130.5, east: 131.5 },
];

const DEFAULT_BBOXES: BBox[] = LAT_BANDS.flatMap((lat) =>
  LON_BANDS.map((lon) => ({
    south: lat.south,
    north: lat.north,
    west: lon.west,
    east: lon.east,
  }))
);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function buildOverpassQuery(bbox: BBox) {
  const { south, west, north, east } = bbox;
  const regexAmenity = AMENITY_FILTERS.join('|');
  const regexShop = SHOP_FILTERS.join('|');
  return `[out:json][timeout:30];(
    node["amenity"~"${regexAmenity}"](${south},${west},${north},${east});
    way["amenity"~"${regexAmenity}"](${south},${west},${north},${east});
    relation["amenity"~"${regexAmenity}"](${south},${west},${north},${east});
    node["shop"~"${regexShop}"](${south},${west},${north},${east});
    way["shop"~"${regexShop}"](${south},${west},${north},${east});
    relation["shop"~"${regexShop}"](${south},${west},${north},${east});
  );out center;`;
}

async function fetchOverpass(bbox: BBox): Promise<OverpassElement[]> {
  const query = buildOverpassQuery(bbox);
  let attempt = 0;

  // basic retry with backoff to handle 429
  while (attempt < RETRIES_PER_BBOX) {
    attempt += 1;
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: query,
    });

    const text = await res.text();

    if (res.ok) {
      try {
        const data = JSON.parse(text) as { elements?: OverpassElement[] };
        return data.elements || [];
      } catch (err) {
        console.warn(`Overpass JSON parse failed on attempt ${attempt}: ${String(err)} | snippet=${text.slice(0, 120)}`);
      }
    }

    const isRateLimited = res.status === 429 || text.includes('rate_limited');
    const delay = BASE_DELAY_MS * attempt;
    console.warn(
      `Overpass error ${res.status} on attempt ${attempt}/${RETRIES_PER_BBOX} (sleep ${delay}ms): ${text.slice(0, 200)}`
    );
    if (!isRateLimited && attempt >= RETRIES_PER_BBOX) {
      throw new Error(`Overpass API error ${res.status}: ${text}`);
    }
    await sleep(delay);
  }

  throw new Error('Overpass API failed after retries');
}

function normalizeCategory(tagValue?: string): PlaceDocument['category'] | null {
  switch (tagValue) {
    case 'cafe':
      return 'cafe';
    case 'restaurant':
    case 'fast_food':
      return 'restaurant';
    case 'convenience':
    case 'supermarket':
    case 'department_store':
      return 'convenience';
    case 'bakery':
      return 'cafe'; // treat bakery as cafe-like
    case 'hairdresser':
    case 'beauty':
      return 'salon';
    default:
      return null;
  }
}

function pickName(tags: Record<string, string>): string | null {
  const candidate = tags.name || tags['name:ko'] || tags['name:en'] || tags.brand;
  return candidate ? candidate.trim() : null;
}

function buildAddress(tags: Record<string, string>): string | undefined {
  const parts = [
    tags['addr:full'],
    tags['addr:city'],
    tags['addr:district'],
    tags['addr:suburb'],
    tags['addr:neighbourhood'],
    tags['addr:street'] && tags['addr:housenumber']
      ? `${tags['addr:street']} ${tags['addr:housenumber']}`
      : tags['addr:street'],
    tags['addr:place'],
  ].filter(Boolean) as string[];

  const unique = Array.from(new Set(parts.map((v) => v.trim()).filter(Boolean)));
  return unique.length ? unique.join(' ') : undefined;
}

function pickTags(tags: Record<string, string>): string[] | undefined {
  const values = ['cuisine', 'brand', 'takeaway', 'delivery', 'wheelchair', 'payment']
    .map((k) => tags[k])
    .filter(Boolean) as string[];
  const unique = Array.from(new Set(values.map((v) => v.trim())));
  return unique.length ? unique : undefined;
}

function toPlaceDocument(element: OverpassElement): PlaceDocument | null {
  const tags = element.tags || {};
  const category = normalizeCategory(tags.amenity || tags.shop);
  if (!category) return null;

  const name = pickName(tags);
  if (!name) return null;

  const coords =
    element.type === 'node' && typeof element.lat === 'number' && typeof element.lon === 'number'
      ? { lat: element.lat, lon: element.lon }
      : element.center && typeof element.center.lat === 'number' && typeof element.center.lon === 'number'
      ? { lat: element.center.lat, lon: element.center.lon }
      : null;
  if (!coords) return null;

  const now = new Date().toISOString();
  return {
    source_id: `${element.type}-${element.id}`,
    name,
    category,
    address: buildAddress(tags),
    location: coords,
    tags: pickTags(tags),
    created_at: now,
    updated_at: now,
  };
}

function dedupeKey(place: PlaceDocument) {
  return [
    place.category,
    place.name.toLowerCase(),
    place.location.lat.toFixed(4),
    place.location.lon.toFixed(4),
  ].join('|');
}

async function collectPlaces(): Promise<PlaceDocument[]> {
  const store = new Map<string, PlaceDocument>();

  for (const bbox of DEFAULT_BBOXES) {
    console.log(
      `Fetching bbox south=${bbox.south} west=${bbox.west} north=${bbox.north} east=${bbox.east}`
    );
    const elements = await fetchOverpass(bbox);
    console.log(`  → received ${elements.length} elements`);

    for (const element of elements) {
      const place = toPlaceDocument(element);
      if (!place) continue;
      const key = dedupeKey(place);
      if (!store.has(key)) store.set(key, place);
    }

    await sleep(BASE_DELAY_MS); // be gentle to Overpass
  }

  return Array.from(store.values());
}

async function bulkIndex(places: PlaceDocument[]) {
  const chunkSize = 500;
  let indexed = 0;

  for (let i = 0; i < places.length; i += chunkSize) {
    const slice = places.slice(i, i + chunkSize);
    const body = slice.flatMap((doc) => [{ index: { _index: 'places', _id: doc.source_id } }, doc]);

    const res = await esClient.bulk({ refresh: true, body });
    if (res.errors) {
      const errored = res.items?.filter((item: any) => item.index?.error) || [];
      console.error(`Bulk chunk failed for ${errored.length} documents`, errored.slice(0, 3));
      throw new Error('Bulk indexing failed');
    }

    indexed += slice.length;
    console.log(`Indexed ${indexed}/${places.length}`);
  }
}

async function main() {
  console.log('Starting crawl for South Korea (cafe/restaurant/convenience/salon + shop tags)...');
  await ensurePlacesIndex();

  const places = await collectPlaces();
  console.log(`Collected ${places.length} cleaned places after de-duplication`);

  if (!places.length) {
    console.log('No places collected, aborting');
    return;
  }

  await bulkIndex(places);
  console.log('Done. Elasticsearch index populated.');
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
