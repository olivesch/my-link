# my-link

Next.js로 만든 개인 프로필 페이지입니다. 앱 코드는 `my-profile` 폴더 안에 있습니다.

## 실행 방법

먼저 프로젝트 폴더로 이동합니다.

```bash
cd my-profile
```

개발 서버를 실행합니다.

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열면 결과를 볼 수 있습니다.

3001번 포트로 실행하려면 아래처럼 실행합니다.

```bash
npm run dev -- --hostname 127.0.0.1 --port 3001
```

## 주요 파일

- `my-profile/app/page.tsx`: 프로필 페이지
- `my-profile/app/layout.tsx`: 페이지 레이아웃
- `my-profile/app/globals.css`: 전역 스타일

## 스크립트

아래 명령은 `my-profile` 폴더 안에서 실행합니다.

```bash
npm run dev
npm run lint
npm run build
```
