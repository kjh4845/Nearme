import { useEffect, useRef, useState } from 'react';
import type { Coordinates, Place } from '../types';

declare global {
  interface Window {
    kakao: any;
  }
}

const scriptId = 'kakao-map-sdk';

function loadKakao(key: string) {
  return new Promise<void>((resolve, reject) => {
    if ((window as any).kakao && (window as any).kakao.maps) return resolve();
    const existing = document.getElementById(scriptId);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Kakao map'));
    document.head.appendChild(script);
  });
}

interface MapViewProps {
  center?: Coordinates | null;
  places: Place[];
  height?: number;
  onBoundsChange?: (bbox: { top_left: Coordinates; bottom_right: Coordinates }) => void;
}

export default function MapView({ center, places, height = 340, onBoundsChange }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    const key = import.meta.env.VITE_KAKAO_MAP_KEY as string | undefined;
    if (!key) {
      setError('VITE_KAKAO_MAP_KEY가 설정되지 않아 지도를 불러올 수 없습니다.');
      return;
    }
    loadKakao(key)
      .then(() => {
        window.kakao.maps.load(() => {
          if (!mapContainer.current) return;
          const map = new window.kakao.maps.Map(mapContainer.current, {
            center: center
              ? new window.kakao.maps.LatLng(center.lat, center.lon)
              : new window.kakao.maps.LatLng(37.5665, 126.978),
            level: 4,
          });
          mapRef.current = map;
          setMapReady(true);
        });
      })
      .catch((err) => setError(err.message));
  }, [center]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.kakao?.maps || !onBoundsChange) return;
    const handler = () => {
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      onBoundsChange({
        top_left: { lat: ne.getLat(), lon: sw.getLng() },
        bottom_right: { lat: sw.getLat(), lon: ne.getLng() },
      });
    };
    window.kakao.maps.event.addListener(map, 'idle', handler);
    return () => window.kakao.maps.event.removeListener(map, 'idle', handler);
  }, [onBoundsChange, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.kakao?.maps || !mapReady) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    places.forEach((place) => {
      const position = new window.kakao.maps.LatLng(place.location.lat, place.location.lon);
      const marker = new window.kakao.maps.Marker({ position });
      marker.setMap(map);
      markersRef.current.push(marker);
    });

    if (center) {
      map.setCenter(new window.kakao.maps.LatLng(center.lat, center.lon));
    }
  }, [places, center, mapReady]);

  if (error) {
    return <div className="kakao-warning">{error}</div>;
  }

  return <div ref={mapContainer} className="map-shell" style={{ height }} />;
}
