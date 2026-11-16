import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  BarChart3,
  Flame,
  Clock,
  Award,
  BookOpen,
  RotateCcw,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePlanner } from '../context/PlannerContext';
import { useRevision } from '../context/RevisionContext';
import { computeGlobalAnalytics } from '../engine/analyticsEngine';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';

const ERROR_COLORS = ['#ef4444', '#f59e0b', '#6366f1', '#64748b'];

export default function Analytics() {
  const { topicProgressMap, pyqAttempts, mockTests, errorLogs } = useApp();
  const { dailyPlans } = usePlanner();
  const { revisionItems } = useRevision();

  const analytics = useMemo(() => {
    return computeGlobalAnalytics({
      dailyPlans,
      topicProgressMap,
      pyqAttempts,
      testRecords: mockTests,
      revisionItems,
      errorLogs
    });
  }, [dailyPlans, topicProgressMap, pyqAttempts, mockTests, revisionItems, errorLogs]);

  const hasNoActivity =
    analytics.totalActualHoursWeek === 0 &&
    analytics.completedTopicsCount === 0 &&
    analytics.totalPrelimsAttempted === 0 &&
    analytics.streakDays === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Empirical Preparation Analytics & Diagnostic Health
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Strictly calculated from authentic stored records • No fabricated vanity metrics
        </p>
      </div>

      {/* Prominent Empty State if No Recorded Activity */}
      {hasNoActivity && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/90 p-8 text-center space-y-2">
          <BarChart3 className="h-9 w-9 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">
            No study activity recorded yet. Start your first study session to see your progress.
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            All preparation metrics, hours completed, active recall mastery, and diagnostic curves are calculated directly from your authentic stored sessions without fabricated data.
          </p>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Study Consistency"
          value={`${analytics.streakDays} Days`}
          subtext="Active daily study streak"
          icon={Flame}
        />

        <StatCard
          title="7-Day Completed Hours"
          value={`${analytics.totalActualHoursWeek} hrs`}
          subtext={`Target: ${analytics.totalPlannedHoursWeek} hrs (${analytics.weeklyCompletionRate}%)`}
          icon={Clock}
        />

        <StatCard
          title="Prelims MCQ Accuracy"
          value={analytics.totalPrelimsAttempted > 0 ? `${analytics.prelimsAccuracy}%` : "No MCQs yet"}
          subtext={`${analytics.totalPrelimsAttempted} questions attempted`}
          icon={Award}
        />

        <StatCard
          title="Syllabus Mastery"
          value={`${analytics.overallCoveragePercentage}%`}
          subtext={`${analytics.completedTopicsCount} / ${analytics.totalTopics} modules`}
          icon={BookOpen}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Planned vs Actual Study Hours Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Planned vs Actual Hours (Past 7 Days)
              </h3>
              <span className="text-[11px] text-slate-400">Daily productivity comparison</span>
            </div>
          </div>

          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.last7DaysHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="planned" fill="#cbd5e1" name="Planned Hours" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" fill="#0f172a" name="Actual Hours" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Error Classification Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Error Categorisation Patterns
              </h3>
              <span className="text-[11px] text-slate-400">Diagnosis of incorrect MCQ attempts</span>
            </div>
          </div>

          {analytics.errorBreakdown.every(e => e.count === 0) ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-xs text-slate-400 space-y-2">
              <Info className="h-6 w-6 text-slate-300" />
              <p>No error log records logged yet.</p>
              <p className="text-[11px] max-w-xs text-slate-400">
                When you answer MCQs incorrectly in PYQ Practice, categorize your mistakes to populate this diagnostic chart.
              </p>
            </div>
          ) : (
            <div className="h-64 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.errorBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {analytics.errorBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={ERROR_COLORS[index % ERROR_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                  <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Weak Topic Diagnosis & Pending Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identified Weak Areas */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900">
              Identified Fragile Topics (Confidence &le; 2)
            </h3>
            <span className="text-xs font-semibold text-rose-600">
              {analytics.weakTopics.length} vulnerable modules
            </span>
          </div>

          {analytics.weakTopics.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No low-confidence topics recorded. Keep maintaining active recall!
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {analytics.weakTopics.map(wt => (
                <div key={wt.topicId} className="flex items-center justify-between rounded-lg border border-rose-150 bg-rose-50/40 p-2.5 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{wt.topicName}</span>
                    <span className="text-slate-500 text-[11px]">{wt.subject} • Confidence: {wt.confidence}/5</span>
                  </div>
                  <Badge label="Needs Attention" variant="Crucial" size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subject-Wise Mastery Table */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900">
              Subject Mastery Summary
            </h3>
            <span className="text-xs text-slate-500">True syllabus completion</span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {analytics.subjectStats.map(s => (
              <div key={s.subject} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <Badge label={s.subject} variant={s.subject} size="sm" />
                  <span className="font-semibold text-slate-800">{s.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900">{s.percentage}%</span>
                  <span className="text-slate-400 text-[10px] block">({s.completed}/{s.total})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
