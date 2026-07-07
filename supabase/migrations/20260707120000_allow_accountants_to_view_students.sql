-- Allow accountants to view student records used by invoice/payment screens.

DROP POLICY IF EXISTS "students_select_scoped" ON public.students;
CREATE POLICY "students_select_scoped" ON public.students FOR SELECT
  TO authenticated USING (
    public.is_admin()
    OR public.current_role() = 'accountant'
    OR auth.uid() = user_id
    OR auth.uid() = parent_id
    OR EXISTS (
      SELECT 1 FROM public.class_subjects cs
      WHERE cs.class_id = students.class_id AND cs.teacher_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = students.class_id AND c.class_teacher_id = auth.uid()
    )
  );
