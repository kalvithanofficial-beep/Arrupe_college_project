'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Notice } from '@/lib/types';
import { Megaphone, Calendar, Trophy, BookOpen, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_CONFIG = {
  holiday: { icon: Calendar, label: 'Holiday', badge: 'badge-holiday' },
  sports: { icon: Trophy, label: 'Sports', badge: 'badge-sports' },
  exam: { icon: BookOpen, label: 'Exam', badge: 'badge-exam' },
  general: { icon: Megaphone, label: 'General', badge: 'badge-general' },
  urgent: { icon: AlertTriangle, label: 'Urgent', badge: 'badge-urgent' },
} as const;

export function NoticeBoard() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('notices')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(15);
      setNotices((data as Notice[]) ?? []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="glass-card rounded-2xl p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#E5E7EB]/40">
        <div className="w-8 h-8 rounded-lg bg-[#0F2942] flex items-center justify-center">
          <Megaphone className="w-4 h-4 text-[#D95D16]" />
        </div>
        <h3 className="font-bold text-[#0F2942] text-sm">Notice Board</h3>
        <span className="ml-auto text-xs text-[#0F2942]/50">{notices.length} active</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-[#D95D16]" />
        </div>
      ) : notices.length === 0 ? (
        <div className="text-center py-8 text-sm text-[#0F2942]/50">
          No active notices.
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto flex-1 pr-1">
          {notices.map((notice) => {
            const cfg = CATEGORY_CONFIG[notice.category];
            const Icon = cfg.icon;
            return (
              <div
                key={notice.id}
                className="p-3 rounded-xl bg-white/60 border border-[#E5E7EB]/40 hover:bg-white/80 transition-all duration-200 animate-slide-in"
              >
                <div className="flex items-start gap-2 mb-1.5">
                  <Icon className="w-4 h-4 text-[#D95D16] mt-0.5 flex-shrink-0" />
                  <h4 className="font-semibold text-[#0F2942] text-sm leading-tight">
                    {notice.title}
                  </h4>
                </div>
                <p className="text-xs text-[#0F2942]/70 leading-relaxed mb-2 pl-6">
                  {notice.content}
                </p>
                <div className="pl-6 flex items-center gap-2">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', cfg.badge)}>
                    {cfg.label}
                  </span>
                  <span className="text-xs text-[#0F2942]/40">
                    {new Date(notice.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
