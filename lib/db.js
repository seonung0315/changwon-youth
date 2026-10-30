// Supabase에서 사업 데이터를 읽는 곳 (서버 함수에서만 import)
// 키는 환경 변수에서만 읽는다: SUPABASE_URL, SUPABASE_SECRET_KEY
import { createClient } from '@supabase/supabase-js';

let client;
function db() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) throw new Error('SUPABASE_URL 또는 SUPABASE_SECRET_KEY 환경 변수가 없습니다.');
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return client;
}

// DB 열 이름(snake_case) → 코드에서 쓰는 이름(camelCase)
function toProgram(r) {
  return {
    id: r.id,
    name: r.name,
    agency: r.agency,
    field: r.field,
    minAge: r.min_age,
    maxAge: r.max_age,
    residence: r.residence,
    status: r.status,
    personalIncome: r.personal_income,
    householdIncome: r.household_income,
    housing: r.housing,
    other: r.other,
    benefit: r.benefit,
    applyStart: r.apply_start,
    applyEnd: r.apply_end,
    always: r.always,
    applyMethod: r.apply_method,
    documents: r.documents,
    officialUrl: r.official_url,
    referenceUrl: r.reference_url,
    checkedDate: r.checked_date,
    verify: r.verify,
    note: r.note,
  };
}

export async function getPrograms() {
  const { data, error } = await db().from('programs').select('*').order('id');
  if (error) throw new Error('데이터를 불러오지 못했습니다: ' + error.message);
  return data.map(toProgram);
}

export async function getProgram(id) {
  const { data, error } = await db().from('programs').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error('데이터를 불러오지 못했습니다: ' + error.message);
  return data ? toProgram(data) : null;
}

// 데이터 기준일 = 가장 최근 확인일
export function dataDate(programs) {
  return programs.map((p) => p.checkedDate).filter(Boolean).sort().pop() || null;
}
