-- ============================================================
-- GlucoLens · P4 数据层 schema
-- 在 Supabase SQL Editor 整段复制粘贴运行即可。
-- 可重复运行（用 IF NOT EXISTS / OR REPLACE 兼容已存在情况）。
-- ============================================================

-- ---- profiles：用户基本档案 ----
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  weight_kg numeric(5,1),
  height_cm numeric(5,1),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---- saved_recipes：用户保存的菜谱 ----
create table if not exists public.saved_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dish_name text not null,
  -- 完整 Recipe JSON（包含 carbsGrams / rulesCheck / companions / 等）
  recipe_data jsonb not null,
  -- 用户当时的偏好快照
  preferences jsonb,
  -- slug 唯一，预留给 P4-B 公开菜谱单页 SEO
  slug text unique,
  public boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists saved_recipes_user_id_created_at_idx
  on public.saved_recipes(user_id, created_at desc);

-- ---- glucose_readings：餐后血糖记录（P4-B 用，本期建好表预留） ----
create table if not exists public.glucose_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid references public.saved_recipes(id) on delete set null,
  value_mmol numeric(4,1) not null,
  -- "fasting" / "pre_meal" / "post_meal_1h" / "post_meal_2h" / "bedtime" / "other"
  context text not null default 'post_meal_2h',
  measured_at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists glucose_readings_user_id_measured_at_idx
  on public.glucose_readings(user_id, measured_at desc);

-- ============================================================
-- RLS：行级安全
-- ============================================================

alter table public.profiles enable row level security;
alter table public.saved_recipes enable row level security;
alter table public.glucose_readings enable row level security;

-- ---- profiles 策略 ----
drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles upsert own" on public.profiles;
create policy "profiles upsert own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---- saved_recipes 策略 ----
drop policy if exists "recipes read own or public" on public.saved_recipes;
create policy "recipes read own or public" on public.saved_recipes
  for select using (auth.uid() = user_id or public = true);

drop policy if exists "recipes insert own" on public.saved_recipes;
create policy "recipes insert own" on public.saved_recipes
  for insert with check (auth.uid() = user_id);

drop policy if exists "recipes update own" on public.saved_recipes;
create policy "recipes update own" on public.saved_recipes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "recipes delete own" on public.saved_recipes;
create policy "recipes delete own" on public.saved_recipes
  for delete using (auth.uid() = user_id);

-- ---- glucose_readings 策略（私密，永远只能本人）----
drop policy if exists "glucose read own" on public.glucose_readings;
create policy "glucose read own" on public.glucose_readings
  for select using (auth.uid() = user_id);

drop policy if exists "glucose insert own" on public.glucose_readings;
create policy "glucose insert own" on public.glucose_readings
  for insert with check (auth.uid() = user_id);

drop policy if exists "glucose update own" on public.glucose_readings;
create policy "glucose update own" on public.glucose_readings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "glucose delete own" on public.glucose_readings;
create policy "glucose delete own" on public.glucose_readings
  for delete using (auth.uid() = user_id);

-- ============================================================
-- updated_at 触发器
-- ============================================================
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();
