import { Request, Response } from 'express';
import { getPlaceById, searchNearbyPlaces, searchWithinBoundingBox } from '../services/placeService';

export async function getNearby(req: Request, res: Response) {
  const { lat, lon, radius, category } = req.query;
  const latNum = Number(lat);
  const lonNum = Number(lon);
  if (Number.isNaN(latNum) || Number.isNaN(lonNum)) {
    return res.status(400).json({ message: 'lat and lon must be numbers' });
  }
  const radiusValue = radius ? `${radius}` : '1km';
  try {
    const results = await searchNearbyPlaces({
      lat: latNum,
      lon: lonNum,
      radius: radiusValue,
      category: category as string | undefined,
    });
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

export async function getWithinBbox(req: Request, res: Response) {
  const { top_left, bottom_right, category } = req.body || {};
  if (!top_left || !bottom_right) {
    return res.status(400).json({ message: 'top_left and bottom_right are required' });
  }
  try {
    const results = await searchWithinBoundingBox({
      top_left,
      bottom_right,
      category,
    });
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

export async function getPlace(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const place = await getPlaceById(id);
    if (!place) return res.status(404).json({ message: 'Place not found' });
    res.json(place);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}
