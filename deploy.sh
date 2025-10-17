#!/bin/bash

# COT Admin Webapp 배포 스크립트
# 사용법: ./deploy.sh [서버_IP] [서버_사용자] [배포_경로]

set -e  # 오류 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 기본값 설정
SERVER_IP=${1:-"jinhak.automail.co.kr"}
SERVER_USER=${2:-"green"}
DEPLOY_PATH=${3:-"/home/green/jinhak.automail.co.kr"}
LOCAL_BUILD_DIR="dist"

echo -e "${BLUE}🚀 COT Admin Webapp 배포를 시작합니다...${NC}"

# 1. 로컬 빌드 확인
echo -e "${YELLOW}📦 로컬 빌드 확인 중...${NC}"
if [ ! -d "$LOCAL_BUILD_DIR" ]; then
    echo -e "${RED}❌ 빌드 디렉토리가 없습니다. 먼저 'npm run build'를 실행하세요.${NC}"
    exit 1
fi

# 2. 의존성 설치 및 빌드
echo -e "${YELLOW}🔨 의존성 설치 및 빌드 중...${NC}"
npm ci
npm run build

# 3. 빌드 결과 확인
if [ ! -d "$LOCAL_BUILD_DIR" ] || [ ! -f "$LOCAL_BUILD_DIR/index.html" ]; then
    echo -e "${RED}❌ 빌드가 실패했습니다.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 로컬 빌드 완료${NC}"

# 4. 서버에 배포 디렉토리 생성
echo -e "${YELLOW}📁 서버에 배포 디렉토리 생성 중...${NC}"
ssh $SERVER_USER@$SERVER_IP "sudo mkdir -p $DEPLOY_PATH && sudo chown $SERVER_USER:$SERVER_USER $DEPLOY_PATH"

# 5. 빌드 파일들을 서버로 복사
echo -e "${YELLOW}📤 빌드 파일들을 서버로 복사 중...${NC}"
rsync -avz --delete $LOCAL_BUILD_DIR/ $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/

# 6. nginx 설정 파일 복사
echo -e "${YELLOW}⚙️  nginx 설정 파일 복사 중...${NC}"
scp nginx.conf $SERVER_USER@$SERVER_IP:/tmp/cot-admin-webapp.conf

# 7. nginx 설정 적용
echo -e "${YELLOW}🔄 nginx 설정 적용 중...${NC}"
ssh $SERVER_USER@$SERVER_IP "
    sudo mv /tmp/cot-admin-webapp.conf /etc/nginx/sites-available/cot-admin-webapp
    sudo ln -sf /etc/nginx/sites-available/cot-admin-webapp /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
"

# 8. 배포 완료 확인
echo -e "${YELLOW}🔍 배포 상태 확인 중...${NC}"
if curl -f -s http://$SERVER_IP > /dev/null; then
    echo -e "${GREEN}✅ 배포가 성공적으로 완료되었습니다!${NC}"
    echo -e "${BLUE}🌐 웹사이트: http://$SERVER_IP${NC}"
else
    echo -e "${RED}❌ 배포 확인에 실패했습니다. 서버 상태를 확인하세요.${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 배포 완료!${NC}"
