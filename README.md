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
DB_URL=jdbc:postgresql://localhost:5432/cwww_db
DB_USERNAME=cwww
DB_PASSWORD=cwww1234
JWT_SECRET=개발용_임시값_주원님_JWT_구현_시_교체
```

### 2. Docker 실행 (PostgreSQL + Redis)

```bash
docker-compose up -d
```

### 3. 서버 실행

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```
