// PRD v2 4-2 판정 규칙을 그대로 옮긴 코드 (규칙 기반, AI 사용 안 함)

const NEED = '확인 필요';

function hasValue(v) {
  return v !== null && v !== undefined && v !== '' && v !== '-';
}

function includesNeed(v) {
  return typeof v === 'string' && v.includes(NEED);
}

// 오늘 날짜(한국 시간) YYYY-MM-DD
export function todayKST() {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return now.toISOString().slice(0, 10);
}

// 모집 상태: 모집중 / 마감
export function recruitStatus(p, today = todayKST()) {
  if (p.always === 'Y') return '모집중';
  if (!p.applyEnd) return '모집중'; // 마감일이 없으면 숨기지 않고 모집 중으로 보여 준다
  return p.applyEnd >= today ? '모집중' : '마감';
}

// input: { age: number, residence: '창원시' | '창원 외', status: '구직 중' | '재직 중' | '창업 준비' | '학생' }
export function judge(p, input) {
  const fails = [];
  const checks = [];
  const passes = [];

  // 1) 나이
  if (p.minAge === null || p.minAge === undefined) {
    checks.push(`나이 기준이 데이터에 없음 → ${NEED}`);
  } else if (input.age < p.minAge || input.age > p.maxAge) {
    fails.push(`나이 ${input.age}세 → 조건 ${p.minAge}~${p.maxAge}세 불충족`);
  } else {
    passes.push(`나이 ${input.age}세 → 조건 ${p.minAge}~${p.maxAge}세 충족`);
  }

  // 2) 거주지
  if (input.residence !== '창원시') {
    fails.push(`거주지 창원 외 → 조건 "${p.residence}" 불충족`);
  } else if (includesNeed(p.residence)) {
    checks.push(`거주지 조건이 데이터에 없음 → ${NEED}`);
  } else {
    passes.push(`거주지 창원시 → 조건 "${p.residence}" 충족`);
  }

  // 3) 현재 상태
  if (p.status === '제한 없음') {
    passes.push(`현재 상태 ${input.status} → 조건 "제한 없음" 충족`);
  } else if (p.status.includes(input.status)) {
    passes.push(`현재 상태 ${input.status} → 조건 "${p.status}" 충족`);
  } else {
    fails.push(`현재 상태 ${input.status} → 조건 "${p.status}" 불충족`);
  }

  // 4) 입력으로 판단할 수 없는 조건(소득·주거)
  const unknown = [
    ['본인 소득', p.personalIncome],
    ['가구 소득', p.householdIncome],
    ['주거', p.housing],
  ];
  for (const [label, v] of unknown) {
    if (includesNeed(v)) checks.push(`${label} 조건이 데이터에 없음 → ${NEED}`);
    else if (hasValue(v)) checks.push(`${label} 조건 "${v}" → 입력으로 판단할 수 없어 ${NEED}`);
  }

  let result;
  if (fails.length) result = '해당 안 됨';
  else if (checks.length) result = '해당 가능성 있음(확인 필요)';
  else result = '해당됨';

  return { result, reasons: [...fails, ...checks, ...passes] };
}

const ORDER = { '해당됨': 0, '해당 가능성 있음(확인 필요)': 1, '해당 안 됨': 2 };

export function search(programs, input, today = todayKST()) {
  const fields = input.fields || [];
  const rows = programs
    .filter((p) => fields.includes(p.field))
    .map((p) => {
      const j = judge(p, input);
      return {
        id: p.id,
        name: p.name,
        field: p.field,
        benefit: p.benefit,
        applyEnd: p.applyEnd,
        always: p.always,
        recruit: recruitStatus(p, today),
        result: j.result,
        reasons: j.reasons,
      };
    })
    .sort((a, b) => ORDER[a.result] - ORDER[b.result]);
  return {
    open: rows.filter((r) => r.recruit === '모집중'),
    closed: rows.filter((r) => r.recruit === '마감'),
  };
}
