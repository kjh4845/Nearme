import { Client } from '@elastic/elasticsearch';
import { config } from './env';

export const esClient = new Client({ node: config.esNode });

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
