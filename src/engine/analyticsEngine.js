/**
 * AnalyticsEngine — True data calculation from authentic LocalStorage state
 * Never outputs fake or hardcoded vanity metrics
 */

import { format, subDays, isSameDay, parseISO } from 'date-fns';
import { allSyllabusTopics, syllabusSubjects } from '../data/syllabus';

/**
 * Calculate overall preparation statistics based purely on real stored data
 */
export function computeGlobalAnalytics({
  dailyPlans = {},
  topicProgressMap = {},
  pyqAttempts = [],
  testRecords = [],
  revisionItems = [],
  errorLogs = []
}) {
  // 1. Topic Completion & Subject Breakdown
  const totalTopics = allSyllabusTopics.length;
  let completedTopicsCount = 0;
  let inProgressTopicsCount = 0;

  const subjectStats = {};
  syllabusSubjects.forEach(s => {
    subjectStats[s.id] = {
      subject: s.id,
      name: s.name,
      total: 0,
      completed: 0,
      inProgress: 0,
      percentage: 0
    };
  });

  allSyllabusTopics.forEach(topic => {
    const sId = topic.subject;
    if (subjectStats[sId]) {
      subjectStats[sId].total += 1;
    }

    const prog = topicProgressMap[topic.id];
    if (prog) {
      if (prog.status === 'COMPLETED' || prog.readLevel === 'Practised') {
        completedTopicsCount += 1;
        if (subjectStats[sId]) subjectStats[sId].completed += 1;
      } else if (prog.status === 'IN_PROGRESS' || prog.readLevel === 'Read' || prog.readLevel === 'Revised') {
        inProgressTopicsCount += 1;
        if (subjectStats[sId]) subjectStats[sId].inProgress += 1;
      }
    }
  });

  Object.values(subjectStats).forEach(s => {
    s.percentage = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
  });

  const overallCoveragePercentage = totalTopics > 0
    ? Math.round((completedTopicsCount / totalTopics) * 100)
    : 0;

  // 2. Planned vs Actual Study Hours (Last 7 Days)
  const last7DaysHours = [];
  let totalActualHoursWeek = 0;
  let totalPlannedHoursWeek = 0;

  for (let i = 6; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const dStr = format(d, 'yyyy-MM-dd');
    const dayLabel = format(d, 'EEE');
    const plan = dailyPlans[dStr];

    const planned = plan ? (plan.plannedHours || 8) : 8;
    const completed = plan ? (plan.completedHours || 0) : 0;

    totalPlannedHoursWeek += planned;
    totalActualHoursWeek += completed;

    last7DaysHours.push({
      date: dStr,
      day: dayLabel,
      planned,
      actual: completed
    });
  }

  // 3. Prelims MCQ Accuracy
  let prelimsAccuracy = 0;
  const prelimsAttempts = pyqAttempts.filter(a => a.stage === 'Prelims');
  if (prelimsAttempts.length > 0) {
    const correctCount = prelimsAttempts.filter(a => a.isCorrect).length;
    prelimsAccuracy = Math.round((correctCount / prelimsAttempts.length) * 100);
  }

  // 4. Error Category Breakdown
  const errorBreakdown = {
    "Conceptual": 0,
    "Guessing": 0,
    "Revision/Silly Mistake": 0,
    "Time Crunch": 0
  };

  errorLogs.forEach(log => {
    if (log.category && errorBreakdown[log.category] !== undefined) {
      errorBreakdown[log.category] += 1;
    }
  });

  // 5. Revision Queue Status
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const pendingRevisions = revisionItems.filter(item => item.status !== 'COMPLETED' && !item.isRejected);
  const overdueRevisions = pendingRevisions.filter(item => item.scheduledDate < todayStr);

  // 6. Weak Topic Identification
  const weakTopics = [];
  Object.entries(topicProgressMap).forEach(([id, prog]) => {
    if (prog.confidence && prog.confidence <= 2) {
      const topic = allSyllabusTopics.find(t => t.id === id);
      if (topic) {
        weakTopics.push({
          topicId: id,
          topicName: topic.topicName,
          subject: topic.subject,
          confidence: prog.confidence,
          difficulty: prog.difficulty || 'Moderate'
        });
      }
    }
  });

  // 7. Study Consistency Streak
  let streakDays = 0;
  for (let i = 0; i < 60; i++) {
    const d = subDays(new Date(), i);
    const dStr = format(d, 'yyyy-MM-dd');
    const plan = dailyPlans[dStr];
    if (plan && plan.completedHours && plan.completedHours > 0) {
      streakDays++;
    } else if (i > 0) {
      // If today has 0 hours so far, don't break streak yet; only break if previous day was 0
      break;
    }
  }

  return {
    totalTopics,
    completedTopicsCount,
    inProgressTopicsCount,
    overallCoveragePercentage,
    subjectStats: Object.values(subjectStats),
    last7DaysHours,
    totalActualHoursWeek,
    totalPlannedHoursWeek,
    weeklyCompletionRate: totalPlannedHoursWeek > 0 ? Math.round((totalActualHoursWeek / totalPlannedHoursWeek) * 100) : 0,
    prelimsAccuracy,
    totalPrelimsAttempted: prelimsAttempts.length,
    errorBreakdown: Object.entries(errorBreakdown).map(([name, count]) => ({ name, count })),
    pendingRevisionsCount: pendingRevisions.length,
    overdueRevisionsCount: overdueRevisions.length,
    weakTopics,
    streakDays,
    hasRealData: completedTopicsCount > 0 || prelimsAttempts.length > 0 || totalActualHoursWeek > 0
  };
}
