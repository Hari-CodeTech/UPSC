import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Filter,
  Check,
  Eye,
  EyeOff,
  Strikethrough
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { authenticPrelimsPYQs, authenticMainsPYQs } from '../data/pyqs';
import Badge from '../components/common/Badge';

export default function PYQPractice() {
  const { recordPyqAttempt, pyqAttempts, errorLogs } = useApp();

  const [activeStage, setActiveStage] = useState('PRELIMS'); // 'PRELIMS' | 'MAINS'
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');

  // Prelims Quiz Engine state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [eliminatedOptions, setEliminatedOptions] = useState([]);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [timerActive, setTimerActive] = useState(true);
  const [selectedErrorCategory, setSelectedErrorCategory] = useState("Conceptual");
  const [userNotes, setUserNotes] = useState("");

  // Mains Practice Engine state
  const [mainsQuestionIndex, setMainsQuestionIndex] = useState(0);
  const [mainsDraftText, setMainsDraftText] = useState("");
  const [mainsTimerSeconds, setMainsTimerSeconds] = useState(600); // 10 mins default for 150 words
  const [mainsTimerRunning, setMainsTimerRunning] = useState(false);
  const [showModelOutline, setShowModelOutline] = useState(false);
  const [mainsDrafts, setMainsDrafts] = useState({});

  // Question Pools (Strictly Authentic UPSC CSE Papers Only)
  const prelimsQuestions = useMemo(() => {
    let pool = [...authenticPrelimsPYQs];
    if (selectedSubject !== 'ALL') {
      pool = pool.filter(q => q.subject === selectedSubject);
    }
    if (selectedYear !== 'ALL') {
      pool = pool.filter(q => q.year === Number(selectedYear));
    }
    return pool;
  }, [selectedSubject, selectedYear]);

  const currentPrelimsQ = prelimsQuestions[currentQuestionIndex] || prelimsQuestions[0];

  const mainsQuestions = useMemo(() => {
    let pool = [...authenticMainsPYQs];
    if (selectedSubject !== 'ALL') {
      pool = pool.filter(q => q.subject === selectedSubject);
    }
    if (selectedYear !== 'ALL') {
      pool = pool.filter(q => q.year === Number(selectedYear));
    }
    return pool;
  }, [selectedSubject, selectedYear]);

  const currentMainsQ = mainsQuestions[mainsQuestionIndex] || mainsQuestions[0];

  // Prelims Timer tick
  useEffect(() => {
    let interval = null;
    if (timerActive && !isAnswerSubmitted && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => s - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, isAnswerSubmitted, timerSeconds]);

  // Mains Timer tick
  useEffect(() => {
    let interval = null;
    if (mainsTimerRunning && mainsTimerSeconds > 0) {
      interval = setInterval(() => {
        setMainsTimerSeconds(s => s - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mainsTimerRunning, mainsTimerSeconds]);

  const handleToggleEliminate = (e, optIdx) => {
    e.stopPropagation();
    if (eliminatedOptions.includes(optIdx)) {
      setEliminatedOptions(eliminatedOptions.filter(i => i !== optIdx));
    } else {
      setEliminatedOptions([...eliminatedOptions, optIdx]);
    }
  };

  const handleSelectOption = (idx) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(idx);
  };

  const handleSubmitPrelimsAnswer = () => {
    if (selectedOption === null || !currentPrelimsQ) return;
    setIsAnswerSubmitted(true);
    const isCorrect = selectedOption === currentPrelimsQ.correctAnswer;

    recordPyqAttempt({
      questionId: currentPrelimsQ.id,
      stage: 'Prelims',
      subject: currentPrelimsQ.subject,
      syllabusTopicId: currentPrelimsQ.syllabusTopicId,
      isCorrect,
      selectedOption,
      timeTakenSeconds: 60 - timerSeconds,
      errorCategory: !isCorrect ? selectedErrorCategory : null,
      userNotes
    });
  };

  const handleNextPrelimsQ = () => {
    if (currentQuestionIndex < prelimsQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setCurrentQuestionIndex(0);
    }
    setSelectedOption(null);
    setEliminatedOptions([]);
    setIsAnswerSubmitted(false);
    setTimerSeconds(60);
    setUserNotes("");
  };

  // Word counter for Mains
  const mainsWordCount = mainsDraftText.trim() ? mainsDraftText.trim().split(/\s+/).length : 0;

  const handleSaveMainsDraft = () => {
    if (!currentMainsQ) return;
    setMainsDrafts({
      ...mainsDrafts,
      [currentMainsQ.id]: mainsDraftText
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Authentic UPSC Previous Year Questions (PYQs)
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Official UPSC Civil Services Examination papers (2018–2024) • Prelims & Mains
          </p>
        </div>

        {/* Stage Tabs (Prelims vs Mains) */}
        <div className="flex rounded-lg border border-slate-200 bg-white p-1 shadow-2xs">
          <button
            onClick={() => { setActiveStage('PRELIMS'); setCurrentQuestionIndex(0); setIsAnswerSubmitted(false); }}
            className={`rounded-md px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeStage === 'PRELIMS' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Prelims MCQ Simulator
          </button>
          <button
            onClick={() => { setActiveStage('MAINS'); setMainsQuestionIndex(0); }}
            className={`rounded-md px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeStage === 'MAINS' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Mains Descriptive Simulator
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Subject Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-500">Subject:</span>
            <select
              value={selectedSubject}
              onChange={(e) => { setSelectedSubject(e.target.value); setCurrentQuestionIndex(0); setMainsQuestionIndex(0); }}
              className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700"
            >
              <option value="ALL">All Subjects</option>
              <option value="GS I">GS I</option>
              <option value="GS II">GS II</option>
              <option value="GS III">GS III</option>
              <option value="GS IV">GS IV</option>
              <option value="CSAT">CSAT</option>
              <option value="PSIR Optional">PSIR Optional</option>
            </select>
          </div>

          {/* Examination Year Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-500">UPSC Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => { setSelectedYear(e.target.value); setCurrentQuestionIndex(0); setMainsQuestionIndex(0); }}
              className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700"
            >
              <option value="ALL">All Years (2020–2024)</option>
              <option value="2024">2024 Official Paper</option>
              <option value="2023">2023 Official Paper</option>
              <option value="2022">2022 Official Paper</option>
              <option value="2021">2021 Official Paper</option>
              <option value="2020">2020 Official Paper</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          {activeStage === 'PRELIMS' ? `${prelimsQuestions.length} Official MCQs Available` : `${mainsQuestions.length} Official Questions Available`}
        </div>
      </div>

      {/* PRELIMS MCQ SIMULATOR */}
      {activeStage === 'PRELIMS' && (
        <div className="space-y-4">
          {!currentPrelimsQ ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-white border border-dashed rounded-xl">
              No authentic UPSC questions match the selected filters.
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-5">
              {/* Question Header & Timer */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-slate-400">
                    Question {currentQuestionIndex + 1} of {prelimsQuestions.length}
                  </span>

                  <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-800">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    UPSC CSE Prelims {currentPrelimsQ.year} ({currentPrelimsQ.paper})
                  </span>

                  <Badge label={currentPrelimsQ.subject} variant={currentPrelimsQ.subject} size="sm" />
                </div>

                {/* Timed countdown */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div className={`flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-bold font-mono ${
                    timerSeconds <= 15 ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <Clock className="h-3.5 w-3.5" />
                    <span>00:{timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds}s</span>
                  </div>
                </div>
              </div>

              {/* Question Statement */}
              <div className="text-sm font-semibold text-slate-900 leading-relaxed whitespace-pre-line">
                {currentPrelimsQ.question}
              </div>

              {/* 4 Options with Option Elimination */}
              <div className="space-y-2.5">
                {currentPrelimsQ.options.map((option, idx) => {
                  const isEliminated = eliminatedOptions.includes(idx);
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === currentPrelimsQ.correctAnswer;

                  let borderClass = "border-slate-200 hover:border-slate-300";
                  let bgClass = "bg-white";

                  if (isAnswerSubmitted) {
                    if (isCorrect) {
                      borderClass = "border-emerald-500 ring-1 ring-emerald-500";
                      bgClass = "bg-emerald-50/50";
                    } else if (isSelected) {
                      borderClass = "border-rose-500 ring-1 ring-rose-500";
                      bgClass = "bg-rose-50/50";
                    }
                  } else if (isSelected) {
                    borderClass = "border-indigo-600 ring-1 ring-indigo-600";
                    bgClass = "bg-indigo-50/30";
                  }

                  return (
                    <div
                      key={idx}
                      onClick={() => !isEliminated && handleSelectOption(idx)}
                      className={`relative flex items-center justify-between rounded-lg border p-3.5 text-xs cursor-pointer transition-all ${borderClass} ${bgClass} ${
                        isEliminated ? 'opacity-40 bg-slate-100' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-700">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className={`text-slate-800 ${isEliminated ? 'line-through text-slate-400' : ''}`}>
                          {option}
                        </span>
                      </div>

                      {/* Elimination Strike Toggle */}
                      {!isAnswerSubmitted && (
                        <button
                          type="button"
                          onClick={(e) => handleToggleEliminate(e, idx)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                          title={isEliminated ? "Restore Option" : "Eliminate Option"}
                        >
                          <Strikethrough className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submission & Error Logging Controls */}
              {!isAnswerSubmitted ? (
                <div className="flex justify-end pt-2">
                  <button
                    disabled={selectedOption === null}
                    onClick={handleSubmitPrelimsAnswer}
                    className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
                  >
                    Submit Answer
                  </button>
                </div>
              ) : (
                <div className="space-y-4 pt-3 border-t border-slate-100">
                  {/* Result Verdict */}
                  <div className={`rounded-lg border p-4 ${
                    selectedOption === currentPrelimsQ.correctAnswer
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}>
                    <div className="flex items-center gap-2 font-bold text-sm">
                      {selectedOption === currentPrelimsQ.correctAnswer ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span>Correct! Option {String.fromCharCode(65 + currentPrelimsQ.correctAnswer)} is the official UPSC answer key.</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-rose-600" />
                          <span>Incorrect. Official UPSC Answer Key is Option {String.fromCharCode(65 + currentPrelimsQ.correctAnswer)}.</span>
                        </>
                      )}
                    </div>

                    {/* Official Explanation */}
                    <div className="mt-2 text-xs text-slate-800 leading-relaxed">
                      <strong>Official Explanation:</strong> {currentPrelimsQ.explanation}
                    </div>
                  </div>

                  {/* Error Log Categorization if incorrect */}
                  {selectedOption !== currentPrelimsQ.correctAnswer && (
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 space-y-2">
                      <span className="text-xs font-bold text-slate-700 block">
                        Classify Your Error Pattern (For Adaptive Sunday Buffer Review)
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {["Conceptual", "Guessing", "Revision/Silly Mistake", "Time Crunch"].map(cat => (
                          <button
                            key={cat}
                            onClick={() => setSelectedErrorCategory(cat)}
                            className={`rounded border p-2 text-xs font-semibold transition-all ${
                              selectedErrorCategory === cat
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Question Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleNextPrelimsQ}
                      className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                    >
                      Next Question →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MAINS DESCRIPTIVE SIMULATOR */}
      {activeStage === 'MAINS' && (
        <div className="space-y-4">
          {!currentMainsQ ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-white border border-dashed rounded-xl">
              No Mains questions found for the selected criteria.
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-5">
              {/* Mains Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-slate-400">
                    Question {mainsQuestionIndex + 1} of {mainsQuestions.length}
                  </span>

                  <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-800">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                    UPSC CSE Mains {currentMainsQ.year} ({currentMainsQ.paper})
                  </span>

                  <Badge label={`${currentMainsQ.marks} Marks`} size="sm" />
                  <Badge label={`${currentMainsQ.wordLimit} Words`} size="sm" />
                  <Badge label={currentMainsQ.directive || "Discuss"} variant="Crucial" size="sm" />
                </div>

                {/* Timed Stopwatch */}
                <div className="flex items-center gap-2">
                  <div className="font-mono text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
                    {Math.floor(mainsTimerSeconds / 60)}:{(mainsTimerSeconds % 60).toString().padStart(2, '0')}
                  </div>
                  <button
                    onClick={() => setMainsTimerRunning(!mainsTimerRunning)}
                    className="rounded bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    {mainsTimerRunning ? "Pause" : "Start Timer"}
                  </button>
                </div>
              </div>

              {/* Question Statement */}
              <div className="text-sm font-semibold text-slate-900 leading-relaxed">
                {currentMainsQ.question}
              </div>

              {/* Writing Workspace */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-600">Your Answer Draft</label>
                  <div className="flex items-center gap-3">
                    <span className={`font-mono font-bold ${
                      mainsWordCount > currentMainsQ.wordLimit ? 'text-amber-600' : 'text-slate-600'
                    }`}>
                      Word Count: {mainsWordCount} / {currentMainsQ.wordLimit}
                    </span>
                  </div>
                </div>

                <textarea
                  rows={10}
                  value={mainsDraftText}
                  onChange={(e) => setMainsDraftText(e.target.value)}
                  placeholder="Draft your introduction, body paragraphs with scholar citations and examples, and forward-looking constitutional conclusion..."
                  className="w-full rounded-lg border border-slate-200 p-3.5 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none font-mono leading-relaxed"
                />
              </div>

              {/* Actions and Model Outline Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => setShowModelOutline(!showModelOutline)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-slate-50 shadow-2xs"
                >
                  {showModelOutline ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span>{showModelOutline ? "Hide Model Framework" : "View Official Model Outline"}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveMainsDraft}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Save Draft Locally
                  </button>
                  <button
                    onClick={() => {
                      if (mainsQuestionIndex < mainsQuestions.length - 1) setMainsQuestionIndex(prev => prev + 1);
                      else setMainsQuestionIndex(0);
                      setMainsDraftText("");
                      setShowModelOutline(false);
                      setMainsTimerSeconds(600);
                      setMainsTimerRunning(false);
                    }}
                    className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Next Question →
                  </button>
                </div>
              </div>

              {/* Model Answer Outline Display */}
              {showModelOutline && currentMainsQ.modelOutline && (
                <div className="rounded-lg bg-indigo-50/40 border border-indigo-200 p-4 space-y-3 text-xs text-slate-800">
                  <h4 className="font-bold text-indigo-950 uppercase tracking-wider text-[11px]">
                    Topper Model Structure & Key Points
                  </h4>
                  <div>
                    <span className="font-bold text-slate-700 block text-[11px]">1. Introduction (15-20%):</span>
                    <p className="text-slate-600">{currentMainsQ.modelOutline.introduction}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block text-[11px]">2. Body Arguments (60-70%):</span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600">
                      {currentMainsQ.modelOutline.body?.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block text-[11px]">3. Conclusion & Way Forward (15%):</span>
                    <p className="text-slate-600">{currentMainsQ.modelOutline.conclusion}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
