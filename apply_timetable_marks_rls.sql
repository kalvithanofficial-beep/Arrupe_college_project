-- timetable_entries RLS
ALTER TABLE timetable_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "timetable_select" ON timetable_entries;
CREATE POLICY "timetable_select" ON timetable_entries
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "timetable_insert" ON timetable_entries;
CREATE POLICY "timetable_insert" ON timetable_entries
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'teacher'));

DROP POLICY IF EXISTS "timetable_update" ON timetable_entries;
CREATE POLICY "timetable_update" ON timetable_entries
  FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'teacher'))
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'teacher'));

DROP POLICY IF EXISTS "timetable_delete" ON timetable_entries;
CREATE POLICY "timetable_delete" ON timetable_entries
  FOR DELETE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- marks RLS
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marks_select" ON marks;
CREATE POLICY "marks_select" ON marks
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "marks_insert" ON marks;
CREATE POLICY "marks_insert" ON marks
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'teacher'));

DROP POLICY IF EXISTS "marks_update" ON marks;
CREATE POLICY "marks_update" ON marks
  FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'teacher'))
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'teacher'));

DROP POLICY IF EXISTS "marks_delete" ON marks;
CREATE POLICY "marks_delete" ON marks
  FOR DELETE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
