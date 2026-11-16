import React, { useState } from 'react';
import {
  Calculator,
  BookOpen,
  HelpCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  BarChart2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { authenticPrelimsPYQs } from '../data/pyqs/prelimsPyqs';
import Badge from '../components/common/Badge';

export default function CSATPractice() {
  const { recordPyqAttempt, pyqAttempts } = useApp();

  const [activeCategory, setActiveCategory] = useState("ALL"); // 'ALL' | 'RC' | 'QA' | 'LR'
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // CSAT Question Pool: strictly authentic UPSC CSE Paper II past questions
  const csatQuestions = React.useMemo(() => {
    const list = authenticPrelimsPYQs.filter(q => q.subject === 'CSAT');
    if (activeCategory === "QA") return list.filter(q => q.syllabusTopicId?.includes("QA") || q.topic?.includes("Number"));
    if (activeCategory === "LR") return list.filter(q => q.syllabusTopicId?.includes("LR") || q.topic?.includes("Data"));
    if (activeCategory === "RC") return list.filter(q => q.syllabusTopicId?.includes("RC") || q.topic?.includes("Reading"));
    return list;
  }, [activeCategory]);

  const currentQ = csatQuestions[currentIndex] || csatQuestions[0];

  // CSAT Attempts accuracy calculated strictly from real user attempts
  const csatAttempts = pyqAttempts.filter(a => a.subject === 'CSAT');
  const accuracy = csatAttempts.length > 0
    ? Math.round((csatAttempts.filter(a => a.isCorrect).length / csatAttempts.length) * 100)
    : 0;

  const handleSubmit = () => {
    if (selectedOption === null || !currentQ) return;
    setSubmitted(true);
    const isCorrect = selectedOption === currentQ.correctAnswer;
    recordPyqAttempt({
      questionId: currentQ.id,
      stage: 'Prelims',
      subject: 'CSAT',
      syllabusTopicId: currentQ.syllabusTopicId,
      isCorrect,
      selectedOption,
      timeTakenSeconds: 90
    });
  };

  const handleNext = () => {
    if (currentIndex < csatQuestions.length - 1) setCurrentIndex(prev => prev + 1);
    else setCurrentIndex(0);
    setSelectedOption(null);
    setSubmitted(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            CSAT Paper II Drill & Qualifying Simulator
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Authentic UPSC CSE Paper II Previous Year Questions • 33% Qualifying Threshold (66/200 Marks)
          </p>
        </div>

        {/* Real Performance Tracker */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Recorded Accuracy
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold text-slate-900">
                {csatAttempts.length > 0 ? `${accuracy}%` : "No Attempts"}
              </span>
              <span className="text-[11px] text-slate-500">
                ({csatAttempts.length} logged)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Domain Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: "ALL", label: "All CSAT Official Questions" },
          { id: "RC", label: "Reading Comprehension (Passages)" },
          { id: "QA", label: "Quantitative Aptitude & Number Systems" },
          { id: "LR", label: "Data Sufficiency & Logical Reasoning" }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => { setActiveCategory(cat.id); setCurrentIndex(0); setSelectedOption(null); setSubmitted(false); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
              activeCategory === cat.id
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Question Card */}
      {!currentQ ? (
        <div className="py-12 text-center text-xs text-slate-400 bg-white border border-dashed rounded-xl">
          No authentic questions found for this CSAT category.
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-slate-400">
                Question {currentIndex + 1} of {csatQuestions.length}
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-800">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                UPSC CSAT {currentQ.year}
              </span>
              <Badge label={currentQ.topic || "CSAT"} size="sm" />
            </div>

            <span className="text-xs text-slate-500 font-mono">
              2.50 Marks • Negative: -0.83
            </span>
          </div>

          <div className="text-sm font-semibold text-slate-900 leading-relaxed whitespace-pre-line">
            {currentQ.question}
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQ.correctAnswer;

              let styleClass = "border-slate-200 bg-white hover:border-slate-300";
              if (submitted) {
                if (isCorrect) styleClass = "border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500 font-semibold";
                else if (isSelected) styleClass = "border-rose-500 bg-rose-50/50 ring-1 ring-rose-500";
              } else if (isSelected) {
                styleClass = "border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-600";
              }

              return (
                <div
                  key={idx}
                  onClick={() => !submitted && setSelectedOption(idx)}
                  className={`flex items-center gap-3 rounded-lg border p-3.5 text-xs cursor-pointer transition-all ${styleClass}`}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-700">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-slate-800">{opt}</span>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          {!submitted ? (
            <div className="flex justify-end pt-2">
              <button
                disabled={selectedOption === null}
                onClick={handleSubmit}
                className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
              >
                Submit Answer
              </button>
            </div>
          ) : (
            <div className="space-y-4 pt-3 border-t border-slate-100">
              <div className={`rounded-lg border p-4 text-xs ${
                selectedOption === currentQ.correctAnswer
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="font-bold mb-1">
                  {selectedOption === currentQ.correctAnswer ? "✓ Correct Solution (Official UPSC Answer Key)" : `✗ Incorrect (Official Answer Key: Option ${String.fromCharCode(65 + currentQ.correctAnswer)})`}
                </div>
                <p className="leading-relaxed whitespace-pre-line text-slate-800">
                  {currentQ.explanation}
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  Next Question →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
