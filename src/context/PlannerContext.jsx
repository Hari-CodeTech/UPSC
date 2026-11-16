import React, { createContext, useContext, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { storageService } from '../services/storageService';
import { generateDayPlan } from '../engine/planningEngine';
import { identifyMissedTasks, calculateRebalanceProposal } from '../engine/adaptiveEngine';
import { useApp } from './AppContext';

const PlannerContext = createContext();

export function PlannerProvider({ children }) {
  const { settings, topicProgressMap, updateTopicProgress } = useApp();
  const [dailyPlans, setDailyPlansState] = useState(() => storageService.getDailyPlans());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [rebalanceResult, setRebalanceResult] = useState(null);

  // Sync daily plans
  const savePlans = (newPlans) => {
    setDailyPlansState(newPlans);
    storageService.saveDailyPlans(newPlans);
  };

  /**
   * Fetch or dynamically synthesize a day plan for any given date
   */
  const getPlanForDate = (date) => {
    const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
    if (dailyPlans[dateStr]) {
      return dailyPlans[dateStr];
    }
    // Generate fresh plan respecting 6+1 rules and Sunday buffer
    const dateObj = typeof date === 'string' ? new Date(dateStr) : date;
    const generated = generateDayPlan(dateObj, settings, topicProgressMap, dailyPlans);
    
    // Save to cache
    const updated = { ...dailyPlans, [dateStr]: generated };
    savePlans(updated);
    return generated;
  };

  /**
   * Update session completion with 3-tier workflow: Read -> Revised -> Practised
   */
  const updateSessionStatus = (dateStr, sessionId, newStatus) => {
    const plan = getPlanForDate(dateStr);
    if (!plan || !plan.sessions) return;

    let newlyCompletedHours = 0;
    const updatedSessions = plan.sessions.map(s => {
      if (s.id === sessionId) {
        const updated = { ...s, completionStatus: newStatus };
        return updated;
      }
      return s;
    });

    // Recompute actual completed hours
    updatedSessions.forEach(s => {
      if (s.completionStatus === 'READ' || s.completionStatus === 'REVISED' || s.completionStatus === 'PRACTISED') {
        newlyCompletedHours += (s.durationHours || 0);
      }
    });

    const updatedPlan = {
      ...plan,
      sessions: updatedSessions,
      completedHours: Number(newlyCompletedHours.toFixed(1)),
      isCustomized: true
    };

    const updatedPlans = { ...dailyPlans, [dateStr]: updatedPlan };
    savePlans(updatedPlans);

    // If session has associated syllabus topic, update topic progress state
    const targetSession = plan.sessions.find(s => s.id === sessionId);
    const hasSyllabusTopic = targetSession?.topicId && (
      targetSession.topicId.startsWith('GS') ||
      targetSession.topicId.startsWith('PSIR') ||
      targetSession.topicId.startsWith('CSAT') ||
      targetSession.topicId.startsWith('ESSAY')
    );

    if (hasSyllabusTopic) {
      const topicId = targetSession.topicId;
      const currentProg = topicProgressMap[topicId] || {};
      const isAlreadyCompleted = currentProg.status === 'COMPLETED';

      // If completing a revision task, preserve COMPLETED learning status
      if (targetSession.type === 'REVISION' && isAlreadyCompleted) {
        updateTopicProgress(topicId, {
          lastRevisedDate: dateStr,
          status: 'COMPLETED'
        });
      } else {
        const statusMap = {
          'NOT_STARTED': 'NOT_STARTED',
          'READ': 'IN_PROGRESS',
          'REVISED': 'IN_PROGRESS',
          'PRACTISED': 'COMPLETED'
        };
        updateTopicProgress(topicId, {
          status: statusMap[newStatus] || 'IN_PROGRESS',
          readLevel: newStatus,
          lastStudiedDate: dateStr
        });
      }
    }

    return updatedPlan;
  };

  /**
   * Update notes inside a specific session
   */
  const updateSessionNotes = (dateStr, sessionId, notes) => {
    const plan = getPlanForDate(dateStr);
    if (!plan) return;

    const updatedSessions = plan.sessions.map(s => s.id === sessionId ? { ...s, notes } : s);
    const updatedPlan = { ...plan, sessions: updatedSessions, isCustomized: true };
    const updatedPlans = { ...dailyPlans, [dateStr]: updatedPlan };
    savePlans(updatedPlans);
  };

  /**
   * Run adaptive timetable rebalance check
   */
  const checkTimetableRebalance = () => {
    const missed = identifyMissedTasks(dailyPlans, new Date());
    const proposal = calculateRebalanceProposal(missed, dailyPlans, settings);
    setRebalanceResult(proposal);
    return proposal;
  };

  /**
   * Apply user-approved rebalance proposals
   */
  const applyRebalanceProposals = (proposals) => {
    if (!proposals || proposals.length === 0) return;
    const currentPlans = { ...dailyPlans };

    proposals.forEach(p => {
      // Find original session and remove/mark it
      if (currentPlans[p.fromOriginalDate]) {
        currentPlans[p.fromOriginalDate].sessions = currentPlans[p.fromOriginalDate].sessions.filter(s => s.topicId !== p.topicId);
      }

      // Add to proposed target date plan
      const targetDatePlan = currentPlans[p.proposedNewDate] || generateDayPlan(new Date(p.proposedNewDate), settings, topicProgressMap, currentPlans);
      const newSession = {
        id: `${p.proposedNewDate}-rebalanced-${Date.now()}-${p.topicId}`,
        slotIndex: (targetDatePlan.sessions.length || 0) + 1,
        name: `Rebalanced: ${p.topicName}`,
        type: "REBALANCED_LEARNING",
        subject: p.subject,
        topicId: p.topicId,
        topicName: p.topicName,
        durationHours: p.durationHours,
        learningObjective: "Recover missed core study session from " + p.fromOriginalDate,
        studyInstructions: "Dedicated focus slot allocated without exceeding daily study capacity.",
        requiredReading: "Refer to primary syllabus source",
        connectedPYQs: "Relevant topic PYQs",
        expectedOutput: "Completed notes and understanding",
        completionStatus: "NOT_STARTED",
        notes: `Rebalanced from ${p.fromOriginalDate}`
      };

      targetDatePlan.sessions = [...(targetDatePlan.sessions || []), newSession];
      targetDatePlan.plannedHours = Number(((targetDatePlan.plannedHours || 0) + p.durationHours).toFixed(1));
      targetDatePlan.isCustomized = true;
      currentPlans[p.proposedNewDate] = targetDatePlan;
    });

    savePlans(currentPlans);
    setRebalanceResult(null); // Clear active prompt
  };

  return (
    <PlannerContext.Provider
      value={{
        dailyPlans,
        selectedDate,
        setSelectedDate,
        getPlanForDate,
        updateSessionStatus,
        updateSessionNotes,
        rebalanceResult,
        setRebalanceResult,
        checkTimetableRebalance,
        applyRebalanceProposals
      }}
    >
      {children}
    </PlannerContext.Provider>
  );
}

export function usePlanner() {
  const context = useContext(PlannerContext);
  if (!context) throw new Error("usePlanner must be used within PlannerProvider");
  return context;
}
