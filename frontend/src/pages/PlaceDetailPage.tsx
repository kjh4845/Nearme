import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { addReview, fetchPlace, fetchReviews } from '../api/places';
import MapView from '../components/MapView';
import { useAuth } from '../hooks/useAuth';
import type { Place, Review } from '../types';

export default function PlaceDetailPage() {
  const { id } = useParams();
  const [place, setPlace] = useState<Place | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const categoryLabel = (cat: string) =>
    ({ cafe: '카페', restaurant: '밥집', convenience: '편의점', salon: '미용실' } as Record<string, string>)[cat] ||
    cat;

  const renderStars = (value: number) => {
    const filled = '★'.repeat(Math.round(value));
    const empty = '☆'.repeat(5 - Math.round(value));
    return (
      <span aria-label={`별점 ${value}점`} style={{ color: '#f5a623', fontSize: 14, letterSpacing: 1 }}>
        {filled}
        <span style={{ color: '#ccc' }}>{empty}</span>
      </span>
    );
  };

  const RatingPicker = () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      {[1, 2, 3, 4, 5].map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => setRating(v)}
          aria-label={`${v}점`}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: 4,
            color: v <= rating ? '#f5a623' : '#ccc',
            fontSize: 20,
            lineHeight: 1,
          }}
        >
          {v <= rating ? '★' : '☆'}
        </button>
      ))}
      <span className="subtle">{rating}점</span>
    </div>
  );

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const [p, r] = await Promise.all([fetchPlace(id), fetchReviews(id)]);
        setPlace(p);
        setReviews(r);
      } catch (err: any) {
        setMessage(err.message || '장소 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!user || !token) {
      navigate('/login');
      return;
    }
    try {
      const review = await addReview(id, { rating, comment });
      setReviews((prev) => [review, ...prev]);
      setComment('');
      setMessage('리뷰가 등록되었습니다.');
    } catch (err: any) {
      setMessage(err.message || '리뷰 등록에 실패했습니다.');
    }
  };

  if (loading) return <p>불러오는 중...</p>;
  if (!place) return <p>장소 정보를 찾지 못했습니다.</p>;

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="card">
        <h2 className="page-title">{place.name}</h2>
        <p className="subtle">{categoryLabel(place.category)}</p>
        {place.address && <p>{place.address}</p>}
        {place.tags && place.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {place.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <MapView center={place.location} places={[place]} height={260} />

      <div className="card stack">
        <div className="section-title">
          <span>리뷰</span>
          <span className="subtle">{reviews.length}개</span>
        </div>
        {reviews.length === 0 && <p className="subtle">첫 리뷰를 남겨보세요.</p>}
        <div className="stack">
          {reviews.map((r) => (
            <div key={r.id} className="review-item">
              <strong>{r.nickname}</strong> · {renderStars(r.rating)}
              <p style={{ margin: '6px 0' }}>{r.comment || '코멘트 없음'}</p>
              <small className="muted">{new Date(r.createdAt).toLocaleString()}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="card form-card">
        <h3 style={{ marginTop: 0 }}>리뷰 작성</h3>
        {!user && <p className="subtle">로그인하면 리뷰를 남길 수 있습니다.</p>}
        <form className="stack" onSubmit={handleSubmit}>
          <div>
            <label>별점</label>
            <RatingPicker />
          </div>
          <div>
            <label>코멘트</label>
            <textarea
              className="textarea"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="방문 경험을 공유해주세요"
            />
          </div>
          <button className="btn" type="submit" disabled={!user}>
            등록하기
          </button>
          {message && <small className="subtle">{message}</small>}
        </form>
      </div>
    </div>
  );
}
