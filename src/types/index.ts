export type UserRole = 'admin' | 'teacher' | 'accountant' | 'parent' | 'student';

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  email: string | null;
  phone: string | null;
  age: number | null;
  gender: 'Male' | 'Female' | 'Other' | null;
  date_of_birth: string | null;
  address: string | null;
  religion: string | null;
  avatar_url: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Student {
  id: string;
  name: string;
  roll_no: string;
  class_name: string;
  section: string;
  parent_email: string | null;
  photo_url: string | null;
  admission_date: string | null;
  created_at: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  department: string | null;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  notice_type: 'INTERNAL' | 'CIRCULAR' | 'URGENT' | 'ACADEMIC' | 'HOLIDAY' | 'UPDATE' | 'IMPORTANT';
  created_at: string;
}

export interface FeePayment {
  id: string;
  invoice_id: string;
  student_id: string | null;
  student_name: string;
  student_class: string;
  amount: number;
  payment_type: string;
  payment_mode: string;
  reference_no: string | null;
  remarks: string | null;
  status: 'Paid' | 'Pending' | 'Overdue';
  payment_date: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string | null;
  student_name: string;
  class_name: string;
  section: string;
  date: string;
  present: boolean;
  created_at: string;
}

export interface Mark {
  id: string;
  student_id: string | null;
  student_name: string;
  subject: string;
  midterm: number;
  finals: number;
  internal: number;
  max_score: number;
  academic_year: string;
  created_at: string;
}

export interface TimetableEntry {
  id: string;
  class_name: string;
  subject: string;
  teacher_name: string | null;
  room: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface Substitution {
  id: string;
  date: string;
  class_name: string;
  subject: string;
  acting_teacher: string;
  time_slot: string;
  reason: string | null;
  created_at: string;
}
