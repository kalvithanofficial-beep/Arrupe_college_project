export type UserRole = 'admin' | 'accountant' | 'teacher' | 'student' | 'parent';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  grade: number;
  section: string;
  class_teacher_id: string | null;
  academic_year: string;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  max_marks: number;
  created_at: string;
}

export interface ClassSubject {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string | null;
  created_at: string;
}

export interface Student {
  id: string;
  user_id: string | null;
  roll_number: string | null;
  full_name: string;
  class_id: string;
  parent_id: string | null;
  admission_number: string | null;
  date_of_birth: string | null;
  gender: 'male' | 'female' | 'other' | null;
  address: string | null;
  created_at: string;
}

export interface TimetableEntry {
  id: string;
  class_id: string;
  day_of_week: number;
  period: number;
  start_time: string;
  end_time: string;
  subject_id: string | null;
  teacher_id: string | null;
  room: string | null;
  created_at: string;
}

export interface ExamTerm {
  id: string;
  name: string;
  code: string;
  sort_order: number;
  created_at: string;
}

export interface Mark {
  id: string;
  student_id: string;
  subject_id: string;
  exam_term_id: string;
  academic_year: string;
  class_id: string;
  marks_obtained: number;
  max_marks: number;
  published: boolean;
  entered_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  marked_by: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  student_id: string;
  term: string;
  academic_year: string;
  tuition_fee: number;
  library_fee: number;
  lab_fee: number;
  sports_fee: number;
  other_fee: number;
  total_amount: number;
  amount_paid: number;
  status: 'unpaid' | 'partial' | 'paid';
  due_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  student_id: string;
  amount: number;
  payment_method: 'cash' | 'cheque' | 'bank_deposit';
  payment_reference: string | null;
  payment_date: string;
  notes: string | null;
  received_by: string | null;
  created_at: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  category: 'holiday' | 'sports' | 'exam' | 'general' | 'urgent';
  posted_by: string | null;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

export interface Substitution {
  id: string;
  date: string;
  class_id: string;
  subject_id: string;
  absent_teacher_id: string | null;
  acting_teacher_id: string;
  start_time: string;
  end_time: string;
  period: number | null;
  leave_reason: string | null;
  status: 'active' | 'completed' | 'cancelled';
  created_by: string | null;
  created_at: string;
}

export interface AttendanceAlert {
  id: string;
  substitution_id: string;
  student_id: string;
  message: string;
  channels: string[];
  is_dismissed: boolean;
  created_at: string;
}

export interface OtpRequest {
  id: string;
  user_id: string;
  otp_code: string;
  phone_number: string | null;
  purpose: string;
  is_used: boolean;
  expires_at: string;
  created_at: string;
}
