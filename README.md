# NearMe (Geo-Spatial 추천 서비스)

위치 기반으로 주변 카페/맛집/편의점/미용실을 추천하는 웹 서비스 샘플입니다. Elasticsearch의 geo 기능과 간단한 JWT 인증을 포함합니다.

## 구성
- **Frontend**: React + Vite + Axios + Kakao Map JS SDK
- **Backend**: Node.js + Express + Typescript + Elasticsearch Node Client + JWT/bcrypt
- **Infra**: Docker, docker-compose, Elasticsearch 8.x, Nginx (frontend)

## 빠른 시작 (Docker)
```bash
docker-compose up -d --build
```
- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:4000/api
- Elasticsearch: http://localhost:9200

## 개발 모드
### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```
기본 포트 `4000`. Elasticsearch 주소는 `.env`의 `ES_NODE_URL`에서 설정합니다.

### Frontend
```bash
cd frontend
cp .env.example .env  # VITE_KAKAO_MAP_KEY 입력 필수
npm install
npm run dev -- --host
```
기본 API 베이스는 `VITE_API_URL` (기본 http://localhost:4000/api).

## API 요약 (`/api` prefix)
- `POST /auth/register` — 이메일/비밀번호/닉네임으로 회원가입 (메모리 저장)
- `POST /auth/login` — JWT 발급
- `GET /places/nearby?lat&lon&radius=1000&category=cafe` — 반경 검색 + 거리순 정렬
- `POST /places/within-bbox` — 지도 영역 검색
- `GET /places/:id` — 장소 상세 (Elasticsearch 문서)
- `GET /places/:id/reviews` — 리뷰 조회 (메모리 저장)
- `POST /places/:id/reviews` — 리뷰 작성 (Bearer JWT 필요)

## Elasticsearch 인덱스
애플리케이션 시작 시 `places` 인덱스를 확인 후 없으면 다음 매핑으로 생성합니다:
```
name (text), category (keyword), address (text), location (geo_point),
avg_rating (float), rating_count (integer), tags (keyword), created_at/updated_at (date)
```
샘플 문서는 README 상단의 예시를 참고해 직접 색인하세요.

## 데이터 크롤링/색인 (Overpass → Elasticsearch)
- OpenStreetMap Overpass API를 사용해 카페/맛집/편의점/미용실 등 POI를 수집하고 정제해 `places` 인덱스에 벌크 색인합니다.
- 실행 방법:
  ```bash
  cd backend
  npm install
  ES_NODE_URL=http://localhost:9200 npm run crawl:places
  ```
- 기본 bbox는 서울 중심부 4개 그리드입니다. 다른 지역을 넣고 싶으면 `backend/src/scripts/crawlPlaces.ts`의 `DEFAULT_BBOXES`를 수정하면 됩니다.
- 전국/대규모 크롤링 시 Overpass API가 429를 반환할 수 있으니, 지연 시간을 늘리거나 다른 엔드포인트를 환경변수로 지정해 사용하세요:
  ```bash
  OVERPASS_URL=https://overpass.kumi.systems/api/interpreter \
  OVERPASS_DELAY_MS=12000 \
  ES_NODE_URL=http://localhost:9200 npm run crawl:places
  ```

## 폴더 구조
```
project/
  backend/
    src/app.ts
    src/routes/*
    src/controllers/*
    src/services/*
    src/middlewares/*
    Dockerfile
  frontend/
    src/pages/*
    src/components/*
    src/api/*
    Dockerfile
  docker-compose.yml
  README.md
```

## 인증/리뷰 동작 메모
- 사용자/리뷰 데이터는 데모용으로 서버 메모리에 저장됩니다. (재시작 시 초기화)
- JWT 발행 시 `.env`의 `JWT_SECRET`, `TOKEN_EXPIRES_IN`을 사용합니다.

## 지도 연동
- Kakao Map JS SDK를 사용합니다. `frontend/.env`에 `VITE_KAKAO_MAP_KEY=<your_key>`를 설정하세요.
- 지도를 이동하거나 확대/축소하면 현재 Bounding Box를 갱신하며, "지도 영역 검색"으로 해당 영역만 필터링할 수 있습니다.
