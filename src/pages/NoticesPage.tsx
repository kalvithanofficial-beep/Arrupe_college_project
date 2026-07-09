import { useEffect, useState } from 'react';
import { Bell, Plus, Search, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Notice } from '../types';
import { useAuth } from '../contexts/AuthContext';

const TYPE_STYLES: Record<string, { bar: string; bg: string; text: string; label: string }> = {
  INTERNAL: { bar: 'bg-slate-400', bg: 'bg-slate-50', text: 'text-slate-600', label: 'Internal' },
  CIRCULAR: { bar: 'bg-accent-500', bg: 'bg-accent-50', text: 'text-accent-700', label: 'Circular' },
  URGENT: { bar: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', label: 'Urgent' },
  ACADEMIC: { bar: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', label: 'Academic' },
  HOLIDAY: { bar: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Holiday' },
  UPDATE: { bar: 'bg-violet-500', bg: 'bg-violet-50', text: 'text-violet-700', label: 'Update' },
  IMPORTANT: { bar: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', label: 'Important' },
};

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  return `${mins}m ago`;
}

export default function NoticesPage() {
  const { role } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<Notice['notice_type']>('INTERNAL');
  const [adding, setAdding] = useState(false);

  useEffect(() => { fetchNotices(); }, []);

  async function fetchNotices() {
    setLoading(true);
    const { data } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
    if (data) setNotices(data as Notice[]);
    setLoading(false);
  }

  async function handleAdd() {
    if (!newTitle || !newContent) return;
    setAdding(true);
    const { data, error } = await supabase.from('notices').insert({
      title: newTitle, content: newContent, notice_type: newType,
    }).select().single();
    setAdding(false);
    if (!error && data) {
      setNotices(prev => [data as Notice, ...prev]);
      setNewTitle(''); setNewContent(''); setNewType('INTERNAL');
      setShowAdd(false);
    }
  }

  const filtered = notices.filter(n => {
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'ALL' || n.notice_type === filter;
    return matchSearch && matchFilter;
  });

  const canAdd = role === 'admin' || role === 'teacher';

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Notice Board</h1>
          <p className="text-slate-500 text-sm mt-0.5">School-wide announcements and circulars</p>
        </div>
        {canAdd && (
          <button onClick={() => setShowAdd(v => !v)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Notice
          </button>
        )}
      </div>

      {/* Add notice form */}
      {showAdd && (
        <div className="card p-5 mb-6 border-2 border-accent-200">
          <h3 className="font-bold text-navy-900 mb-4">Post New Notice</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Title</label>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Notice title" className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Type</label>
                <select value={newType} onChange={e => setNewType(e.target.value as Notice['notice_type'])} className="input-field">
                  {Object.entries(TYPE_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Content</label>
              <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Notice content..." rows={3} className="input-field resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleAdd} disabled={adding || !newTitle || !newContent} className="btn-primary flex items-center gap-2 text-sm">
                {adding ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus size={14} /> Post Notice</>}
              </button>
              <button onClick={() => setShowAdd(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notices..." className="input-field pl-9 text-sm" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-slate-400" />
          {['ALL', ...Object.keys(TYPE_STYLES)].map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors capitalize ${filter === t ? 'bg-navy-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'}`}>
              {t === 'ALL' ? 'All' : TYPE_STYLES[t]?.label ?? t}
            </button>
          ))}
        </div>
      </div>

      {/* Notices grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading notices...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Bell size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No notices found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(n => {
            const style = TYPE_STYLES[n.notice_type] ?? TYPE_STYLES.INTERNAL;
            return (
              <div key={n.id} className={`card p-5 border-l-4 ${style.bar} hover:shadow-md transition-shadow`}>
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-xs font-bold uppercase tracking-wide ${style.text} ${style.bg} px-2 py-0.5 rounded`}>
                    {style.label}
                  </span>
                  <span className="text-xs text-slate-400">{timeAgo(n.created_at)}</span>
                </div>
                <h3 className="font-semibold text-navy-900 text-sm leading-tight mb-2">{n.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{n.content}</p>
                <div className="mt-3 text-xs text-slate-400">
                  {new Date(n.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
