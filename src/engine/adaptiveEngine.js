/**
 * AdaptiveEngine — Intelligent timetable rebalancing without overloading days
 */

import { addDays, format, isSunday, parseISO } from 'date-fns';

/**
 * Detect missed or overdue uncompleted tasks up to a given reference date
 */
export function identifyMissedTasks(dailyPlans = {}, referenceDate = new Date()) {
  const refDateStr = format(referenceDate, 'yyyy-MM-dd');
  const missedTasks = [];

  Object.entries(dailyPlans).forEach(([dateStr, plan]) => {
    // Only check past dates prior to today
    if (dateStr < refDateStr && plan.sessions) {
      plan.sessions.forEach(session => {
        if (session.completionStatus === 'NOT_STARTED' || session.completionStatus === 'READ') {
          missedTasks.push({
            originalDate: dateStr,
            sessionId: session.id,
            slotIndex: session.slotIndex,
            subject: session.subject,
            topicId: session.topicId,
            topicName: session.topicName,
            durationHours: session.durationHours || 1.5,
            importance: session.importance || 'Medium',
            type: session.type
          });
        }
      });
    }
  });

  return missedTasks;
}

/**
 * Rebalance missed tasks across upcoming days respecting daily study capacity.
 * Protects Sunday buffer and limits workload.
 */
export function calculateRebalanceProposal(missedTasks = [], upcomingPlans = {}, settings = {}) {
  const dailyCapacity = settings.dailyStudyHours || 8;
  const sundayCapacity = settings.sundayBufferHours || 6;
  const maxAllowableExtensionHours = 1.0; // Max extra buffer allowed per day (e.g. 8h -> 9h max)

  const proposals = [];
  const warnings = [];
  const today = new Date();

  // Sort missed tasks: Crucial first, then High, then Medium
  const priorityWeight = { 'Crucial': 3, 'High': 2, 'Medium': 1, 'Low': 0 };
  const sortedTasks = [...missedTasks].sort((a, b) => {
    return (priorityWeight[b.importance] || 1) - (priorityWeight[a.importance] || 1);
  });

  // Track simulated daily load for next 14 days
  const simulatedLoad = {};
  for (let i = 1; i <= 14; i++) {
    const targetDate = addDays(today, i);
    const dateStr = format(targetDate, 'yyyy-MM-dd');
    const isSun = isSunday(targetDate);
    const existingPlan = upcomingPlans[dateStr];

    const currentLoad = existingPlan
      ? existingPlan.sessions.reduce((acc, s) => acc + (s.durationHours || 0), 0)
      : (isSun ? 3.0 : 6.0); // Baseline default planned load

    simulatedLoad[dateStr] = {
      date: dateStr,
      dateObj: targetDate,
      isSunday: isSun,
      maxCapacity: isSun ? sundayCapacity : dailyCapacity,
      currentLoad,
      addedHours: 0,
      assignedTasks: []
    };
  }

  // Allocate each missed task to the earliest day with spare capacity
  sortedTasks.forEach(task => {
    let allocated = false;

    for (let i = 1; i <= 14; i++) {
      const targetDate = addDays(today, i);
      const dateStr = format(targetDate, 'yyyy-MM-dd');
      const dayData = simulatedLoad[dateStr];

      // Protect Sunday: Never assign weekday core learning directly to Sunday buffer
      if (dayData.isSunday && task.type === 'LEARNING') {
        continue;
      }

      const availableHeadroom = (dayData.maxCapacity + maxAllowableExtensionHours) - (dayData.currentLoad + dayData.addedHours);

      if (availableHeadroom >= task.durationHours) {
        dayData.addedHours += task.durationHours;
        dayData.assignedTasks.push(task);
        proposals.push({
          taskId: task.sessionId || `${task.topicId}-${task.originalDate}`,
          topicId: task.topicId,
          topicName: task.topicName,
          subject: task.subject,
          durationHours: task.durationHours,
          importance: task.importance,
          fromOriginalDate: task.originalDate,
          proposedNewDate: dateStr,
          reason: `Rebalanced to ${dateStr} (${format(targetDate, 'EEEE')}) — preserves 8h study limit.`
        });
        allocated = true;
        break;
      }
    }

    if (!allocated) {
      warnings.push({
        topicId: task.topicId,
        topicName: task.topicName,
        importance: task.importance,
        message: `Plan infeasibility detected: No capacity in next 14 days without exceeding daily ${dailyCapacity}h limit. Recommend reducing lower-priority sessions or extending timeline.`
      });
    }
  });

  return {
    proposedChanges: proposals,
    feasibilityWarnings: warnings,
    totalMissedHours: missedTasks.reduce((acc, t) => acc + (t.durationHours || 0), 0),
    rebalancedCount: proposals.length,
    unrebalancedCount: warnings.length
  };
}
