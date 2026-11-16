/**
 * RevisionEngine — Spaced Repetition (1d -> 3d -> 7d -> 14d -> 30d)
 * Hybrid System (Option C): Algorithmic recommendation + Student sovereignty
 */

import { addDays, format, isBefore, isToday, parseISO } from 'date-fns';
import { allSyllabusTopics } from '../data/syllabus';

export const DEFAULT_SPACED_INTERVALS = [1, 3, 7, 14, 30]; // in days

/**
 * Calculate the next recommended revision interval based on:
 * - Current interval step
 * - User confidence rating (1 - 5)
 * - Topic difficulty ('Easy' | 'Moderate' | 'Tough')
 */
export function calculateNextInterval(currentStep = 0, confidence = 3, difficulty = 'Moderate') {
  // If recall failed or was very weak (confidence 1 or 2), reset to 1-day interval
  if (confidence <= 2) {
    return {
      nextStep: 0,
      intervalDays: 1,
      reason: "Low confidence rating (1-2/5). Concept reset for immediate active recall."
    };
  }

  // Next standard step
  let nextStep = Math.min(currentStep + 1, DEFAULT_SPACED_INTERVALS.length - 1);
  let baseDays = DEFAULT_SPACED_INTERVALS[nextStep];

  // Difficulty adjustment
  if (difficulty === 'Tough' && confidence === 3) {
    // If tough and only moderate confidence, don't jump too far
    baseDays = Math.max(1, Math.round(baseDays * 0.7));
  } else if (difficulty === 'Easy' && confidence === 5) {
    // Mastered easy topic: can extend by 1.25x
    baseDays = Math.round(baseDays * 1.25);
  }

  return {
    nextStep,
    intervalDays: Math.max(1, baseDays),
    reason: `Interval adjusted for confidence ${confidence}/5 and difficulty '${difficulty}'.`
  };
}

/**
 * Generate active revision recommendations from syllabus progress and revision items
 */
export function generateRevisionRecommendations(topicProgressMap = {}, revisionItems = []) {
  const recommendations = [];
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const existingTopicIdsInQueue = new Set(revisionItems.map(item => item.topicId));

  // 1. Process existing active revision items that are due
  revisionItems.forEach(item => {
    if (item.status === 'COMPLETED' || item.isRejected) return;

    const dueDate = item.scheduledDate;
    const isDue = dueDate <= todayStr;
    const isOverdue = dueDate < todayStr;

    recommendations.push({
      id: item.id,
      topicId: item.topicId,
      topicName: item.topicName,
      subject: item.subject,
      dueDate,
      isDue,
      isOverdue,
      priority: item.priority || (isOverdue ? 'CRITICAL' : 'HIGH'),
      estimatedDurationMinutes: item.estimatedDurationMinutes || 30,
      confidence: item.confidence || 3,
      difficulty: item.difficulty || 'Moderate',
      revisionStep: item.revisionStep || 1,
      reason: item.reason || (isOverdue ? `Overdue by ${Math.abs(Math.round((new Date(todayStr) - new Date(dueDate)) / (1000 * 3600 * 24)))} days` : "Scheduled spaced recall"),
      isUserOverridden: !!item.isUserOverridden
    });
  });

  // 2. Identify topics completed in learning that need initial spaced revision schedule
  Object.entries(topicProgressMap).forEach(([topicId, prog]) => {
    if (prog.status === 'COMPLETED' || prog.readLevel === 'Read' || prog.readLevel === 'Revised') {
      if (!existingTopicIdsInQueue.has(topicId)) {
        const topic = allSyllabusTopics.find(t => t.id === topicId);
        if (!topic) return;

        const nextDate = prog.nextRevisionDate || format(addDays(new Date(), 1), 'yyyy-MM-dd');
        recommendations.push({
          id: `rev-${topicId}-${Date.now()}`,
          topicId: topic.id,
          topicName: topic.topicName,
          subject: topic.subject,
          dueDate: nextDate,
          isDue: nextDate <= todayStr,
          isOverdue: nextDate < todayStr,
          priority: prog.difficulty === 'Tough' ? 'HIGH' : 'MEDIUM',
          estimatedDurationMinutes: 30,
          confidence: prog.confidence || 3,
          difficulty: prog.difficulty || 'Moderate',
          revisionStep: 0,
          reason: "First spaced recall after learning completion (Day 1)",
          isUserOverridden: false
        });
      }
    }
  });

  // Sort: Overdue first, then High priority, then by Due Date
  return recommendations.sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    return a.dueDate.localeCompare(b.dueDate);
  });
}

/**
 * Complete a revision session for a topic:
 * Records history and calculates the next date
 */
export function recordRevisionCompletion(currentItem, confidence, durationMinutes = 30) {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const { nextStep, intervalDays, reason } = calculateNextInterval(
    currentItem.revisionStep || 0,
    confidence,
    currentItem.difficulty || 'Moderate'
  );

  const nextRevisionDate = format(addDays(new Date(), intervalDays), 'yyyy-MM-dd');

  const historyEntry = {
    revisedAt: todayStr,
    confidence,
    durationMinutes,
    revisionStep: currentItem.revisionStep || 0,
    intervalDays
  };

  const updatedItem = {
    ...currentItem,
    lastRevisedDate: todayStr,
    nextRevisionDate,
    revisionStep: nextStep,
    confidence,
    status: 'ACTIVE',
    reason,
    history: [...(currentItem.history || []), historyEntry]
  };

  return {
    updatedItem,
    historyEntry,
    nextRevisionDate
  };
}
