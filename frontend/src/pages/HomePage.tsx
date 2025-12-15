import { useEffect, useState } from 'react';
import { fetchNearby, fetchWithinBox } from '../api/places';
import MapView from '../components/MapView';
import PlaceList from '../components/PlaceList';
import type { Coordinates, Place } from '../types';

export default function HomePage() {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [category, setCategory] = useState<string>('cafe');
  const [radius, setRadius] = useState<number>(1000);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('도착 범위를 설정하세요');
  const [bbox, setBbox] = useState<{ top_left: Coordinates; bottom_right: Coordinates } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus('브라우저가 위치 정보를 지원하지 않습니다.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setCoords(next);
        setStatus('');
      },
      () => setStatus('위치 허용을 확인해주세요.'),
      { enableHighAccuracy: true }
    );
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) return;
    setStatus('위치 업데이트 중...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setCoords(next);
        setStatus('');
      },
      () => setStatus('위치 허용을 확인해주세요.'),
      { enableHighAccuracy: true }
    );
  };

  const handleNearby = async () => {
    if (!coords) {
      requestLocation();
      return;
    }
    setLoading(true);
    setStatus('내 주변을 검색 중...');
    try {
      const data = await fetchNearby({ lat: coords.lat, lon: coords.lon, radius, category });
      setPlaces(data);
      setStatus(`결과 ${data.length}개`);
    } catch (err: any) {
      setStatus(err.message || '검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithinBox = async () => {
    if (!bbox) return;
    setLoading(true);
    setStatus('지도 영역을 검색 중...');
    try {
      const data = await fetchWithinBox({ ...bbox, category });
      setPlaces(data);
      setStatus(`영역 내 결과 ${data.length}개`);
    } catch (err: any) {
      setStatus(err.message || '검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="hero">
        <h1>가까운 즐겨찾기를 빠르게, NearMe</h1>
        <p>현재 위치나 지도에서 보고 있는 영역 기준으로 카페·밥집·편의점을 바로 탐색하세요.</p>
      </div>

      <div className="card stack" style={{ gap: 16 }}>
        <div className="form-grid">
          <div>
            <label>카테고리</label>
            <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="cafe">카페</option>
              <option value="restaurant">밥집</option>
              <option value="convenience">편의점</option>
              <option value="salon">미용실</option>
            </select>
          </div>
          <div>
            <label>반경 (m)</label>
            <input
              className="input"
              type="number"
              min={100}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
            />
          </div>
          <div>
            <label>위도</label>
            <input
              className="input"
              type="number"
              value={coords?.lat ?? ''}
              placeholder="37.5665"
              onChange={(e) => setCoords((prev) => ({ lon: prev?.lon ?? 0, lat: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label>경도</label>
            <input
              className="input"
              type="number"
              value={coords?.lon ?? ''}
              placeholder="126.9780"
              onChange={(e) => setCoords((prev) => ({ lat: prev?.lat ?? 0, lon: Number(e.target.value) }))}
            />
          </div>
        </div>

        <div className="inline-actions" style={{ alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn" onClick={handleNearby} disabled={loading}>
              내 주변 검색
            </button>
            <button className="btn secondary" onClick={handleWithinBox} disabled={!bbox || loading}>
              지도 영역 검색
            </button>
            <button className="btn ghost" onClick={requestLocation} disabled={loading}>
              내 위치 불러오기
            </button>
          </div>
          <div className="subtle" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>{bbox ? '현재 지도 영역을 검색할 수 있어요' : '지도를 움직이면 영역이 저장됩니다'}</span>
            {status && <span>{status}</span>}
          </div>
        </div>
      </div>

      <MapView
        center={coords}
        places={places}
        height={360}
        onBoundsChange={(b) => setBbox(b)}
      />

      <div>
        <div className="section-title">
          <span>검색 결과</span>
          <span className="subtle">{places.length}곳</span>
        </div>
        <PlaceList places={places} />
      </div>
    </div>
  );
}
