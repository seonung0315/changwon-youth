// 서버 함수: 사업 하나의 상세 정보와 판정 결과를 돌려준다
// 예: /api/program?id=CW-008&age=28&residence=창원시&status=구직 중
import { getProgram } from '../lib/db.js';
import { judge, recruitStatus } from '../lib/judge.js';

export default async function handler(req, res) {
  const q = req.query || {};
  let p;
  try {
    p = await getProgram(String(q.id || ''));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
  if (!p) return res.status(404).json({ error: '사업을 찾을 수 없습니다.' });

  const input = {
    age: Number(q.age),
    residence: q.residence === '창원 외' ? '창원 외' : '창원시',
    status: q.status || '구직 중',
  };
  const j = judge(p, input);
  const docsMissing = !p.documents || String(p.documents).trim() === '확인 필요';

  res.status(200).json({
    dataDate: p.checkedDate,
    id: p.id,
    name: p.name,
    field: p.field,
    benefit: p.benefit,
    result: j.result,
    reasons: j.reasons,
    other: p.other,
    applyStart: p.applyStart,
    applyEnd: p.applyEnd,
    always: p.always,
    recruit: recruitStatus(p),
    applyMethod: p.applyMethod,
    documents: docsMissing ? '공식 공고에서 확인하세요' : p.documents,
    link: p.officialUrl
      ? { url: p.officialUrl, label: '공식 공고 보기', official: true }
      : p.referenceUrl
        ? { url: p.referenceUrl, label: '참고 자료(공식 공고 아님)', official: false }
        : null,
    checkedDate: p.checkedDate,
  });
}
