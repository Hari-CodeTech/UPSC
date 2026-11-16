import React, { useState, useMemo } from 'react';
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
  isSunday,
  parseISO
} from 'date-fns';
import {
  Table,
  Calendar as CalendarIcon,
  GitCommit,
  FolderTree,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronDown
} from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { useApp } from '../context/AppContext';
import { allSyllabusTopics, syllabusSubjects, getParentTopicsBySubject } from '../data/syllabus';
import { calculatePhaseTimelines } from '../engine/planningEngine';
import { exportTimetableToCSV } from '../services/exportService';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';

export default function CompletePlan() {
  const { settings, topicProgressMap } = useApp();
  const { dailyPlans, getPlanForDate } = usePlanner();

  const [activeTab, setActiveTab] = useState('TABLE'); // 'TABLE' | 'CALENDAR' | 'TIMELINE' | 'TREE'
  const [calendarViewMode, setCalendarViewMode] = useState('MONTH'); // 'MONTH' | 'WEEK'
  const [calendarCurrentDate, setCalendarCurrentDate] = useState(new Date());
  const [selectedTaskModal, setSelectedTaskModal] = useState(null);
  const [expandedParents, setExpandedParents] = useState({ "GS I": true, "GS II": true });

  // Dynamic Phase Timeline calculations based on actual workload and examination milestones
  const phaseTimelineData = useMemo(() => {
    return calculatePhaseTimelines(settings, allSyllabusTopics, topicProgressMap);
  }, [settings, topicProgressMap]);

  // Generate date list for Table View (next 30 days)
  const tableDates = useMemo(() => {
    const list = [];
    const base = new Date();
    for (let i = 0; i < 30; i++) {
      list.push(addDays(base, i));
    }
    return list;
  }, []);

  // Feasibility & Overloaded Day analysis
  const feasibilityStats = useMemo(() => {
    let overloadedCount = 0;
    let totalPlannedHours = 0;
    let sundayBufferCount = 0;

    tableDates.forEach(d => {
      const p = getPlanForDate(d);
      if (p) {
        totalPlannedHours += (p.plannedHours || 0);
        const limit = isSunday(d) ? (settings.sundayBufferHours || 6) : (settings.dailyStudyHours || 8);
        if (p.plannedHours > limit + 0.5) {
          overloadedCount++;
        }
        if (isSunday(d)) {
          sundayBufferCount++;
        }
      }
    });

    return {
      totalDays: tableDates.length,
      overloadedCount,
      totalPlannedHours,
      sundayBufferCount,
      isFeasible: overloadedCount === 0
    };
  }, [tableDates, getPlanForDate, settings]);

  const handleExportCSV = () => {
    // Collect all loaded plans
    const allPlansToExport = {};
    tableDates.forEach(d => {
      const dStr = format(d, 'yyyy-MM-dd');
      allPlansToExport[dStr] = getPlanForDate(d);
    });
    exportTimetableToCSV(allPlansToExport);
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleParent = (key) => {
    setExpandedParents(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Calendar dates
  const calendarDays = useMemo(() => {
    if (calendarViewMode === 'MONTH') {
      const monthStart = startOfMonth(calendarCurrentDate);
      const monthEnd = endOfMonth(monthStart);
      const start = startOfWeek(monthStart, { weekStartsOn: 1 });
      const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfWeek(calendarCurrentDate, { weekStartsOn: 1 });
      const end = endOfWeek(start, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    }
  }, [calendarCurrentDate, calendarViewMode]);

  return (
    <div className="space-y-6">
      {/* Header and Mode Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 pb-4 no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Complete Preparation Plan Viewer
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Comprehensive multi-perspective roadmap from Foundation through Mains Consolidation
          </p>
        </div>

        {/* View Switcher Tabs & Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 bg-white p-1 shadow-2xs">
            <button
              onClick={() => setActiveTab('TABLE')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === 'TABLE' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Table className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>

            <button
              onClick={() => setActiveTab('CALENDAR')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === 'CALENDAR' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>Calendar</span>
            </button>

            <button
              onClick={() => setActiveTab('TIMELINE')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === 'TIMELINE' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <GitCommit className="h-3.5 w-3.5" />
              <span>Timeline</span>
            </button>

            <button
              onClick={() => setActiveTab('TREE')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === 'TREE' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FolderTree className="h-3.5 w-3.5" />
              <span>Syllabus Tree</span>
            </button>
          </div>

          {/* Action Buttons */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Download CSV export"
          >
            <Download className="h-3.5 w-3.5" />
            <span>CSV Export</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Print-friendly view"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Feasibility Summary Banner */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          {feasibilityStats.isFeasible ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-50 text-amber-700 shrink-0">
              <AlertTriangle className="h-4 w-4" />
            </div>
          )}
          <div>
            <span className="font-bold text-slate-800">
              Feasibility Reporter: {feasibilityStats.isFeasible ? "Workload Fully Sustainable" : "Overloaded Slots Detected"}
            </span>
            <p className="text-slate-500">
              {feasibilityStats.totalDays} days projected • {feasibilityStats.totalPlannedHours} planned hours • {feasibilityStats.sundayBufferCount} Sunday buffer slots
            </p>
          </div>
        </div>

        {feasibilityStats.overloadedCount > 0 && (
          <span className="rounded bg-amber-50 border border-amber-200 px-2.5 py-1 text-amber-800 font-semibold">
            {feasibilityStats.overloadedCount} days exceed study-hour limit
          </span>
        )}
      </div>

      {/* VIEW A: TABLE VIEW */}
      {activeTab === 'TABLE' && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-3 py-3">Day</th>
                  <th className="px-3 py-3">Phase</th>
                  <th className="px-4 py-3">GS Topic / Target</th>
                  <th className="px-4 py-3">PSIR Topic</th>
                  <th className="px-3 py-3">Practice / Output</th>
                  <th className="px-3 py-3 text-right">Hours</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tableDates.map((date) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const plan = getPlanForDate(date);
                  const isSun = isSunday(date);

                  const gsSession = plan?.sessions?.find(s => s.subject.startsWith('GS'));
                  const psirSession = plan?.sessions?.find(s => s.subject.includes('PSIR'));
                  const practiceSession = plan?.sessions?.find(s => s.type === 'PRACTICE' || s.type === 'MOCK_TEST');

                  return (
                    <tr
                      key={dateStr}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSun ? 'bg-indigo-50/30 font-medium' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-slate-600">
                        {format(date, 'EEEE')}
                        {isSun && <span className="ml-1 text-[10px] text-indigo-700 font-bold">(Buffer)</span>}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-slate-500">
                        {settings.preparationPhase?.split(':')[0] || 'Phase 1'}
                      </td>
                      <td className="px-4 py-3 text-slate-800">
                        {gsSession ? (
                          <div>
                            <span className="font-semibold block">{gsSession.topicName}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                gsSession.type === 'NEW_LEARNING'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : gsSession.type === 'CONTINUATION'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}>
                                {gsSession.type === 'CONTINUATION' ? `Part ${gsSession.sessionNumber}/${gsSession.totalSessions} (Cont.)` : 'New Learning'}
                              </span>
                              {gsSession.remainingHours !== undefined && (
                                <span className="text-[10px] text-slate-400">Rem: {gsSession.remainingHours}h</span>
                              )}
                            </div>
                          </div>
                        ) : (isSun ? "Targeted Concept Repair" : "GS Module")}
                      </td>
                      <td className="px-4 py-3 text-slate-800">
                        {psirSession ? (
                          <div>
                            <span className="font-semibold block">{psirSession.topicName}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                psirSession.type === 'NEW_LEARNING'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : psirSession.type === 'CONTINUATION'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}>
                                {psirSession.type === 'CONTINUATION' ? `Part ${psirSession.sessionNumber}/${psirSession.totalSessions} (Cont.)` : 'New Learning'}
                              </span>
                              {psirSession.remainingHours !== undefined && (
                                <span className="text-[10px] text-slate-400">Rem: {psirSession.remainingHours}h</span>
                              )}
                            </div>
                          </div>
                        ) : (isSun ? "Theoretical Synthesis" : "Optional Module")}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {practiceSession ? practiceSession.name : "Timed Drill"}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                        {plan?.plannedHours || 8}h
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <Badge
                          label={plan?.completedHours > 0 ? (plan.completedHours >= plan.plannedHours ? "COMPLETED" : "IN_PROGRESS") : "NOT_STARTED"}
                          size="sm"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW B: CALENDAR VIEW */}
      {activeTab === 'CALENDAR' && (
        <div className="space-y-4">
          {/* Calendar Controls */}
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCalendarCurrentDate(prev => addDays(prev, calendarViewMode === 'MONTH' ? -30 : -7))}
                className="rounded p-1 text-slate-500 hover:bg-slate-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-bold text-slate-900">
                {format(calendarCurrentDate, calendarViewMode === 'MONTH' ? 'MMMM yyyy' : "'Week of' MMM d, yyyy")}
              </span>
              <button
                onClick={() => setCalendarCurrentDate(prev => addDays(prev, calendarViewMode === 'MONTH' ? 30 : 7))}
                className="rounded p-1 text-slate-500 hover:bg-slate-100"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex rounded border border-slate-200 p-0.5">
              <button
                onClick={() => setCalendarViewMode('MONTH')}
                className={`rounded px-2.5 py-1 text-xs font-semibold ${
                  calendarViewMode === 'MONTH' ? 'bg-slate-900 text-white' : 'text-slate-600'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setCalendarViewMode('WEEK')}
                className={`rounded px-2.5 py-1 text-xs font-semibold ${
                  calendarViewMode === 'WEEK' ? 'bg-slate-900 text-white' : 'text-slate-600'
                }`}
              >
                Week
              </button>
            </div>
          </div>

          {/* Grid */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
            <div className="grid grid-cols-7 gap-px border-b border-slate-200 pb-2 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
              <div className="text-indigo-600">Sun (Buffer)</div>
            </div>

            <div className="grid grid-cols-7 gap-2 pt-2">
              {calendarDays.map((day) => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const isSun = isSunday(day);
                const isCurrMonth = isSameMonth(day, calendarCurrentDate);
                const isTod = isToday(day);
                const plan = getPlanForDate(day);

                return (
                  <div
                    key={dayStr}
                    onClick={() => setSelectedTaskModal(plan)}
                    className={`min-h-[105px] rounded-lg border p-2 text-xs transition-all cursor-pointer ${
                      isTod
                        ? 'border-indigo-500 bg-indigo-50/20 shadow-xs'
                        : isSun
                        ? 'border-indigo-100 bg-indigo-50/10'
                        : isCurrMonth
                        ? 'border-slate-150 bg-white hover:border-slate-300'
                        : 'border-slate-100 bg-slate-50/50 opacity-40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`font-bold text-xs ${isTod ? 'text-indigo-700' : 'text-slate-800'}`}>
                        {format(day, 'd')}
                      </span>
                      {isSun && (
                        <span className="text-[9px] font-extrabold uppercase text-indigo-700">Buffer</span>
                      )}
                    </div>

                    <div className="space-y-1">
                      {plan?.sessions?.slice(0, 2).map((s) => (
                        <div
                          key={s.id}
                          className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700 line-clamp-1 font-medium"
                          title={s.topicName}
                        >
                          {s.subject}: {s.topicName}
                        </div>
                      ))}
                      {(plan?.sessions?.length || 0) > 2 && (
                        <span className="text-[10px] text-slate-400 font-medium block">
                          +{plan.sessions.length - 2} more sessions
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW C: TIMELINE VIEW */}
      {activeTab === 'TIMELINE' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Dynamic Macro Preparation Timeline & Phase Workload
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculated from actual topic workload & available study capacity — never forced into arbitrary fixed windows
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded bg-amber-50 border border-amber-200 px-2 py-1 text-[11px] font-bold text-amber-900">
                Prelims: {phaseTimelineData.prelimsTargetDate}
              </span>
              <span className="rounded bg-indigo-50 border border-indigo-200 px-2 py-1 text-[11px] font-bold text-indigo-900">
                Mains: {phaseTimelineData.mainsTargetDate}
              </span>
            </div>
          </div>

          {/* Workload Warning Banner if Deadlines are Unrealistic */}
          {phaseTimelineData.warnings.length > 0 && (
            <div className="space-y-2">
              {phaseTimelineData.warnings.map((w, idx) => (
                <div key={idx} className="rounded-lg bg-rose-50 border border-rose-200 p-4 text-xs text-rose-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-rose-950">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    <span>{w.title}</span>
                  </div>
                  <p>{w.message}</p>
                  <p className="text-rose-800 font-medium"><strong>Recommended Adjustment:</strong> {w.suggestion}</p>
                </div>
              ))}
            </div>
          )}

          {/* Dynamic 6-Phase Timeline */}
          <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pl-6">
            {phaseTimelineData.phases.map((phase) => (
              <div key={phase.id} className="relative">
                <span className={`absolute -left-[31px] top-0 flex h-6 w-6 items-center justify-center rounded-full text-white text-xs font-bold ring-4 ring-white ${
                  phase.number <= 3 ? 'bg-slate-900' : (phase.number === 4 ? 'bg-amber-500' : 'bg-indigo-600')
                }`}>
                  {phase.number}
                </span>

                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div>
                      <span className="text-xs font-bold text-indigo-700 block">
                        {phase.startDate} → {phase.expectedCompletionDate}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                        Phase {phase.number}: {phase.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-semibold">
                      <span className="text-slate-600">
                        {phase.totalTopics} Topics • {phase.totalEstimatedHours}h Workload
                      </span>
                      <span className="rounded bg-slate-200/80 px-2 py-0.5 text-[11px] text-slate-800">
                        {phase.workingDaysNeeded} Study Days
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {phase.description}
                  </p>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Syllabus Progress</span>
                      <span className="font-bold text-slate-800">{phase.completionPercentage}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all"
                        style={{ width: `${phase.completionPercentage}%` }}
                      />
                    </div>
                  </div>

                  {phase.warning && (
                    <div className="rounded bg-rose-50 border border-rose-200 p-2 text-xs text-rose-900">
                      <strong>Warning:</strong> {phase.warning.message}
                    </div>
                  )}

                  {phase.number === 4 && (
                    <div className="inline-flex items-center gap-1.5 rounded bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-bold text-amber-900">
                      Target Prelims Milestone: {phaseTimelineData.prelimsTargetDate}
                    </div>
                  )}

                  {phase.number === 6 && (
                    <div className="inline-flex items-center gap-1.5 rounded bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-bold text-indigo-900">
                      Target Mains Milestone: {phaseTimelineData.mainsTargetDate}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW D: SYLLABUS TREE VIEW */}
      {activeTab === 'TREE' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Expandable UPSC Syllabus Hierarchy
          </h2>

          <div className="space-y-3">
            {syllabusSubjects.map(sub => {
              const parents = getParentTopicsBySubject(sub.id);
              const isExpanded = expandedParents[sub.id];

              return (
                <div key={sub.id} className="rounded-lg border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => toggleParent(sub.id)}
                    className="flex w-full items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 text-left transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      <Badge label={sub.id} variant={sub.id} size="sm" />
                      <span className="text-xs font-bold text-slate-900">{sub.name}</span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      {sub.count} Core Modules
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="p-4 bg-white space-y-3 border-t border-slate-200">
                      {parents.map(p => (
                        <div key={p.name} className="space-y-1.5 pl-4 border-l-2 border-slate-200">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            {p.name}
                          </h4>
                          <div className="space-y-1 pl-2">
                            {p.topics.map(t => {
                              const prog = topicProgressMap[t.id];
                              const status = prog?.status || 'NOT_STARTED';

                              return (
                                <div
                                  key={t.id}
                                  className="flex items-center justify-between py-1 text-xs text-slate-700 hover:text-slate-900"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[11px] text-slate-400">{t.id}</span>
                                    <span>{t.topicName}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-slate-400">{t.estimatedHours}h</span>
                                    <Badge label={status} variant={status} size="sm" />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day Details Modal (from Calendar click) */}
      <Modal
        isOpen={!!selectedTaskModal}
        onClose={() => setSelectedTaskModal(null)}
        title={`Timetable Details: ${selectedTaskModal?.date || ''}`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
            <span>Planned Load: <strong>{selectedTaskModal?.plannedHours} hrs</strong></span>
            <span>Completed: <strong>{selectedTaskModal?.completedHours} hrs</strong></span>
          </div>

          <div className="space-y-2">
            {selectedTaskModal?.sessions?.map((sess) => (
              <div key={sess.id} className="rounded-lg border border-slate-200 p-3 text-xs bg-slate-50/50">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{sess.name}</span>
                    <Badge label={sess.subject} variant={sess.subject} size="sm" />
                  </div>
                  <Badge label={sess.completionStatus} variant={sess.completionStatus} size="sm" />
                </div>
                <p className="text-slate-700 font-medium">{sess.topicName}</p>
                <p className="text-slate-500 mt-1">{sess.learningObjective}</p>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
