/*
# Arrupe College School Management System — Initial Schema

## Overview
Full schema for a multi-role school management portal serving Admins, Teachers,
Accountants, Parents, and Students. All tables use UUID primary keys and RLS.

## New Tables

### profiles
Extends auth.users. Stores display name, role, avatar, and phone.
Roles: admin | teacher | accountant | parent | student

### students
Core student registry: name, class, section, roll number, parent email.

### staff
Staff/teacher registry: name, role/designation, department, email.

### classes
Class definitions: grade label (e.g. "Grade 10") and section (e.g. "B").

### subjects
Subjects mapped to a class and optionally a teacher.

### attendance_records
Daily per-student attendance: student, class, date, present/absent.

### marks
Exam marks per student per subject: midterm, finals, internal, exam type.

### fee_payments
Fee transaction ledger: student, amount, type, mode, reference, status.

### notices
School-wide notice board: title, content, priority type, timestamps.

### substitutions
Smart substitution assignments: date, class, subject, acting teacher, time slot.

### timetable_entries
Weekly schedule: class, subject, day of week, start/end time, room.

## Security
RLS enabled on all tables. Authenticated users can read all school data.
Only admins/staff should write — enforced at UI level (role checks on client).
For simplicity, insert/update/delete policies also use authenticated so the
demo can be driven by any logged-in user.
*/

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('admin','teacher','accountant','parent','student')),
  email text,
  phone text,
  age integer,
  gender text CHECK (gender IN ('Male', 'Female', 'Other')),
  date_of_birth date,
  address text,
  religion text,
  avatar_url text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin') WITH CHECK (auth.uid() = id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "profiles_delete" ON profiles;
CREATE POLICY "profiles_delete" ON profiles FOR DELETE TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- STUDENTS
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  roll_no text NOT NULL,
  class_name text NOT NULL,
  section text NOT NULL DEFAULT 'A',
  parent_email text,
  photo_url text,
  admission_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students_select" ON students;
CREATE POLICY "students_select" ON students FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "students_insert" ON students;
CREATE POLICY "students_insert" ON students FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "students_update" ON students;
CREATE POLICY "students_update" ON students FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "students_delete" ON students;
CREATE POLICY "students_delete" ON students FOR DELETE TO authenticated USING (true);

-- STAFF
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL DEFAULT 'Teacher',
  department text,
  email text,
  phone text,
  photo_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_select" ON staff;
CREATE POLICY "staff_select" ON staff FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "staff_insert" ON staff;
CREATE POLICY "staff_insert" ON staff FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "staff_update" ON staff;
CREATE POLICY "staff_update" ON staff FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "staff_delete" ON staff;
CREATE POLICY "staff_delete" ON staff FOR DELETE TO authenticated USING (true);

-- NOTICES
CREATE TABLE IF NOT EXISTS notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  notice_type text NOT NULL DEFAULT 'INTERNAL' CHECK (notice_type IN ('INTERNAL','CIRCULAR','URGENT','ACADEMIC','HOLIDAY','UPDATE','IMPORTANT')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notices_select" ON notices;
CREATE POLICY "notices_select" ON notices FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "notices_insert" ON notices;
CREATE POLICY "notices_insert" ON notices FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "notices_update" ON notices;
CREATE POLICY "notices_update" ON notices FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "notices_delete" ON notices;
CREATE POLICY "notices_delete" ON notices FOR DELETE TO authenticated USING (true);

-- FEE PAYMENTS
CREATE TABLE IF NOT EXISTS fee_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id text NOT NULL,
  student_id uuid REFERENCES students(id) ON DELETE SET NULL,
  student_name text NOT NULL,
  student_class text NOT NULL,
  amount numeric(10,2) NOT NULL,
  payment_type text NOT NULL DEFAULT 'Tuition Fees',
  payment_mode text NOT NULL DEFAULT 'Cash',
  reference_no text,
  remarks text,
  status text NOT NULL DEFAULT 'Paid' CHECK (status IN ('Paid','Pending','Overdue')),
  payment_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fee_select" ON fee_payments;
CREATE POLICY "fee_select" ON fee_payments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "fee_insert" ON fee_payments;
CREATE POLICY "fee_insert" ON fee_payments FOR INSERT TO authenticated WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'accountant'));

DROP POLICY IF EXISTS "fee_update" ON fee_payments;
CREATE POLICY "fee_update" ON fee_payments FOR UPDATE TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'accountant')) WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'accountant'));

DROP POLICY IF EXISTS "fee_delete" ON fee_payments;
CREATE POLICY "fee_delete" ON fee_payments FOR DELETE TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'accountant'));

-- ATTENDANCE RECORDS
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  class_name text NOT NULL,
  section text NOT NULL DEFAULT 'A',
  date date NOT NULL DEFAULT CURRENT_DATE,
  present boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, date)
);

ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendance_select" ON attendance_records;
CREATE POLICY "attendance_select" ON attendance_records FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "attendance_insert" ON attendance_records;
CREATE POLICY "attendance_insert" ON attendance_records FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "attendance_update" ON attendance_records;
CREATE POLICY "attendance_update" ON attendance_records FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "attendance_delete" ON attendance_records;
CREATE POLICY "attendance_delete" ON attendance_records FOR DELETE TO authenticated USING (true);

-- MARKS
CREATE TABLE IF NOT EXISTS marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  subject text NOT NULL,
  midterm integer DEFAULT 0,
  finals integer DEFAULT 0,
  internal integer DEFAULT 0,
  max_score integer DEFAULT 200,
  academic_year text DEFAULT '2023-24',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE marks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marks_select" ON marks;
CREATE POLICY "marks_select" ON marks FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "marks_insert" ON marks;
CREATE POLICY "marks_insert" ON marks FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "marks_update" ON marks;
CREATE POLICY "marks_update" ON marks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marks_delete" ON marks;
CREATE POLICY "marks_delete" ON marks FOR DELETE TO authenticated USING (true);

-- SUBSTITUTIONS
CREATE TABLE IF NOT EXISTS substitutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  class_name text NOT NULL,
  subject text NOT NULL,
  acting_teacher text NOT NULL,
  time_slot text NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE substitutions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sub_select" ON substitutions;
CREATE POLICY "sub_select" ON substitutions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "sub_insert" ON substitutions;
CREATE POLICY "sub_insert" ON substitutions FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "sub_update" ON substitutions;
CREATE POLICY "sub_update" ON substitutions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "sub_delete" ON substitutions;
CREATE POLICY "sub_delete" ON substitutions FOR DELETE TO authenticated USING (true);

-- TIMETABLE
CREATE TABLE IF NOT EXISTS timetable_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name text NOT NULL,
  subject text NOT NULL,
  teacher_name text,
  room text,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE timetable_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "timetable_select" ON timetable_entries;
CREATE POLICY "timetable_select" ON timetable_entries FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "timetable_insert" ON timetable_entries;
CREATE POLICY "timetable_insert" ON timetable_entries FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "timetable_update" ON timetable_entries;
CREATE POLICY "timetable_update" ON timetable_entries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "timetable_delete" ON timetable_entries;
CREATE POLICY "timetable_delete" ON timetable_entries FOR DELETE TO authenticated USING (true);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_name, section);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_student ON fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_marks_student ON marks(student_id);
CREATE INDEX IF NOT EXISTS idx_notices_created ON notices(created_at DESC);

-- RPC FUNCTION FOR ADMIN USER CREATION
CREATE OR REPLACE FUNCTION create_user_profile(
  p_email text,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_age integer,
  p_gender text,
  p_date_of_birth date,
  p_address text,
  p_religion text,
  p_role text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_role text;
  v_user_id uuid;
BEGIN
  -- Check if caller is admin
  v_admin_role := (SELECT role FROM profiles WHERE id = auth.uid());
  
  IF v_admin_role != 'admin' THEN
    RETURN jsonb_build_object('error', 'Only admins can create user profiles', 'success', false);
  END IF;

  -- Get user ID from auth.users by email
  v_user_id := (SELECT id FROM auth.users WHERE email = p_email);
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'error', 'Auth user not found. Please create user in Supabase Dashboard first.',
      'success', false,
      'email', p_email
    );
  END IF;

  -- Create profile for the auth user
  INSERT INTO profiles (
    id, first_name, last_name, full_name, role, email, phone, 
    age, gender, date_of_birth, address, religion, created_by, created_at
  )
  VALUES (
    v_user_id, 
    p_first_name, 
    p_last_name, 
    p_first_name || ' ' || p_last_name, 
    p_role, 
    p_email, 
    p_phone,
    p_age, 
    p_gender, 
    p_date_of_birth, 
    p_address, 
    p_religion, 
    auth.uid(),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'message', 'User profile created successfully',
    'email', p_email,
    'role', p_role
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'success', false
  );
END;
$$;

/*
## SETUP INSTRUCTIONS

### Create Admin User (Principle) - NEW METHOD

Since this uses RPC function (PostgreSQL), admins can now create users directly from the app:

1. **Create auth user first** in Supabase Dashboard:
   - Go to Supabase > Authentication > Users
   - Click "Add User"
   - Email: admin@arrupecollege.edu
   - Password: Admin@arrupecollege.edu123
   - Click "Create User"
   - Copy the UUID

2. **Insert profile** using SQL:
   ```sql
   INSERT INTO profiles (id, first_name, last_name, full_name, role, email, phone, age, gender, date_of_birth, address, religion)
   VALUES (
     'PASTE_UUID_HERE',
     'Admin',
     'Principle',
     'Admin Principle',
     'admin',
     'admin@arrupecollege.edu',
     '+91 98765 43210',
     45,
     'Male',
     '1978-06-15',
     'Arrupe College, Chennai',
     'Catholic'
   );
   ```

3. **Login with admin account** at localhost:5173
   - Email: admin@arrupecollege.edu
   - Password: Admin@arrupecollege.edu123

4. **Now admins can create users via the app:**
   - Go to Users page
   - Click "Add New User"
   - Fill form and submit
   - User is created via PostgreSQL RPC function

### Demo Accounts (For Testing)
For local development, keep demo account credentials outside version control.
Create and store them in a local gitignored file such as `local/demo-credentials.md`.

Example local credentials:
- Admin: admin@arrupecollege.edu / Admin@arrupecollege.edu123
- Teacher: teacher.demo@arrupecollege.edu / Demo@1234
- Student: student.demo@arrupecollege.edu / Demo@1234 (optional, seed if needed)

Do not commit `local/demo-credentials.md` or any real secrets to the repository.
*/
