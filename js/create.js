const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function formatSlotLabel(dateStr, timeStr) {
  const d = new Date(`${dateStr}T${timeStr || '00:00'}`);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = WEEKDAYS[d.getDay()];
  const timePart = timeStr ? ` ${timeStr}` : '';
  return `${month}/${day}(${weekday})${timePart}`;
}

function addSlotRow(list) {
  const row = document.createElement('div');
  row.className = 'slot-row';
  row.innerHTML = `
    <input type="date" class="slot-date" />
    <input type="time" class="slot-time" />
    <button type="button" class="remove-slot">삭제</button>
  `;
  row.querySelector('.remove-slot').addEventListener('click', () => row.remove());
  list.appendChild(row);
}

document.addEventListener('DOMContentLoaded', () => {
  const slotList = document.getElementById('slot-list');
  addSlotRow(slotList);
  addSlotRow(slotList);

  document.getElementById('add-slot').addEventListener('click', () => addSlotRow(slotList));

  const form = document.getElementById('create-form');
  const errorMsg = document.getElementById('error-msg');
  const resultBox = document.getElementById('result');
  const submitBtn = document.getElementById('submit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.classList.add('hidden');

    const title = document.getElementById('title').value.trim();
    const location = document.getElementById('location').value.trim();
    const invitees = document
      .getElementById('invitees')
      .value.split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const rows = Array.from(slotList.querySelectorAll('.slot-row'));
    const seenKeys = new Set();
    const slots = [];
    for (const row of rows) {
      const date = row.querySelector('.slot-date').value;
      const time = row.querySelector('.slot-time').value;
      if (!date) continue;
      const key = `${date}T${time || '00:00'}`;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
      slots.push({ key, label: formatSlotLabel(date, time) });
    }

    if (slots.length === 0) {
      errorMsg.textContent = '후보 일시를 최소 1개 이상 입력해 주세요.';
      errorMsg.classList.remove('hidden');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '생성 중...';

    try {
      const data = await window.postJson('/api/create-meeting', { title, location, invitees, slots });

      const meetingUrl = `${window.location.origin}/meeting.html?id=${data.id}`;
      document.getElementById('share-link').value = meetingUrl;
      document.getElementById('view-link').href = meetingUrl;
      form.classList.add('hidden');
      resultBox.classList.remove('hidden');
    } catch (err) {
      errorMsg.textContent = err.message;
      errorMsg.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '회의 만들기';
    }
  });

  document.getElementById('copy-btn').addEventListener('click', async () => {
    const input = document.getElementById('share-link');
    input.select();
    await navigator.clipboard.writeText(input.value);
  });
});
