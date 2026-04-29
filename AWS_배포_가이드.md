# 법률사무소 시민 - AWS 배포 가이드

## 아키텍처 개요

```
[사용자] → [Route 53 (도메인)] → [ALB (로드밸런서)] → [ECS Fargate (Docker)] → [RDS MySQL]
                                                                                    ↓
                                                                              [S3 (미디어 파일)]
```

또는 더 간단하게:

```
[사용자] → [도메인] → [EC2 (Docker)] → [RDS MySQL]
```

---

## 방법 1: EC2 + Docker (간단, 추천)

### 1단계: EC2 인스턴스 생성

1. AWS 콘솔 → EC2 → "인스턴스 시작"
2. 설정:
   - 이름: `citizen-web`
   - AMI: **Amazon Linux 2023** 또는 **Ubuntu 22.04**
   - 인스턴스 유형: **t3.small** (운영) 또는 **t3.micro** (테스트)
   - 키 페어: 새로 생성하거나 기존 것 선택 (SSH 접속용)
   - 네트워크: 기본 VPC
   - 보안 그룹: 아래 포트 열기
     - SSH (22) - 내 IP만
     - HTTP (80) - 모든 곳
     - HTTPS (443) - 모든 곳
   - 스토리지: 20GB gp3

3. "인스턴스 시작" 클릭

4. 탄력적 IP 할당:
   - EC2 → 탄력적 IP → "할당" → 생성된 IP를 인스턴스에 "연결"
   - 이 IP가 고정 서버 주소가 됩니다

### 2단계: EC2에 Docker 설치

SSH로 접속:
```bash
ssh -i your-key.pem ec2-user@<탄력적IP>
```

Amazon Linux 2023:
```bash
sudo dnf update -y
sudo dnf install -y docker git
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 재접속 (docker 그룹 적용)
exit
ssh -i your-key.pem ec2-user@<탄력적IP>
```

Ubuntu 22.04:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose git
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu
exit
ssh -i your-key.pem ubuntu@<탄력적IP>
```

### 3단계: RDS MySQL 생성

1. AWS 콘솔 → RDS → "데이터베이스 생성"
2. 설정:
   - 엔진: **MySQL 8.0**
   - 템플릿: **프리 티어** (db.t3.micro)
   - DB 인스턴스 식별자: `citizen-db`
   - 마스터 사용자 이름: `citizen`
   - 마스터 암호: 강한 비밀번호 설정 (기록해두세요!)
   - 스토리지: 20GB gp2
   - 연결:
     - VPC: EC2와 같은 VPC
     - 퍼블릭 액세스: **아니요**
     - 보안 그룹: 새로 생성 → MySQL(3306) 포트를 EC2 보안 그룹에서만 허용
   - 추가 구성:
     - 초기 데이터베이스 이름: `citizen`
     - 문자 세트: `utf8mb4`

3. 생성 후 **엔드포인트** 주소를 기록 (예: `citizen-db.abc123.ap-northeast-2.rds.amazonaws.com`)

### 4단계: 소스 코드 배포

EC2에서:
```bash
# 소스 클론
git clone https://github.com/jjh889/citizen.git
cd citizen
git checkout prod

# 환경변수 파일 생성
cat > .env << 'EOF'
SECRET_KEY=여기에-랜덤-시크릿키-50자이상
DEBUG=False
ALLOWED_HOSTS=도메인.com,www.도메인.com,탄력적IP
DB_HOST=citizen-db.abc123.ap-northeast-2.rds.amazonaws.com
DB_PORT=3306
DB_NAME=citizen
DB_USER=citizen
DB_PASSWORD=RDS에서-설정한-비밀번호
SITE_URL=https://도메인.com
CSRF_TRUSTED_ORIGINS=https://도메인.com,https://www.도메인.com

# MySQL 컨테이너는 사용 안 함 (RDS 사용)
MYSQL_ROOT_PASSWORD=unused
MYSQL_DATABASE=citizen
MYSQL_USER=citizen
MYSQL_PASSWORD=unused
EOF
```

시크릿 키 생성:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

### 5단계: docker-compose 수정 (RDS 사용)

EC2용 docker-compose를 만듭니다:
```bash
cat > docker-compose.prod.yml << 'EOF'
services:
  web:
    build: .
    restart: always
    ports:
      - "80:8000"
    volumes:
      - media_data:/app/media
    env_file:
      - .env
    command: sh /app/entrypoint.sh

volumes:
  media_data:
EOF
```

### 6단계: 빌드 및 실행

```bash
# 빌드
docker-compose -f docker-compose.prod.yml build

# 실행
docker-compose -f docker-compose.prod.yml up -d

# 로그 확인
docker-compose -f docker-compose.prod.yml logs -f web
```

정상이면 다음 메시지가 보입니다:
```
Running migrations...
Creating superuser...
Starting server on port 8000...
```

### 7단계: 접속 확인

브라우저에서:
```
http://<탄력적IP>
```

관리자:
```
http://<탄력적IP>/admin
ID: admin / PW: admin1234
```

⚠️ 관리자 비밀번호를 반드시 변경하세요!

---

## 도메인 + HTTPS 설정

### 도메인 연결 (Route 53 또는 외부 DNS)

1. 도메인 구매 (가비아, 카페24, Route 53 등)
2. DNS 설정:
   - A 레코드: `도메인.com` → 탄력적 IP
   - A 레코드: `www.도메인.com` → 탄력적 IP

### HTTPS (SSL) 설정 - Nginx + Certbot

EC2에서:
```bash
# Nginx 설치
sudo dnf install -y nginx   # Amazon Linux
# 또는
sudo apt install -y nginx    # Ubuntu

# Nginx 설정
sudo cat > /etc/nginx/conf.d/citizen.conf << 'NGINXEOF'
server {
    listen 80;
    server_name 도메인.com www.도메인.com;

    client_max_body_size 10M;

    location /static/ {
        alias /home/ec2-user/citizen/staticfiles/;
    }

    location /media/ {
        alias /var/lib/docker/volumes/citizen_media_data/_data/;
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINXEOF

# Nginx 시작
sudo systemctl start nginx
sudo systemctl enable nginx

# SSL 인증서 (Let's Encrypt)
sudo dnf install -y certbot python3-certbot-nginx   # Amazon Linux
# 또는
sudo apt install -y certbot python3-certbot-nginx    # Ubuntu

sudo certbot --nginx -d 도메인.com -d www.도메인.com
```

Certbot이 자동으로 HTTPS 설정을 완료합니다.

docker-compose에서 포트를 80 대신 8000으로 변경:
```yaml
ports:
  - "8000:8000"  # Nginx가 80/443을 처리
```

### static 파일 수집

```bash
cd ~/citizen
docker-compose -f docker-compose.prod.yml exec web python manage.py collectstatic --noinput
```

---

## 방법 2: ECS Fargate (자동 스케일링, 고급)

대규모 트래픽이 예상되면 ECS를 사용합니다.

### 1. ECR에 Docker 이미지 푸시

```bash
# ECR 리포지토리 생성
aws ecr create-repository --repository-name citizen

# 로그인
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin <계정ID>.dkr.ecr.ap-northeast-2.amazonaws.com

# 빌드 & 푸시
docker build -t citizen .
docker tag citizen:latest <계정ID>.dkr.ecr.ap-northeast-2.amazonaws.com/citizen:latest
docker push <계정ID>.dkr.ecr.ap-northeast-2.amazonaws.com/citizen:latest
```

### 2. ECS 클러스터 생성

AWS 콘솔 → ECS → 클러스터 생성 → Fargate

### 3. 태스크 정의

- 컨테이너 이미지: ECR 이미지 URL
- 포트: 8000
- 환경변수: .env 내용 입력
- CPU: 0.5 vCPU, 메모리: 1GB

### 4. 서비스 생성

- ALB(Application Load Balancer) 연결
- 원하는 태스크 수: 1~2개
- 자동 스케일링 설정

---

## 환경변수 정리 (운영용)

```
SECRET_KEY=<50자 이상 랜덤 문자열>
DEBUG=False
ALLOWED_HOSTS=도메인.com,www.도메인.com
DB_HOST=<RDS 엔드포인트>
DB_PORT=3306
DB_NAME=citizen
DB_USER=citizen
DB_PASSWORD=<RDS 비밀번호>
SITE_URL=https://도메인.com
CSRF_TRUSTED_ORIGINS=https://도메인.com,https://www.도메인.com
```

---

## 배포 후 체크리스트

- [ ] `DEBUG=False` 확인
- [ ] 관리자 비밀번호 변경 (/admin)
- [ ] HTTPS 동작 확인
- [ ] 도메인 접속 확인
- [ ] 상담 신청 폼 테스트 → DB 저장 확인
- [ ] 팝업 등록/표시 확인
- [ ] 카카오맵 동작 확인
- [ ] 모바일 접속 확인
- [ ] 자가진단 → CRM 저장 확인
- [ ] SSL 인증서 자동 갱신 설정

```bash
# SSL 자동 갱신 (cron)
sudo certbot renew --dry-run  # 테스트
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo tee -a /etc/crontab
```

---

## 업데이트 배포 방법

```bash
ssh -i your-key.pem ec2-user@<탄력적IP>
cd citizen
git pull origin prod
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml exec web python manage.py migrate --noinput
docker-compose -f docker-compose.prod.yml exec web python manage.py collectstatic --noinput
```

---

## 예상 비용 (월)

| 서비스 | 사양 | 비용 |
|--------|------|------|
| EC2 | t3.small | ~$15 |
| RDS MySQL | db.t3.micro (프리티어 1년 무료) | $0~$15 |
| 탄력적 IP | 사용 중이면 무료 | $0 |
| Route 53 | 호스팅 존 | ~$0.5 |
| 총 예상 | | **$15~$30/월** |

프리 티어 기간(1년)에는 EC2 t3.micro + RDS db.t3.micro로 **거의 무료**로 운영 가능합니다.

---

## 문제 해결

### 502 Bad Gateway
```bash
docker-compose -f docker-compose.prod.yml logs web
```

### DB 연결 실패
- RDS 보안 그룹에서 EC2 보안 그룹의 3306 포트 허용 확인
- `.env`의 DB_HOST가 RDS 엔드포인트인지 확인

### static 파일 404
```bash
docker-compose -f docker-compose.prod.yml exec web python manage.py collectstatic --noinput
sudo systemctl restart nginx
```

### 마이그레이션 필요
```bash
docker-compose -f docker-compose.prod.yml exec web python manage.py migrate
```
