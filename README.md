# CWWW-SpringBoot

싸이월드와이드웹 (CWWW) 백엔드 서버

## 기술 스택

- Java 21
- Spring Boot 3.5.6
- PostgreSQL + MyBatis + Flyway
- Redis
- Spring Security + JWT
- WebSocket (STOMP)

## 실행 방법

### 1. 환경변수 설정

`src/main/resources/application-local.properties` 파일 생성 후 아래 값 입력:

```properties
DB_URL=
DB_USERNAME=
DB_PASSWORD=
JWT_SECRET=
```

> 실제 값은 Notion 팀 페이지를 참고하세요.

### 2. Docker 실행 (PostgreSQL + Redis)

```bash
docker-compose up -d
```

### 3. 서버 실행

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```
