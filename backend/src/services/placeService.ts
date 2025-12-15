import { esClient } from '../lib/elasticsearch';
import { Place } from '../types';

interface NearbyParams {
  lat: number;
  lon: number;
  radius: string;
  category?: string;
  size?: number;
}

interface BboxParams {
  top_left: { lat: number; lon: number };
  bottom_right: { lat: number; lon: number };
  category?: string;
  size?: number;
}

export async function searchNearbyPlaces(params: NearbyParams) {
  const filters: any[] = [
    {
      geo_distance: {
        distance: params.radius,
        location: { lat: params.lat, lon: params.lon },
      },
    },
  ];

  if (params.category) {
    filters.push({ term: { category: params.category } });
  }

  const result = await esClient.search<Place>({
    index: 'places',
    size: params.size || 50,
    query: {
      bool: {
        filter: filters,
      },
    },
    sort: [
      {
        _geo_distance: {
          location: { lat: params.lat, lon: params.lon },
          order: 'asc',
          unit: 'm',
        },
      },
    ],
  });

  return result.hits.hits.map((hit) => ({
    id: hit._id,
    distance_m: hit.sort?.[0] || null,
    ...hit._source,
  }));
}

export async function searchWithinBoundingBox(params: BboxParams) {
  const filters: any[] = [
    {
      geo_bounding_box: {
        location: {
          top_left: params.top_left,
          bottom_right: params.bottom_right,
        },
      },
    },
  ];

  if (params.category) {
    filters.push({ term: { category: params.category } });
  }

  const result = await esClient.search<Place>({
    index: 'places',
    size: params.size || 50,
    query: {
      bool: {
        filter: filters,
      },
    },
  });

  return result.hits.hits.map((hit) => ({ id: hit._id, ...hit._source }));
}

export async function getPlaceById(id: string) {
  try {
    const doc = await esClient.get<Place>({ index: 'places', id });
    if (!doc.found) return null;
    return { id: doc._id, ...doc._source } as Place & { id: string };
  } catch (err: any) {
    if (err.meta?.statusCode === 404) return null;
    throw err;
  }
}
