# COT Admin Webapp 배포 가이드

이 문서는 COT Admin Webapp을 nginx 서버에 배포하는 방법을 설명합니다.

## 📋 사전 요구사항

### 로컬 환경
- Node.js 18.0.0 이상
- npm 9.0.0 이상
- SSH 접근 권한이 있는 서버

### 서버 환경
- Ubuntu 20.04+ (또는 다른 Linux 배포판)
- nginx 설치
- SSL 인증서 (HTTPS 사용 시)

## 🚀 배포 절차

### 1단계: 서버 준비

#### nginx 설치
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
# 또는
sudo dnf install nginx
```

#### nginx 서비스 시작
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2단계: 로컬 빌드

#### TypeScript 오류 수정
현재 빌드에서 TypeScript 오류가 발생하고 있습니다. 다음 파일들을 수정해야 합니다:

1. **StorageStatusCard.tsx**: `Database` 아이콘을 `Dataset`으로 변경
2. **ProductSelectorDialog.tsx**: `rowBuffer` 속성을 `rowBufferPx`로 변경
3. **useCotForm.ts**: undefined 값 처리 추가
4. **useUserForm.ts**: 타입 호환성 문제 해결
5. **기타 타입 오류들**: 각 파일의 타입 정의 수정

#### 빌드 실행
```bash
# 의존성 설치
npm ci

# TypeScript 오류 수정 후 빌드
npm run build
```

### 3단계: 자동 배포 (권장)

#### 배포 스크립트 사용
```bash
# 기본 사용법
./deploy.sh

# 서버 정보 지정
./deploy.sh your-server-ip ubuntu /var/www/cot-admin-webapp
```

#### 수동 배포
```bash
# 1. 빌드 파일을 서버로 복사
rsync -avz --delete dist/ user@server:/var/www/cot-admin-webapp/

# 2. nginx 설정 파일 복사
scp nginx.conf user@server:/tmp/cot-admin-webapp.conf

# 3. 서버에서 nginx 설정 적용
ssh user@server "
    sudo mv /tmp/cot-admin-webapp.conf /etc/nginx/sites-available/cot-admin-webapp
    sudo ln -sf /etc/nginx/sites-available/cot-admin-webapp /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
"
```

### 4단계: SSL 설정 (선택사항)

#### Let's Encrypt를 사용한 SSL 인증서
```bash
# Certbot 설치
sudo apt install certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d your-domain.com

# 자동 갱신 설정
sudo crontab -e
# 다음 라인 추가:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔧 nginx 설정 설명

### 주요 설정 항목

1. **SPA 라우팅**: React Router를 위한 `try_files` 설정
2. **정적 파일 캐싱**: JS, CSS, 이미지 파일의 장기 캐싱
3. **Gzip 압축**: 전송 데이터 크기 최적화
4. **보안 헤더**: XSS, CSRF 등 보안 위협 방지

### 설정 파일 위치
- **설정 파일**: `/etc/nginx/sites-available/cot-admin-webapp`
- **활성화된 설정**: `/etc/nginx/sites-enabled/cot-admin-webapp`
- **로그 파일**: `/var/log/nginx/cot-admin-webapp.*.log`

## 🐛 문제 해결

### 일반적인 문제들

#### 1. 빌드 실패
```bash
# TypeScript 오류 확인
npm run build 2>&1 | grep error

# 의존성 재설치
rm -rf node_modules package-lock.json
npm install
```

#### 2. nginx 설정 오류
```bash
# nginx 설정 문법 검사
sudo nginx -t

# nginx 로그 확인
sudo tail -f /var/log/nginx/error.log
```

#### 3. 권한 문제
```bash
# 파일 권한 설정
sudo chown -R www-data:www-data /var/www/cot-admin-webapp
sudo chmod -R 755 /var/www/cot-admin-webapp
```

#### 4. 포트 충돌
```bash
# 포트 사용 확인
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

## 📊 모니터링

### 로그 확인
```bash
# nginx 액세스 로그
sudo tail -f /var/log/nginx/cot-admin-webapp.access.log

# nginx 에러 로그
sudo tail -f /var/log/nginx/cot-admin-webapp.error.log

# 시스템 로그
sudo journalctl -u nginx -f
```

### 성능 모니터링
```bash
# nginx 상태 확인
sudo systemctl status nginx

# 메모리 사용량
free -h

# 디스크 사용량
df -h
```

## 🔄 업데이트 절차

### 코드 업데이트 시
```bash
# 1. 코드 변경 후 빌드
npm run build

# 2. 자동 배포 실행
./deploy.sh your-server-ip ubuntu /var/www/cot-admin-webapp

# 3. 배포 확인
curl -I http://your-server-ip
```

### nginx 설정 변경 시
```bash
# 1. 설정 파일 수정
sudo nano /etc/nginx/sites-available/cot-admin-webapp

# 2. 설정 테스트
sudo nginx -t

# 3. nginx 재시작
sudo systemctl reload nginx
```

## 📝 추가 고려사항

### 보안 강화
- 방화벽 설정 (UFW 사용 권장)
- fail2ban 설치로 무차별 대입 공격 방지
- 정기적인 보안 업데이트

### 성능 최적화
- CDN 사용 고려
- 이미지 최적화
- 데이터베이스 연결 풀링 (백엔드 API 사용 시)

### 백업 전략
- 정기적인 설정 파일 백업
- 데이터베이스 백업 (필요 시)
- 재해 복구 계획 수립

---

**문의사항이 있으시면 개발팀에 연락하세요.**
