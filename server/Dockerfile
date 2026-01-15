# Node.js 22 버전 사용
FROM node:22

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 패키지 설치
RUN npm install

# 소스코드 전체 복사
COPY . .

# 포트 노출
EXPOSE 5000

# 서버 시작 (프로덕션 모드)
CMD ["npm", "start"]