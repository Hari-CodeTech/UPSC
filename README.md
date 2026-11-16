# UPSC CSE MASTER PLANNER

A complete, professionally designed, client-side React preparation management platform engineered for serious UPSC Civil Services Examination aspirants.

Covers:
- **General Studies Paper I** (History, Heritage, Geography, Society)
- **General Studies Paper II** (Polity, Governance, Constitution, Social Justice, IR)
- **General Studies Paper III** (Economy, Agriculture, Science & Tech, Environment, Security, Disaster Management)
- **General Studies Paper IV** (Ethics, Integrity & Aptitude, Applied Case Studies)
- **CSAT Paper II** (Reading Comprehension, Quantitative Aptitude & Number Systems, Logical Reasoning)
- **Essay Paper** (PESTLE Framework, Philosophical Quote Deconstruction, Thematic Brainstorming)
- **PSIR Optional Paper I** (Political Theory & Thinkers, Indian Government & Politics)
- **PSIR Optional Paper II** (Comparative Politics, IR Theories, India's Foreign Policy & Global Power Centers)

---

## 1. Core Engineering Systems

### 6+1 Weekly Planning System
- **Monday–Saturday**: Generates realistic, modular study days adhering strictly to configured productive capacity (default 8 hours, excluding breaks). Large topics are subdivided into sessions; completed topics never reappear as new learning.
- **Dynamic Sunday Buffer**: Sunday does not introduce new learning modules. It dynamically aggregates low-confidence topics (< 3/5), incomplete weekday sessions, active recall flashcards, and error log queries from actual student activity during the week.

### Hybrid Spaced Repetition (Option C)
- Spaced interval sequence: **1d → 3d → 7d → 14d → 30d**.
- Adapts future recommendations based on confidence rating (1–5) and difficulty.
- Complete student sovereignty: manually reschedule, override priorities, or dismiss cards without algorithmic overwriting.

### Adaptive Timetable Rebalancing
- Detects uncompleted or missed sessions without dumping everything into the following day.
- Preserves daily 8h capacity and Sunday buffer; scans the next 14 days for open headroom.
- Infeasibility reporter alerts when targets cannot be achieved within safe study-hour limits.

### Authentic UPSC Previous-Year Questions (PYQs)
- Official UPSC Prelims & Mains questions (2018–2024) are strictly separated from practice drills.
- Prelims MCQ simulator with option elimination (strikethrough), official explanations, and 4-tier error classification (Conceptual, Guessing, Revision/Silly Mistake, Time Crunch).
- Mains writing simulator with word count monitoring, stopwatch timer, draft saving, and 4-factor self-evaluation rubric.

### Transparent Live Data Pipeline
- Honest CORS and offline handling for current affairs newsfeeds.
- If browser cross-origin limits prevent live RSS ingestion, transparent notifications are displayed alongside the verified, syllabus-mapped curated repository.

---

## 2. Technology Stack

- **Frontend**: React 19 + Vite 8
- **Language**: JavaScript (ES6+)
- **Styling**: Tailwind CSS v4 (Academic restrained palette: Navy `#0f172a`, Slate `#f8fafc`, Amber `#d97706`, Emerald `#059669`, Indigo `#4f46e5`, White)
- **Routing**: React Router DOM v7
- **Icons**: Lucide React
- **Visualization**: Recharts
- **Date Handling**: date-fns
- **Markdown**: React Markdown
- **Persistence**: LocalStorage with schema versioning (`upsc_planner_v1_*`), auto-recovery, and full JSON backup/restore.

---

## 3. Local Execution

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```
Access at `http://localhost:5173`.

### Verify Production Build
```bash
npm run build
```
Builds verified client bundles with zero errors.
