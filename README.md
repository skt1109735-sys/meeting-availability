# 회의 가능 여부 확인 웹앱

회의명 / 후보 일시 / 장소 / 참석자를 지정해 회의를 만들면, 참석자는 링크에 접속해 가능한 일시를 표시합니다.
모든 데이터는 GitHub 저장소에 커밋되어 쌓이므로, 저장소 자체가 회의 이력의 공개 아카이브가 됩니다.

## 구조

- 정적 프론트(`index.html`, `create.html`, `meeting.html`)와 서버리스 API(`api/*.js`)를 **Vercel 하나**에 배포합니다.
- 프론트는 데이터를 항상 `raw.githubusercontent.com`에서 직접 읽습니다 — Vercel을 재배포하지 않아도 새 회의/응답이 즉시 반영됩니다.
- 쓰기(회의 생성, 응답 제출)는 `api/*.js`가 서버에서만 보관하는 GitHub 토큰으로 GitHub Contents API에 커밋합니다.

## 처음 설정하는 방법

### 1. 데이터를 저장할 공개 GitHub 저장소 만들기

이 코드가 있는 저장소를 그대로 데이터 저장소로 써도 되고, 데이터 전용 별도 공개 저장소를 만들어도 됩니다.
(코드와 데이터를 분리하고 싶다면 별도 저장소를 추천합니다. 이 프로젝트를 그 저장소에 push 하세요.)

### 2. Fine-grained Personal Access Token 발급

GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens

- Repository access: 위에서 만든 저장소만 선택
- Permissions: **Contents → Read and write**

### 3. 환경변수 설정

`.env.example`을 참고해 아래 값을 준비하세요.

```
GITHUB_TOKEN=발급받은 토큰
GITHUB_OWNER=저장소 소유자(계정명)
GITHUB_REPO=저장소 이름
GITHUB_BRANCH=main
```

- Vercel 프로젝트의 **Settings → Environment Variables**에 위 4개를 등록합니다.
- `js/config.js`의 `githubOwner` / `githubRepo` / `githubBranch`도 동일한 값으로 수정합니다(이 값은 공개 정보이며 프론트에서 읽기 전용으로만 씁니다).

### 4. Vercel에 배포

```
npm install -g vercel   # 아직 없다면
vercel                  # 최초 배포 (질문에 답하며 프로젝트 연결)
vercel --prod           # 프로덕션 배포
```

또는 GitHub 저장소를 Vercel 프로젝트로 Import해 push마다 자동 배포되도록 설정해도 됩니다.

### 5. 로컬에서 테스트 (선택)

```
cp .env.example .env.local   # 값 채우기
vercel dev
```

`vercel dev`는 정적 페이지와 `/api/*` 서버리스 함수를 함께 로컬에서 띄워줍니다.

## 사용 방법

1. `create.html`에서 회의명 · 장소 · 참석자(선택) · 후보 일시를 입력하고 회의를 만듭니다.
2. 생성된 링크(`meeting.html?id=...`)를 참석자에게 공유합니다.
3. 참석자는 이름과 가능한 일시를 체크해 제출합니다.
4. `index.html`(아카이브)에서 지금까지의 모든 회의와 응답 수를 확인할 수 있습니다.

## 알아두면 좋은 점

- 회의 생성 폼에는 별도 인증이 없습니다. 링크를 아는 사람은 누구든 회의를 만들 수 있으니, `create.html` 링크는 본인만 사용하세요.
- 데이터는 GitHub raw content로 읽기 때문에 CDN 캐시로 인해 몇 초~몇 분의 지연이 있을 수 있습니다(응답 제출 직후 화면은 API 응답으로 즉시 갱신됩니다).
- 두 사람이 거의 동시에 응답을 제출하면 GitHub 파일 버전 충돌이 날 수 있는데, 서버에서 자동으로 최신 버전을 다시 읽어 재시도합니다.
