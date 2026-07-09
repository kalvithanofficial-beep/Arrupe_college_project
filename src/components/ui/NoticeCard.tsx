import { Notice } from '../../types';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  return `${mins}m ago`;
}

const TYPE_STYLES: Record<string, { label: string; bar: string; text: string }> = {
  INTERNAL: { label: 'Internal', bar: 'bg-slate-400', text: 'text-slate-500' },
  CIRCULAR: { label: 'Circular', bar: 'bg-accent-500', text: 'text-accent-600' },
  URGENT: { label: 'Urgent', bar: 'bg-red-500', text: 'text-red-600' },
  ACADEMIC: { label: 'Academic', bar: 'bg-blue-500', text: 'text-blue-600' },
  HOLIDAY: { label: 'Holiday', bar: 'bg-emerald-500', text: 'text-emerald-600' },
  UPDATE: { label: 'Update', bar: 'bg-violet-500', text: 'text-violet-600' },
  IMPORTANT: { label: 'Important', bar: 'bg-orange-500', text: 'text-orange-600' },
};

interface NoticeCardProps {
  notice: Notice;
}

export default function NoticeCard({ notice }: NoticeCardProps) {
  const style = TYPE_STYLES[notice.notice_type] ?? TYPE_STYLES.INTERNAL;

  return (
    <div className={`border-l-4 ${style.bar} pl-3 py-2`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-bold uppercase tracking-wide ${style.text}`}>
          {style.label}
        </span>
        <span className="text-xs text-slate-400">{timeAgo(notice.created_at)}</span>
      </div>
      <div className="text-sm font-semibold text-navy-900 leading-tight">{notice.title}</div>
      <div className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{notice.content}</div>
    </div>
  );
}
