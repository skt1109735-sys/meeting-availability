// /api/* 서버리스 함수를 호출하는 공용 헬퍼.
// GitHub Pages처럼 API가 실제로 연결되어 있지 않은 배포판에서는 404 HTML 페이지가 돌아오므로,
// JSON 파싱을 시도하기 전에 이를 감지해 사람이 읽을 수 있는 오류로 바꾼다.
async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(
      '저장 기능을 사용할 수 없습니다. 이 주소는 정적 아카이브라 회의 생성/응답 저장 API가 연결되어 있지 않습니다.'
    );
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '요청이 실패했습니다.');
  return data;
}

window.postJson = postJson;
