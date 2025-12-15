import { Client } from '@elastic/elasticsearch';
import { config } from './env';

export const esClient = new Client({ node: config.esNode });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function waitForElasticsearch() {
  const maxAttempts = parseInt(process.env.ES_STARTUP_RETRIES || '20', 10);
  const delayMs = parseInt(process.env.ES_STARTUP_DELAY_MS || '1500', 10);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await esClient.info();
      return;
    } catch (err: any) {
      const isLast = attempt === maxAttempts;
      console.warn(`Elasticsearch not ready (attempt ${attempt}/${maxAttempts}): ${err?.message || err}`);
      if (isLast) throw err;
      await sleep(delayMs);
    }
  }
}

export async function ensurePlacesIndex() {
  const index = 'places';
  const exists = await esClient.indices.exists({ index });
  if (!exists) {
    await esClient.indices.create({
      index,
      mappings: {
        properties: {
          name: { type: 'text' },
          category: { type: 'keyword' },
          address: { type: 'text' },
          location: { type: 'geo_point' },
          avg_rating: { type: 'float' },
          rating_count: { type: 'integer' },
          tags: { type: 'keyword' },
          created_at: { type: 'date' },
          updated_at: { type: 'date' },
        },
      },
    });
  }
}
