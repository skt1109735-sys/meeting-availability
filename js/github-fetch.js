// raw.githubusercontent.com에서 데이터 JSON을 직접 읽는 클라이언트 헬퍼.
// 공개 저장소이므로 토큰 없이 읽을 수 있고, Vercel 재배포 없이 항상 최신 커밋을 반영한다.

function rawUrl(path) {
  const { githubOwner, githubRepo, githubBranch } = window.APP_CONFIG;
  const cacheBust = Date.now();
  return `https://raw.githubusercontent.com/${githubOwner}/${githubRepo}/${githubBranch}/${path}?t=${cacheBust}`;
}

async function fetchData(path) {
  const res = await fetch(rawUrl(path), { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`데이터를 불러오지 못했습니다: ${path} (${res.status})`);
  return res.json();
}

window.fetchMeetingIndex = () => fetchData('data/index.json');
window.fetchMeeting = (id) => fetchData(`data/meetings/${id}.json`);
