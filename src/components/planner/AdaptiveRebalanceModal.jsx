import React from 'react';
import { RefreshCw, AlertTriangle, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';

export default function AdaptiveRebalanceModal({ isOpen, onClose, proposal, onApply }) {
  if (!proposal) return null;

  const { proposedChanges = [], feasibilityWarnings = [], totalMissedHours = 0, rebalancedCount = 0 } = proposal;

  const handleApply = () => {
    onApply(proposedChanges);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adaptive Timetable Rebalancing"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5">
        {/* Status Banner */}
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 text-indigo-700 shrink-0">
              <RefreshCw className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Missed Task Workload Audit
              </h4>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                The engine detected <strong className="text-slate-800">{rebalancedCount + feasibilityWarnings.length} uncompleted tasks</strong> ({totalMissedHours} hours).
                Tasks have been distributed into future open slots without overloading any single day past the 8-hour daily limit.
              </p>
            </div>
          </div>
        </div>

        {/* Infeasibility Warnings if any */}
        {feasibilityWarnings.length > 0 && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              <span>Timetable Capacity Warnings ({feasibilityWarnings.length})</span>
            </div>
            <div className="space-y-1.5 pl-6 text-xs text-amber-900">
              {feasibilityWarnings.map((w, idx) => (
                <div key={idx} className="leading-snug">
                  • <strong>{w.topicName}</strong>: {w.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Proposed Schedule Adjustments */}
        <div>
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Proposed Reallocation Slots ({proposedChanges.length})
          </h5>

          {proposedChanges.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 border border-dashed rounded-lg">
              No missed tasks detected! Your study plan is currently fully on schedule.
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-2 border border-slate-200 rounded-lg p-2 bg-slate-50/50">
              {proposedChanges.map((p, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-2xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{p.topicName}</span>
                      <Badge label={p.subject} variant={p.subject} size="sm" />
                    </div>
                    <Badge label={p.importance} variant={p.importance} size="sm" />
                  </div>

                  <div className="flex items-center gap-3 text-slate-600 pt-1">
                    <div className="flex items-center gap-1.5 line-through text-slate-400">
                      <span>Missed on: {p.fromOriginalDate}</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    <div className="flex items-center gap-1.5 font-semibold text-indigo-700">
                      <span>New Target Date: {p.proposedNewDate}</span>
                      <span className="text-[11px] font-normal text-slate-500">({p.durationHours} hrs)</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 italic">
                    {p.reason}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={proposedChanges.length === 0}
            onClick={handleApply}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            Accept & Update Timetable
          </button>
        </div>
      </div>
    </Modal>
  );
}
