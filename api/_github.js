// GitHub Contents API를 통해 데이터 저장소에 JSON 파일을 읽고 쓰는 서버 전용 헬퍼.
// GITHUB_TOKEN은 여기서만 사용되며 클라이언트에는 절대 전달하지 않는다.

function getConfig() {
  const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH } = process.env;
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    throw new Error(
      'GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO 환경변수가 설정되어 있어야 합니다.'
    );
  }
  return {
    token: GITHUB_TOKEN,
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    branch: GITHUB_BRANCH || 'main',
  };
}

function contentsUrl(path) {
  const { owner, repo } = getConfig();
  return `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
}

function authHeaders() {
  const { token } = getConfig();
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

// path의 JSON 파일을 읽는다. 없으면 null을 반환한다.
async function getFile(path) {
  const { branch } = getConfig();
  const res = await fetch(`${contentsUrl(path)}?ref=${branch}`, {
    headers: authHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub 파일 조회 실패 (${path}): ${res.status} ${await res.text()}`);
  }
  const body = await res.json();
  const content = Buffer.from(body.content, 'base64').toString('utf-8');
  return { json: JSON.parse(content), sha: body.sha };
}

// path에 JSON을 커밋한다. sha가 있으면 갱신, 없으면 새로 생성.
// 동시 수정으로 인한 409(sha mismatch) 발생 시 최신 sha를 다시 읽어 재시도한다.
async function putFile(path, jsonValue, sha, message) {
  const { branch } = getConfig();
  const content = Buffer.from(JSON.stringify(jsonValue, null, 2), 'utf-8').toString('base64');
  const res = await fetch(contentsUrl(path), {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content,
      branch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (res.ok) {
    const body = await res.json();
    return body.content.sha;
  }
  if (res.status === 409 || res.status === 422) {
    return { conflict: true, status: res.status, error: await res.text() };
  }
  throw new Error(`GitHub 파일 저장 실패 (${path}): ${res.status} ${await res.text()}`);
}

// 최신 상태를 다시 읽어 updater(currentJson)로 다음 값을 계산한 뒤 커밋한다.
// 409 충돌 시 최대 maxRetries회 재시도한다.
async function readModifyWrite(path, updater, message, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const existing = await getFile(path);
    const nextJson = updater(existing ? existing.json : null);
    const result = await putFile(path, nextJson, existing ? existing.sha : undefined, message);
    if (result && result.conflict) {
      if (attempt === maxRetries) {
        throw new Error(`GitHub 저장 충돌이 반복되어 실패했습니다 (${path}): ${result.error}`);
      }
      continue;
    }
    return nextJson;
  }
}

module.exports = { getFile, putFile, readModifyWrite };
