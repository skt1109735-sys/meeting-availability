function getMeetingId() {
  return new URLSearchParams(window.location.search).get('id');
}

function renderSlotChecks(container, slots) {
  container.innerHTML = '';
  for (const slot of slots) {
    const row = document.createElement('label');
    row.className = 'check-row';
    row.innerHTML = `<input type="checkbox" value="${slot.key}" /> ${slot.label}`;
    container.appendChild(row);
  }
}

function renderSummary(meeting) {
  const section = document.getElementById('summary-section');
  const table = document.getElementById('summary-table');

  if (!meeting.responses || meeting.responses.length === 0) {
    section.classList.add('hidden');
    return;
  }

  const rows = [];
  rows.push(
    '<tr><th>참석자</th>' + meeting.slots.map((s) => `<th>${s.label}</th>`).join('') + '</tr>'
  );
  for (const r of meeting.responses) {
    const cells = meeting.slots
      .map((s) => `<td>${r.availability[s.key] ? '✅' : '—'}</td>`)
      .join('');
    rows.push(`<tr><td>${r.name}</td>${cells}</tr>`);
  }
  table.innerHTML = rows.join('');
  section.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', async () => {
  const id = getMeetingId();
  const loading = document.getElementById('loading');
  const notFound = document.getElementById('not-found');
  const view = document.getElementById('meeting-view');

  if (!id) {
    loading.classList.add('hidden');
    notFound.classList.remove('hidden');
    return;
  }

  let meeting;
  try {
    meeting = await window.fetchMeeting(id);
  } catch (err) {
    loading.textContent = `불러오기 실패: ${err.message}`;
    return;
  }

  loading.classList.add('hidden');
  if (!meeting) {
    notFound.classList.remove('hidden');
    return;
  }

  view.classList.remove('hidden');
  document.getElementById('meeting-title').textContent = meeting.title;
  document.getElementById('meeting-location').textContent = meeting.location
    ? `장소: ${meeting.location}`
    : '';

  renderSlotChecks(document.getElementById('slot-checks'), meeting.slots);
  renderSummary(meeting);

  const form = document.getElementById('response-form');
  const errorMsg = document.getElementById('error-msg');
  const successMsg = document.getElementById('success-msg');
  const submitBtn = document.getElementById('submit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.classList.add('hidden');
    successMsg.classList.add('hidden');

    const name = document.getElementById('respondent-name').value.trim();
    if (!name) return;

    const availability = {};
    form.querySelectorAll('.check-row input[type="checkbox"]').forEach((cb) => {
      availability[cb.value] = cb.checked;
    });

    submitBtn.disabled = true;
    submitBtn.textContent = '제출 중...';

    try {
      const data = await window.postJson('/api/submit-response', { meetingId: id, name, availability });

      successMsg.classList.remove('hidden');
      renderSummary(data.meeting);
    } catch (err) {
      errorMsg.textContent = err.message;
      errorMsg.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '제출';
    }
  });
});
