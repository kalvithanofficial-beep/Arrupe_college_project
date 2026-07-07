/*
# School Management System - Core Schema (retry)

Fixes the syntax error from the previous attempt: `CREATE POLICY IF EXISTS` is not valid SQL. Uses `DROP POLICY IF EXISTS` before each `CREATE POLICY` instead. All other content is identical and idempotent.
*/

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('admin', 'accountant', 'teacher', 'student', 'parent')),
  full_name text NOT NULL,
  phone text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.current_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_admin_insert" ON public.profiles;
CREATE POLICY "profiles_admin_insert" ON public.profiles FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
CREATE POLICY "profiles_admin_update" ON public.profiles FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- CLASSES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  grade int NOT NULL,
  section text NOT NULL DEFAULT 'A',
  class_teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  academic_year text NOT NULL DEFAULT '2025-2026',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "classes_select_all_authenticated" ON public.classes;
CREATE POLICY "classes_select_all_authenticated" ON public.classes FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "classes_admin_write" ON public.classes;
CREATE POLICY "classes_admin_write" ON public.classes FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- SUBJECTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  max_marks int NOT NULL DEFAULT 100,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subjects_select_all_authenticated" ON public.subjects;
CREATE POLICY "subjects_select_all_authenticated" ON public.subjects FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "subjects_admin_write" ON public.subjects;
CREATE POLICY "subjects_admin_write" ON public.subjects FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- CLASS_SUBJECTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.class_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (class_id, subject_id)
);

ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "class_subjects_select_all_authenticated" ON public.class_subjects;
CREATE POLICY "class_subjects_select_all_authenticated" ON public.class_subjects FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "class_subjects_admin_write" ON public.class_subjects;
CREATE POLICY "class_subjects_admin_write" ON public.class_subjects FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- STUDENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  roll_number text,
  full_name text NOT NULL,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  admission_number text UNIQUE,
  date_of_birth date,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students_select_scoped" ON public.students;
CREATE POLICY "students_select_scoped" ON public.students FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR auth.uid() = parent_id
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.class_subjects cs
      WHERE cs.class_id = students.class_id AND cs.teacher_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = students.class_id AND c.class_teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "students_admin_write" ON public.students;
CREATE POLICY "students_admin_write" ON public.students FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- TIMETABLE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.timetable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  period int NOT NULL CHECK (period BETWEEN 1 AND 8),
  start_time text NOT NULL,
  end_time text NOT NULL,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  room text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (class_id, day_of_week, period)
);

ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "timetable_select_scoped" ON public.timetable;
CREATE POLICY "timetable_select_scoped" ON public.timetable FOR SELECT
  TO authenticated USING (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.class_id = timetable.class_id AND (s.user_id = auth.uid() OR s.parent_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM public.class_subjects cs WHERE cs.class_id = timetable.class_id AND cs.teacher_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = timetable.class_id AND c.class_teacher_id = auth.uid())
  );

DROP POLICY IF EXISTS "timetable_admin_write" ON public.timetable;
CREATE POLICY "timetable_admin_write" ON public.timetable FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- EXAM_TERMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.exam_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.exam_terms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exam_terms_select_all" ON public.exam_terms;
CREATE POLICY "exam_terms_select_all" ON public.exam_terms FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "exam_terms_admin_write" ON public.exam_terms;
CREATE POLICY "exam_terms_admin_write" ON public.exam_terms FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- MARKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  exam_term_id uuid NOT NULL REFERENCES public.exam_terms(id) ON DELETE RESTRICT,
  academic_year text NOT NULL,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  marks_obtained numeric(6,2) NOT NULL,
  max_marks int NOT NULL DEFAULT 100,
  published boolean NOT NULL DEFAULT false,
  entered_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (student_id, subject_id, exam_term_id, academic_year)
);

ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_marks_student ON public.marks(student_id);
CREATE INDEX IF NOT EXISTS idx_marks_class_term ON public.marks(class_id, exam_term_id, academic_year);

DROP POLICY IF EXISTS "marks_select_scoped" ON public.marks;
CREATE POLICY "marks_select_scoped" ON public.marks FOR SELECT
  TO authenticated USING (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = marks.student_id AND s.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = marks.student_id AND s.parent_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.class_subjects cs
      WHERE cs.class_id = marks.class_id AND cs.subject_id = marks.subject_id AND cs.teacher_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.classes c WHERE c.id = marks.class_id AND c.class_teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "marks_teacher_admin_insert" ON public.marks;
CREATE POLICY "marks_teacher_admin_insert" ON public.marks FOR INSERT
  TO authenticated WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.class_subjects cs
      WHERE cs.class_id = marks.class_id AND cs.subject_id = marks.subject_id AND cs.teacher_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.classes c WHERE c.id = marks.class_id AND c.class_teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "marks_teacher_admin_update" ON public.marks;
CREATE POLICY "marks_teacher_admin_update" ON public.marks FOR UPDATE
  TO authenticated USING (
    public.is_admin()
    OR entered_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.class_subjects cs
      WHERE cs.class_id = marks.class_id AND cs.subject_id = marks.subject_id AND cs.teacher_id = auth.uid()
    )
  ) WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.class_subjects cs
      WHERE cs.class_id = marks.class_id AND cs.subject_id = marks.subject_id AND cs.teacher_id = auth.uid()
    )
  );

-- ============================================================
-- ATTENDANCE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (student_id, date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON public.attendance(class_id, date);

DROP POLICY IF EXISTS "attendance_select_scoped" ON public.attendance;
CREATE POLICY "attendance_select_scoped" ON public.attendance FOR SELECT
  TO authenticated USING (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = attendance.student_id AND s.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = attendance.student_id AND s.parent_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = attendance.class_id AND c.class_teacher_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.class_subjects cs WHERE cs.class_id = attendance.class_id AND cs.teacher_id = auth.uid())
  );

DROP POLICY IF EXISTS "attendance_teacher_admin_insert" ON public.attendance;
CREATE POLICY "attendance_teacher_admin_insert" ON public.attendance FOR INSERT
  TO authenticated WITH CHECK (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = attendance.class_id AND c.class_teacher_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.class_subjects cs WHERE cs.class_id = attendance.class_id AND cs.teacher_id = auth.uid())
  );

DROP POLICY IF EXISTS "attendance_teacher_admin_update" ON public.attendance;
CREATE POLICY "attendance_teacher_admin_update" ON public.attendance FOR UPDATE
  TO authenticated USING (
    public.is_admin()
    OR marked_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = attendance.class_id AND c.class_teacher_id = auth.uid())
  ) WITH CHECK (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = attendance.class_id AND c.class_teacher_id = auth.uid())
  );

-- ============================================================
-- INVOICES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  term text NOT NULL,
  academic_year text NOT NULL,
  tuition_fee numeric(10,2) NOT NULL DEFAULT 0,
  library_fee numeric(10,2) NOT NULL DEFAULT 0,
  lab_fee numeric(10,2) NOT NULL DEFAULT 0,
  sports_fee numeric(10,2) NOT NULL DEFAULT 0,
  other_fee numeric(10,2) NOT NULL DEFAULT 0,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  amount_paid numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid')),
  due_date date,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_invoices_student ON public.invoices(student_id);

DROP POLICY IF EXISTS "invoices_select_scoped" ON public.invoices;
CREATE POLICY "invoices_select_scoped" ON public.invoices FOR SELECT
  TO authenticated USING (
    public.is_admin()
    OR public.current_role() = 'accountant'
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = invoices.student_id AND s.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = invoices.student_id AND s.parent_id = auth.uid())
  );

DROP POLICY IF EXISTS "invoices_accountant_admin_insert" ON public.invoices;
CREATE POLICY "invoices_accountant_admin_insert" ON public.invoices FOR INSERT
  TO authenticated WITH CHECK (public.is_admin() OR public.current_role() = 'accountant');

DROP POLICY IF EXISTS "invoices_accountant_admin_update" ON public.invoices;
CREATE POLICY "invoices_accountant_admin_update" ON public.invoices FOR UPDATE
  TO authenticated USING (public.is_admin() OR public.current_role() = 'accountant')
  WITH CHECK (public.is_admin() OR public.current_role() = 'accountant');

-- ============================================================
-- PAYMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'cheque', 'bank_deposit')),
  payment_reference text,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  received_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_student ON public.payments(student_id);

DROP POLICY IF EXISTS "payments_select_scoped" ON public.payments;
CREATE POLICY "payments_select_scoped" ON public.payments FOR SELECT
  TO authenticated USING (
    public.is_admin()
    OR public.current_role() = 'accountant'
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = payments.student_id AND s.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = payments.student_id AND s.parent_id = auth.uid())
  );

DROP POLICY IF EXISTS "payments_accountant_admin_insert" ON public.payments;
CREATE POLICY "payments_accountant_admin_insert" ON public.payments FOR INSERT
  TO authenticated WITH CHECK (public.is_admin() OR public.current_role() = 'accountant');

-- ============================================================
-- NOTICES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL CHECK (category IN ('holiday', 'sports', 'exam', 'general', 'urgent')),
  posted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notices_select_all" ON public.notices;
CREATE POLICY "notices_select_all" ON public.notices FOR SELECT
  TO authenticated USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "notices_admin_write" ON public.notices;
CREATE POLICY "notices_admin_write" ON public.notices FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- SUBSTITUTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.substitutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  absent_teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  acting_teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_time text NOT NULL,
  end_time text NOT NULL,
  period int,
  leave_reason text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.substitutions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "substitutions_select_scoped" ON public.substitutions;
CREATE POLICY "substitutions_select_scoped" ON public.substitutions FOR SELECT
  TO authenticated USING (
    public.is_admin()
    OR acting_teacher_id = auth.uid()
    OR absent_teacher_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.class_id = substitutions.class_id AND (s.user_id = auth.uid() OR s.parent_id = auth.uid()))
  );

DROP POLICY IF EXISTS "substitutions_admin_write" ON public.substitutions;
CREATE POLICY "substitutions_admin_write" ON public.substitutions FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- ATTENDANCE_ALERTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.attendance_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  substitution_id uuid NOT NULL REFERENCES public.substitutions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  message text NOT NULL,
  channels text[] NOT NULL DEFAULT ARRAY['whatsapp', 'email', 'sms', 'banner'],
  is_dismissed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.attendance_alerts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_alerts_student ON public.attendance_alerts(student_id);
CREATE INDEX IF NOT EXISTS idx_alerts_substitution ON public.attendance_alerts(substitution_id);

DROP POLICY IF EXISTS "alerts_select_scoped" ON public.attendance_alerts;
CREATE POLICY "alerts_select_scoped" ON public.attendance_alerts FOR SELECT
  TO authenticated USING (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = attendance_alerts.student_id AND s.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = attendance_alerts.student_id AND s.parent_id = auth.uid())
  );

DROP POLICY IF EXISTS "alerts_admin_write" ON public.attendance_alerts;
CREATE POLICY "alerts_admin_write" ON public.attendance_alerts FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "alerts_dismiss_own" ON public.attendance_alerts;
CREATE POLICY "alerts_dismiss_own" ON public.attendance_alerts FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.students s WHERE s.id = attendance_alerts.student_id AND (s.user_id = auth.uid() OR s.parent_id = auth.uid()))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.students s WHERE s.id = attendance_alerts.student_id AND (s.user_id = auth.uid() OR s.parent_id = auth.uid()))
  );

-- ============================================================
-- OTP_REQUESTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.otp_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  otp_code text NOT NULL,
  phone_number text,
  purpose text NOT NULL DEFAULT 'password_reset',
  is_used boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.otp_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_otp_user ON public.otp_requests(user_id);

DROP POLICY IF EXISTS "otp_select_own_or_admin" ON public.otp_requests;
CREATE POLICY "otp_select_own_or_admin" ON public.otp_requests FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "otp_insert_own" ON public.otp_requests;
CREATE POLICY "otp_insert_own" ON public.otp_requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "otp_update_own" ON public.otp_requests;
CREATE POLICY "otp_update_own" ON public.otp_requests FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- UPDATED_AT trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS invoices_updated_at ON public.invoices;
CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS marks_updated_at ON public.marks;
CREATE TRIGGER marks_updated_at BEFORE UPDATE ON public.marks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
