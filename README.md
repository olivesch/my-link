# MyLink

개발자와 크리에이터가 GitHub, 블로그, 포트폴리오, 소셜 채널을 하나의 공개 링크 페이지로 정리할 수 있는 링크 관리 서비스입니다.

배포 주소: [https://my-link-pink.vercel.app](https://my-link-pink.vercel.app)

## 주요 기능

- Google 소셜 로그인 기반 사용자 인증
- `displayName` 기반 개인 공개 페이지 제공: `/{displayName}`
- 프로필 관리: 표시 이름, 주소 아이디, 한 줄 소개 수정
- 링크 관리: 링크 추가, 인라인 수정, 삭제
- URL 기반 파비콘 자동 표시
- 링크 클릭 수 누적 및 관리 화면 내 표시
- `/stats` 통계 페이지에서 총 클릭 수, 상위 링크, 활성 링크 수와 차트 확인
- 공개 페이지와 일반 페이지를 위한 Open Graph 이미지 및 metadata 제공

## 기술 스택

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui, Base UI
- Firebase Authentication
- Cloud Firestore
- TanStack Query
- React Hook Form, Zod
- Recharts
- Sonner

## 프로젝트 구조

```txt
app/
  [displayName]/        # 공개 프로필 페이지와 동적 OG 이미지
  stats/                # 로그인 사용자 통계 페이지
  opengraph-image.tsx   # 기본 OG 이미지
components/             # 화면/공통 UI 컴포넌트
data/                   # 더미 데이터
docs/                   # PRD, 사용자 시나리오, 와이어프레임 문서
lib/
  firebase/             # Firebase 클라이언트, 링크/프로필 API
  og/                   # OG 이미지용 프로필 조회 및 폰트 유틸
  validations/          # 입력 검증 스키마
```

## 로컬 실행

```bash
npm install
npm run dev
```

개발 서버가 실행되면 [http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

## 환경 변수

루트에 `.env.local` 파일을 만들고 Firebase와 사이트 URL 값을 설정합니다.

```env
NEXT_PUBLIC_SITE_URL=https://my-link-pink.vercel.app

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

로컬에서 Google 로그인을 테스트하려면 Firebase Authentication의 승인된 도메인에 `localhost`를 추가해야 합니다. 배포 환경에서는 `my-link-pink.vercel.app`도 승인된 도메인에 등록되어 있어야 합니다.

## Firestore 데이터 구조

```txt
users/{uid}
displayNames/{displayName}
users/{uid}/links/{linkId}
```

링크 문서는 `title`, `url`, `clickCount`, `createdAt`, `updatedAt`, `lastClickedAt` 값을 사용합니다. 파비콘은 DB에 저장하지 않고 링크 URL을 기반으로 클라이언트에서 표시합니다.

## 주요 명령어

```bash
npm run dev        # 개발 서버 실행
npm run build      # 프로덕션 빌드
npm run start      # 빌드 결과 실행
npm run lint       # ESLint 검사
npm run typecheck  # TypeScript 타입 검사
npm run format     # Prettier 포맷
```

## 문서

- [PRD](docs/prd.md)
- [사용자 시나리오](docs/user-scenarios.md)
- [와이어프레임](docs/Wireframe.md)
- [링크 관리 명세](docs/link-management.md)

## 구현 메모

- Firestore 실시간 구독은 사용하지 않고, TanStack Query를 통해 조회 후 작업 성공 시 쿼리를 무효화해 갱신합니다.
- 프로필 저장은 낙관적 업데이트를 적용합니다.
- 공개 페이지에서는 클릭 수를 노출하지 않고, 링크 클릭 시 카운트만 누적합니다.
- 동적 OG 이미지는 `/{displayName}/opengraph-image` 경로에서 생성됩니다.
