import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Filter,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  HelpCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getSyllabusBySubject, getTopicById } from '../data/syllabus';
import { getStudyGuideForTopic } from '../data/studyGuides/sources';
import Badge from '../components/common/Badge';
import SearchInput from '../components/common/SearchInput';
import Modal from '../components/common/Modal';

const GS_TABS = [
  { id: "GS I", label: "GS I: History, Society & Geography" },
  { id: "GS II", label: "GS II: Polity, Governance & IR" },
  { id: "GS III", label: "GS III: Economy, Environment & Security" },
  { id: "GS IV", label: "GS IV: Ethics, Integrity & Aptitude" },
  { id: "CSAT", label: "CSAT: Aptitude & Comprehension" }
];

export default function GSPlanner() {
  const { topicProgressMap, updateTopicProgress } = useApp();
  const [selectedSubject, setSelectedSubject] = useState("GS II");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGuideModal, setActiveGuideModal] = useState(null);

  const topics = useMemo(() => {
    const list = getSyllabusBySubject(selectedSubject);
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(t =>
      t.topicName.toLowerCase().includes(q) ||
      t.parentTopic.toLowerCase().includes(q) ||
      t.subtopics.some(s => (typeof s === 'string' ? s : s.title).toLowerCase().includes(q))
    );
  }, [selectedSubject, searchQuery]);

  const handleStatusToggle = (topicId) => {
    const current = topicProgressMap[topicId]?.status || 'NOT_STARTED';
    const nextStatus = current === 'NOT_STARTED' ? 'IN_PROGRESS' : current === 'IN_PROGRESS' ? 'COMPLETED' : 'NOT_STARTED';
    updateTopicProgress(topicId, {
      status: nextStatus,
      lastStudiedDate: nextStatus !== 'NOT_STARTED' ? new Date().toISOString().split('T')[0] : null
    });
  };

  const handleOpenStudyGuide = (topicId) => {
    const guide = getStudyGuideForTopic(topicId);
    setActiveGuideModal(guide);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          General Studies & CSAT Subject Planner
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Comprehensive curriculum mapped to authoritative sources (Laxmikanth, Spectrum, GC Leong, Lexicon)
        </p>
      </div>

      {/* Subject Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        {GS_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setSelectedSubject(tab.id); setSearchQuery(""); }}
            className={`rounded-lg px-3 py-2 text-xs font-bold transition-all ${
              selectedSubject === tab.id
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={`Search ${selectedSubject} modules, subtopics, or keywords...`}
          className="max-w-md w-full"
        />

        <div className="text-xs text-slate-500 font-medium hidden sm:block">
          Showing {topics.length} modules
        </div>
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 gap-4">
        {topics.map(topic => {
          const prog = topicProgressMap[topic.id] || {};
          const status = prog.status || 'NOT_STARTED';
          const isCompleted = status === 'COMPLETED';

          return (
            <div
              key={topic.id}
              className={`rounded-xl border bg-white p-5 shadow-2xs transition-all ${
                isCompleted ? 'border-emerald-200 bg-emerald-50/15' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Module Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-500">{topic.id}</span>
                    <Badge label={topic.importance} variant={topic.importance} size="sm" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {topic.parentTopic}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">
                    {topic.topicName}
                  </h3>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => handleOpenStudyGuide(topic.id)}
                    className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Study Guide</span>
                  </button>

                  <button
                    onClick={() => handleStatusToggle(topic.id)}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold border transition-all ${
                      isCompleted
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                        : status === 'IN_PROGRESS'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{status === 'NOT_STARTED' ? "Mark In Progress" : status === 'IN_PROGRESS' ? "Mark Completed" : "Completed"}</span>
                  </button>
                </div>
              </div>

              {/* Relevance & Sources info */}
              <div className="mt-3.5 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1.5">
                  <div>
                    <span className="font-semibold text-slate-500 block text-[11px] uppercase tracking-wider">
                      Prelims Relevance
                    </span>
                    <p className="text-slate-700">{topic.prelimsRelevance}</p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-500 block text-[11px] uppercase tracking-wider">
                      Mains Relevance
                    </span>
                    <p className="text-slate-700">{topic.mainsRelevance}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div>
                    <span className="font-semibold text-slate-500 block text-[11px] uppercase tracking-wider">
                      Primary Reading Source
                    </span>
                    <p className="text-slate-800 font-medium">{topic.primarySource}</p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-500 block text-[11px] uppercase tracking-wider">
                      Supplementary Source
                    </span>
                    <p className="text-slate-600">{topic.supplementarySource}</p>
                  </div>
                </div>
              </div>

              {/* Subtopics Checklist */}
              <div className="mt-3.5 pt-3 border-t border-slate-100">
                <span className="font-semibold text-slate-500 block text-[11px] uppercase tracking-wider mb-1.5">
                  Core Subtopic Coverage
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-slate-600">
                  {topic.subtopics.map((sub, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-indigo-500 font-bold">•</span>
                      <span>{typeof sub === 'string' ? sub : sub.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Study Guide Deep Dive Modal */}
      <Modal
        isOpen={!!activeGuideModal}
        onClose={() => setActiveGuideModal(null)}
        title={`Academic Study Guide: ${activeGuideModal?.title || ''}`}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-5 text-xs text-slate-700">
          <div className="rounded-lg bg-indigo-50/50 border border-indigo-100 p-3.5 space-y-1">
            <span className="font-bold text-indigo-900 block text-[11px] uppercase tracking-wider">
              Prerequisites & Foundation
            </span>
            <p className="text-indigo-800 leading-relaxed">
              {activeGuideModal?.prerequisites}
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
              Before-Reading Critical Questions (Self-Inquiry)
            </h4>
            <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
              {activeGuideModal?.beforeReadingQuestions?.map((q, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="font-bold text-slate-400">{i + 1}.</span>
                  <span className="text-slate-700 leading-relaxed">{q}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 rounded-lg border border-emerald-100 bg-emerald-50/30 p-3">
              <span className="font-bold text-emerald-900 block text-[11px] uppercase tracking-wider">
                What to Highlight & Memorise
              </span>
              <ul className="space-y-1 text-slate-700 pl-3 list-disc">
                {activeGuideModal?.whatToHighlight?.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 rounded-lg border border-amber-100 bg-amber-50/30 p-3">
              <span className="font-bold text-amber-900 block text-[11px] uppercase tracking-wider">
                What to Skip (Low-Yield Content)
              </span>
              <ul className="space-y-1 text-slate-700 pl-3 list-disc">
                {activeGuideModal?.whatToSkip?.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
              Post-Reading Active Recall Test
            </h4>
            <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
              {activeGuideModal?.recallQuestions?.map((rq, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="font-bold text-slate-400">Q{i + 1}:</span>
                  <span className="text-slate-700 leading-relaxed">{rq}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">
              Expected Output: <strong className="text-slate-800">{activeGuideModal?.expectedOutput}</strong>
            </span>
            <button
              onClick={() => setActiveGuideModal(null)}
              className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
