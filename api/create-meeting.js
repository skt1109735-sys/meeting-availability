const { randomUUID } = require('crypto');
const { putFile, readModifyWrite } = require('./_github');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST만 허용됩니다.' });
    return;
  }

  const { title, location, invitees, slots } = req.body || {};

  if (!title || typeof title !== 'string' || !title.trim()) {
    res.status(400).json({ error: '회의명을 입력해 주세요.' });
    return;
  }
  if (!Array.isArray(slots) || slots.length === 0) {
    res.status(400).json({ error: '후보 일시를 최소 1개 이상 입력해 주세요.' });
    return;
  }
  for (const slot of slots) {
    if (!slot || typeof slot.key !== 'string' || typeof slot.label !== 'string') {
      res.status(400).json({ error: '후보 일시 형식이 올바르지 않습니다.' });
      return;
    }
  }

  const id = randomUUID().split('-')[0];
  const createdAt = new Date().toISOString();
  const meeting = {
    id,
    title: title.trim(),
    location: typeof location === 'string' ? location.trim() : '',
    createdAt,
    slots,
    invitees: Array.isArray(invitees) ? invitees.filter((n) => typeof n === 'string' && n.trim()) : [],
    responses: [],
  };

  try {
    await putFile(`data/meetings/${id}.json`, meeting, undefined, `회의 생성: ${meeting.title} (${id})`);

    await readModifyWrite(
      'data/index.json',
      (current) => {
        const list = current && Array.isArray(current.meetings) ? current.meetings : [];
        return {
          meetings: [
            {
              id,
              title: meeting.title,
              location: meeting.location,
              createdAt,
              slotCount: slots.length,
              responseCount: 0,
            },
            ...list,
          ],
        };
      },
      `회의 목록 갱신: ${meeting.title} (${id}) 추가`
    );

    res.status(200).json({ id, meeting });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
