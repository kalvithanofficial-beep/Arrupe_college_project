import { useEffect, useState, FormEvent } from 'react';
import { CheckSquare, FileUp, Sparkles, Clock, AlertTriangle, Upload, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Student, Notice, TimetableEntry } from '../types';
import NoticeCard from '../components/ui/NoticeCard';

interface AttendanceRow {
  student: Student;
  present: boolean;
}

const AI_INSIGHTS = [
  {
    tag: 'High Performer', tagColor: 'bg-emerald-100 text-emerald-700',
    name: 'Aarav Sharma',
    text: '"Aarav shows exceptional analytical skills in Science and Mathematics. Recommend enrolling in the inter-school olympiad."',
    scores: [{ label: 'Science', val: '98%' }, { label: 'Math', val: '96%' }],
  },
  {
    tag: 'Needs Focus', tagColor: 'bg-orange-100 text-orange-700',
    name: 'Karan Patel',
    text: '"Historical data suggests Karan struggles with Literature comprehension. Supplemental reading lists may help improve scores."',
    scores: [{ label: 'English', val: '62%' }, { label: 'History', val: '70%' }],
  },
  {
    tag: 'Steady Progress', tagColor: 'bg-blue-100 text-blue-700',
    name: 'Ishani Gupta',
    text: '"Ishani has shown a 12% improvement in Social Studies this term. Consistent effort is paying off."',
    scores: [{ label: 'SST', val: '85%' }, { label: 'Arts', val: '92%' }],
  },
];

export default function AcademicDashboard() {
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadName, setUploadName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [recentUploads, setRecentUploads] = useState<Array<{ name: string; id: string; created_at?: string; metadata?: { size?: number } }>>([]);

  useEffect(() => {
    void fetchData();
    void fetchRecentUploads();
  }, []);

  async function fetchData() {
    const today = new Date().getDay(); // 0=Sun, 1=Mon...
    const [{ data: studentsData }, { data: noticesData }, { data: ttData }] = await Promise.all([
      supabase.from('students').select('*').eq('class_name', 'Class X').eq('section', 'B').order('roll_no'),
      supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(4),
      supabase.from('timetable_entries').select('*').eq('day_of_week', today === 0 ? 1 : today),
    ]);

    if (studentsData) {
      const rows: AttendanceRow[] = (studentsData as Student[]).map(s => ({ student: s, present: true }));
      setAttendance(rows);
    }
    if (noticesData) setNotices(noticesData as Notice[]);
    if (ttData) setTimetable(ttData as TimetableEntry[]);
  }

  async function fetchRecentUploads() {
    const { data, error } = await supabase.storage.from('term-results').list('', { limit: 10 });

    if (error) {
      console.error('Failed to load recent uploads', error);
      return;
    }

    const uploads = (data ?? [])
      .filter((item): item is { name: string; id: string; created_at?: string; metadata?: { size?: number } } => Boolean(item.name))
      .sort((a, b) => {
        const aTime = new Date((a as { created_at?: string; updated_at?: string }).created_at ?? (a as { created_at?: string; updated_at?: string }).updated_at ?? 0).getTime();
        const bTime = new Date((b as { created_at?: string; updated_at?: string }).created_at ?? (b as { created_at?: string; updated_at?: string }).updated_at ?? 0).getTime();
        return bTime - aTime;
      })
      .map(item => ({
        name: item.name,
        id: item.id,
        created_at: item.created_at,
        metadata: item.metadata,
      }));

    setRecentUploads(uploads);
  }

  function toggleAttendance(idx: number, field: 'present') {
    setAttendance(prev => prev.map((r, i) => i === idx ? { ...r, [field]: !r[field] } : r));
  }

  async function handleSubmitAttendance(e: FormEvent) {
    e.preventDefault();
    setSubmitLoading(true);
    const records = attendance.map(r => ({
      student_id: r.student.id,
      student_name: r.student.name,
      class_name: r.student.class_name,
      section: r.student.section,
      date: selectedDate,
      present: r.present,
    }));
    await supabase.from('attendance_records').upsert(records, { onConflict: 'student_id,date' });
    setSubmitLoading(false);
    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 3000);
  }

  const lastStatus = (r: AttendanceRow) => {
    if (!r.present) return <span className="text-red-500 text-xs font-medium">3 Absences</span>;
    if (r.student.name === 'Ishani Gupta') return <span className="text-amber-500 text-xs font-medium">On Leave</span>;
    return <span className="text-emerald-600 text-xs font-medium">Consistent</span>;
  };

  const formatTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  function formatFileSize(bytes?: number) {
    if (!bytes && bytes !== 0) return '—';
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  }

  function formatUploadDate(value?: string) {
    if (!value) return 'Unknown date';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown date';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  async function handleUploadTermResults(file: File | null) {
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    setUploadMessage(null);

    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from('term-results').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream',
      });

      if (error) throw error;

      setUploadName(file.name);
      await fetchRecentUploads();
      setUploadMessage(`Uploaded successfully to term-results: ${file.name}`);
    } catch (err) {
      console.error('Upload failed', err);
      const message = err instanceof Error ? err.message : 'Upload failed.';
      setUploadError(message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="p-6 max-w-screen-2xl mx-auto">
      {/* Alert */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3 mb-6">
        <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1 text-sm text-amber-800">
          <span className="font-semibold">CRITICAL: Mandatory Attendance required</span> for Lab Practical Session today at 2:00 PM. (Sent via WhatsApp/SMS)
        </div>
        <button className="text-xs font-semibold text-amber-700 border border-amber-300 rounded px-3 py-1 hover:bg-amber-100 transition-colors">
          View Details
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Attendance + Marksheet row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Attendance Entry */}
            <div className="card p-5">
              <div className="flex items-start gap-3 mb-4">
                <CheckSquare size={20} className="text-accent-500 mt-0.5 shrink-0" />
                <div>
                  <h2 className="font-bold text-navy-900 text-base">Daily Attendance Entry</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">Class X-B</span>
                    <span className="text-xs text-slate-400">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>

              {submitSuccess && (
                <div className="mb-3 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-lg text-xs">
                  <Check size={14} /> Attendance submitted!
                </div>
              )}

              <form onSubmit={handleSubmitAttendance}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs font-semibold text-slate-500 uppercase border-b border-slate-100">
                        <th className="pb-2 pr-2">Roll</th>
                        <th className="pb-2 pr-2">Name</th>
                        <th className="pb-2 pr-2 text-center">P</th>
                        <th className="pb-2 pr-2 text-center">A</th>
                        <th className="pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {attendance.map((r, idx) => (
                        <tr key={r.student.id} className="hover:bg-slate-50">
                          <td className="py-2.5 pr-2 text-slate-500 text-xs">{r.student.roll_no}</td>
                          <td className="py-2.5 pr-2 font-medium text-navy-900 text-xs">{r.student.name}</td>
                          <td className="py-2.5 pr-2 text-center">
                            <input
                              type="checkbox"
                              checked={r.present}
                              onChange={() => toggleAttendance(idx, 'present')}
                              className="w-4 h-4 rounded accent-accent-500"
                            />
                          </td>
                          <td className="py-2.5 pr-2 text-center">
                            <input
                              type="checkbox"
                              checked={!r.present}
                              onChange={() => toggleAttendance(idx, 'present')}
                              className="w-4 h-4 rounded accent-red-500"
                            />
                          </td>
                          <td className="py-2.5">{lastStatus(r)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button type="submit" disabled={submitLoading} className="btn-primary w-full mt-4 text-sm flex items-center justify-center gap-2">
                  {submitLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Submit Attendance'}
                </button>
              </form>
            </div>

            {/* Marksheet Entry */}
            <div className="card p-5">
              <div className="flex items-start gap-3 mb-4">
                <FileUp size={20} className="text-accent-500 mt-0.5 shrink-0" />
                <div>
                  <h2 className="font-bold text-navy-900 text-base">Marksheet Entry</h2>
                  <p className="text-xs text-slate-500">Upload Term Results</p>
                </div>
              </div>

              <div
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 text-center transition-all ${uploading ? 'border-accent-400 bg-accent-50/50 cursor-not-allowed' : 'border-slate-200 cursor-pointer hover:border-accent-400 hover:bg-accent-50/50'}`}
                onClick={() => {
                  if (uploading) return;
                  document.getElementById('file-upload')?.click();
                }}
              >
                <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center">
                  <Upload size={22} className="text-accent-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-navy-900">
                    {uploading ? 'Uploading...' : (uploadName || 'Upload Term Results')}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Supports PDF or Excel</div>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.xlsx,.xls,.csv"
                  className="hidden"
                  disabled={uploading}
                  onChange={async e => {
                    const file = e.target.files?.[0] ?? null;
                    await handleUploadTermResults(file);
                    e.target.value = '';
                  }}
                />
              </div>

              {uploadMessage && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  <Check size={16} /> {uploadMessage}
                </div>
              )}

              {uploadError && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  <AlertTriangle size={16} /> {uploadError}
                </div>
              )}

              <div className="mt-4">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Recent Uploads</div>
                {recentUploads.length === 0 ? (
                  <div className="text-xs text-slate-500">No files uploaded yet.</div>
                ) : recentUploads.map(upload => (
                  <div key={upload.id} className="flex items-center justify-between gap-2 py-2 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center shrink-0">
                        <FileUp size={12} className="text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-slate-600 font-medium truncate">{upload.name}</div>
                        <div className="text-[11px] text-slate-400">{formatUploadDate(upload.created_at)} • {formatFileSize(upload.metadata?.size)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles size={18} className="text-accent-500" />
              <h2 className="font-bold text-navy-900">AI Insights &amp; Student Performance</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {AI_INSIGHTS.map(ins => (
                <div key={ins.name} className="border border-slate-100 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className={`badge ${ins.tagColor} text-[10px]`}>{ins.tag}</span>
                    <Sparkles size={12} className="text-slate-400" />
                  </div>
                  <div className="font-bold text-navy-900 mb-2">{ins.name}</div>
                  <p className="text-xs text-slate-500 leading-relaxed">{ins.text}</p>
                  <div className="flex gap-2 mt-3">
                    {ins.scores.map(s => (
                      <span key={s.label} className="text-xs bg-slate-100 text-slate-600 rounded px-2 py-0.5 font-medium">
                        {s.label}: {s.val}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Notices */}
          <div className="card p-5">
            <h2 className="font-bold text-navy-900 mb-4">Announcements</h2>
            <div className="space-y-3">
              {notices.map(n => <NoticeCard key={n.id} notice={n} />)}
            </div>
          </div>

          {/* Upcoming timetable */}
          <div className="card p-5">
            <h2 className="font-bold text-navy-900 mb-4 text-sm uppercase tracking-wide">Upcoming Timetable</h2>
            <div className="space-y-3">
              {timetable.slice(0, 4).map(t => (
                <div key={t.id} className="flex items-center gap-3">
                  <div className="text-center w-14 shrink-0">
                    <div className="text-xs font-bold text-navy-900">{formatTime(t.start_time)}</div>
                  </div>
                  <div className="flex-1 border-l border-slate-200 pl-3">
                    <div className="text-sm font-semibold text-navy-900">{t.subject}</div>
                    <div className="text-xs text-slate-400">{t.room} {t.teacher_name ? `• ${t.teacher_name}` : ''}</div>
                  </div>
                </div>
              ))}
              {timetable.length === 0 && (
                <div className="text-center py-4 text-slate-400 text-sm">
                  <Clock size={24} className="mx-auto mb-2 opacity-40" />
                  No classes scheduled today
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
