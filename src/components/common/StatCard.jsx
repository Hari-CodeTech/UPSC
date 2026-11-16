import React from 'react';

export default function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  badge,
  trend,
  className = ""
}) {
  return (
    <div className={`bg-white rounded-lg border border-slate-200/90 p-5 shadow-xs transition-shadow hover:shadow-sm ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-700">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </span>
        {badge && (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-700">
            {badge}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-1 text-xs text-slate-500">
          {subtext}
        </p>
      )}

      {trend && (
        <div className="mt-2 text-xs font-medium text-emerald-600">
          {trend}
        </div>
      )}
    </div>
  );
}
