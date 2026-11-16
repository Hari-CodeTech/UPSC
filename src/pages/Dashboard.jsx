import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  BookOpen,
  Award,
  RotateCcw,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  CalendarCheck,
  PenTool,
  Newspaper
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { useApp } from '../context/AppContext';
import { usePlanner } from '../context/PlannerContext';
import { useRevision } from '../context/RevisionContext';
import { computeGlobalAnalytics } from '../engine/analyticsEngine';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';

export default function Dashboard() {
  const navigate = useNavigate();
  const { settings, topicProgressMap, pyqAttempts, mockTests, errorLogs } = useApp();
  const { dailyPlans, getPlanForDate } = usePlanner();
  const { revisionItems, activeRecommendations } = useRevision();

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayPlan = getPlanForDate(new Date());

  // Countdowns
  const today = new Date();
  const prelimsTarget = parseISO(settings.prelimsTargetDate || "2027-05-30");
  const mainsTarget = parseISO(settings.mainsTargetDate || "2027-09-17");
  const prelimsDays = Math.max(0, differenceInDays(prelimsTarget, today));
  const mainsDays = Math.max(0, differenceInDays(mainsTarget, today));

  // Genuine Analytics
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

  // Today's session metrics
  const plannedHours = todayPlan?.plannedHours || settings.dailyStudyHours || 8;
  const completedHours = todayPlan?.completedHours || 0;
  const progressPercent = plannedHours > 0 ? Math.min(100, Math.round((completedHours / plannedHours) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Welcome & Exam Target Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Preparation Command Centre
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            {format(new Date(), 'EEEE, MMMM d, yyyy')} • {settings.preparationPhase}
          </p>
        </div>

        {/* Target Countdowns */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3.5 py-2">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-amber-800">
              Prelims 2027 Target
            </span>
            <span className="text-lg font-extrabold text-amber-900">
              {prelimsDays} <span className="text-xs font-normal text-amber-700">Days Left</span>
            </span>
          </div>

          <div className="rounded-lg border border-indigo-200 bg-indigo-50/70 px-3.5 py-2">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-indigo-800">
              Mains 2027 Target
            </span>
            <span className="text-lg font-extrabold text-indigo-900">
              {mainsDays} <span className="text-xs font-normal text-indigo-700">Days Left</span>
            </span>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (All True Data) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Study Load"
          value={`${completedHours} / ${plannedHours} hrs`}
          subtext={`${plannedHours - completedHours > 0 ? (plannedHours - completedHours).toFixed(1) : 0} hrs remaining today`}
          icon={Clock}
          badge={`${progressPercent}% done`}
        />

        <StatCard
          title="Syllabus Coverage"
          value={`${analytics.overallCoveragePercentage}%`}
          subtext={`${analytics.completedTopicsCount} of ${analytics.totalTopics} topics mastered`}
          icon={BookOpen}
        />

        <StatCard
          title="Prelims Accuracy"
          value={analytics.totalPrelimsAttempted > 0 ? `${analytics.prelimsAccuracy}%` : "No MCQs yet"}
          subtext={analytics.totalPrelimsAttempted > 0 ? `${analytics.totalPrelimsAttempted} authentic PYQs attempted` : "Attempt timed questions to track"}
          icon={Award}
        />

        <StatCard
          title="Pending Revisions"
          value={`${analytics.pendingRevisionsCount}`}
          subtext={analytics.overdueRevisionsCount > 0 ? `${analytics.overdueRevisionsCount} cards overdue` : "All reviews up to date"}
          icon={RotateCcw}
          badge={analytics.overdueRevisionsCount > 0 ? "Action required" : "On schedule"}
        />
      </div>

      {/* Today's Schedule Overview & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's 6 Modular Sessions */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Today's 6 Modular Sessions
              </h2>
            </div>
            <Link
              to="/today"
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Open Full Daily Schedule <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {todayPlan?.sessions?.slice(0, 4).map((sess, idx) => (
              <div
                key={sess.id}
                className="flex items-center justify-between rounded-lg border border-slate-150 p-3 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-700 text-xs font-bold shrink-0 mt-0.5">
                    {sess.slotIndex}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900 line-clamp-1">
                        {sess.name}
                      </span>
                      <Badge label={sess.subject} variant={sess.subject} size="sm" />
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {sess.topicName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-medium text-slate-600">
                    {sess.durationHours}h
                  </span>
                  <Badge label={sess.completionStatus} variant={sess.completionStatus} size="sm" />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-between items-center text-xs text-slate-500 border-t border-slate-100">
            <span>Weekly Study System: 6 Days Learning + 1 Day Sunday Buffer</span>
            <Link to="/today" className="font-semibold text-slate-700 hover:underline">
              View remaining 2 sessions →
            </Link>
          </div>
        </div>

        {/* Right Col: Quick Preparation Actions */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Quick Practice Triggers
          </h2>

          <div className="space-y-2.5">
            <button
              onClick={() => navigate('/pyq-practice')}
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-3 text-left hover:border-slate-300 hover:bg-slate-50 transition-all shadow-2xs group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700 group-hover:bg-amber-100">
                  <Award className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Prelims PYQ Drill</div>
                  <div className="text-[11px] text-slate-500">Timed MCQs with error logging</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700" />
            </button>

            <button
              onClick={() => navigate('/answer-writing')}
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-3 text-left hover:border-slate-300 hover:bg-slate-50 transition-all shadow-2xs group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 group-hover:bg-indigo-100">
                  <PenTool className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Daily Mains Answer</div>
                  <div className="text-[11px] text-slate-500">Timed 150/250 word draft & rubric</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700" />
            </button>

            <button
              onClick={() => navigate('/revision-centre')}
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-3 text-left hover:border-slate-300 hover:bg-slate-50 transition-all shadow-2xs group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-700 group-hover:bg-purple-100">
                  <RotateCcw className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Active Recall Cards</div>
                  <div className="text-[11px] text-slate-500">1-3-7-14-30 Spaced Repetition</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700" />
            </button>

            <button
              onClick={() => navigate('/current-affairs')}
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-3 text-left hover:border-slate-300 hover:bg-slate-50 transition-all shadow-2xs group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 group-hover:bg-blue-100">
                  <Newspaper className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Current Affairs Feed</div>
                  <div className="text-[11px] text-slate-500">Syllabus-tagged editorial analysis</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Subject-Wise Coverage Breakdown */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Subject-Wise Preparation Progress
            </h2>
            <p className="text-xs text-slate-500">
              Real completion metrics derived from your topic updates
            </p>
          </div>
          <Link to="/syllabus-tracker" className="text-xs font-semibold text-indigo-600 hover:underline">
            View Syllabus Tracker →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {analytics.subjectStats.map(s => (
            <div key={s.subject} className="rounded-lg border border-slate-150 p-3.5 bg-slate-50/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge label={s.subject} variant={s.subject} size="sm" />
                  <span className="text-xs font-semibold text-slate-800">{s.name}</span>
                </div>
                <span className="text-xs font-bold text-slate-900">{s.percentage}%</span>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-slate-900 transition-all duration-300"
                  style={{ width: `${s.percentage}%` }}
                />
              </div>

              <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                <span>Completed: {s.completed} / {s.total} topics</span>
                <span>In Progress: {s.inProgress}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
