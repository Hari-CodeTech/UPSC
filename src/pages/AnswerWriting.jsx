import React, { useState, useEffect, useMemo } from 'react';
import {
  PenTool,
  Clock,
  BookOpen,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Info,
  ChevronDown,
  RotateCcw,
  Check,
  AlertCircle,
  FolderOpen,
  Trash2,
  Edit3
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { authenticMainsPYQs } from '../data/pyqs/mainsPyqs';
import { storageService } from '../services/storageService';
import Badge from '../components/common/Badge';

const DIRECTIVES_GUIDE = [
  {
    directive: "Discuss",
    meaning: "Present multiple facets, exploring merits, demerits, cause-and-effect relationships, and scholarly viewpoints before arriving at a reasoned conclusion."
  },
  {
    directive: "Critically Analyse",
    meaning: "Deconstruct the statement into parts, evaluate the underlying assumptions, scrutinize shortcomings/criticisms, and formulate a balanced, non-dogmatic synthesis."
  },
  {
    directive: "Examine",
    meaning: "Inspect closely, probe beneath surface facts, uncover root institutional causes, and provide verifiable empirical evidence or case precedents."
  },
  {
    directive: "Evaluate",
    meaning: "Assess the success, failure, effectiveness, or impact against predefined benchmarks, statutory targets, or constitutional values."
  },
  {
    directive: "Elucidate",
    meaning: "Make clear and explain in depth using illustrative examples, analogies, case laws, or conceptual breakdowns."
  },
  {
    directive: "Comment",
    meaning: "Express an informed analytical viewpoint on the statement, defending your reasoned judgment with solid constitutional or empirical backing."
  }
];

export default function AnswerWriting() {
  const { notes, addNote, updateNote, deleteNote } = useApp();

  const [selectedQuestion, setSelectedQuestion] = useState(() => authenticMainsPYQs[0]);
  
  // Load draft from LocalStorage for the current question
  const initialDrafts = useMemo(() => storageService.getMainsDrafts(), []);
  const initialQDraft = initialDrafts[selectedQuestion.id] || {};

  const [draftText, setDraftText] = useState(initialQDraft.draftText || "");
  const [timerSeconds, setTimerSeconds] = useState(initialQDraft.timerSeconds !== undefined ? initialQDraft.timerSeconds : 600); // 10 mins
  const [timerActive, setTimerActive] = useState(false);
  const [savedNoteId, setSavedNoteId] = useState(initialQDraft.savedNoteId || null);

  const [saveStatus, setSaveStatus] = useState({ success: false, message: "", error: false });
  const [showDirectivesModal, setShowDirectivesModal] = useState(false);
  const [showHistoryTab, setShowHistoryTab] = useState(false);

  // Self Evaluation Rubric state
  const [rubric, setRubric] = useState(initialQDraft.rubric || {
    introduction: 3,
    substance: 3,
    examples: 3,
    conclusion: 3
  });

  // When changing selected question, restore its draft from LocalStorage
  const handleSelectQuestion = (q) => {
    setSelectedQuestion(q);
    const drafts = storageService.getMainsDrafts();
    const qDraft = drafts[q.id] || {};
    setDraftText(qDraft.draftText || "");
    setTimerSeconds(qDraft.timerSeconds !== undefined ? qDraft.timerSeconds : 600);
    setTimerActive(false);
    setSavedNoteId(qDraft.savedNoteId || null);
    setRubric(qDraft.rubric || { introduction: 3, substance: 3, examples: 3, conclusion: 3 });
    setSaveStatus({ success: false, message: "", error: false });
  };

  // Auto-save draft changes to LocalStorage so navigating away never loses content
  useEffect(() => {
    storageService.saveMainsDraft(selectedQuestion.id, {
      draftText,
      timerSeconds,
      rubric,
      savedNoteId,
      questionId: selectedQuestion.id
    });
  }, [draftText, timerSeconds, rubric, savedNoteId, selectedQuestion.id]);

  // Timer countdown
  useEffect(() => {
    let interval = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds(s => s - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  const wordCount = draftText.trim() ? draftText.trim().split(/\s+/).length : 0;
  const targetWords = selectedQuestion.wordLimit || 150;
  const totalScore = rubric.introduction + rubric.substance + rubric.examples + rubric.conclusion; // out of 20

  // Filter all saved answers from Study Notes
  const savedAnswers = useMemo(() => {
    return notes.filter(n => n.category === "Answer Writing");
  }, [notes]);

  // Handle Save to Study Notes (prevents duplicates by updating existing note)
  const handleSaveToNotes = () => {
    if (!draftText.trim()) {
      setSaveStatus({ success: false, error: true, message: "Please compose an answer draft before saving." });
      return;
    }

    try {
      const nowIso = new Date().toISOString();
      const existingNote = savedNoteId ? notes.find(n => n.id === savedNoteId) : notes.find(n => n.category === "Answer Writing" && n.questionId === selectedQuestion.id);

      const notePayload = {
        title: `Mains Answer (${selectedQuestion.subject}): ${selectedQuestion.question.slice(0, 45)}...`,
        subject: selectedQuestion.subject,
        category: "Answer Writing",
        questionId: selectedQuestion.id,
        question: selectedQuestion.question,
        syllabusTopicId: selectedQuestion.syllabusTopicId || null,
        wordCount,
        rubric,
        rawAnswerText: draftText,
        tags: ["Answer Writing", selectedQuestion.subject, selectedQuestion.directive || "Mains"],
        content: `## Question (${selectedQuestion.marks} Marks, ${selectedQuestion.wordLimit} Words)\n${selectedQuestion.question}\n\n### Candidate Answer (${wordCount} words)\n${draftText}\n\n### Self-Evaluation Rubric: ${totalScore} / 20\n- **Introduction & Context:** ${rubric.introduction}/5\n- **Substance & Structure:** ${rubric.substance}/5\n- **Examples & Case Laws:** ${rubric.examples}/5\n- **Conclusion & Vision:** ${rubric.conclusion}/5\n\n_Last updated: ${new Date().toLocaleString()}_`
      };

      let activeId = savedNoteId;
      if (existingNote) {
        updateNote(existingNote.id, notePayload);
        activeId = existingNote.id;
      } else {
        const created = addNote(notePayload);
        activeId = created.id;
        setSavedNoteId(activeId);
      }

      // Persist noteId link into local draft
      storageService.saveMainsDraft(selectedQuestion.id, {
        draftText,
        timerSeconds,
        rubric,
        savedNoteId: activeId
      });

      setSaveStatus({
        success: true,
        error: false,
        message: `Answer successfully saved to Study Notes (${wordCount} words at ${new Date().toLocaleTimeString()}).`
      });

      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, success: false }));
      }, 4000);
    } catch (err) {
      console.error("[AnswerWriting] Failed to save answer:", err);
      setSaveStatus({
        success: false,
        error: true,
        message: "Failed to persist answer to LocalStorage. Please verify browser storage quota."
      });
    }
  };

  // Reopen and edit a previously saved answer
  const handleReopenSavedAnswer = (savedNote) => {
    // Check if matching authentic question exists
    const matchingQ = authenticMainsPYQs.find(q => q.id === savedNote.questionId) || {
      id: savedNote.questionId || `CUSTOM-${Date.now()}`,
      question: savedNote.question || savedNote.title,
      subject: savedNote.subject || "General Studies",
      wordLimit: savedNote.wordCount || 150,
      marks: 10,
      directive: "Discuss"
    };

    setSelectedQuestion(matchingQ);
    const restoredText = savedNote.rawAnswerText || savedNote.content?.split('### Candidate Answer')[1]?.split('### Self-Evaluation Rubric')[0]?.replace(/\(\d+ words\)/, '').trim() || "";
    setDraftText(restoredText);
    setSavedNoteId(savedNote.id);
    if (savedNote.rubric) setRubric(savedNote.rubric);
    setShowHistoryTab(false);
    setSaveStatus({ success: true, error: false, message: "Reopened saved answer for editing." });
    setTimeout(() => setSaveStatus(prev => ({ ...prev, success: false })), 3000);
  };

  // Clear answer with confirmation
  const handleClearDraft = () => {
    if (window.confirm("Are you sure you want to clear your current draft? (Saved notes in Study Notes will remain safe)")) {
      setDraftText("");
      setTimerSeconds(600);
      setTimerActive(false);
      storageService.clearMainsDraft(selectedQuestion.id);
      setSaveStatus({ success: true, error: false, message: "Draft cleared." });
      setTimeout(() => setSaveStatus(prev => ({ ...prev, success: false })), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Mains Answer Writing & Evaluation Studio
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Timed practice • Auto-persisted answer drafts • Directives guide • 4-factor self-evaluation rubric
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Saved Answers History Toggle */}
          <button
            onClick={() => setShowHistoryTab(!showHistoryTab)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
              showHistoryTab ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <FolderOpen className="h-4 w-4" />
            <span>Saved Answers ({savedAnswers.length})</span>
          </button>

          {/* Directives Guide Modal Button */}
          <button
            onClick={() => setShowDirectivesModal(!showDirectivesModal)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-slate-50 shadow-2xs"
          >
            <Info className="h-4 w-4" />
            <span>Directives Guide</span>
          </button>
        </div>
      </div>

      {/* Save Status Notification Banner */}
      {saveStatus.message && (
        <div className={`rounded-lg border p-3 text-xs flex items-center justify-between animate-in fade-in ${
          saveStatus.error
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex items-center gap-2 font-medium">
            {saveStatus.error ? <AlertCircle className="h-4 w-4 text-rose-600" /> : <CheckCircle className="h-4 w-4 text-emerald-600" />}
            <span>{saveStatus.message}</span>
          </div>
          <button onClick={() => setSaveStatus({ success: false, message: "", error: false })} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Directives Master Guide Accordion */}
      {showDirectivesModal && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-5 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
              UPSC Examination Directives Glossary
            </h3>
            <button onClick={() => setShowDirectivesModal(false)} className="text-xs text-indigo-600 font-semibold hover:underline">Close</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {DIRECTIVES_GUIDE.map((d, i) => (
              <div key={i} className="rounded-lg bg-white border border-indigo-150 p-3 space-y-1">
                <span className="font-bold text-indigo-900 text-xs block">{d.directive}</span>
                <p className="text-[11px] text-slate-600 leading-relaxed">{d.meaning}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saved Answers History Panel */}
      {showHistoryTab && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Previously Saved Mains Answers in Study Notes ({savedAnswers.length})
            </h3>
            <span className="text-[11px] text-slate-400">Click any answer to reopen and edit</span>
          </div>

          {savedAnswers.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              No saved answers in Study Notes yet. Write a response below and click "Save to Study Notes".
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto">
              {savedAnswers.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-xs space-y-2 hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Badge label={item.subject || "Mains"} size="sm" />
                      <span className="text-[10px] text-slate-400">{item.updatedAt?.split('T')[0]}</span>
                    </div>
                    <p className="font-bold text-slate-900 line-clamp-2">
                      {item.question || item.title}
                    </p>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      Word Count: {item.wordCount || 0} words
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <button
                      onClick={() => handleReopenSavedAnswer(item)}
                      className="flex items-center gap-1 font-semibold text-indigo-700 hover:text-indigo-900"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Reopen & Edit
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm("Delete this saved answer note?")) deleteNote(item.id);
                      }}
                      className="text-slate-400 hover:text-rose-600"
                      title="Delete from notes"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Authentic Question Picker Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
          Authentic Question:
        </span>
        {authenticMainsPYQs.map(q => (
          <button
            key={q.id}
            onClick={() => handleSelectQuestion(q)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
              selectedQuestion.id === q.id
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {q.year} {q.subject} ({q.directive || 'Q'})
          </button>
        ))}
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Question & Writing Workspace */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-5">
          {/* Question Title & Timer */}
          <div className="space-y-3 border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Badge label={selectedQuestion.subject} variant={selectedQuestion.subject} size="sm" />
                <Badge label={`${selectedQuestion.marks} Marks`} size="sm" />
                <Badge label={`${selectedQuestion.wordLimit} Words`} size="sm" />
                <Badge label={selectedQuestion.directive || "Discuss"} variant="Crucial" size="sm" />
              </div>

              {/* Timer Controls */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold bg-slate-50 border border-slate-200 px-2.5 py-1 rounded">
                  {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
                </span>
                <button
                  onClick={() => setTimerActive(!timerActive)}
                  className="rounded bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  {timerActive ? "Pause" : "Start Timer"}
                </button>
                <button
                  onClick={() => { setTimerSeconds(600); setTimerActive(false); }}
                  className="p-1 text-slate-400 hover:text-slate-600"
                  title="Reset Timer"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>

            <h2 className="text-sm font-bold text-slate-900 leading-relaxed">
              {selectedQuestion.question}
            </h2>
          </div>

          {/* Text Area with Live LocalStorage Persistence */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <label className="font-bold text-slate-700">Answer Composition</label>
                <span className="text-[10px] text-slate-400 italic">(Auto-persisted to LocalStorage)</span>
              </div>
              <span className={`font-mono font-bold ${
                wordCount > targetWords ? 'text-amber-600' : 'text-slate-600'
              }`}>
                {wordCount} / {targetWords} words ({Math.round((wordCount / targetWords) * 100)}%)
              </span>
            </div>

            <textarea
              rows={12}
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              placeholder="Structure your answer: 1. Introduction with contextual hook -> 2. Analytical Body with headers, diagrams, scholar citations -> 3. Balanced constitutional conclusion..."
              className="w-full rounded-lg border border-slate-200 p-3.5 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none font-mono leading-relaxed"
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
            <button
              onClick={handleClearDraft}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              Clear Current Text
            </button>

            <button
              onClick={handleSaveToNotes}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-2xs"
            >
              <PenTool className="h-4 w-4 text-emerald-400" />
              <span>{savedNoteId ? "Update Saved Answer in Notes" : "Save to Study Notes"}</span>
            </button>
          </div>
        </div>

        {/* Right Col: Self-Evaluation Rubric */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Self-Evaluation Rubric
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Score your answer against the 4 core dimensions (Topper criteria)
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Dimension 1: Introduction */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">1. Introduction & Context</span>
                <span className="font-bold text-slate-900">{rubric.introduction} / 5</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={rubric.introduction}
                onChange={(e) => setRubric({ ...rubric, introduction: Number(e.target.value) })}
                className="w-full accent-slate-900"
              />
              <span className="text-[10px] text-slate-400">Did you define the term or provide relevant constitutional context?</span>
            </div>

            {/* Dimension 2: Substance */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">2. Substance & Structure</span>
                <span className="font-bold text-slate-900">{rubric.substance} / 5</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={rubric.substance}
                onChange={(e) => setRubric({ ...rubric, substance: Number(e.target.value) })}
                className="w-full accent-slate-900"
              />
              <span className="text-[10px] text-slate-400">Did you directly answer the demand of the directive without rambling?</span>
            </div>

            {/* Dimension 3: Examples */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">3. Examples & Case Laws</span>
                <span className="font-bold text-slate-900">{rubric.examples} / 5</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={rubric.examples}
                onChange={(e) => setRubric({ ...rubric, examples: Number(e.target.value) })}
                className="w-full accent-slate-900"
              />
              <span className="text-[10px] text-slate-400">Did you substantiate points with Supreme Court cases, reports, or data?</span>
            </div>

            {/* Dimension 4: Conclusion */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">4. Conclusion & Vision</span>
                <span className="font-bold text-slate-900">{rubric.conclusion} / 5</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={rubric.conclusion}
                onChange={(e) => setRubric({ ...rubric, conclusion: Number(e.target.value) })}
                className="w-full accent-slate-900"
              />
              <span className="text-[10px] text-slate-400">Is the conclusion forward-looking, constitutional, and solution-oriented?</span>
            </div>
          </div>

          {/* Rubric Total Score Banner */}
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Calculated Marks Equivalent
            </span>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {totalScore} / 20 <span className="text-xs font-normal text-slate-500">({Math.round((totalScore / 20) * 100)}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
