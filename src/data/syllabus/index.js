import { gs1Syllabus } from './gs1.js';
import { gs2Syllabus } from './gs2.js';
import { gs3Syllabus } from './gs3.js';
import { gs4Syllabus } from './gs4.js';
import { csatSyllabus } from './csat.js';
import { essaySyllabus } from './essay.js';
import { psir1Syllabus } from './psir1.js';
import { psir2Syllabus } from './psir2.js';

export function getDifficultyTier(hours) {
  if (hours <= 4) return "Easy";
  if (hours <= 6) return "Moderate";
  if (hours <= 10) return "Difficult";
  if (hours <= 16) return "Very Difficult";
  return "Extensive";
}

export function normalizeSubtopics(topic) {
  if (!topic || !Array.isArray(topic.subtopics)) return [];
  const totalTopicHours = topic.estimatedHours || 6;
  const count = topic.subtopics.length;

  return topic.subtopics.map((s, idx) => {
    if (typeof s === 'object' && s !== null && s.id && s.title) {
      return {
        id: s.id,
        title: s.title,
        estimatedHours: s.estimatedHours || Number((totalTopicHours / count).toFixed(1)),
        difficulty: s.difficulty || getDifficultyTier(s.estimatedHours || 3)
      };
    }
    const subTitle = typeof s === 'string' ? s : (s.title || `Subtopic ${idx + 1}`);
    const est = Number((totalTopicHours / count).toFixed(1));
    return {
      id: `${topic.id}-SUB-${String(idx + 1).padStart(2, '0')}`,
      title: subTitle,
      estimatedHours: est,
      difficulty: getDifficultyTier(est)
    };
  });
}

const rawAllSyllabusTopics = [
  ...gs1Syllabus,
  ...gs2Syllabus,
  ...gs3Syllabus,
  ...gs4Syllabus,
  ...csatSyllabus,
  ...essaySyllabus,
  ...psir1Syllabus,
  ...psir2Syllabus
];

export const allSyllabusTopics = rawAllSyllabusTopics.map(topic => {
  const normSubs = normalizeSubtopics(topic);
  const totalSubHours = normSubs.reduce((acc, sub) => acc + (sub.estimatedHours || 0), 0);
  const effectiveHours = topic.estimatedHours || totalSubHours || 6;
  const difficulty = topic.difficulty || getDifficultyTier(effectiveHours);
  return {
    ...topic,
    difficulty,
    estimatedHours: effectiveHours,
    subtopics: normSubs
  };
});

export const syllabusSubjects = [
  { id: "GS I", name: "General Studies Paper I", code: "GS1", count: gs1Syllabus.length },
  { id: "GS II", name: "General Studies Paper II", code: "GS2", count: gs2Syllabus.length },
  { id: "GS III", name: "General Studies Paper III", code: "GS3", count: gs3Syllabus.length },
  { id: "GS IV", name: "General Studies Paper IV", code: "GS4", count: gs4Syllabus.length },
  { id: "CSAT", name: "CSAT Paper II", code: "CSAT", count: csatSyllabus.length },
  { id: "Essay", name: "Essay Paper", code: "ESSAY", count: essaySyllabus.length },
  { id: "PSIR Optional", name: "PSIR Papers I & II", code: "PSIR", count: psir1Syllabus.length + psir2Syllabus.length }
];

export function getTopicById(id) {
  return allSyllabusTopics.find(t => t.id === id) || null;
}

export function getSyllabusBySubject(subject) {
  if (!subject || subject === "ALL") return allSyllabusTopics;
  return allSyllabusTopics.filter(t => t.subject === subject);
}

export function getParentTopicsBySubject(subject) {
  const topics = getSyllabusBySubject(subject);
  const parents = [...new Set(topics.map(t => t.parentTopic))];
  return parents.map(p => ({
    name: p,
    topics: topics.filter(t => t.parentTopic === p)
  }));
}

/**
 * Get the effective study duration for a topic, respecting student manual overrides
 */
export function getTopicEffectiveDuration(topic, topicProgressMap = {}, settings = {}) {
  if (!topic) return 6;
  const userOverride =
    topicProgressMap[topic.id]?.customHours ||
    settings.topicDurationOverrides?.[topic.id];
  return userOverride ? Number(userOverride) : (topic.estimatedHours || 6);
}

/**
 * Calculate subtopic-level progress: completed count, completed hours, remaining hours, and status
 */
export function calculateSubtopicProgress(topic, topicProgressMap = {}) {
  if (!topic) return { completedCount: 0, totalCount: 0, completedHours: 0, remainingHours: 0, allCompleted: false };
  const subs = topic.subtopics || [];
  const prog = topicProgressMap[topic.id] || {};
  const subProgMap = prog.subtopicProgress || {};

  let completedCount = 0;
  let completedHours = 0;

  subs.forEach(sub => {
    const sState = subProgMap[sub.id];
    if (sState?.status === 'COMPLETED') {
      completedCount++;
      completedHours += sub.estimatedHours || 0;
    } else if (sState?.completedHours) {
      completedHours += sState.completedHours;
    }
  });

  const totalHours = topic.estimatedHours || 6;
  const remainingHours = Math.max(0, totalHours - completedHours);
  const allCompleted = subs.length > 0 && completedCount === subs.length;

  return {
    completedCount,
    totalCount: subs.length,
    completedHours: Number(completedHours.toFixed(1)),
    remainingHours: Number(remainingHours.toFixed(1)),
    allCompleted
  };
}

/**
 * Parent topic completion validation rule:
 * The parent topic must not be marked completed until its required subtopics are completed!
 */
export function canTopicBeCompleted(topic, topicProgressMap = {}) {
  const { allCompleted, totalCount } = calculateSubtopicProgress(topic, topicProgressMap);
  if (totalCount === 0) return true;
  return allCompleted;
}
