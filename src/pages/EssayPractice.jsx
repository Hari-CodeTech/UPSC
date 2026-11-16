import React, { useState } from 'react';
import {
  Scroll,
  Sparkles,
  BookOpen,
  PenTool,
  Check,
  ChevronRight,
  HelpCircle,
  Clock,
  Layers
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { authenticMainsPYQs } from '../data/pyqs/mainsPyqs';
import Badge from '../components/common/Badge';

const ESSAY_LIBRARY = [
  {
    id: "ESSAY-2023-01",
    year: 2023,
    type: "Philosophical",
    topic: "Thinking is like a game, it begins with an individual feeling of an opening, then it becomes a play of pieces.",
    deconstruction: "Metaphor of chess/game: Individual spark/intuition (the opening) followed by systemic, disciplined, multi-stakeholder strategy (the play of pieces).",
    suggestedQuotes: ["'The unexamined life is not worth living.' — Socrates", "'Imagination is more important than knowledge.' — Albert Einstein"]
  },
  {
    id: "ESSAY-2022-01",
    year: 2022,
    type: "Philosophical",
    topic: "Forests are the best case studies for economic excellence.",
    deconstruction: "Natural symbiosis vs ruthless extractive greed: Biodiversity as diversification; waste-as-resource circular economy; resilience through ecological equilibrium.",
    suggestedQuotes: ["'The Earth has enough for everyone's need, but not for everyone's greed.' — Mahatma Gandhi"]
  },
  {
    id: "ESSAY-2021-01",
    year: 2021,
    type: "Philosophical",
    topic: "The real is rational and the rational is real.",
    deconstruction: "Hegelian dialectic: Historical reality is propelled by reasoned evolutionary progress; caution against rationalizing tyrannical status quo.",
    suggestedQuotes: ["'Reason is, and ought only to be the slave of the passions.' — David Hume"]
  }
];

const PESTLE_DIMENSIONS = [
  { key: "political", label: "Political & Governance", prompt: "Democratic decentralisation, state capacity, civic participation, electoral integrity" },
  { key: "economic", label: "Economic & Financial", prompt: "Inclusive wealth creation, fiscal equity, circular economy, labor dynamics" },
  { key: "social", label: "Social & Cultural", prompt: "Gender parity, caste emancipation, public health, human dignity, community harmony" },
  { key: "technological", label: "Technological & Scientific", prompt: "Digital commons, ethical AI, automation, green frontier technology" },
  { key: "legal", label: "Legal & Constitutional", prompt: "Rule of law, judicial accountability, fundamental freedoms, statutory safeguards" },
  { key: "environmental", label: "Environmental & Ecological", prompt: "Intergenerational justice, climate resilience, conservation, ecological footprints" },
  { key: "ethical", label: "Ethical & Moral", prompt: "Virtue ethics, categorical imperatives, compassion for the weakest, moral courage" }
];

export default function EssayPractice() {
  const { addNote } = useApp();

  const [selectedEssay, setSelectedEssay] = useState(ESSAY_LIBRARY[0]);
  const [activeTab, setActiveTab] = useState("BRAINSTORM"); // 'BRAINSTORM' | 'OUTLINE' | 'DRAFT'
  const [pestleNotes, setPestleNotes] = useState({
    political: "",
    economic: "",
    social: "",
    technological: "",
    legal: "",
    environmental: "",
    ethical: ""
  });
  const [outlineText, setOutlineText] = useState("");
  const [draftText, setDraftText] = useState("");
  const [savedNotification, setSavedNotification] = useState(false);

  const wordCount = draftText.trim() ? draftText.trim().split(/\s+/).length : 0;

  const handleSaveToNotes = () => {
    addNote({
      title: `Essay Workspace: ${selectedEssay.topic.slice(0, 45)}...`,
      subject: "Essay",
      category: "Essay",
      tags: ["Essay", selectedEssay.type, "PESTLE"],
      content: `## Essay Topic: "${selectedEssay.topic}" (${selectedEssay.year})\n\n### PESTLE Brainstorming Matrix\n${Object.entries(pestleNotes).map(([k, v]) => `- **${k.toUpperCase()}**: ${v || 'N/A'}`).join('\n')}\n\n### Structured Outline\n${outlineText}\n\n### Essay Draft (${wordCount} words)\n${draftText}`
    });
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Essay Preparation & PESTLE Deconstruction Studio
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Philosophical aphorisms • 360-degree multi-dimensional brainstorming • 1000–1200 word drafts
          </p>
        </div>

        <button
          onClick={handleSaveToNotes}
          className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-2xs"
        >
          {savedNotification ? <Check className="h-4 w-4 text-emerald-400" /> : <PenTool className="h-4 w-4" />}
          <span>{savedNotification ? "Saved to Study Notes!" : "Save Workspace to Notes"}</span>
        </button>
      </div>

      {/* Topic Selection Carousel */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Selected UPSC Essay Topic
        </span>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ESSAY_LIBRARY.map(item => (
            <div
              key={item.id}
              onClick={() => setSelectedEssay(item)}
              className={`rounded-lg border p-3.5 text-xs cursor-pointer transition-all ${
                selectedEssay.id === item.id
                  ? 'border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-600'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-800">UPSC {item.year}</span>
                <Badge label={item.type} size="sm" />
              </div>
              <p className="font-semibold text-slate-900 line-clamp-2 leading-relaxed">
                "{item.topic}"
              </p>
            </div>
          ))}
        </div>

        {/* Deconstruction Hint Box */}
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-700 space-y-1">
          <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
            Philosophical Metaphor Deconstruction
          </span>
          <p className="leading-relaxed">{selectedEssay.deconstruction}</p>
        </div>
      </div>

      {/* Workspace Tabs: Brainstorm (PESTLE), Outline, Draft */}
      <div className="flex border-b border-slate-200 gap-4">
        {[
          { id: "BRAINSTORM", label: "1. PESTLE Framework Brainstorming" },
          { id: "OUTLINE", label: "2. Thematic Argument Mapping" },
          { id: "DRAFT", label: "3. Full Essay Composition" }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`border-b-2 py-3 px-1 text-xs font-bold transition-all ${
              activeTab === t.id
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: PESTLE FRAMEWORK */}
      {activeTab === 'BRAINSTORM' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              360° Multi-Dimensional PESTLE Brainstorming
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ensure comprehensive coverage across Political, Economic, Social, Technological, Legal, Environmental, and Ethical dimensions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PESTLE_DIMENSIONS.map(dim => (
              <div key={dim.key} className="rounded-lg border border-slate-200 p-3.5 space-y-1.5 bg-slate-50/40">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">{dim.label}</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">{dim.prompt}</p>
                <textarea
                  rows={3}
                  value={pestleNotes[dim.key]}
                  onChange={(e) => setPestleNotes({ ...pestleNotes, [dim.key]: e.target.value })}
                  placeholder="Key anecdotes, historical examples, paradoxes, scholar quotes..."
                  className="w-full rounded border border-slate-200 bg-white p-2 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: OUTLINE */}
      {activeTab === 'OUTLINE' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Thematic Argument Flow & Outline Map
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Draft paragraph transitions, antitheses, and counter-arguments before writing full prose.
            </p>
          </div>

          <textarea
            rows={12}
            value={outlineText}
            onChange={(e) => setOutlineText(e.target.value)}
            placeholder={`I. INTRODUCTION: Opening hook (historical paradox, allegorical fable), thesis statement.\n\nII. CORE METAPHOR EXPLORATION: Unpacking literal vs symbolic connotations.\n\nIII. THESIS (Direct Affirmation): How individual genius/spark sets the opening.\n\nIV. SYSTEMIC INTERPLAY (Play of Pieces): Institutional coordination, public policy, collective labor.\n\nV. ANTITHESIS / CRITIQUE: What happens when the play of pieces becomes chaotic or tyrannical?\n\nVI. SYNTHESIS: Reconciling individual autonomy with institutional harmony.\n\nVII. CONCLUSION: Visionary forward-looking wrap-up rooted in constitutional values.`}
            className="w-full rounded-lg border border-slate-200 p-3.5 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none font-mono leading-relaxed"
          />
        </div>
      )}

      {/* TAB 3: DRAFT */}
      {activeTab === 'DRAFT' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Full Essay Draft
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Target: 1000–1200 words • Recommended time: 90 minutes
              </p>
            </div>

            <span className={`font-mono font-bold text-xs ${
              wordCount >= 1000 && wordCount <= 1250 ? 'text-emerald-600' : 'text-slate-600'
            }`}>
              Word Count: {wordCount} / 1200 words
            </span>
          </div>

          <textarea
            rows={16}
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder="Write your comprehensive essay draft here..."
            className="w-full rounded-lg border border-slate-200 p-4 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none font-mono leading-relaxed"
          />
        </div>
      )}
    </div>
  );
}
