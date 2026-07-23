# CWWW — 싸이월드와이드웹

2000년대 싸이월드를 모티브로 한 레트로 소셜 네트워크 서비스입니다.  
미니홈피, 다이어리, 일촌, 방명록, 실시간 채팅, 미니룸 꾸미기, 도토리 결제까지 싸이월드의 핵심 경험을 현대적으로 재현했습니다.

**GitHub**: https://github.com/CWWW-project/CWWW.git

---

## 팀원 및 담당

| 이름 | 담당 도메인 |
|------|------------|
| 윤주원 | 회원 인증 (로그인/회원가입/OAuth2/비밀번호), 사용자 |
| 김채린 | 미니홈피, 다이어리, 방명록, 방문자, 배경화면, BGM |
| 송경용 | 피드, 댓글, 좋아요, 북마크, 해시태그, 일촌 |
| 김찬호 | 실시간 채팅 (WebSocket/STOMP), 알림(Redis) |
| 정용혁 | 미니룸, 상점, 장바구니 |
| 장수호 | 결제 (Toss Payments), 결제 관리자 |

---

## 기술 스택

**Backend**
- Java 21, Spring Boot 3.5.6
- MyBatis, PostgreSQL 17, Flyway
- Spring Security, JWT, OAuth2 (Google / GitHub)
- WebSocket / STOMP, Redis (Pub/Sub · 블랙리스트)
- Toss Payments

**Frontend**
- React 19, TypeScript, Vite
- Zustand, Tailwind CSS v4, Axios

---

## 주요 기능

- **미니홈피** — 프로필, 배경화면(도트/사진), BGM 재생, 공개범위 설정
- **다이어리** — 게시글 CRUD, 이미지 첨부, 공개범위(전체/일촌/비공개), 해시태그
- **피드** — 전체공개 + 일촌 글 커서 기반 무한스크롤
- **일촌** — 신청/수락/거절/해제, 별명(호칭) 설정
- **방명록** — 비밀글, 홈피 주인 삭제 권한
- **실시간 채팅** — 1:1 / 단체 채팅방, 읽음 처리, 미디어 첨부
- **미니룸** — 아이템·아바타 배치 편집 및 저장
- **상점 & 결제** — 도토리 충전(Toss Payments), 아이템 구매, 장바구니
- **알림** — Redis Pub/Sub 기반 실시간 알림 (좋아요·댓글·일촌·방명록)

---

## API 요약

| 영역 | 개수 |
|------|------|
| AUTH / USER | 15개 |
| FRIEND | 7개 |
| MINIHOMPY / GUESTBOOK / BGM | 16개 |
| POST / 댓글 / 북마크 / 미디어 | 17개 |
| CHAT | 10개 |
| ROOM / ITEM / CART | 6개 |
| PAYMENT / PAYMENT(관리자) | 19개 |
| **총합** | **87개** |

---

## 로컬 실행 방법

### 사전 준비
- Java 21
- Node.js 18+
- PostgreSQL 17
- Redis

### Backend

```bash
cd BE
# application.yml 또는 환경변수 설정 후
./mvnw spring-boot:run
```

### Frontend

```bash
cd FE
npm install
# .env.local 파일 생성 (아래 참고)
npm run dev
```

**FE/.env.local**
```
VITE_TOSS_CLIENT_KEY=your_toss_client_key
```

Vite 개발 서버는 `http://localhost:3000`에서 실행되며, `/api` 요청은 `http://localhost:8080`으로 프록시됩니다.

---

## 보안 정책

로그인 페이지 진입에 필요한 인증 API(`/api/auth/login`, `/api/auth/signup` 등)를 제외한 **모든 API는 JWT 인증 필수**입니다.  
비로그인 사용자는 프론트엔드와 Spring Security 양쪽에서 차단됩니다.
