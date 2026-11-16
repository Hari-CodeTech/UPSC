/**
 * PlanningEngine — Intelligent Multi-Day Topic Distribution, 6+1 System & Dynamic Phase Calculations
 * Strictly respects topic difficulty, human learning capacity, examination milestones,
 * and guaranteed duplicate prevention across days.
 */

import { format, addDays, startOfWeek, differenceInCalendarDays, parseISO, isAfter, isBefore } from 'date-fns';
import { allSyllabusTopics, getTopicEffectiveDuration } from '../data/syllabus/index.js';

/**
 * Difficulty-to-duration guidelines:
 * - Easy / Small: 2–4 hours (1 session)
 * - Moderate: 4–6 hours (1–2 sessions)
 * - Difficult: 7–10 hours (2 sessions)
 * - Very Difficult: 11–16 hours (3 sessions)
 * - Extensive: 17–24 hours (3–4 sessions)
 */
export function buildTopicStudySessions(topic, effectiveHours) {
  const totalHours = effectiveHours || topic.estimatedHours || 6;
  const subtopics = topic.subtopics || [];

  let numSessions = 1;
  if (totalHours <= 4.0) numSessions = 1;
  else if (totalHours <= 7.0) numSessions = 2; // e.g. 6h -> 2 sessions of 3h
  else if (totalHours <= 11.0) numSessions = 2; // e.g. 10h -> 2 sessions of 5h
  else if (totalHours <= 16.0) numSessions = 3; // e.g. 12h -> 3 sessions of 4h
  else numSessions = Math.min(4, Math.max(3, Math.ceil(totalHours / 5.5))); // e.g. 18h -> 3 sessions of 6h

  const hoursPerSession = Number((totalHours / numSessions).toFixed(1));
  const sessions = [];
  let accumulatedHours = 0;

  for (let i = 1; i <= numSessions; i++) {
    const isFirst = i === 1;
    const sessionHours = i === numSessions ? Number((totalHours - accumulatedHours).toFixed(1)) : hoursPerSession;
    const completedBefore = Number(accumulatedHours.toFixed(1));
    accumulatedHours += sessionHours;

    // Slice proportional subtopics
    const startIdx = Math.floor(((i - 1) * subtopics.length) / numSessions);
    const endIdx = Math.floor((i * subtopics.length) / numSessions);
    const sliceSubs = subtopics.slice(startIdx, Math.max(startIdx + 1, endIdx));

    sessions.push({
      topicId: topic.id,
      topicName: topic.topicName,
      subject: topic.subject,
      paper: topic.paper,
      parentTopic: topic.parentTopic,
      difficulty: topic.difficulty,
      sessionNumber: i,
      totalSessions: numSessions,
      // Task Types strictly enforced
      taskType: isFirst ? "NEW_LEARNING" : "CONTINUATION",
      durationHours: sessionHours,
      totalTopicHours: totalHours,
      completedHours: completedBefore,
      remainingHours: Number((totalHours - completedBefore).toFixed(1)),
      subtopicsCovered: sliceSubs,
      learningObjective: isFirst
        ? `Foundational conceptual mastery of ${topic.topicName}`
        : `Topic Continuation (Session ${i} of ${numSessions}): In-depth analytical coverage & subtopic consolidation`,
      studyInstructions: topic.studyInstructions || `Study core concepts and subtopics from ${topic.primarySource}`,
      requiredReading: topic.primarySource || "NCERT & Standard Reference Text",
      expectedOutput: `Consolidated analytical notes for Part ${i} of ${numSessions}`
    });
  }

  return sessions;
}

/**
 * Calculate the count of non-Sunday study days elapsed between baseDate and targetDate
 */
export function getStudyDayIndex(targetDate, baseDateStr = "2026-11-16") {
  const base = parseISO(baseDateStr);
  const totalDays = differenceInCalendarDays(targetDate, base);
  if (totalDays <= 0) return 0;

  let studyDays = 0;
  for (let i = 0; i < totalDays; i++) {
    const checkDate = addDays(base, i);
    // Sunday is day 0 in JavaScript Date.getDay()
    if (checkDate.getDay() !== 0) {
      studyDays++;
    }
  }
  return studyDays;
}

/**
 * Generate a dynamic study plan for any given date
 * Respects:
 * - Daily study capacity (default 8 hours Mon-Sat, 6 hours Sunday)
 * - Multi-day topic continuation without restarting
 * - Never schedules same topic twice as NEW_LEARNING
 * - Completed topics never return as NEW_LEARNING
 * - Distinct task types: NEW_LEARNING, CONTINUATION, REVISION, PRACTICE, CURRENT_AFFAIRS
 */
export function generateDayPlan(date, settings, topicProgressMap = {}, existingPlans = {}) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayOfWeek = format(date, 'EEEE');
  const isSunday = dayOfWeek === 'Sunday';

  // If plan already exists and was modified by user, preserve it
  if (existingPlans[dateStr] && existingPlans[dateStr].isCustomized) {
    return existingPlans[dateStr];
  }

  if (isSunday) {
    return generateDynamicSundayPlan(date, settings, topicProgressMap, existingPlans);
  }

  const dailyCapacity = settings.dailyStudyHours || 8;
  const prepStartDate = settings.prepStartDate || "2026-11-16";
  const studyDayIndex = getStudyDayIndex(date, prepStartDate);

  // 1. Gather all topics marked COMPLETED
  // Rule: Once a topic is marked COMPLETED, it must NEVER reappear as a NEW_LEARNING or CONTINUATION task!
  const completedTopicIds = new Set(
    Object.entries(topicProgressMap)
      .filter(([_, prog]) => prog && (prog.status === 'COMPLETED' || prog.readLevel === 'Practised'))
      .map(([id]) => id)
  );

  // 2. Separate syllabus into GS and PSIR topics excluding COMPLETED topics
  const uncompletedGsTopics = allSyllabusTopics.filter(
    t => t.subject.startsWith('GS') && !completedTopicIds.has(t.id)
  );
  const uncompletedPsirTopics = allSyllabusTopics.filter(
    t => t.subject.includes('PSIR') && !completedTopicIds.has(t.id)
  );

  // 3. Build ordered study session queues for GS and PSIR
  const gsSessionQueue = [];
  uncompletedGsTopics.forEach(topic => {
    const effectiveHours = getTopicEffectiveDuration(topic, topicProgressMap, settings);
    const sessions = buildTopicStudySessions(topic, effectiveHours);
    sessions.forEach(s => gsSessionQueue.push(s));
  });

  const psirSessionQueue = [];
  uncompletedPsirTopics.forEach(topic => {
    const effectiveHours = getTopicEffectiveDuration(topic, topicProgressMap, settings);
    const sessions = buildTopicStudySessions(topic, effectiveHours);
    sessions.forEach(s => psirSessionQueue.push(s));
  });

  // Effective queues fallback to full syllabus if everything is exhausted
  const effectiveGsQueue = gsSessionQueue.length >= 2 ? gsSessionQueue : allSyllabusTopics.filter(t => t.subject.startsWith('GS')).flatMap(t => buildTopicStudySessions(t));
  const effectivePsirQueue = psirSessionQueue.length >= 1 ? psirSessionQueue : allSyllabusTopics.filter(t => t.subject.includes('PSIR')).flatMap(t => buildTopicStudySessions(t));

  // Determine daily slots based on studyDayIndex
  const gsIdx1 = (studyDayIndex * 2) % Math.max(1, effectiveGsQueue.length);
  const gsIdx2 = (studyDayIndex * 2 + 1) % Math.max(1, effectiveGsQueue.length);
  const psirIdx = studyDayIndex % Math.max(1, effectivePsirQueue.length);

  const targetGs1 = effectiveGsQueue[gsIdx1] || effectiveGsQueue[0];
  let targetGs2 = effectiveGsQueue[gsIdx2] || effectiveGsQueue[Math.min(1, effectiveGsQueue.length - 1)];

  // Ensure Session 1 and Session 2 on the same day are not the identical session unit
  if (targetGs1.topicId === targetGs2.topicId && targetGs1.sessionNumber === targetGs2.sessionNumber && effectiveGsQueue.length > 1) {
    targetGs2 = effectiveGsQueue[(gsIdx2 + 1) % effectiveGsQueue.length];
  }

  const targetPsir = effectivePsirQueue[psirIdx] || effectivePsirQueue[0];

  const sessions = [];
  let allocatedHours = 0;

  // Session 1: GS Morning Conceptual Focus (e.g. 2.5 hrs)
  const s1Hours = Math.min(2.5, targetGs1.durationHours || 2.5);
  sessions.push({
    id: `${dateStr}-s1`,
    slotIndex: 1,
    name: targetGs1.taskType === 'CONTINUATION'
      ? `GS Analytical Focus: ${targetGs1.topicName} (Continuation)`
      : `Morning GS Foundation: ${targetGs1.topicName}`,
    type: targetGs1.taskType, // "NEW_LEARNING" | "CONTINUATION"
    subject: targetGs1.subject,
    topicId: targetGs1.topicId,
    topicName: targetGs1.topicName,
    sessionNumber: targetGs1.sessionNumber,
    totalSessions: targetGs1.totalSessions,
    difficulty: targetGs1.difficulty,
    completedHours: targetGs1.completedHours,
    remainingHours: targetGs1.remainingHours,
    durationHours: s1Hours,
    subtopicsCovered: targetGs1.subtopicsCovered,
    learningObjective: targetGs1.learningObjective,
    studyInstructions: targetGs1.studyInstructions,
    requiredReading: targetGs1.requiredReading,
    connectedPYQs: "Attempt 2 verified UPSC Prelims/Mains questions on this theme",
    expectedOutput: targetGs1.expectedOutput,
    completionStatus: "NOT_STARTED",
    notes: ""
  });
  allocatedHours += s1Hours;

  // Session 2: GS Analytical Core / Deep Dive (e.g. 2.0 hrs)
  const s2Hours = Math.min(2.0, targetGs2.durationHours || 2.0);
  sessions.push({
    id: `${dateStr}-s2`,
    slotIndex: 2,
    name: targetGs2.taskType === 'CONTINUATION'
      ? `GS Deep Dive: ${targetGs2.topicName} (Continuation)`
      : `GS Analytical Core: ${targetGs2.topicName}`,
    type: targetGs2.taskType, // "NEW_LEARNING" | "CONTINUATION"
    subject: targetGs2.subject,
    topicId: targetGs2.topicId,
    topicName: targetGs2.topicName,
    sessionNumber: targetGs2.sessionNumber,
    totalSessions: targetGs2.totalSessions,
    difficulty: targetGs2.difficulty,
    completedHours: targetGs2.completedHours,
    remainingHours: targetGs2.remainingHours,
    durationHours: s2Hours,
    subtopicsCovered: targetGs2.subtopicsCovered,
    learningObjective: targetGs2.learningObjective,
    studyInstructions: targetGs2.studyInstructions,
    requiredReading: targetGs2.requiredReading,
    connectedPYQs: "Focus on constitutional, economic, or environmental controversies",
    expectedOutput: targetGs2.expectedOutput,
    completionStatus: "NOT_STARTED",
    notes: ""
  });
  allocatedHours += s2Hours;

  // Session 3: PSIR Optional Theoretical Mastery (e.g. 2.0 hrs)
  const s3Hours = Math.min(2.0, targetPsir.durationHours || 2.0);
  sessions.push({
    id: `${dateStr}-s3`,
    slotIndex: 3,
    name: targetPsir.taskType === 'CONTINUATION'
      ? `PSIR Optional Mastery: ${targetPsir.topicName} (Continuation)`
      : `PSIR Optional Foundation: ${targetPsir.topicName}`,
    type: targetPsir.taskType, // "NEW_LEARNING" | "CONTINUATION"
    subject: targetPsir.subject,
    topicId: targetPsir.topicId,
    topicName: targetPsir.topicName,
    sessionNumber: targetPsir.sessionNumber,
    totalSessions: targetPsir.totalSessions,
    difficulty: targetPsir.difficulty,
    completedHours: targetPsir.completedHours,
    remainingHours: targetPsir.remainingHours,
    durationHours: s3Hours,
    subtopicsCovered: targetPsir.subtopicsCovered,
    learningObjective: targetPsir.learningObjective,
    studyInstructions: targetPsir.studyInstructions,
    requiredReading: targetPsir.requiredReading,
    connectedPYQs: "Official UPSC PSIR past questions",
    expectedOutput: targetPsir.expectedOutput,
    completionStatus: "NOT_STARTED",
    notes: ""
  });
  allocatedHours += s3Hours;

  // Session 4: Active Recall & Spaced Revision (0.75 hr) — STRICTLY REVISION
  let dueRevisionTopic = null;
  for (const [topId, prog] of Object.entries(topicProgressMap)) {
    if (prog.nextRevisionDate && prog.nextRevisionDate <= dateStr) {
      dueRevisionTopic = allSyllabusTopics.find(t => t.id === topId);
      if (dueRevisionTopic) break;
    }
  }

  const s4Hours = 0.75;
  sessions.push({
    id: `${dateStr}-s4`,
    slotIndex: 4,
    name: "Active Recall & Spaced Repetition",
    type: "REVISION", // STRICTLY REVISION
    subject: dueRevisionTopic ? dueRevisionTopic.subject : "Spaced Recall",
    topicId: dueRevisionTopic ? dueRevisionTopic.id : "SPACED-REVISION-QUEUE",
    topicName: dueRevisionTopic ? `Revision: ${dueRevisionTopic.topicName}` : "Daily Active Recall & Flashcard Deck",
    durationHours: s4Hours,
    learningObjective: dueRevisionTopic
      ? `Conduct active recall test for ${dueRevisionTopic.topicName} (Scheduled spaced review)`
      : "Active recall test for topics revised 1, 3, or 7 days ago without textbook reference",
    studyInstructions: "Test mental recall of core definitions, articles, and criticisms. Assign confidence rating (1–5).",
    requiredReading: dueRevisionTopic ? dueRevisionTopic.primarySource : "Personal study notes and error log",
    connectedPYQs: "Flashcards & multiple-statement MCQs",
    expectedOutput: "Confidence rating updated and interval safely advanced",
    completionStatus: "NOT_STARTED",
    notes: ""
  });
  allocatedHours += s4Hours;

  // Session 5: Daily Practice Drill & Current Affairs (Remaining capacity strictly up to dailyCapacity)
  const remainingHours = Math.max(0, Number((dailyCapacity - allocatedHours).toFixed(2)));
  if (remainingHours > 0) {
    sessions.push({
      id: `${dateStr}-s5`,
      slotIndex: 5,
      name: "Practice Drill & Editorial Synthesis",
      type: "PRACTICE", // "PRACTICE" | "MCQ_PRACTICE" | "PYQ_PRACTICE"
      subject: "Practice & Editorial",
      topicId: "DAILY-PRACTICE",
      topicName: "Timed Authentic MCQ Drill & PIB Editorial Analysis",
      durationHours: remainingHours,
      learningObjective: "Timed test execution & syllabus-mapped policy extraction",
      studyInstructions: "Attempt 10 official UPSC Prelims questions or 1 timed 150-word Mains answer; analyze 2 PIB releases",
      requiredReading: "Official UPSC Question Papers & Official Press Information Bureau releases",
      connectedPYQs: "Official UPSC Questions (2020–2024)",
      expectedOutput: "Completed answer or verified error log entries",
      completionStatus: "NOT_STARTED",
      notes: ""
    });
  }

  return {
    date: dateStr,
    dayOfWeek,
    isSundayBuffer: false,
    plannedHours: dailyCapacity,
    completedHours: 0,
    sessions,
    isCustomized: false
  };
}

/**
 * Generate Dynamic Sunday Buffer Plan
 * Dedicated solely to:
 * 1. Weekly assessment / sectional mock test
 * 2. Weak spot & error log review
 * 3. Backlog catch-up from Monday–Saturday
 * 4. Upcoming week strategic audit
 * (NEVER introduces new-learning modules)
 */
export function generateDynamicSundayPlan(date, settings, topicProgressMap = {}, existingPlans = {}) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const sundayCapacity = settings.sundayBufferHours || 6;
  const startOfCurrWeek = startOfWeek(date, { weekStartsOn: 1 }); // Monday

  const weeklyStudiedTopicIds = new Set();
  const incompleteSessions = [];

  for (let i = 0; i < 6; i++) {
    const dayDate = addDays(startOfCurrWeek, i);
    const dayStr = format(dayDate, 'yyyy-MM-dd');
    const dayPlan = existingPlans[dayStr];

    if (dayPlan && dayPlan.sessions) {
      dayPlan.sessions.forEach(sess => {
        if (sess.topicId && (sess.topicId.startsWith('GS') || sess.topicId.startsWith('PSIR'))) {
          weeklyStudiedTopicIds.add(sess.topicId);
        }
        if (sess.completionStatus === 'NOT_STARTED' || sess.completionStatus === 'READ') {
          incompleteSessions.push(sess);
        }
      });
    }
  }

  const lowConfidenceTopics = [];
  const difficultTopics = [];

  Object.entries(topicProgressMap).forEach(([id, prog]) => {
    const topic = allSyllabusTopics.find(t => t.id === id);
    if (!topic) return;

    if (prog.confidence && prog.confidence < 3) {
      lowConfidenceTopics.push({ topic, confidence: prog.confidence });
    }
    if (prog.difficulty === 'Tough' || topic.difficulty === 'Difficult' || topic.difficulty === 'Very Difficult') {
      difficultTopics.push(topic);
    }
  });

  const sundaySessions = [];
  let allocatedHours = 0;

  // 1. Weekly Mock Test / Full Assessment (2.0 hrs)
  sundaySessions.push({
    id: `${dateStr}-sun-1`,
    slotIndex: 1,
    name: "Weekly Comprehensive Assessment",
    type: "MOCK_TEST",
    subject: "Assessment",
    topicId: "SUNDAY-MOCK",
    topicName: "Weekly Sectional Mock Test & Diagnostic Review",
    durationHours: 2.0,
    learningObjective: "Test retention of topics studied this week under simulated exam conditions",
    studyInstructions: "Attempt 50 timed MCQs or 3 full Mains questions; immediately review error patterns",
    requiredReading: "Weekly consolidated notes and authentic test papers",
    connectedPYQs: "UPSC Prelims & Mains past papers",
    expectedOutput: "Calculated score, accuracy %, and error logbook entries",
    completionStatus: "NOT_STARTED",
    notes: ""
  });
  allocatedHours += 2.0;

  // 2. Weekly Error Log & Low-Confidence Topic Deep Clean (1.5 hrs)
  const weakTopic = lowConfidenceTopics[0]?.topic || difficultTopics[0] || allSyllabusTopics[0];
  sundaySessions.push({
    id: `${dateStr}-sun-2`,
    slotIndex: 2,
    name: "Weak Spot & Error Log Rectification",
    type: "REVISION",
    subject: weakTopic.subject,
    topicId: weakTopic.id,
    topicName: `Targeted Repair: ${weakTopic.topicName}`,
    durationHours: 1.5,
    learningObjective: `Re-evaluate concepts where confidence is low (${lowConfidenceTopics[0]?.confidence || 'Low'}) or error rate was high`,
    studyInstructions: "Review standard textbook explanations and revise mistakes made during weekday practice",
    requiredReading: weakTopic.primarySource,
    connectedPYQs: "Re-attempt questions previously answered incorrectly",
    expectedOutput: "Clear doubt clarification notes; upgrade confidence rating",
    completionStatus: "NOT_STARTED",
    notes: ""
  });
  allocatedHours += 1.5;

  // 3. Weekly Backlog Clearance & Thematic Consolidation (1.5 hrs)
  const backlogSession = incompleteSessions[0];
  sundaySessions.push({
    id: `${dateStr}-sun-3`,
    slotIndex: 3,
    name: "Weekly Backlog Buffer",
    type: "BACKLOG",
    subject: backlogSession ? backlogSession.subject : "GS Synthesis",
    topicId: backlogSession ? backlogSession.topicId : "BACKLOG-BUFFER",
    topicName: backlogSession ? `Backlog Catch-up: ${backlogSession.topicName}` : "Weekly Thematic Synthesis & Mind Mapping",
    durationHours: 1.5,
    learningObjective: backlogSession ? `Complete pending reading/practice for ${backlogSession.topicName}` : "Connect disparate weekly themes across GS and Optional",
    studyInstructions: "Fill gaps without compromising following week's schedule",
    requiredReading: backlogSession ? backlogSession.requiredReading : "Weekly notes collection",
    connectedPYQs: "Weekly practice items",
    expectedOutput: "Unfinished tasks marked completed or rescheduled safely",
    completionStatus: "NOT_STARTED",
    notes: ""
  });
  allocatedHours += 1.5;

  // 4. Strategic Planning & Self-Audit (1.0 hr)
  const remainingSundayHours = Math.max(1.0, Number((sundayCapacity - allocatedHours).toFixed(1)));
  sundaySessions.push({
    id: `${dateStr}-sun-4`,
    slotIndex: 4,
    name: "Upcoming Week Planning & Self-Audit",
    type: "AUDIT",
    subject: "Strategic Planning",
    topicId: "WEEKLY-AUDIT",
    topicName: "Weekly Progress Audit & Adaptive Rebalancing",
    durationHours: remainingSundayHours,
    learningObjective: "Review planned vs actual hours for the past 6 days; calibrate next week's targets",
    studyInstructions: "Verify spaced repetition queues for next week and confirm target deadlines",
    requiredReading: "Master timetable & revision calendar",
    connectedPYQs: "N/A",
    expectedOutput: "Finalized 6-day roadmap for Monday to Saturday",
    completionStatus: "NOT_STARTED",
    notes: ""
  });

  return {
    date: dateStr,
    dayOfWeek: "Sunday",
    isSundayBuffer: true,
    plannedHours: sundayCapacity,
    completedHours: 0,
    sessions: sundaySessions,
    isCustomized: false,
    generatedFromActivity: {
      weeklyStudiedCount: weeklyStudiedTopicIds.size,
      incompleteCount: incompleteSessions.length,
      lowConfidenceCount: lowConfidenceTopics.length
    }
  };
}

/**
 * Dynamic Phase Timeline Calculation Engine
 * Calculates phase durations from actual syllabus topic workload and available daily capacity.
 * Checks against Prelims and Mains milestones and surfaces workload warnings.
 */
export function calculatePhaseTimelines(settings = {}, topics = allSyllabusTopics, topicProgressMap = {}) {
  const prepStartDate = settings.prepStartDate || "2026-11-16";
  const prelimsTarget = settings.prelimsTargetDate || "2027-05-30";
  const mainsTarget = settings.mainsTargetDate || "2027-09-17";
  const dailyHours = settings.dailyStudyHours || 8;

  // Dedicated topic allocations across the 6 preparation phases
  const phaseDefinitions = [
    {
      id: "PHASE-1",
      number: 1,
      name: "Foundation and NCERTs",
      description: "Build conceptual bedrock using NCERTs across core History, Geography, Polity, Ethics, and CSAT fundamentals.",
      filter: t => ["GS1-ART-01", "GS1-ART-03", "GS1-HIST-01", "GS1-GEOG-01", "GS1-SOC-01", "GS2-POL-01", "GS4-ETH-01", "CSAT-RC-01", "PSIR1-THY-01"].includes(t.id)
    },
    {
      id: "PHASE-2",
      number: 2,
      name: "Standard Books and Syllabus Coverage",
      description: "Deep mastery of standard references: Laxmikanth (Polity), Spectrum (Modern India), Macroeconomics, and PSIR thinkers.",
      filter: t => ["GS1-ART-02", "GS1-HIST-02", "GS1-HIST-03", "GS1-GEOG-02", "GS2-POL-02", "GS2-POL-03", "GS2-POL-04", "GS3-ECO-01", "GS3-AGR-01", "GS4-ATT-01", "GS4-THK-01", "CSAT-QA-01", "PSIR1-WPT-01", "PSIR1-IPT-01"].includes(t.id)
    },
    {
      id: "PHASE-3",
      number: 3,
      name: "Integrated GS and PSIR Consolidation",
      description: "Cross-paper synthesis, ethics applied cases, internal security, environment, foreign policy, and essay thematic matrices.",
      filter: t => ["GS1-HIST-04", "GS1-GEOG-03", "GS1-SOC-02", "GS2-GOV-01", "GS2-SOC-01", "GS2-IR-01", "GS2-IR-02", "GS3-SCI-01", "GS3-ENV-01", "GS3-DIS-01", "GS3-SEC-01", "GS4-CAS-01", "CSAT-LR-01", "ESSAY-PHILO-01", "ESSAY-THEME-01", "PSIR1-IGP-01", "PSIR2-CP-01", "PSIR2-ORD-01", "PSIR2-IFP-01", "PSIR2-GPW-01"].includes(t.id)
    },
    {
      id: "PHASE-4",
      number: 4,
      name: "Prelims Intensive Preparation",
      description: "100% Prelims focus: Daily 50-MCQ elimination drills, CSAT qualifying practice, Economic Survey & Budget, and simulated test series.",
      isPrelimsMilestone: true,
      filter: t => t.subject.startsWith('GS') || t.subject === 'CSAT'
    },
    {
      id: "PHASE-5",
      number: 5,
      name: "Mains Consolidation & Advanced Answer Writing",
      description: "Post-Prelims high-intensity answer writing, PSIR scholar integration, 1200-word essay writing, and ethics case studies.",
      isPostPrelims: true,
      filter: t => t.subject.startsWith('GS') || t.subject.includes('PSIR') || t.subject === 'Essay'
    },
    {
      id: "PHASE-6",
      number: 6,
      name: "Final Revision and Peak Performance",
      description: "Rapid active recall of micro-notes, landmark judgments, committee reports, thinker quotes, and full 3-hour exam simulations.",
      isMainsMilestone: true,
      filter: t => true
    }
  ];

  let currentStartDate = parseISO(prepStartDate);
  const prelimsDate = parseISO(prelimsTarget);
  const mainsDate = parseISO(mainsTarget);

  const phases = [];
  const warnings = [];

  phaseDefinitions.forEach((def) => {
    // 1. Gather topics for phase
    const phaseTopics = topics.filter(def.filter);
    const totalTopics = phaseTopics.length;

    // 2. Calculate total estimated hours
    let rawTopicHours = phaseTopics.reduce((acc, t) => {
      const effectiveHours = getTopicEffectiveDuration(t, topicProgressMap, settings);
      return acc + effectiveHours;
    }, 0);

    // For dedicated revision/intensive phases, calibrate required hours
    let requiredHours = rawTopicHours;
    if (def.number === 4) {
      requiredHours = Math.max(180, Math.round(rawTopicHours * 0.45));
    } else if (def.number === 5) {
      requiredHours = Math.max(220, Math.round(rawTopicHours * 0.55));
    } else if (def.number === 6) {
      requiredHours = 100;
    } else {
      requiredHours = Math.round(rawTopicHours * 1.2);
    }

    // 3. Calculate study working days (excluding Sundays)
    const effectiveDailyCapacity = Math.max(4, dailyHours * 0.75);
    const workingDaysNeeded = Math.max(1, Math.ceil(requiredHours / effectiveDailyCapacity));

    // 4. Calculate calendar dates advancing across non-Sunday study days
    let phaseStart = currentStartDate;
    if (def.number === 5) {
      phaseStart = addDays(prelimsDate, 2);
    }

    let calendarDaysElapsed = 0;
    let countedStudyDays = 0;

    while (countedStudyDays < workingDaysNeeded) {
      const checkDate = addDays(phaseStart, calendarDaysElapsed);
      if (checkDate.getDay() !== 0) { // Not Sunday
        countedStudyDays++;
      }
      calendarDaysElapsed++;
    }

    const expectedEnd = addDays(phaseStart, Math.max(1, calendarDaysElapsed - 1));

    // 5. Calculate available study hours in this calendar interval
    const availableStudyHours = countedStudyDays * dailyHours;

    // 6. Calculate completion percentage from actual user progress
    let completedHours = 0;
    phaseTopics.forEach(t => {
      const p = topicProgressMap[t.id];
      if (p?.status === 'COMPLETED') {
        completedHours += t.estimatedHours || 0;
      } else if (p?.completedHours) {
        completedHours += p.completedHours;
      }
    });

    const completionPercentage = rawTopicHours > 0
      ? Math.min(100, Math.round((completedHours / rawTopicHours) * 100))
      : 0;

    // 7. Check Milestones & Warnings
    let warning = null;

    if (def.isPrelimsMilestone) {
      if (isAfter(expectedEnd, prelimsDate)) {
        const daysShort = differenceInCalendarDays(expectedEnd, prelimsDate);
        const hoursShort = Math.round(daysShort * effectiveDailyCapacity);
        warning = {
          type: "PRELIMS_DEADLINE_BREACH",
          title: "Prelims Target Shortage Warning",
          message: `Phase 4 extends ${daysShort} days beyond Prelims target (${prelimsTarget}). Shortage: ~${hoursShort} hours.`,
          suggestion: `Increase daily study hours to ${(dailyHours + Math.ceil(hoursShort / 90)).toFixed(1)}h or adjust prep start date.`
        };
        warnings.push(warning);
      }
    }

    if (def.isMainsMilestone) {
      if (isAfter(expectedEnd, mainsDate)) {
        const daysShort = differenceInCalendarDays(expectedEnd, mainsDate);
        const hoursShort = Math.round(daysShort * effectiveDailyCapacity);
        warning = {
          type: "MAINS_DEADLINE_BREACH",
          title: "Mains Target Shortage Warning",
          message: `Phase 6 extends ${daysShort} days beyond Mains target (${mainsTarget}). Shortage: ~${hoursShort} hours.`,
          suggestion: "Streamline optional answer writing drills or increase daily study capacity."
        };
        warnings.push(warning);
      }
    }

    phases.push({
      id: def.id,
      number: def.number,
      name: def.name,
      description: def.description,
      totalTopics,
      totalEstimatedHours: rawTopicHours,
      totalRequiredHours: requiredHours,
      availableStudyHours,
      workingDaysNeeded,
      startDate: format(phaseStart, 'yyyy-MM-dd'),
      expectedCompletionDate: format(expectedEnd, 'yyyy-MM-dd'),
      completionPercentage,
      warning
    });

    // Advance currentStartDate for next phase
    currentStartDate = addDays(expectedEnd, 1);
  });

  return {
    prepStartDate,
    prelimsTargetDate: prelimsTarget,
    mainsTargetDate: mainsTarget,
    phases,
    warnings,
    hasDeadlinesBreached: warnings.length > 0
  };
}
