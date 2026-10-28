-- ==============================================================================
-- Examination Timetable Scheduling and Conflict Detection System
-- Institution: Akwa Ibom State Polytechnic, Ikot Osurua
-- Database Schema for Supabase (PostgreSQL)
-- ==============================================================================

-- 1. DEPARTMENTS TABLE
create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  created_at timestamptz default now() not null
);

-- 2. CLASSES TABLE
-- In accordance with project rules: Class = Department + Level (e.g. SWD HND 2)
create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references departments(id) on delete cascade,
  level text not null,
  student_count integer not null default 0 check (student_count >= 0),
  created_at timestamptz default now() not null,
  unique (department_id, level)
);

-- 3. COURSES TABLE
-- Belongs to a class
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  title text not null,
  class_id uuid not null references classes(id) on delete cascade,
  created_at timestamptz default now() not null
);

-- 4. HALLS TABLE
-- Hall capacity is optional
create table if not exists halls (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  capacity integer check (capacity is null or capacity > 0),
  created_at timestamptz default now() not null
);

-- 5. TIMETABLES TABLE
create table if not exists timetables (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  session text not null,
  semester text not null,
  created_at timestamptz default now() not null
);

-- 6. EXAMS TABLE (CENTRAL TIMETABLE ENTRIES)
-- Rule: one course cannot appear twice in a single timetable -> unique (timetable_id, course_id)
create table if not exists exams (
  id uuid primary key default gen_random_uuid(),
  timetable_id uuid not null references timetables(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  hall_id uuid not null references halls(id) on delete restrict,
  exam_date date not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz default now() not null,
  unique (timetable_id, course_id),
  check (end_time > start_time)
);

-- 7. SETTINGS TABLE
-- Global default for maximum classes sharing a hall (default 3)
create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  max_classes_per_hall integer not null default 3 check (max_classes_per_hall > 0),
  created_at timestamptz default now() not null
);

-- Insert initial default settings row if table is empty
insert into settings (max_classes_per_hall)
select 3
where not exists (select 1 from settings);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
create index if not exists idx_classes_department_id on classes(department_id);
create index if not exists idx_courses_class_id on courses(class_id);
create index if not exists idx_exams_timetable_id on exams(timetable_id);
create index if not exists idx_exams_course_id on exams(course_id);
create index if not exists idx_exams_hall_id on exams(hall_id);
create index if not exists idx_exams_date on exams(exam_date);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Policy: Anyone can read (SELECT)
-- Policy: Only authenticated users can insert, update, or delete
-- ==============================================================================

-- Enable RLS on all tables
alter table departments enable row level security;
alter table classes enable row level security;
alter table courses enable row level security;
alter table halls enable row level security;
alter table timetables enable row level security;
alter table exams enable row level security;
alter table settings enable row level security;

-- Drop existing policies if re-running script to avoid duplicate errors
drop policy if exists "Allow public read access" on departments;
drop policy if exists "Allow authenticated insert" on departments;
drop policy if exists "Allow authenticated update" on departments;
drop policy if exists "Allow authenticated delete" on departments;

drop policy if exists "Allow public read access" on classes;
drop policy if exists "Allow authenticated insert" on classes;
drop policy if exists "Allow authenticated update" on classes;
drop policy if exists "Allow authenticated delete" on classes;

drop policy if exists "Allow public read access" on courses;
drop policy if exists "Allow authenticated insert" on courses;
drop policy if exists "Allow authenticated update" on courses;
drop policy if exists "Allow authenticated delete" on courses;

drop policy if exists "Allow public read access" on halls;
drop policy if exists "Allow authenticated insert" on halls;
drop policy if exists "Allow authenticated update" on halls;
drop policy if exists "Allow authenticated delete" on halls;

drop policy if exists "Allow public read access" on timetables;
drop policy if exists "Allow authenticated insert" on timetables;
drop policy if exists "Allow authenticated update" on timetables;
drop policy if exists "Allow authenticated delete" on timetables;

drop policy if exists "Allow public read access" on exams;
drop policy if exists "Allow authenticated insert" on exams;
drop policy if exists "Allow authenticated update" on exams;
drop policy if exists "Allow authenticated delete" on exams;

drop policy if exists "Allow public read access" on settings;
drop policy if exists "Allow authenticated insert" on settings;
drop policy if exists "Allow authenticated update" on settings;
drop policy if exists "Allow authenticated delete" on settings;

-- 1. Departments Policies
create policy "Allow public read access" on departments for select using (true);
create policy "Allow authenticated insert" on departments for insert to authenticated with check (true);
create policy "Allow authenticated update" on departments for update to authenticated using (true) with check (true);
create policy "Allow authenticated delete" on departments for delete to authenticated using (true);

-- 2. Classes Policies
create policy "Allow public read access" on classes for select using (true);
create policy "Allow authenticated insert" on classes for insert to authenticated with check (true);
create policy "Allow authenticated update" on classes for update to authenticated using (true) with check (true);
create policy "Allow authenticated delete" on classes for delete to authenticated using (true);

-- 3. Courses Policies
create policy "Allow public read access" on courses for select using (true);
create policy "Allow authenticated insert" on courses for insert to authenticated with check (true);
create policy "Allow authenticated update" on courses for update to authenticated using (true) with check (true);
create policy "Allow authenticated delete" on courses for delete to authenticated using (true);

-- 4. Halls Policies
create policy "Allow public read access" on halls for select using (true);
create policy "Allow authenticated insert" on halls for insert to authenticated with check (true);
create policy "Allow authenticated update" on halls for update to authenticated using (true) with check (true);
create policy "Allow authenticated delete" on halls for delete to authenticated using (true);

-- 5. Timetables Policies
create policy "Allow public read access" on timetables for select using (true);
create policy "Allow authenticated insert" on timetables for insert to authenticated with check (true);
create policy "Allow authenticated update" on timetables for update to authenticated using (true) with check (true);
create policy "Allow authenticated delete" on timetables for delete to authenticated using (true);

-- 6. Exams Policies
create policy "Allow public read access" on exams for select using (true);
create policy "Allow authenticated insert" on exams for insert to authenticated with check (true);
create policy "Allow authenticated update" on exams for update to authenticated using (true) with check (true);
create policy "Allow authenticated delete" on exams for delete to authenticated using (true);

-- 7. Settings Policies
create policy "Allow public read access" on settings for select using (true);
create policy "Allow authenticated insert" on settings for insert to authenticated with check (true);
create policy "Allow authenticated update" on settings for update to authenticated using (true) with check (true);
create policy "Allow authenticated delete" on settings for delete to authenticated using (true);
