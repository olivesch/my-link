# 마이링크 (MyLink) 제품 사양서 (PRD)

---

**버전: 0.3 (2차 수정본)**  
**작성일: 2026-01-19**  
**상태: 초안 (Draft)**

---

## 1. 프로젝트 개요

---

### 1.1. 프로젝트명

**마이링크 (MyLink)**

### 1.2. 목적

개발자와 크리에이터가 자신의 작업물, 포트폴리오, 소셜 미디어 등 흩어진 디지털 자산을 통합하여 관리하고 공유할 수 있는 서비스를 제공한다.

### 1.3. 대상 사용자 (Target Audience)

- **Primary:** 자신의 기술 블로그, Github 작업물, 프로젝트 데모 등을 효과적으로 보여주고 싶은 개발자.
- **Secondary:** 포트폴리오 관리가 필요한 크리에이터.

---

## 2. 핵심 기능 목록 (Feature List)

---

### 2.1. 필수 기능 (Must-Have / MVP)

1. **사용자 인증 (Auth)**
   - Firebase Authentication 기반 **Google 소셜 로그인**.

2. **프로필 관리**
   - **DisplayName 기반 URL:** 별도의 `username` 필드 없이 `displayName`을 URL slug로 사용 (예: `mylink.com/@displayName`).
   - **DisplayName 초기값:** Google 로그인 이메일의 `@` 앞부분을 가져와 설정 (예: `devkim@gmail.com` -> `devkim`).
   - **인라인 편집:** 별도의 수정 폼/모달 없이 텍스트를 클릭하여 즉시 수정.
   - 수정 가능 항목: 닉네임, 한 줄 소개(Bio). (이미지 업로드 기능 없음 - Google 프로필 이미지 사용).

3. **링크 블록 관리**
   - 링크 추가/수정/삭제.
   - **인라인 편집:** 링크 제목 및 URL을 리스트 상에서 바로 수정.
   - **파비콘 자동 연동 (Google API):** 링크 URL 입력 시 Google Favicon API를 사용하여 아이콘 자동 표시.

4. **퍼블릭 페이지 (뷰어)**
   - 방문자가 보는 실제 프로필 페이지.
   - 반응형 디자인 (모바일 최적화).
   - shadcn/ui 기반의 깔끔한 UI.

### 2.2. 추후 제공 예정 (Future Plan)

- **링크 클릭 조회수:** 개별 링크의 클릭 횟수 카운팅 기능.

### 2.3. 제외 기능 (Out of Scope)

- **이미지 업로드:** 커스텀 프로필 이미지 업로드 불가 (Google 계정 이미지 사용).
- **테마 시스템:** 다크/라이트 모드 또는 컬러 커스터마이징 없음.
- 링크 활성화/비활성화 토글.
- 링크 드래그 앤 드롭 순서 변경.
- 개발자 특화 카드.
- 모바일 뷰 미리보기.

---

## 3. 기능 상세 설명

---

### 3.1. 인증 (Authentication)

- **진입점:** 메인 랜딩 페이지의 "Google로 시작하기" 버튼.
- **로직:** Firebase Auth.
- **초기값:** Google 로그인 이메일의 `@` 앞부분을 `displayName` 초기값으로 설정하고, Google 계정 사진(PhotoURL)을 프로필 이미지로 설정.

### 3.2. 대시보드 (Admin) - 인라인 에디팅 중심

- **프로필 영역:**
  - 프로필 사진(Google URL, 수정 불가), 닉네임(수정 가능), 소개글(수정 가능) 표시.
  - 닉네임/소개글 클릭 시 `contenteditable` 혹은 `input`으로 전환되어 즉시 수정 (Inline Edit).
  - **중복 검사:** `displayName` 수정 시 유일성(Uniqueness) 검사 필요 (URL slug로 사용되므로).

- **링크 목록 영역:**
  - "새 링크 추가" 버튼: 클릭 시 리스트 하단에 빈 입력 필드 생성.
  - 리스트 아이템:
    - 아이콘: URL 입력 시 `https://www.google.com/s2/favicons?domain={url}` 형식을 이용하여 자동 렌더링.
    - 제목/URL: 텍스트 클릭 시 인라인 수정 모드 진입.
    - 삭제 버튼: 우측/좌측 위치.

### 3.3. 디자인 시스템 (UI/UX)

- **프레임워크:** shadcn/ui.
- **인터랙션:** 빠르고 간편한 수정 경험을 위해 인라인 편집 UX 최적화 (엔터 키 저장, 포커스 아웃 저장 등).

---

## 4. 데이터베이스 모델링 (NoSQL - Firestore)

---

### 4.1. Users Collection

```json
{
  "uid": "google_uid_123",
  "email": "dev_kim@gmail.com",
  "displayName": "dev_kim",
  "photoURL": "https://lh3.googleusercontent.com/...",
  "bio": "Frontend Developer",
  "createdAt": "timestamp"
}
```

Note: `displayName`을 URL slug로 사용하므로 유일성을 보장하기 위한 별도 인덱스나 로직이 필요함.

### 4.2. Links Sub-collection (users/{uid}/links)

```json
{
  "id": "link_uuid",
  "title": "My Blog",
  "url": "https://blog.example.com",
  "createdAt": "timestamp"
}
```

Note: 파비콘은 DB에 저장하지 않고 클라이언트에서 `url`을 기반으로 동적 생성.
