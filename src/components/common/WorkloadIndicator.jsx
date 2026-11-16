import React from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function WorkloadIndicator({ plannedHours = 8, completedHours = 0, maxDailyHours = 8, isSunday = false }) {
  const targetCapacity = isSunday ? 6 : maxDailyHours;
  const isOverloaded = plannedHours > targetCapacity + 0.5;
  const remainingHours = Math.max(0, Number((plannedHours - completedHours).toFixed(1)));
  const percentage = Math.min(100, Math.round((completedHours / Math.max(0.1, plannedHours)) * 100));

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Workload Distribution
          </span>
        </div>
        {isOverloaded ? (
          <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
            <AlertTriangle className="h-3 w-3" /> Overloaded ({plannedHours}h / {targetCapacity}h limit)
          </span>
        ) : (
          <span className="text-xs text-slate-500">
            Capacity: {targetCapacity}h limit
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded bg-slate-50 py-1.5 border border-slate-100">
          <span className="text-slate-400 block text-[10px] uppercase font-medium">Planned</span>
          <span className="text-slate-800 font-bold text-sm">{plannedHours}h</span>
        </div>
        <div className="rounded bg-emerald-50 py-1.5 border border-emerald-100">
          <span className="text-emerald-600 block text-[10px] uppercase font-medium">Completed</span>
          <span className="text-emerald-800 font-bold text-sm">{completedHours}h</span>
        </div>
        <div className="rounded bg-slate-50 py-1.5 border border-slate-100">
          <span className="text-slate-400 block text-[10px] uppercase font-medium">Remaining</span>
          <span className="text-slate-800 font-bold text-sm">{remainingHours}h</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3">
        <div className="flex justify-between text-[11px] text-slate-500 mb-1">
          <span>Day Progress</span>
          <span className="font-medium text-slate-700">{percentage}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full transition-all duration-300 ${percentage >= 100 ? 'bg-emerald-600' : 'bg-indigo-600'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
