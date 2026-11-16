import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  Check,
  CheckCircle2,
  Calendar,
  Clock,
  ShieldCheck,
  Sliders
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { storageService, DEFAULT_SETTINGS } from '../services/storageService';
import { downloadJsonFile } from '../services/exportService';
import Modal from '../components/common/Modal';

export default function Settings() {
  const { settings, updateSettings, resetAllData, importAllData } = useApp();

  const [formData, setFormData] = useState({ ...settings });
  const [savedBanner, setSavedBanner] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [importError, setImportError] = useState(null);

  const handleSave = (e) => {
    e.preventDefault();
    updateSettings({
      ...formData,
      dailyStudyHours: Number(formData.dailyStudyHours),
      sundayBufferHours: Number(formData.sundayBufferHours),
      weeklyStudyDays: Number(formData.weeklyStudyDays)
    });
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  };

  const handleExportJSON = () => {
    const backup = storageService.exportAllData();
    downloadJsonFile(backup, `UPSC_Master_Planner_Backup_${new Date().toISOString().split('T')[0]}.json`);
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        importAllData(parsed);
        setFormData({ ...storageService.getSettings() });
        setImportError(null);
        alert("Backup file successfully imported and verified!");
      } catch (err) {
        setImportError("Failed to parse backup JSON. Please ensure the file is a valid backup export.");
      }
    };
    reader.readAsText(file);
  };

  const handleRestoreDefaults = () => {
    if (window.confirm("Restore default study hour and target date settings?")) {
      updateSettings(DEFAULT_SETTINGS);
      setFormData({ ...DEFAULT_SETTINGS });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            System Settings & Plan Calibration
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Configure examination targets, daily capacities, dynamic Sunday buffer, and data backups
          </p>
        </div>

        {savedBanner && (
          <span className="flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-800 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Settings Successfully Saved!</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Examination Target Dates */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900">
              1. Examination Target Dates & Planning Milestones
            </h3>
            <p className="text-xs text-slate-500">
              User planning targets governing dynamic phase timeline calculations, daily session allocations, and deadline countdowns.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Preparation Start Date</label>
              <input
                type="date"
                required
                value={formData.prepStartDate || "2026-11-16"}
                onChange={(e) => setFormData({ ...formData, prepStartDate: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none font-medium"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Baseline planning date</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Prelims Target Date</label>
              <input
                type="date"
                required
                value={formData.prelimsTargetDate}
                onChange={(e) => setFormData({ ...formData, prelimsTargetDate: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none font-medium"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Target examination milestone</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Mains Target Date</label>
              <input
                type="date"
                required
                value={formData.mainsTargetDate}
                onChange={(e) => setFormData({ ...formData, mainsTargetDate: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none font-medium"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Target examination milestone</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Current Preparation Phase</label>
              <select
                value={formData.preparationPhase}
                onChange={(e) => setFormData({ ...formData, preparationPhase: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none font-medium"
              >
                <option value="Phase 1: Foundation and NCERTs">Phase 1: Foundation and NCERTs</option>
                <option value="Phase 2: Standard References & Syllabus Depth">Phase 2: Standard References & Syllabus Depth</option>
                <option value="Phase 3: Integrated GS & PSIR Consolidation">Phase 3: Integrated GS & PSIR Consolidation</option>
                <option value="Phase 4: Prelims-Focused Intensive">Phase 4: Prelims-Focused Intensive</option>
                <option value="Phase 5: Mains Consolidation & Essay">Phase 5: Mains Consolidation & Essay</option>
                <option value="Phase 6: Final Revision and Peak Performance">Phase 6: Final Revision and Peak Performance</option>
              </select>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Current preparation focus</span>
            </div>
          </div>
        </div>

        {/* Section 2: Study Capacity & 6+1 Weekly Rules */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900">
              2. Daily Study Capacity & 6+1 System Rules
            </h3>
            <p className="text-xs text-slate-500">
              Strictly governs daily session generation and adaptive rebalancing
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Daily Study Limit (Mon–Sat)</label>
              <input
                type="number"
                min={4}
                max={14}
                required
                value={formData.dailyStudyHours}
                onChange={(e) => setFormData({ ...formData, dailyStudyHours: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Default: 8 hours productive study</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Sunday Buffer Capacity</label>
              <input
                type="number"
                min={2}
                max={10}
                required
                value={formData.sundayBufferHours}
                onChange={(e) => setFormData({ ...formData, sundayBufferHours: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Dedicated buffer; never overloaded</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Weekly Learning Days</label>
              <input
                type="number"
                disabled
                value={6}
                className="w-full rounded-lg border border-slate-200 p-2 text-slate-500 bg-slate-50 cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">6 Days Learning + 1 Day Sunday Buffer</span>
            </div>
          </div>
        </div>

        {/* Section 3: Subject Proficiency Profile */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900">
              3. Subject Proficiency & Preparation Levels
            </h3>
            <p className="text-xs text-slate-500">
              Calibrates session allocation weightages in the planning engine
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">CSAT Proficiency Level</label>
              <select
                value={formData.csatProficiency}
                onChange={(e) => setFormData({ ...formData, csatProficiency: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
              >
                <option value="Needs Work">Needs Work (Requires frequent daily practice)</option>
                <option value="Moderate">Moderate (Standard sectional drills)</option>
                <option value="Strong">Strong (Qualifying benchmark secured)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">PSIR Optional Preparation Depth</label>
              <select
                value={formData.psirPreparationLevel}
                onChange={(e) => setFormData({ ...formData, psirPreparationLevel: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
              >
                <option value="Foundation">Foundation (Western Thinkers & Concepts)</option>
                <option value="Intermediate">Intermediate (Comparative Politics & IR Theories)</option>
                <option value="Advanced">Advanced (Scholar synthesis & 6-stage answers)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleRestoreDefaults}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Restore Defaults
          </button>

          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <Save className="h-4 w-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>

      {/* Section 4: Data Backup, Import & Reset */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-slate-900">
            4. Local Data Backup & Storage Management
          </h3>
          <p className="text-xs text-slate-500">
            Export all personal study notes, schedules, test records, and progress to an offline JSON backup.
          </p>
        </div>

        {importError && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
            {importError}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Export JSON */}
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export Full Data Backup (JSON)</span>
          </button>

          {/* Import JSON */}
          <label className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer">
            <Upload className="h-4 w-4 text-slate-500" />
            <span>Import JSON Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          {/* Reset All Data with confirmation */}
          <button
            onClick={() => setResetConfirmOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 font-semibold text-rose-700 hover:bg-rose-100"
          >
            <RotateCcw className="h-4 w-4 text-rose-600" />
            <span>Clear All Application Records</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Reset */}
      <Modal
        isOpen={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        title="Confirm Application Reset"
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Destructive Action Warning</p>
              <p className="mt-1 leading-relaxed">
                This will permanently delete all your daily study logs, completed topic progress, custom flashcards, study notes, and mock test scores stored in this browser's LocalStorage.
              </p>
            </div>
          </div>

          <p className="text-slate-600">
            Before proceeding, we strongly recommend using "Export Full Data Backup (JSON)" above to preserve a copy of your records.
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setResetConfirmOpen(false)}
              className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                resetAllData();
                setResetConfirmOpen(false);
                setFormData({ ...DEFAULT_SETTINGS });
              }}
              className="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
            >
              Yes, Permanently Clear All Records
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
