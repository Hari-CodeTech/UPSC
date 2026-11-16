import React, { useState } from 'react';
import {
  format,
  addDays,
  subDays,
  isToday,
  isSunday,
  parseISO
} from 'date-fns';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  BookOpen,
  CheckCircle,
  FileText,
  AlertCircle,
  Award,
  Sparkles,
  Info
} from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { useApp } from '../context/AppContext';
import WorkloadIndicator from '../components/common/WorkloadIndicator';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';

export default function TodayPlan() {
  const { settings } = useApp();
  const { getPlanForDate, updateSessionStatus, updateSessionNotes } = usePlanner();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeSessionModal, setActiveSessionModal] = useState(null);
  const [sessionNotesText, setSessionNotesText] = useState("");

  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const plan = getPlanForDate(currentDate);

  const isCurrentDaySunday = isSunday(currentDate);

  const handleStatusChange = (sessionId, newStatus) => {
    updateSessionStatus(dateStr, sessionId, newStatus);
  };

  const handleOpenNotes = (session) => {
    setActiveSessionModal(session);
    setSessionNotesText(session.notes || "");
  };

  const handleSaveNotes = () => {
    if (activeSessionModal) {
      updateSessionNotes(dateStr, activeSessionModal.id, sessionNotesText);
      setActiveSessionModal(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Day Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Daily Study Plan
            </h1>
            {isCurrentDaySunday && (
              <span className="rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                Dynamic Sunday Buffer
              </span>
            )}
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            6 Modular Focus Sessions • 3-Tier Execution Workflow (Read → Revised → Practised)
          </p>
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 shadow-2xs">
          <button
            onClick={() => setCurrentDate(prev => subDays(prev, 1))}
            className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            title="Previous Day"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="px-3 text-xs font-semibold text-slate-800">
            {format(currentDate, 'EEEE, MMM d, yyyy')}
          </span>

          <button
            onClick={() => setCurrentDate(prev => addDays(prev, 1))}
            className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            title="Next Day"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {!isToday(currentDate) && (
            <button
              onClick={() => setCurrentDate(new Date())}
              className="ml-1 rounded bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white hover:bg-slate-800"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* Workload Indicator Banner */}
      <WorkloadIndicator
        plannedHours={plan?.plannedHours || 8}
        completedHours={plan?.completedHours || 0}
        maxDailyHours={settings.dailyStudyHours || 8}
        isSunday={isCurrentDaySunday}
      />

      {/* Sunday Buffer Informational Notice if applicable */}
      {isCurrentDaySunday && (
        <div className="rounded-lg bg-indigo-50/60 border border-indigo-200 p-4 text-xs text-indigo-900 leading-relaxed">
          <div className="flex items-center gap-2 font-bold mb-1 text-indigo-950">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <span>Dynamic Sunday Buffer Active</span>
          </div>
          Sunday does not introduce new learning modules. Instead, it aggregates weak topics, incomplete weekday reading, and scheduled weekly mock evaluations from your actual Monday–Saturday activity.
        </div>
      )}

      {/* Sessions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Structured Modular Sessions ({plan?.sessions?.length || 0})
          </h2>
          <span className="text-xs text-slate-400">
            Standard: 8 hours productive study (excl. breaks)
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {plan?.sessions?.map((session) => {
            const isCompleted = session.completionStatus === 'PRACTISED';
            const isRead = session.completionStatus === 'READ';
            const isRevised = session.completionStatus === 'REVISED';

            return (
              <div
                key={session.id}
                className={`rounded-xl border bg-white p-5 shadow-2xs transition-all ${
                  isCompleted
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Session Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-start sm:items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-white font-bold text-xs shrink-0">
                      {session.slotIndex}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900">
                          {session.name}
                        </h3>
                        <Badge label={session.subject} variant={session.subject} size="sm" />
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          session.type === 'NEW_LEARNING'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : session.type === 'CONTINUATION'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : session.type === 'REVISION'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {session.type === 'CONTINUATION'
                            ? `Continuation (Session ${session.sessionNumber} of ${session.totalSessions})`
                            : session.type === 'NEW_LEARNING'
                            ? 'New Learning'
                            : session.type}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                          <Clock className="h-3.5 w-3.5" /> {session.durationHours} hrs
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <p className="text-xs font-semibold text-slate-700">
                          {session.topicName}
                        </p>
                        {session.remainingHours !== undefined && (
                          <span className="text-[11px] text-slate-500">
                            • Completed: {session.completedHours}h • Remaining: {session.remainingHours}h
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 3-Tier Completion Controls */}
                  <div className="flex items-center gap-1.5 self-start sm:self-auto pt-2 sm:pt-0">
                    <button
                      onClick={() => handleStatusChange(session.id, isRead ? 'NOT_STARTED' : 'READ')}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold border transition-all ${
                        isRead || isRevised || isCompleted
                          ? 'bg-sky-100 text-sky-800 border-sky-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                      title="Step 1: Read standard textbook chapter"
                    >
                      1. Read
                    </button>

                    <button
                      onClick={() => handleStatusChange(session.id, isRevised ? 'READ' : 'REVISED')}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold border transition-all ${
                        isRevised || isCompleted
                          ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                      title="Step 2: Actively revised with mind-maps"
                    >
                      2. Revised
                    </button>

                    <button
                      onClick={() => handleStatusChange(session.id, isCompleted ? 'REVISED' : 'PRACTISED')}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold border transition-all ${
                        isCompleted
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                      title="Step 3: Attempted PYQs and conceptual recall"
                    >
                      3. Practised
                    </button>
                  </div>
                </div>

                {/* Session Details Grid */}
                <div className="mt-3.5 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1.5">
                    <div>
                      <span className="font-semibold text-slate-800 block text-[11px] uppercase tracking-wider text-slate-500">
                        Learning Objective
                      </span>
                      <p className="text-slate-700 leading-relaxed">
                        {session.learningObjective}
                      </p>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-800 block text-[11px] uppercase tracking-wider text-slate-500">
                        Study Instructions
                      </span>
                      <p className="text-slate-600 leading-relaxed">
                        {session.studyInstructions}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div>
                      <span className="font-semibold text-slate-800 block text-[11px] uppercase tracking-wider text-slate-500">
                        Required Reading Material
                      </span>
                      <p className="text-slate-700 font-medium">
                        {session.requiredReading}
                      </p>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-800 block text-[11px] uppercase tracking-wider text-slate-500">
                        Connected Authentic PYQs / Output
                      </span>
                      <p className="text-slate-600">
                        {session.connectedPYQs} • <span className="text-slate-700 font-medium">{session.expectedOutput}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Subtopics Assigned for this Session */}
                {session.subtopicsCovered && session.subtopicsCovered.length > 0 && (
                  <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs">
                    <span className="font-bold text-slate-700 block mb-1">
                      Assigned Subtopics for this Session ({session.subtopicsCovered.length}):
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-700">
                      {session.subtopicsCovered.map((sub, idx) => (
                        <li key={idx}>
                          {typeof sub === 'string' ? sub : (
                            <span>
                              <strong>{sub.title}</strong>
                              <span className="text-slate-500 text-[11px] ml-1">({sub.estimatedHours}h • {sub.difficulty})</span>
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Footer notes row */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleOpenNotes(session)}
                    className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-medium"
                  >
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    <span>{session.notes ? "Edit Session Notes" : "Add Session Notes"}</span>
                  </button>

                  <Badge
                    label={session.completionStatus}
                    variant={session.completionStatus}
                    size="sm"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Session Notes Modal */}
      <Modal
        isOpen={!!activeSessionModal}
        onClose={() => setActiveSessionModal(null)}
        title={`Session Notes: ${activeSessionModal?.name || ''}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Jot down key takeaways, specific questions you struggled with, or references for Sunday revision.
          </p>

          <textarea
            rows={6}
            value={sessionNotesText}
            onChange={(e) => setSessionNotesText(e.target.value)}
            placeholder="Document key facts, tricky subtopics, or concepts needing spaced recall..."
            className="w-full rounded-lg border border-slate-200 p-3 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 font-mono"
          />

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setActiveSessionModal(null)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveNotes}
              className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Save Notes
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
