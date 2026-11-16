import React, { useState } from 'react';
import {
  RotateCcw,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Sliders,
  CalendarDays,
  History,
  Star
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useRevision } from '../context/RevisionContext';
import { useApp } from '../context/AppContext';
import { allSyllabusTopics } from '../data/syllabus';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';

export default function RevisionCentre() {
  const { topicProgressMap } = useApp();
  const {
    activeRecommendations,
    completeRevisionSession,
    rescheduleRevision,
    updateItemPriority,
    updateItemDuration,
    updateItemNotes,
    rejectRecommendation
  } = useRevision();

  const [activeCard, setActiveCard] = useState(null);
  const [selectedConfidence, setSelectedConfidence] = useState(3);
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(30);
  const [personalNotesText, setPersonalNotesText] = useState("");
  const [rescheduleModalItem, setRescheduleModalItem] = useState(null);
  const [rescheduleDateInput, setRescheduleDateInput] = useState("");
  const [reschedulePriorityInput, setReschedulePriorityInput] = useState("HIGH");
  const [rescheduleDurationInput, setRescheduleDurationInput] = useState(30);
  const [rescheduleNotesInput, setRescheduleNotesInput] = useState("");

  const handleStartFlashcard = (item) => {
    setActiveCard(item);
    setSelectedConfidence(item.confidence || 3);
    setSessionDurationMinutes(item.estimatedDurationMinutes || 30);
    setPersonalNotesText(item.notes || "");
  };

  const handleCompleteActiveCard = () => {
    if (!activeCard) return;
    completeRevisionSession({
      ...activeCard,
      notes: personalNotesText || activeCard.notes
    }, selectedConfidence, sessionDurationMinutes);
    setActiveCard(null);
    setPersonalNotesText("");
  };

  const handleOpenReschedule = (item) => {
    setRescheduleModalItem(item);
    setRescheduleDateInput(item.dueDate || format(new Date(), 'yyyy-MM-dd'));
    setReschedulePriorityInput(item.priority || "HIGH");
    setRescheduleDurationInput(item.estimatedDurationMinutes || 30);
    setRescheduleNotesInput(item.notes || "");
  };

  const handleApplyReschedule = () => {
    if (rescheduleModalItem) {
      if (rescheduleDateInput) rescheduleRevision(rescheduleModalItem.id, rescheduleDateInput);
      if (reschedulePriorityInput) updateItemPriority(rescheduleModalItem.id, reschedulePriorityInput);
      if (rescheduleDurationInput) updateItemDuration(rescheduleModalItem.id, Number(rescheduleDurationInput));
      if (rescheduleNotesInput !== undefined) updateItemNotes(rescheduleModalItem.id, rescheduleNotesInput);
      setRescheduleModalItem(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Active Recall & Spaced Repetition Centre
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Hybrid Option C: Algorithmic 1d → 3d → 7d → 14d → 30d recommendations with complete student control
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs">
            {activeRecommendations.length} Cards in Queue
          </span>
        </div>
      </div>

      {/* Spaced Intervals Guide Banner */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 text-xs text-indigo-950 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-2xs">
        <div>
          <span className="font-bold block text-sm">Spaced Intervals Sequence:</span>
          <p className="text-indigo-800 mt-0.5">
            Day 1 (Immediate Recall) → Day 3 (Stabilization) → Day 7 (Consolidation) → Day 14 (Refinement) → Day 30 (Long-Term Mastery)
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start md:self-auto font-mono text-[11px] font-bold">
          <span className="rounded bg-indigo-100 px-2 py-0.5">1d</span>
          <span>→</span>
          <span className="rounded bg-indigo-100 px-2 py-0.5">3d</span>
          <span>→</span>
          <span className="rounded bg-indigo-100 px-2 py-0.5">7d</span>
          <span>→</span>
          <span className="rounded bg-indigo-100 px-2 py-0.5">14d</span>
          <span>→</span>
          <span className="rounded bg-indigo-100 px-2 py-0.5">30d</span>
        </div>
      </div>

      {/* Active Recall Deck (Interactive Flashcard modal/view if card is selected) */}
      {activeCard && (
        <div className="rounded-xl border border-indigo-300 bg-white p-6 shadow-md space-y-5 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold">
                Q
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                Active Recall Drill
              </span>
              <Badge label={activeCard.subject} variant={activeCard.subject} size="sm" />
            </div>

            <button
              onClick={() => setActiveCard(null)}
              className="text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              Close Flashcard
            </button>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">
              {activeCard.topicName}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Test your spontaneous mental recall without consulting textbooks or notes.
            </p>
          </div>

          {/* Active Recall Prompts */}
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2 text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Core Recall Challenges
            </span>
            <ul className="list-disc pl-4 space-y-1 text-slate-700">
              <li>Can you state the 3 core constitutional articles, economic indicators, or thinker arguments?</li>
              <li>What are the 2 primary counter-arguments or critical limitations?</li>
              <li>Recall 1 recent Supreme Court judgment, committee report, or international agreement.</li>
            </ul>
          </div>

          {/* Confidence Slider (1 to 5) */}
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Rate Recall Confidence (1 - 5):</span>
              <span className="font-bold text-indigo-700">
                {selectedConfidence === 1 && "1/5 — Blank / Completely Forgotten"}
                {selectedConfidence === 2 && "2/5 — Weak / High Hesitation"}
                {selectedConfidence === 3 && "3/5 — Moderate Recall with Gaps"}
                {selectedConfidence === 4 && "4/5 — Clear & Solid Recall"}
                {selectedConfidence === 5 && "5/5 — Mastered / Instant Recall"}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  onClick={() => setSelectedConfidence(rating)}
                  className={`rounded-lg p-2.5 text-xs font-bold border transition-all ${
                    selectedConfidence === rating
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Rating {rating}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              *Ratings 1-2 reset the interval to 1 day and queue topic for Sunday buffer. Ratings 4-5 safely advance the interval.
            </p>
          </div>

          {/* Personal Revision Notes */}
          <div className="space-y-1.5 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Personal Revision Notes / Tricky Points:</label>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <span>Duration:</span>
                <input
                  type="number"
                  min="10"
                  max="180"
                  step="5"
                  value={sessionDurationMinutes}
                  onChange={(e) => setSessionDurationMinutes(Number(e.target.value))}
                  className="w-16 rounded border border-slate-200 px-1.5 py-0.5 text-xs text-right font-semibold text-slate-800"
                />
                <span>mins</span>
              </div>
            </div>
            <textarea
              rows={2}
              value={personalNotesText}
              onChange={(e) => setPersonalNotesText(e.target.value)}
              placeholder="Record tricky memory hooks, forgotten articles, or topics for next review..."
              className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none resize-none"
            />
          </div>

          {/* Finish Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleCompleteActiveCard}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-2xs"
            >
              Record Recall & Advance Interval →
            </button>
          </div>
        </div>
      )}

      {/* Revision Queue List */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Recommended Revision Queue ({activeRecommendations.length})
          </h3>
          <span className="text-xs text-slate-400">
            Adjust dates, priority, or discard recommendations anytime
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {activeRecommendations.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No pending revisions due! All completed learning modules are up to date.
            </div>
          ) : (
            activeRecommendations.map(item => (
              <div
                key={item.id}
                className={`p-4 transition-colors hover:bg-slate-50/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                  item.isOverdue ? 'bg-amber-50/25' : ''
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-slate-900">{item.topicName}</span>
                    <Badge label={item.subject} variant={item.subject} size="sm" />
                    {item.isOverdue && (
                      <span className="rounded bg-rose-50 border border-rose-200 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                        Overdue
                      </span>
                    )}
                    {item.isUserOverridden && (
                      <span className="rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                        Customized
                      </span>
                    )}
                    <Badge label={item.priority} variant={item.priority === 'CRITICAL' ? 'Crucial' : item.priority} size="sm" />
                  </div>

                  <p className="text-xs text-slate-500">
                    Due Date: <strong>{item.dueDate}</strong> • Estimated: {item.estimatedDurationMinutes} mins • {item.reason}
                  </p>

                  {item.notes && (
                    <p className="text-[11px] text-indigo-700 bg-indigo-50/70 rounded-md px-2 py-1 border border-indigo-100">
                      <span className="font-semibold">Notes:</span> {item.notes}
                    </p>
                  )}
                </div>

                {/* Hybrid Student Controls */}
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <button
                    onClick={() => handleStartFlashcard(item)}
                    className="flex items-center gap-1 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Review Card</span>
                  </button>

                  <button
                    onClick={() => handleOpenReschedule(item)}
                    className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    title="Reschedule Date & Settings"
                  >
                    Adjust
                  </button>

                  <button
                    onClick={() => rejectRecommendation(item.id)}
                    className="rounded-md p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    title="Dismiss Recommendation"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reschedule & Customize Modal */}
      <Modal
        isOpen={!!rescheduleModalItem}
        onClose={() => setRescheduleModalItem(null)}
        title={`Customize Revision: ${rescheduleModalItem?.topicName?.slice(0, 35)}...`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Manual Override: Modify target review date, priority, or study duration without algorithmic overwrite.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">New Review Date:</label>
              <input
                type="date"
                value={rescheduleDateInput}
                onChange={(e) => setRescheduleDateInput(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Priority Tier:</label>
              <select
                value={reschedulePriorityInput}
                onChange={(e) => setReschedulePriorityInput(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Allocated Duration (Minutes):</label>
            <input
              type="number"
              min="10"
              max="240"
              step="5"
              value={rescheduleDurationInput}
              onChange={(e) => setRescheduleDurationInput(e.target.value)}
              className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Personal Notes / Specific Focus Area:</label>
            <textarea
              rows={3}
              value={rescheduleNotesInput}
              onChange={(e) => setRescheduleNotesInput(e.target.value)}
              placeholder="e.g. Focus on Article 356 judicial review cases, S.R. Bommai guidelines..."
              className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setRescheduleModalItem(null)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyReschedule}
              className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
