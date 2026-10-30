// 서버 함수: 입력 4개를 받아 판정 결과 목록을 돌려준다
// 예: /api/search?age=28&residence=창원시&status=구직 중&fields=일자리
import { getPrograms, dataDate } from '../lib/db.js';
import { search } from '../lib/judge.js';

export default async function handler(req, res) {
  const q = req.query || {};
  const age = Number(q.age);
  if (!Number.isFinite(age) || age <= 0) {
    return res.status(400).json({ error: '나이를 숫자로 입력해 주세요.' });
  }
  const input = {
    age,
    residence: q.residence === '창원 외' ? '창원 외' : '창원시',
    status: q.status || '구직 중',
    fields: String(q.fields || '').split(',').filter(Boolean),
  };
  try {
    const programs = await getPrograms();
    res.status(200).json({ dataDate: dataDate(programs), ...search(programs, input) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
