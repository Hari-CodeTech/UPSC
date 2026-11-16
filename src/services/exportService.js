/**
 * ExportService — CSV & Timetable export utilities
 */

export function exportTimetableToCSV(dailyPlans = {}) {
  const headers = [
    "Date",
    "Day",
    "Session Slot",
    "Session Name",
    "Subject",
    "Topic Name",
    "Planned Hours",
    "Completion Status",
    "Learning Objective",
    "Primary Reading Source"
  ];

  const rows = [headers];

  // Sort dates chronologically
  const sortedDates = Object.keys(dailyPlans).sort();

  sortedDates.forEach(dateStr => {
    const plan = dailyPlans[dateStr];
    if (plan && plan.sessions) {
      plan.sessions.forEach(sess => {
        rows.push([
          `"${dateStr}"`,
          `"${plan.dayOfWeek || ''}"`,
          `"${sess.slotIndex || ''}"`,
          `"${(sess.name || '').replace(/"/g, '""')}"`,
          `"${(sess.subject || '').replace(/"/g, '""')}"`,
          `"${(sess.topicName || '').replace(/"/g, '""')}"`,
          `"${sess.durationHours || 0}"`,
          `"${sess.completionStatus || 'NOT_STARTED'}"`,
          `"${(sess.learningObjective || '').replace(/"/g, '""')}"`,
          `"${(sess.requiredReading || '').replace(/"/g, '""')}"`
        ]);
      });
    }
  });

  const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `UPSC_Master_Timetable_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadJsonFile(dataObj, filename = "upsc_planner_backup.json") {
  const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataObj, null, 2));
  const link = document.createElement("a");
  link.setAttribute("href", jsonStr);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
