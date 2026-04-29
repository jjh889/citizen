# 법률사무소 시민 - AWS 프리티어 배포 가이드 (최소 비용)

## 예상 비용: 월 $0~$3 (프리티어 1년간)

```
[사용자] → [도메인] → [EC2 t2.micro] → [RDS MySQL db.t3.micro]
                         ↓
                    [Nginx + SSL]
```

---

## 1단계: EC2 인스턴스 생성 (프리티어)

### AWS 콘솔 접속
1. https://console.aws.amazon.com 로그인
2. 리전: **아시아 태평양(서울) ap-northeast-2** 선택

### 인스턴스 생성
1. EC2 → "인스턴스 시작"
2. 설정:

| 항목 | 값 |
|------|-----|
| 이름 | `citizen-web` |
| AMI | **Amazon Linux 2023** (프리 티어 사용 가능 표시 확인) |
| 인스턴스 유형 | **t2.micro** (프리 티어) |
| 키 페어 | "새 키 페어 생성" → `citizen-key` → .pem 다운로드 → 안전한 곳에 보관 |
| 네트워크 설정 | "편집" 클릭 |
| - 퍼블릭 IP 자동 할당 | **활성화** |
| - 보안 그룹 | "보안 그룹 생성" |
| - 인바운드 규칙 1 | SSH (22) - 내 IP |
| - 인바운드 규칙 2 | HTTP (80) - 0.0.0.0/0 |
| - 인바운드 규칙 3 | HTTPS (443) - 0.0.0.0/0 |
| 스토리지 | **30GB gp3** (프리티어 최대 30GB) |

3. "인스턴스 시작" 클릭

### 탄력적 IP 할당 (무료 - 사용 중이면)
1. EC2 → 탄력적 IP → "탄력적 IP 주소 할당"
2. 할당된 IP 선택 → "탄력적 IP 주소 연결" → 인스턴스 선택
3. 이 IP를 기록: `___.___.___.__`

> ⚠️ 탄력적 IP는 인스턴스에 연결된 상태에서만 무료. 연결 안 하면 과금됨

---

## 2단계: EC2 초기 설정

### SSH 접속
```bash
# .pem 파일 권한 설정
chmod 400 citizen-key.pem

# 접속
ssh -i citizen-key.pem ec2-user@<탄력적IP>
```

### Docker + Git 설치
```bash
# 시스템 업데이트
sudo dnf update -y

# Docker 설치
sudo dnf install -y docker git
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 재접속 (docker 그룹 적용 위해)
exit
ssh -i citizen-key.pem ec2-user@<탄력적IP>

# 확인
docker --version
docker-compose --version
```

### 스왑 메모리 추가 (t2.micro 메모리 부족 대비)
```bash
sudo dd if=/dev/zero of=/swapfile bs=128M count=16
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab
```

---

## 3단계: RDS MySQL 생성 (프리티어)

### RDS 생성
1. AWS 콘솔 → RDS → "데이터베이스 생성"
2. 설정:

| 항목 | 값 |
|------|-----|
| 엔진 | **MySQL 8.0** |
| 템플릿 | **프리 티어** ← 반드시 이거 선택 |
| DB 인스턴스 식별자 | `citizen-db` |
| 마스터 사용자 이름 | `citizen` |
| 마스터 암호 | 강한 비밀번호 (기록!) |
| 인스턴스 클래스 | **db.t3.micro** (프리 티어) |
| 스토리지 | **20GB gp2** |
| 스토리지 자동 조정 | **비활성화** (비용 방지) |
| 연결 - VPC | EC2와 같은 VPC |
| 퍼블릭 액세스 | **아니요** |
| 보안 그룹 | "새로 생성" → 이름: `citizen-db-sg` |
| 가용 영역 | 아무거나 |
| 추가 구성 - 초기 DB 이름 | `citizen` |
| 백업 보존 기간 | 1일 (최소) |
| 모니터링 | **비활성화** (비용 방지) |
| 삭제 방지 | 활성화 |

3. "데이터베이스 생성" (5~10분 소요)

### RDS 보안 그룹 설정
1. RDS → citizen-db 클릭 → "VPC 보안 그룹" 클릭
2. "인바운드 규칙 편집"
3. 규칙 추가:
   - 유형: **MySQL/Aurora (3306)**
   - 소스: **EC2 보안 그룹 ID** (sg-xxxx)
4. 저장

### RDS 엔드포인트 기록
RDS → citizen-db → 연결 & 보안 → 엔드포인트:
```
citizen-db.xxxxxx.ap-northeast-2.rds.amazonaws.com
```

---

## 4단계: 소스 코드 배포

### 소스 클론
```bash
cd ~
git clone https://github.com/jjh889/citizen.git
cd citizen
git checkout prod
```

### 환경변수 파일 생성
```bash
# 시크릿 키 생성
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
# 출력된 값 복사

# .env 파일 생성
nano .env
```

아래 내용을 붙여넣기 (각 값 수정):
```
SECRET_KEY=위에서-생성한-시크릿키
DEBUG=False
ALLOWED_HOSTS=도메인.com,www.도메인.com,탄력적IP
DB_HOST=citizen-db.xxxxxx.ap-northeast-2.rds.amazonaws.com
DB_PORT=3306
DB_NAME=citizen
DB_USER=citizen
DB_PASSWORD=RDS에서-설정한-비밀번호
SITE_URL=https://도메인.com
CSRF_TRUSTED_ORIGINS=https://도메인.com,https://www.도메인.com

MYSQL_ROOT_PASSWORD=unused
MYSQL_DATABASE=citizen
MYSQL_USER=citizen
MYSQL_PASSWORD=unused
```

저장: `Ctrl+O` → Enter → `Ctrl+X`

### 운영용 docker-compose 생성
```bash
nano docker-compose.prod.yml
```

아래 내용:
```yaml
services:
  web:
    build: .
    restart: always
    ports:
      - "8000:8000"
    volumes:
      - media_data:/app/media
    env_file:
      - .env
    command: sh /app/entrypoint.sh

volumes:
  media_data:
```

저장: `Ctrl+O` → Enter → `Ctrl+X`

---

## 5단계: 빌드 및 실행

```bash
# 빌드 (처음에 5~10분 소요)
docker-compose -f docker-compose.prod.yml build

# 실행
docker-compose -f docker-compose.prod.yml up -d

# 로그 확인 (Ctrl+C로 나가기)
docker-compose -f docker-compose.prod.yml logs -f web
```

성공 메시지:
```
Running migrations...
Superuser created: admin / admin1234
Starting server on port 8000...
[INFO] Starting gunicorn ...
```

### 접속 확인
```
http://<탄력적IP>:8000
```

페이지가 보이면 성공!

---

## 6단계: Nginx + HTTPS (SSL) 설정

### Nginx 설치
```bash
sudo dnf install -y nginx
```

### Nginx 설정
```bash
sudo nano /etc/nginx/conf.d/citizen.conf
```

아래 내용 (도메인 부분 수정):
```nginx
server {
    listen 80;
    server_name 도메인.com www.도메인.com;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

저장 후:
```bash
# 기본 설정 충돌 방지
sudo sed -i 's/listen       80;/listen       8080;/' /etc/nginx/nginx.conf

# Nginx 시작
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx
```

이제 `http://도메인.com`으로 접속 가능

### SSL 인증서 (무료 - Let's Encrypt)
```bash
# Certbot 설치
sudo dnf install -y certbot python3-certbot-nginx

# SSL 인증서 발급 (도메인이 이 서버를 가리키고 있어야 함)
sudo certbot --nginx -d 도메인.com -d www.도메인.com

# 이메일 입력 → Y → Y
```

자동으로 HTTPS 설정 완료!

### SSL 자동 갱신
```bash
# 테스트
sudo certbot renew --dry-run

# 자동 갱신 크론 등록
echo "0 3 * * * root certbot renew --quiet --post-hook 'systemctl reload nginx'" | sudo tee /etc/cron.d/certbot-renew
```

---

## 7단계: 도메인 연결

### 가비아/카페24 등에서 도메인 구매 후

DNS 설정에서 추가:
```
타입    호스트    값
A       @        <탄력적IP>
A       www      <탄력적IP>
```

DNS 전파까지 최대 24시간 (보통 10분~1시간)

### Route 53 사용 시 (선택)
1. Route 53 → 호스팅 영역 생성 → 도메인 입력
2. A 레코드 추가 → 탄력적 IP
3. 도메인 등록 업체의 네임서버를 Route 53 네임서버로 변경

---

## 8단계: 운영 후 필수 작업

### 관리자 비밀번호 변경
```
https://도메인.com/admin
로그인: admin / admin1234
→ 비밀번호 변경
```

### 더미 데이터 삭제
관리자에서 테스트용 공지사항, FAQ, 상담 신청 등 삭제

### .env 확인
```
DEBUG=False        ← 반드시 False
ALLOWED_HOSTS      ← 실제 도메인
SITE_URL           ← https://도메인.com
CSRF_TRUSTED_ORIGINS ← https://도메인.com
```

---

## 업데이트 배포 (코드 수정 후)

```bash
ssh -i citizen-key.pem ec2-user@<탄력적IP>
cd ~/citizen
git pull origin prod
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

마이그레이션이 있으면:
```bash
docker-compose -f docker-compose.prod.yml exec web python manage.py migrate
```

---

## 비용 정리 (프리티어 1년간)

| 서비스 | 사양 | 월 비용 |
|--------|------|---------|
| EC2 | t2.micro (750시간/월 무료) | **$0** |
| RDS MySQL | db.t3.micro (750시간/월 무료) | **$0** |
| EBS 스토리지 | 30GB (30GB 무료) | **$0** |
| RDS 스토리지 | 20GB (20GB 무료) | **$0** |
| 탄력적 IP | 연결 시 무료 | **$0** |
| 데이터 전송 | 100GB/월 무료 | **$0** |
| 도메인 | 가비아 등 | ~$10/년 |
| **합계** | | **월 $0 + 도메인비** |

### 프리티어 만료 후 (1년 뒤)

| 서비스 | 월 비용 |
|--------|---------|
| EC2 t2.micro | ~$8.5 |
| RDS db.t3.micro | ~$12 |
| **합계** | **~$20/월** |

→ 비용 절감 옵션: EC2를 **예약 인스턴스** (1년)로 전환하면 40% 할인

---

## 문제 해결

### 사이트 접속 안 됨
```bash
# Docker 상태 확인
docker-compose -f docker-compose.prod.yml ps

# 로그 확인
docker-compose -f docker-compose.prod.yml logs web

# Nginx 상태
sudo systemctl status nginx
sudo nginx -t
```

### DB 연결 실패
1. RDS 보안 그룹에서 EC2 보안 그룹의 3306 허용 확인
2. `.env`의 DB_HOST가 RDS 엔드포인트인지 확인
3. RDS가 실행 중인지 확인

### 메모리 부족 (t2.micro)
```bash
# 스왑 확인
free -h

# 스왑 없으면 위 2단계의 스왑 추가 명령 실행
```

### Docker 빌드 실패 (메모리)
```bash
# 한 번에 빌드하면 메모리 부족할 수 있음
docker system prune -f  # 캐시 정리 후 재시도
docker-compose -f docker-compose.prod.yml build --no-cache
```

### SSL 인증서 발급 실패
- 도메인이 탄력적 IP를 가리키고 있는지 확인
- 80번 포트가 열려있는지 확인
- `ping 도메인.com` → IP 확인

---

## 서버 모니터링

### 기본 확인 명령
```bash
# 디스크 용량
df -h

# 메모리
free -h

# CPU
top

# Docker 컨테이너 상태
docker ps

# Docker 로그 (최근 100줄)
docker-compose -f docker-compose.prod.yml logs --tail 100 web
```

### 자동 재시작 설정
Docker의 `restart: always`가 이미 설정되어 있어 서버 재부팅 시 자동 시작됩니다.
```bash
# Docker 자동 시작 확인
sudo systemctl is-enabled docker
```
