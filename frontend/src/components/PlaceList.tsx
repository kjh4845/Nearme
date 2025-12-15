import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Place } from '../types';

interface Props {
  places: Place[];
}

export default function PlaceList({ places }: Props) {
  const navigate = useNavigate();
  const formatter = useMemo(() => new Intl.NumberFormat('ko-KR'), []);
  const labelCategory = (cat: string) =>
    ({ cafe: '카페', restaurant: '밥집', convenience: '편의점', salon: '미용실' } as Record<string, string>)[cat] ||
    cat;

  if (!places.length) return <p className="subtle">검색 결과가 비어 있습니다.</p>;

  return (
    <div className="list-grid">
      {places.map((place) => (
        <button
          key={place.id}
          className="place-card"
          style={{ textAlign: 'left', cursor: 'pointer', border: '1px solid var(--border)' }}
          onClick={() => navigate(`/place/${place.id}`)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4>
              {place.name}
              <span className="badge">{labelCategory(place.category)}</span>
            </h4>
            {place.distance_m != null && (
              <small className="muted">{formatter.format(Math.round(place.distance_m))} m</small>
            )}
          </div>
          {place.address && <small className="muted">{place.address}</small>}
          {place.tags && place.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {place.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
