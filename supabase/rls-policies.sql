-- daily-mood-diary-web: 개인 전용(단일 계정) RLS 정책
--
-- 이 프로젝트는 기본적으로 로그인 없이 브라우저 localStorage만 사용한다
-- (누구나 자유롭게 체험 가능, Supabase에 전혀 접근하지 않음).
-- 운영자 본인이 로그인했을 때만 실제 Supabase DB를 사용하며,
-- 아래 정책으로 "로그인한 계정 본인의 행"만 읽고 쓸 수 있도록 제한한다.
--
-- Supabase 대시보드 > SQL Editor 에서 이 파일 내용을 그대로 실행하면 된다.
-- (Supabase CLI 마이그레이션을 쓰지 않는 프로젝트이므로 참고용 SQL로 관리)

-- user_id 컬럼이 없다면 추가 (이미 있다면 이 구문은 아무 효과 없음 -- 기본값은 아래에서 별도로 건다)
alter table daily_records
  add column if not exists user_id uuid references auth.users(id);

alter table monthly_assessments
  add column if not exists user_id uuid references auth.users(id);

-- 컬럼이 이미 있던 없던 상관없이 기본값을 강제로 지정 (ADD COLUMN IF NOT EXISTS는 컬럼이
-- 이미 있으면 통째로 스킵되어 DEFAULT가 안 걸리는 경우가 있어 별도 ALTER COLUMN으로 확실히 지정)
alter table daily_records
  alter column user_id set default auth.uid();

alter table monthly_assessments
  alter column user_id set default auth.uid();

-- RLS 활성화
alter table daily_records enable row level security;
alter table monthly_assessments enable row level security;

-- 본인 소유 행만 select/insert/update/delete 가능
drop policy if exists "daily_records_owner_all" on daily_records;
create policy "daily_records_owner_all"
  on daily_records
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "monthly_assessments_owner_all" on monthly_assessments;
create policy "monthly_assessments_owner_all"
  on monthly_assessments
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 로그인 기능을 추가하기 전에 이미 만들어둔 기록이 있다면 user_id가 NULL이라 RLS 아래에서는
-- 보이지도, 수정되지도 않는다. 본인 계정으로 한 번 로그인한 뒤, 아래 UUID 자리에
-- Authentication 메뉴에서 확인한 본인 계정의 id를 넣어 한 번만 실행하면 기존 기록도 복구된다.
-- update daily_records set user_id = '본인 계정 UUID' where user_id is null;
-- update monthly_assessments set user_id = '본인 계정 UUID' where user_id is null;
