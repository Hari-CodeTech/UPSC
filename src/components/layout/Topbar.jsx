import React, { useState } from 'react';
import { Menu, Search, Calendar, Bell, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { useApp } from '../../context/AppContext';
import { usePlanner } from '../../context/PlannerContext';

export default function Topbar({ onMenuClick, onOpenRebalanceModal }) {
  const { settings, setGlobalSearchOpen, notifications } = useApp();
  const { checkTimetableRebalance } = usePlanner();
  const [showNotifications, setShowNotifications] = useState(false);

  // Compute actual countdowns based on settings
  const today = new Date();
  const prelimsTarget = parseISO(settings.prelimsTargetDate || "2027-05-30");
  const mainsTarget = parseISO(settings.mainsTargetDate || "2027-09-17");

  const prelimsDays = Math.max(0, differenceInDays(prelimsTarget, today));
  const mainsDays = Math.max(0, differenceInDays(mainsTarget, today));

  const handleRebalanceClick = () => {
    const proposal = checkTimetableRebalance();
    onOpenRebalanceModal(proposal);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-xs">
      {/* Left: Mobile hamburger & Search Shortcut */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 md:hidden"
          aria-label="Toggle Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <button
          onClick={() => setGlobalSearchOpen(true)}
          className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500 hover:border-slate-300 hover:bg-white transition-all shadow-2xs"
        >
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <span>Search syllabus, PYQs, notes...</span>
          <kbd className="ml-4 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right: Countdowns, Adaptive Rebalance, Notifications */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Exam Countdowns */}
        <div className="hidden lg:flex items-center gap-2 border-r border-slate-200 pr-4">
          <div className="flex items-center gap-1.5 rounded-md bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs">
            <Calendar className="h-3.5 w-3.5 text-amber-600" />
            <span className="font-semibold text-amber-900">Prelims:</span>
            <span className="font-bold text-amber-700">{prelimsDays}d</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-md bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs">
            <Calendar className="h-3.5 w-3.5 text-indigo-600" />
            <span className="font-semibold text-indigo-900">Mains:</span>
            <span className="font-bold text-indigo-700">{mainsDays}d</span>
          </div>
        </div>

        {/* Adaptive Rebalancing Quick Action */}
        <button
          onClick={handleRebalanceClick}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          title="Analyze missed tasks and rebalance upcoming days"
        >
          <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
          <span className="hidden sm:inline">Adaptive Rebalance</span>
        </button>

        {/* Search icon on mobile */}
        <button
          onClick={() => setGlobalSearchOpen(true)}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 sm:hidden"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Bell className="h-4 w-4" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-500" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-lg z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-900">Notifications & Alerts</span>
                <span className="text-[10px] text-slate-400">{notifications.length} alerts</span>
              </div>
              <div className="mt-2 max-h-60 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-400">No active alerts. All schedules aligned.</p>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className="rounded-lg bg-slate-50 p-2.5 text-xs border border-slate-100">
                      <p className="font-semibold text-slate-800">{n.title}</p>
                      <p className="text-slate-600 mt-0.5">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
