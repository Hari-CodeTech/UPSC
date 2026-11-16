import { authenticPrelimsPYQs } from './prelimsPyqs';
import { authenticMainsPYQs } from './mainsPyqs';

export { authenticPrelimsPYQs, authenticMainsPYQs };

export const allPrelimsQuestions = authenticPrelimsPYQs;
export const allMainsQuestions = authenticMainsPYQs;

export function getPrelimsQuestions(filter = {}) {
  let list = authenticPrelimsPYQs;
  if (filter.subject && filter.subject !== "ALL") {
    list = list.filter(q => q.subject === filter.subject);
  }
  if (filter.year) {
    list = list.filter(q => q.year === Number(filter.year));
  }
  if (filter.syllabusTopicId) {
    list = list.filter(q => q.syllabusTopicId === filter.syllabusTopicId);
  }
  return list;
}

export function getMainsQuestions(filter = {}) {
  let list = authenticMainsPYQs;
  if (filter.subject && filter.subject !== "ALL") {
    list = list.filter(q => q.subject === filter.subject);
  }
  if (filter.year) {
    list = list.filter(q => q.year === Number(filter.year));
  }
  if (filter.syllabusTopicId) {
    list = list.filter(q => q.syllabusTopicId === filter.syllabusTopicId);
  }
  return list;
}
