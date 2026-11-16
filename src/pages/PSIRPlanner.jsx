import React, { useState, useEffect } from 'react';
import {
  Scale,
  Columns,
  PenTool,
  BookOpen,
  Copy,
  Check,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  BookMarked,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { psir1Syllabus } from '../data/syllabus/psir1';
import { psir2Syllabus } from '../data/syllabus/psir2';
import { thinkerComparisons } from '../data/psirComparisons';
import { authenticMainsPYQs } from '../data/pyqs/mainsPyqs';
import Badge from '../components/common/Badge';

const PSIR_TABS = [
  { id: 'SYLLABUS', label: 'Paper I & II Curriculum', icon: BookOpen },
  { id: 'COMPARISON', label: 'Thinker Comparison Matrices', icon: Columns },
  { id: 'BUILDER', label: '6-Stage PSIR Answer Builder', icon: PenTool }
];

const PSIR_DRAFT_KEY = 'upsc_planner_v1_psir_builder_draft';

export default function PSIRPlanner() {
  const { topicProgressMap, updateTopicProgress, addNote } = useApp();
  const [activeTab, setActiveTab] = useState('SYLLABUS');
  const [selectedPaperPart, setSelectedPaperPart] = useState('1A'); // '1A' | '1B' | '2A' | '2B'
  const [activeComparisonId, setActiveComparisonId] = useState('rawls-vs-nozick');

  // Filter authentic PSIR questions
  const authenticPsirQuestions = authenticMainsPYQs.filter(
    q => q.subject.includes('PSIR') || q.paper.includes('PSIR')
  );

  const getInitialBuilderState = () => {
    try {
      const saved = localStorage.getItem(PSIR_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.stages) return parsed;
      }
    } catch (e) {
      // fallback
    }
    const defaultQ = authenticPsirQuestions[0];
    return {
      selectedPyqId: defaultQ?.id || "custom",
      question: defaultQ?.question || "Examine the feminist critique of Rawls's theory of justice with special reference to Susan Moller Okin.",
      stages: {
        introduction: "",
        theory: "",
        arguments: "",
        critiques: "",
        contemporaryExample: "",
        synthesis: ""
      }
    };
  };

  // Answer Builder States with LocalStorage draft persistence
  const [builderState, setBuilderState] = useState(getInitialBuilderState);
  const [copied, setCopied] = useState(false);
  const [savedNote, setSavedNote] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(PSIR_DRAFT_KEY, JSON.stringify(builderState));
    } catch (e) {
      console.warn("Failed to persist PSIR draft to localStorage", e);
    }
  }, [builderState]);

  // Filter modules based on selected paper part
  const activeSyllabus = selectedPaperPart.startsWith('1')
    ? psir1Syllabus.filter(t => selectedPaperPart === '1A' ? t.paper.includes('Part A') : t.paper.includes('Part B'))
    : psir2Syllabus.filter(t => selectedPaperPart === '2A' ? t.paper.includes('Part A') : t.paper.includes('Part B'));

  const activeComparison = thinkerComparisons.find(c => c.id === activeComparisonId) || thinkerComparisons[0];

  const handleSelectQuestion = (pyqId) => {
    if (pyqId === 'custom') {
      setBuilderState(prev => ({
        ...prev,
        selectedPyqId: 'custom'
      }));
    } else {
      const found = authenticPsirQuestions.find(q => q.id === pyqId);
      if (found) {
        setBuilderState(prev => ({
          ...prev,
          selectedPyqId: found.id,
          question: found.question
        }));
      }
    }
  };

  const handleLoadModelOutline = () => {
    const found = authenticPsirQuestions.find(q => q.id === builderState.selectedPyqId);
    if (!found || !found.modelOutline) return;
    setBuilderState(prev => ({
      ...prev,
      stages: {
        introduction: found.modelOutline.introduction || "",
        theory: found.modelOutline.body?.[0] || "",
        arguments: found.modelOutline.body?.[1] || "",
        critiques: found.modelOutline.body?.[2] || "",
        contemporaryExample: found.modelOutline.body?.[3] || "",
        synthesis: found.modelOutline.conclusion || ""
      }
    }));
  };

  const handleClearStages = () => {
    if (window.confirm("Clear all text from the 6 answer stages to write fresh?")) {
      setBuilderState(prev => ({
        ...prev,
        stages: {
          introduction: "",
          theory: "",
          arguments: "",
          critiques: "",
          contemporaryExample: "",
          synthesis: ""
        }
      }));
    }
  };

  const handleCopyDraft = () => {
    const fullDraft = `PSIR ANSWER DRAFT\nQuestion: ${builderState.question}\n\n1. INTRODUCTION:\n${builderState.stages.introduction}\n\n2. THEORETICAL FOUNDATION:\n${builderState.stages.theory}\n\n3. SCHOLARLY ARGUMENTS:\n${builderState.stages.arguments}\n\n4. CRITIQUES & COUNTER-THEORIES:\n${builderState.stages.critiques}\n\n5. CONTEMPORARY MANIFESTATION & CASE STUDY:\n${builderState.stages.contemporaryExample}\n\n6. SYNTHESIS & WAY FORWARD:\n${builderState.stages.synthesis}`;
    navigator.clipboard.writeText(fullDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToNotes = () => {
    addNote({
      title: `PSIR Answer: ${builderState.question.slice(0, 50)}...`,
      subject: "PSIR Optional",
      category: "PSIR",
      tags: ["PSIR", "Answer Writing", "Thinkers"],
      content: `## Question\n${builderState.question}\n\n### 1. Introduction\n${builderState.stages.introduction}\n\n### 2. Theoretical Grounding\n${builderState.stages.theory}\n\n### 3. Scholarly Arguments\n${builderState.stages.arguments}\n\n### 4. Critiques & Counter-Arguments\n${builderState.stages.critiques}\n\n### 5. Contemporary Case Study\n${builderState.stages.contemporaryExample}\n\n### 6. Critical Synthesis\n${builderState.stages.synthesis}`
    });
    setSavedNote(true);
    setTimeout(() => setSavedNote(false), 2500);
  };

  const totalStageWords = Object.values(builderState.stages)
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Political Science & International Relations (PSIR) Planner
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Papers I & II • Western & Indian Thinkers • Comparative Politics • IR Theories • Foreign Policy
        </p>
      </div>

      {/* Main Workspace Navigation */}
      <div className="flex border-b border-slate-200 gap-4">
        {PSIR_TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 py-3 px-1 text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: CURRICULUM WORKSPACE */}
      {activeTab === 'SYLLABUS' && (
        <div className="space-y-5">
          {/* Sub-paper switcher */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: '1A', label: 'Paper I — Part A: Political Theory & Western Thinkers' },
              { id: '1B', label: 'Paper I — Part B: Indian Government & Politics' },
              { id: '2A', label: 'Paper II — Part A: Comparative Politics & IR Theories' },
              { id: '2B', label: 'Paper II — Part B: India’s Foreign Policy' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPaperPart(p.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
                  selectedPaperPart === p.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {activeSyllabus.map(topic => {
              const prog = topicProgressMap[topic.id] || {};
              const isCompleted = prog.status === 'COMPLETED';

              return (
                <div
                  key={topic.id}
                  className={`rounded-xl border bg-white p-5 shadow-2xs transition-all ${
                    isCompleted ? 'border-emerald-200 bg-emerald-50/15' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500">{topic.id}</span>
                        <Badge label={topic.importance} variant={topic.importance} size="sm" />
                        <span className="text-xs text-slate-400 uppercase font-semibold">{topic.parentTopic}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-1">
                        {topic.topicName}
                      </h3>
                    </div>

                    <button
                      onClick={() => {
                        const next = prog.status === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED';
                        updateTopicProgress(topic.id, { status: next, lastStudiedDate: new Date().toISOString().split('T')[0] });
                      }}
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold border transition-all ${
                        isCompleted
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{isCompleted ? "Completed" : "Mark Mastered"}</span>
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="font-semibold text-slate-500 uppercase text-[11px] block">Primary Literature</span>
                      <p className="text-slate-800 font-medium">{topic.primarySource}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500 uppercase text-[11px] block">Supplementary Scholarly Sources</span>
                      <p className="text-slate-600">{topic.supplementarySource}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <span className="font-semibold text-slate-500 uppercase text-[11px] block mb-1">Subtopics & Thinkers</span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-slate-600">
                      {topic.subtopics.map((s, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-indigo-600 font-bold">•</span>
                          <span>{typeof s === 'string' ? s : s.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: THINKER COMPARISON TOOL */}
      {activeTab === 'COMPARISON' && (
        <div className="space-y-6">
          {/* Comparison Pair Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            {thinkerComparisons.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveComparisonId(c.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
                  activeComparisonId === c.id
                    ? 'bg-indigo-900 text-white border-indigo-900 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {c.title}
              </button>
            ))}
          </div>

          {/* Side-by-side Matrix Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {activeComparison.title}
                </h3>
                <span className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">
                  {activeComparison.domain}
                </span>
              </div>
            </div>

            {/* Thinker Profiles Headings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Thinker A</span>
                <h4 className="text-base font-extrabold text-slate-900 mt-0.5">{activeComparison.thinkerA.name}</h4>
                <p className="text-xs text-slate-500">{activeComparison.thinkerA.tradition} • <em>{activeComparison.thinkerA.coreWork}</em></p>
              </div>

              <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Thinker B</span>
                <h4 className="text-base font-extrabold text-slate-900 mt-0.5">{activeComparison.thinkerB.name}</h4>
                <p className="text-xs text-slate-500">{activeComparison.thinkerB.tradition} • <em>{activeComparison.thinkerB.coreWork}</em></p>
              </div>
            </div>

            {/* Matrix Comparison Dimensions */}
            <div className="space-y-4">
              {/* Dimension 1: Core Arguments */}
              <div className="rounded-lg border border-slate-150 p-4 space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1.5">
                  1. Core Arguments & Thesis
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-700">
                  <div className="border-r border-slate-100 pr-2">{activeComparison.thinkerA.dimensions.coreArguments}</div>
                  <div>{activeComparison.thinkerB.dimensions.coreArguments}</div>
                </div>
              </div>

              {/* Dimension 2: Theoretical Assumptions */}
              <div className="rounded-lg border border-slate-150 p-4 space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1.5">
                  2. Foundational Assumptions (Human Nature / System)
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-700">
                  <div className="border-r border-slate-100 pr-2">{activeComparison.thinkerA.dimensions.assumptions}</div>
                  <div>{activeComparison.thinkerB.dimensions.assumptions}</div>
                </div>
              </div>

              {/* Dimension 3: Key Concepts */}
              <div className="rounded-lg border border-slate-150 p-4 space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1.5">
                  3. Key Conceptual Vocabulary
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="flex flex-wrap gap-1.5 border-r border-slate-100 pr-2">
                    {activeComparison.thinkerA.dimensions.keyConcepts.map((k, i) => (
                      <span key={i} className="rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-indigo-800 font-medium">{k}</span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeComparison.thinkerB.dimensions.keyConcepts.map((k, i) => (
                      <span key={i} className="rounded bg-purple-50 border border-purple-200 px-2 py-0.5 text-purple-800 font-medium">{k}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dimension 4: Criticisms */}
              <div className="rounded-lg border border-slate-150 p-4 space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1.5">
                  4. Major Scholarly Criticisms
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-700">
                  <div className="border-r border-slate-100 pr-2">{activeComparison.thinkerA.dimensions.criticisms}</div>
                  <div>{activeComparison.thinkerB.dimensions.criticisms}</div>
                </div>
              </div>

              {/* Dimension 5: Contemporary Relevance */}
              <div className="rounded-lg border border-slate-150 p-4 space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1.5">
                  5. Contemporary Administrative & Global Relevance
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-700">
                  <div className="border-r border-slate-100 pr-2">{activeComparison.thinkerA.dimensions.contemporaryRelevance}</div>
                  <div>{activeComparison.thinkerB.dimensions.contemporaryRelevance}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GUIDED 6-STAGE PSIR ANSWER BUILDER */}
      {activeTab === 'BUILDER' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Guided 6-Stage PSIR Answer Builder
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Topper-tested 6-stage architecture: Introduction → Theory → Arguments → Critiques → Contemporary Example → Synthesis
              </p>
            </div>

            <div className="flex items-center gap-2">
              {builderState.selectedPyqId !== 'custom' && (
                <button
                  type="button"
                  onClick={handleLoadModelOutline}
                  className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-2xs"
                  title="Populate stages with authentic UPSC model outline"
                >
                  <BookMarked className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Load Official Outline</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleClearStages}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                title="Clear all stages to write from scratch"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Authentic Question Selection or Custom */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Select Authentic UPSC PSIR Question (Or Custom)
              </label>
              <select
                value={builderState.selectedPyqId}
                onChange={(e) => handleSelectQuestion(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-900 font-medium focus:border-indigo-600 focus:outline-none"
              >
                {authenticPsirQuestions.map((q) => (
                  <option key={q.id} value={q.id}>
                    [{q.year} {q.paper}] {q.question.slice(0, 95)}... ({q.marks} Marks)
                  </option>
                ))}
                <option value="custom">-- Custom PSIR Question Statement --</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Question Statement
              </label>
              <textarea
                rows={2}
                value={builderState.question}
                onChange={(e) => setBuilderState(prev => ({ ...prev, question: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-900 font-semibold focus:border-indigo-600 focus:outline-none"
                placeholder="Enter or refine your PSIR question prompt..."
              />
            </div>
          </div>

          {/* 6 Stages Grid */}
          <div className="space-y-4">
            {[
              { key: 'introduction', stage: 'Stage 1: Introduction & Contextualization', placeholder: 'Contextualize the thinker, historical setting, and core paradox.' },
              { key: 'theory', stage: 'Stage 2: Theoretical Grounding', placeholder: 'Explain the core theoretical concept or model with key technical terms.' },
              { key: 'arguments', stage: 'Stage 3: Scholarly Arguments & Justification', placeholder: 'Detail the thinker’s rationale, philosophical justifications, and textual support.' },
              { key: 'critiques', stage: 'Stage 4: Scholarly Critiques & Counter-Theories', placeholder: 'Introduce major critiques (Feminist, Marxist, Communitarian, or Realist).' },
              { key: 'contemporaryExample', stage: 'Stage 5: Contemporary Case Study & Application', placeholder: 'Ground the theoretical debate in a modern constitutional, policy, or geopolitical issue.' },
              { key: 'synthesis', stage: 'Stage 6: Critical Synthesis & Way Forward', placeholder: 'Synthesize opposing viewpoints into a nuanced, balanced concluding perspective.' }
            ].map((step) => (
              <div key={step.key} className="rounded-lg border border-slate-200 p-4 space-y-1.5 bg-slate-50/40">
                <span className="text-xs font-bold text-indigo-900 block">
                  {step.stage}
                </span>
                <textarea
                  rows={3}
                  value={builderState.stages[step.key]}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBuilderState(prev => ({
                      ...prev,
                      stages: { ...prev.stages, [step.key]: val }
                    }));
                  }}
                  placeholder={step.placeholder}
                  className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
                />
              </div>
            ))}
          </div>

          {/* Output Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">
                Word Count: <span className={totalStageWords > 280 ? 'text-amber-600 font-bold' : 'text-slate-900 font-bold'}>{totalStageWords} words</span>
              </span>
              <span className="text-[11px] text-slate-400">
                (Standard UPSC target: ~250 words for 15/20 markers)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyDraft}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? "Copied!" : "Copy Full Answer"}</span>
              </button>

              <button
                onClick={handleSaveToNotes}
                className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                {savedNote ? <Check className="h-4 w-4 text-emerald-400" /> : <Sparkles className="h-4 w-4" />}
                <span>{savedNote ? "Saved to Notes!" : "Save to Study Notes"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
