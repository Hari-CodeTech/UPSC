import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  Calendar,
  Clock,
  Award,
  AlertTriangle,
  TrendingUp,
  Trash2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';

export default function MockTests() {
  const { mockTests, addMockTest } = useApp();

  const getInitialFormData = () => ({
    testName: "",
    paper: "GS Paper I (Prelims)",
    testDate: new Date().toISOString().split('T')[0],
    score: "",
    maxScore: 200,
    accuracy: "",
    timeTakenMinutes: "",
    weakAreas: "",
    notes: ""
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState(getInitialFormData());

  const handleOpenModal = () => {
    setFormData(getInitialFormData());
    setIsAddModalOpen(true);
  };

  const handleCreateRecord = (e) => {
    e.preventDefault();
    addMockTest({
      ...formData,
      score: formData.score !== "" ? Number(formData.score) : 0,
      maxScore: formData.maxScore !== "" ? Number(formData.maxScore) : 200,
      accuracy: formData.accuracy !== "" ? Number(formData.accuracy) : 0,
      timeTakenMinutes: formData.timeTakenMinutes !== "" ? Number(formData.timeTakenMinutes) : 0
    });
    setFormData(getInitialFormData());
    setIsAddModalOpen(false);
  };

  // True averages
  const totalTests = mockTests.length;
  const avgScore = totalTests > 0
    ? (mockTests.reduce((acc, t) => acc + (t.score || 0), 0) / totalTests).toFixed(1)
    : 0;
  const avgAccuracy = totalTests > 0
    ? Math.round(mockTests.reduce((acc, t) => acc + (t.accuracy || 0), 0) / totalTests)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Mock Test Records & Diagnostic Analysis
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Full-length simulated test logs • Real historical performance metrics • Weak-area diagnosis
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-2xs"
        >
          <Plus className="h-4 w-4" />
          <span>Log Mock Test Result</span>
        </button>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-xs font-semibold uppercase text-slate-400">Total Tests Taken</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalTests}</p>
          <span className="text-[11px] text-slate-500">Documented exam simulations</span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-xs font-semibold uppercase text-slate-400">Average Score</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{avgScore > 0 ? avgScore : "No Data"}</p>
          <span className="text-[11px] text-slate-500">Calculated from actual records</span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-xs font-semibold uppercase text-slate-400">Average Accuracy</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{avgAccuracy > 0 ? `${avgAccuracy}%` : "No Data"}</p>
          <span className="text-[11px] text-slate-500">Net positive ratio</span>
        </div>
      </div>

      {/* Tests Log List */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Recorded Mock Test Attempts ({totalTests})
          </h3>
        </div>

        {totalTests === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 space-y-2">
            <GraduationCap className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No mock test records found.</p>
            <p className="text-slate-400 max-w-sm mx-auto">
              Per strict guidelines, fake test data is never fabricated. Take a sectional or full-length paper and click "Log Mock Test Result" to record your score.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {mockTests.map((test) => (
              <div key={test.id} className="p-5 hover:bg-slate-50/70 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{test.testName}</h4>
                      <Badge label={test.paper} size="sm" />
                    </div>
                    <span className="text-xs text-slate-500 mt-0.5 block">
                      Attempted on {test.testDate} • Duration: {test.timeTakenMinutes} minutes
                    </span>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <div className="text-right">
                      <span className="text-base font-extrabold text-slate-900">{test.score} / {test.maxScore}</span>
                      <span className="text-xs font-semibold text-emerald-600 block">{test.accuracy}% Accuracy</span>
                    </div>
                  </div>
                </div>

                {test.weakAreas && (
                  <div className="rounded bg-rose-50/60 border border-rose-150 p-2 text-xs text-rose-900">
                    <strong className="text-rose-950">Identified Weak Areas:</strong> {test.weakAreas}
                  </div>
                )}

                {test.notes && (
                  <p className="text-xs text-slate-600 italic">
                    Note: "{test.notes}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Mock Test Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Log Full-Length Mock Test Attempt"
      >
        <form onSubmit={handleCreateRecord} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Test Series / Paper Name</label>
            <input
              type="text"
              required
              value={formData.testName}
              onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
              className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Paper Type</label>
              <select
                value={formData.paper}
                onChange={(e) => setFormData({ ...formData, paper: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
              >
                <option value="GS Paper I (Prelims)">GS Paper I (Prelims)</option>
                <option value="CSAT Paper II">CSAT Paper II</option>
                <option value="GS I (Mains)">GS I (Mains)</option>
                <option value="GS II (Mains)">GS II (Mains)</option>
                <option value="GS III (Mains)">GS III (Mains)</option>
                <option value="GS IV (Mains)">GS IV (Mains)</option>
                <option value="Essay Paper">Essay Paper</option>
                <option value="PSIR Paper I">PSIR Paper I</option>
                <option value="PSIR Paper II">PSIR Paper II</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Test Date</label>
              <input
                type="date"
                required
                value={formData.testDate}
                onChange={(e) => setFormData({ ...formData, testDate: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
              >
              </input>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Score Obtained</label>
              <input
                type="number"
                step="0.5"
                required
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Max Score</label>
              <input
                type="number"
                required
                value={formData.maxScore}
                onChange={(e) => setFormData({ ...formData, maxScore: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Accuracy (%)</label>
              <input
                type="number"
                required
                min={0}
                max={100}
                value={formData.accuracy}
                onChange={(e) => setFormData({ ...formData, accuracy: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Identified Weak Areas</label>
            <input
              type="text"
              value={formData.weakAreas}
              onChange={(e) => setFormData({ ...formData, weakAreas: e.target.value })}
              placeholder="e.g. Modern History Governor Generals, Macro GDP deflators..."
              className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Diagnostic Observations / Self-Audit</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Time management bottlenecks, question selection issues..."
              className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Save Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
