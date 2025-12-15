# Ubuntu 서버에서 Docker 배포 가이드

우분투 22.04+ 기준, Docker Compose로 `NearMe`를 배포하는 절차입니다.

## 1) 필수 패키지 설치
```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl enable --now docker
```

## 2) Elasticsearch 커널 파라미터 설정
```bash
echo "vm.max_map_count=262144" | sudo tee /etc/sysctl.d/99-nearme.conf
sudo sysctl --system
```

## 3) 소스 가져오기
```bash
git clone https://github.com/kjh4845/Nearme.git
cd Nearme
```

## 4) 환경 변수 준비
`docker-compose.yml`에서 사용되는 값들을 안전한 값으로 바꿔주세요.

- 백엔드: `ES_NODE_URL`(기본 `http://elasticsearch:9200`), `PORT`(기본 4000), `JWT_SECRET`, `TOKEN_EXPIRES_IN`, `BCRYPT_SALT_ROUNDS`
- 프론트엔드: `VITE_KAKAO_MAP_KEY` (발급 키 필수), `VITE_API_URL`(기본 `/api`)

편의상 루트 `.env`를 만들어 compose가 읽게 할 수 있습니다:
```bash
cat <<'EOF' > .env
JWT_SECRET=your-strong-secret
TOKEN_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
VITE_KAKAO_MAP_KEY=your-kakao-key
VITE_API_URL=/api
EOF
```
> 필요 시 `docker-compose.yml`의 하드코딩된 값 대신 `.env`를 참조하도록 수정하거나, 실행 시 `JWT_SECRET=... VITE_KAKAO_MAP_KEY=... docker compose ...` 형태로 넘겨주세요.

## 5) 빌드 및 실행
```bash
docker compose up -d --build
```
- 프론트엔드: `http://<서버_IP>` (포트 80으로 노출, proxy가 80/443 담당)
- 백엔드 API: `http://<서버_IP>:4000/api`
- Elasticsearch: `http://<서버_IP>:9200`

## 6) HTTPS(셀프사인) 사용하기
- proxy 컨테이너가 시작 시 self-signed 인증서를 생성해 80→443 리다이렉트, TLS 종료를 수행합니다.
- 기본 CN/SAN은 `localhost`/`127.0.0.1`이므로 IP/도메인을 SAN에 넣어 경고를 최소화하세요(브라우저 경고는 남음).
```bash
export SSL_CN=nearme.local             # CN
export SSL_SAN="DNS:nearme.local,IP:<서버_IP>,DNS:localhost,IP:127.0.0.1"
docker compose down
docker compose up -d --build proxy
```
- 브라우저에서 “안전하지 않음/고급” 경고를 통과해야 합니다. 실서비스는 공인 인증서(로드밸런서/Let’s Encrypt)를 권장합니다.

## 6) 상태 확인
```bash
docker compose ps
docker compose logs backend -f
curl http://localhost:4000/api/health
```

## 7) 운영 팁
- 데이터: Elasticsearch 데이터는 `esdata` 볼륨에 저장됩니다.
- 업데이트: 소스 변경 후 `docker compose build --no-cache` 또는 `docker compose pull`(이미지 사용 시) 후 재시작.
- 정리: `docker compose down` (데이터 유지), 완전 초기화는 `docker compose down -v`.
