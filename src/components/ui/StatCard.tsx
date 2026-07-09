import { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  change?: string;
  changePositive?: boolean;
  badge?: string;
  badgeColor?: string;
}

export default function StatCard({ icon, label, value, change, changePositive, badge, badgeColor }: StatCardProps) {
  return (
    <div className="card p-5 flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
          {icon}
        </div>
        {change && (
          <span className={`text-xs font-semibold ${changePositive ? 'text-emerald-600' : 'text-red-500'}`}>
            {change}
          </span>
        )}
        {badge && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor ?? 'bg-emerald-100 text-emerald-700'}`}>
            {badge}
          </span>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-navy-900">{value}</div>
        <div className="text-xs text-slate-500 mt-0.5">{label}</div>
      </div>
    </div>
  );
}
