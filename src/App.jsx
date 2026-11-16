import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { PlannerProvider } from './context/PlannerContext';
import { RevisionProvider } from './context/RevisionContext';
import AppShell from './components/layout/AppShell';

// Pages
import Dashboard from './pages/Dashboard';
import TodayPlan from './pages/TodayPlan';
import CompletePlan from './pages/CompletePlan';
import GSPlanner from './pages/GSPlanner';
import PSIRPlanner from './pages/PSIRPlanner';
import SyllabusTracker from './pages/SyllabusTracker';
import CurrentAffairs from './pages/CurrentAffairs';
import PYQPractice from './pages/PYQPractice';
import CSATPractice from './pages/CSATPractice';
import AnswerWriting from './pages/AnswerWriting';
import EssayPractice from './pages/EssayPractice';
import RevisionCentre from './pages/RevisionCentre';
import MockTests from './pages/MockTests';
import Notes from './pages/Notes';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

export default function App() {
  return (
    <AppProvider>
      <PlannerProvider>
        <RevisionProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AppShell />}>
                <Route index element={<Dashboard />} />
                <Route path="today" element={<TodayPlan />} />
                <Route path="complete-plan" element={<CompletePlan />} />
                <Route path="gs-planner" element={<GSPlanner />} />
                <Route path="psir-planner" element={<PSIRPlanner />} />
                <Route path="syllabus-tracker" element={<SyllabusTracker />} />
                <Route path="current-affairs" element={<CurrentAffairs />} />
                <Route path="pyq-practice" element={<PYQPractice />} />
                <Route path="csat-practice" element={<CSATPractice />} />
                <Route path="answer-writing" element={<AnswerWriting />} />
                <Route path="essay-practice" element={<EssayPractice />} />
                <Route path="revision-centre" element={<RevisionCentre />} />
                <Route path="mock-tests" element={<MockTests />} />
                <Route path="notes" element={<Notes />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </RevisionProvider>
      </PlannerProvider>
    </AppProvider>
  );
}
