function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

document.addEventListener('DOMContentLoaded', async () => {
  const loading = document.getElementById('loading');
  const empty = document.getElementById('empty');
  const list = document.getElementById('meeting-list');

  let index;
  try {
    index = await window.fetchMeetingIndex();
  } catch (err) {
    loading.textContent = `불러오기 실패: ${err.message}`;
    return;
  }

  loading.classList.add('hidden');

  const meetings = index && Array.isArray(index.meetings) ? index.meetings : [];
  if (meetings.length === 0) {
    empty.classList.remove('hidden');
    return;
  }

  for (const m of meetings) {
    const li = document.createElement('li');
    li.className = 'meeting-item';
    li.innerHTML = `
      <a href="meeting.html?id=${m.id}" class="meeting-title">${m.title}</a>
      <div class="meeting-meta">
        ${m.location ? `${m.location} · ` : ''}후보 ${m.slotCount}개 · 응답 ${m.responseCount}건 · ${formatDate(m.createdAt)} 생성
      </div>
    `;
    list.appendChild(li);
  }
});
