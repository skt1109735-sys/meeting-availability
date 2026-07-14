const { getFile, putFile, readModifyWrite } = require('./_github');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST만 허용됩니다.' });
    return;
  }

  const { meetingId, name, availability } = req.body || {};

  if (!meetingId || typeof meetingId !== 'string') {
    res.status(400).json({ error: 'meetingId가 필요합니다.' });
    return;
  }
  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: '이름을 입력해 주세요.' });
    return;
  }
  if (!availability || typeof availability !== 'object') {
    res.status(400).json({ error: '가능 여부(availability)가 필요합니다.' });
    return;
  }

  const path = `data/meetings/${meetingId}.json`;
  const trimmedName = name.trim();

  try {
    const existing = await getFile(path);
    if (!existing) {
      res.status(404).json({ error: '존재하지 않는 회의입니다.' });
      return;
    }

    const validKeys = new Set(existing.json.slots.map((s) => s.key));
    const cleanAvailability = {};
    for (const [key, value] of Object.entries(availability)) {
      if (validKeys.has(key)) cleanAvailability[key] = Boolean(value);
    }

    const updated = await readModifyWrite(
      path,
      (current) => {
        const meeting = current || existing.json;
        const responses = meeting.responses.filter((r) => r.name !== trimmedName);
        responses.push({
          name: trimmedName,
          submittedAt: new Date().toISOString(),
          availability: cleanAvailability,
        });
        return { ...meeting, responses };
      },
      `응답 제출: ${trimmedName} → ${existing.json.title} (${meetingId})`
    );

    await readModifyWrite(
      'data/index.json',
      (current) => {
        const list = current && Array.isArray(current.meetings) ? current.meetings : [];
        return {
          meetings: list.map((m) =>
            m.id === meetingId ? { ...m, responseCount: updated.responses.length } : m
          ),
        };
      },
      `회의 목록 응답 수 갱신: ${meetingId}`
    );

    res.status(200).json({ meeting: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
