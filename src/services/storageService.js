/**
 * StorageService — Versioned, resilient browser-based persistence layer
 * Schema version: v1
 */

const STORAGE_PREFIX = "upsc_planner_v1_";

export const STORAGE_KEYS = {
  USER_PROFILE: `${STORAGE_PREFIX}user_profile`,
  SETTINGS: `${STORAGE_PREFIX}settings`,
  TOPIC_PROGRESS: `${STORAGE_PREFIX}topic_progress`,
  DAILY_PLANS: `${STORAGE_PREFIX}daily_plans`,
  STUDY_SESSIONS: `${STORAGE_PREFIX}study_sessions`,
  REVISION_ITEMS: `${STORAGE_PREFIX}revision_items`,
  REVISION_HISTORY: `${STORAGE_PREFIX}revision_history`,
  TEST_RECORDS: `${STORAGE_PREFIX}test_records`,
  PYQ_ATTEMPTS: `${STORAGE_PREFIX}pyq_attempts`,
  STUDY_NOTES: `${STORAGE_PREFIX}study_notes`,
  CURRENT_AFFAIRS: `${STORAGE_PREFIX}current_affairs`,
  CACHED_ARTICLES: `${STORAGE_PREFIX}cached_articles`,
  ERROR_LOGS: `${STORAGE_PREFIX}error_logs`,
  SCHEDULE_CHANGES: `${STORAGE_PREFIX}schedule_changes`,
  MAINS_DRAFTS: `${STORAGE_PREFIX}mains_drafts`
};

export const DEFAULT_SETTINGS = {
  prelimsTargetDate: "2027-05-30",
  mainsTargetDate: "2027-09-17",
  prepStartDate: "2026-11-16",
  dailyStudyHours: 8,
  weeklyStudyDays: 6, // Mon-Sat
  sundayBufferHours: 6, // Dedicated Sunday capacity
  subjectPriorities: {
    "GS I": 3,
    "GS II": 5,
    "GS III": 4,
    "GS IV": 4,
    "CSAT": 3,
    "Essay": 3,
    "PSIR Optional": 5
  },
  topicDurationOverrides: {}, // Custom student hours per topic: { [topicId]: number }
  csatProficiency: "Moderate", // "Needs Work" | "Moderate" | "Strong"
  psirPreparationLevel: "Foundation", // "Foundation" | "Intermediate" | "Advanced"
  preparationPhase: "Phase 1: Foundation and NCERTs",
  revisionPreference: "Hybrid_OptionC",
  activeRecallIntervals: [1, 3, 7, 14, 30] // Spaced repetition in days
};

export const DEFAULT_USER_PROFILE = {
  name: "UPSC Aspirant",
  targetYear: 2027,
  optionalSubject: "PSIR",
  medium: "English",
  createdAt: "2026-11-01T00:00:00.000Z"
};

class StorageService {
  /**
   * Get an item from localStorage with fallback and JSON parsing error recovery
   */
  getItem(key, fallback = null) {
    try {
      const data = localStorage.getItem(key);
      if (data === null || data === undefined) return fallback;
      return JSON.parse(data);
    } catch (err) {
      console.error(`[StorageService] Failed to parse key ${key}:`, err);
      return fallback;
    }
  }

  /**
   * Set an item in localStorage
   */
  setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error(`[StorageService] Failed to set key ${key}:`, err);
      return false;
    }
  }

  /**
   * Remove an item from localStorage
   */
  removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (err) {
      console.error(`[StorageService] Failed to remove key ${key}:`, err);
      return false;
    }
  }

  /**
   * Get application settings
   */
  getSettings() {
    return this.getItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  /**
   * Save application settings
   */
  saveSettings(settings) {
    return this.setItem(STORAGE_KEYS.SETTINGS, { ...DEFAULT_SETTINGS, ...settings });
  }

  /**
   * Get user profile
   */
  getUserProfile() {
    return this.getItem(STORAGE_KEYS.USER_PROFILE, DEFAULT_USER_PROFILE);
  }

  /**
   * Save user profile
   */
  saveUserProfile(profile) {
    return this.setItem(STORAGE_KEYS.USER_PROFILE, { ...DEFAULT_USER_PROFILE, ...profile });
  }

  /**
   * Topic Progress map: { [topicId]: { status, confidence, difficulty, lastStudiedDate, lastRevisedDate, revisionCount, readLevel } }
   */
  getTopicProgress() {
    return this.getItem(STORAGE_KEYS.TOPIC_PROGRESS, {});
  }

  saveTopicProgress(progressMap) {
    return this.setItem(STORAGE_KEYS.TOPIC_PROGRESS, progressMap);
  }

  updateSingleTopicProgress(topicId, updates) {
    const all = this.getTopicProgress();
    all[topicId] = {
      ...(all[topicId] || {
        status: "NOT_STARTED", // "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "REVISION_REQUIRED"
        confidence: 3, // 1 to 5
        difficulty: "Moderate", // "Easy" | "Moderate" | "Tough"
        lastStudiedDate: null,
        lastRevisedDate: null,
        nextRevisionDate: null,
        revisionCount: 0,
        readLevel: "Unread", // "Unread" | "Read" | "Revised" | "Practised"
        history: []
      }),
      ...updates
    };
    this.saveTopicProgress(all);
    return all[topicId];
  }

  /**
   * Daily Study Plans: { [dateString YYYY-MM-DD]: { date, sessions: [], completedHours, plannedHours, isSundayBuffer } }
   */
  getDailyPlans() {
    return this.getItem(STORAGE_KEYS.DAILY_PLANS, {});
  }

  saveDailyPlans(plans) {
    return this.setItem(STORAGE_KEYS.DAILY_PLANS, plans);
  }

  getPlanForDate(dateStr) {
    const plans = this.getDailyPlans();
    return plans[dateStr] || null;
  }

  savePlanForDate(dateStr, planData) {
    const plans = this.getDailyPlans();
    plans[dateStr] = planData;
    this.saveDailyPlans(plans);
    return plans[dateStr];
  }

  /**
   * Study Notes
   */
  getNotes() {
    return this.getItem(STORAGE_KEYS.STUDY_NOTES, []);
  }

  saveNotes(notes) {
    return this.setItem(STORAGE_KEYS.STUDY_NOTES, notes);
  }

  /**
   * Revision items (Spaced Repetition Queue)
   */
  getRevisionItems() {
    return this.getItem(STORAGE_KEYS.REVISION_ITEMS, []);
  }

  saveRevisionItems(items) {
    return this.setItem(STORAGE_KEYS.REVISION_ITEMS, items);
  }

  /**
   * Mock test records
   */
  getMockTestRecords() {
    return this.getItem(STORAGE_KEYS.TEST_RECORDS, []);
  }

  saveMockTestRecords(records) {
    return this.setItem(STORAGE_KEYS.TEST_RECORDS, records);
  }

  /**
   * Prelims & Mains PYQ attempts
   */
  getPYQAttempts() {
    return this.getItem(STORAGE_KEYS.PYQ_ATTEMPTS, []);
  }

  savePYQAttempts(attempts) {
    return this.setItem(STORAGE_KEYS.PYQ_ATTEMPTS, attempts);
  }

  /**
   * Error logs: { id, date, questionId, topicId, errorCategory, notes }
   */
  getErrorLogs() {
    return this.getItem(STORAGE_KEYS.ERROR_LOGS, []);
  }

  saveErrorLogs(logs) {
    return this.setItem(STORAGE_KEYS.ERROR_LOGS, logs);
  }

  /**
   * Current Affairs local state (bookmarks, read status, notes)
   */
  getCurrentAffairsState() {
    return this.getItem(STORAGE_KEYS.CURRENT_AFFAIRS, {});
  }

  saveCurrentAffairsState(state) {
    return this.setItem(STORAGE_KEYS.CURRENT_AFFAIRS, state);
  }

  /**
   * Cached authentic Current Affairs feed
   */
  getCachedArticles() {
    return this.getItem(STORAGE_KEYS.CACHED_ARTICLES, null);
  }

  saveCachedArticles(articles, lastUpdated = new Date().toISOString()) {
    return this.setItem(STORAGE_KEYS.CACHED_ARTICLES, {
      articles,
      lastUpdated
    });
  }

  /**
   * Active Mains answer writing drafts: { [questionId]: { draftText, rubric, timerSeconds, noteId, updatedAt } }
   */
  getMainsDrafts() {
    return this.getItem(STORAGE_KEYS.MAINS_DRAFTS, {});
  }

  saveMainsDraft(questionId, draftData) {
    const all = this.getMainsDrafts();
    all[questionId] = {
      ...(all[questionId] || {}),
      ...draftData,
      updatedAt: new Date().toISOString()
    };
    return this.setItem(STORAGE_KEYS.MAINS_DRAFTS, all);
  }

  clearMainsDraft(questionId) {
    const all = this.getMainsDrafts();
    delete all[questionId];
    return this.setItem(STORAGE_KEYS.MAINS_DRAFTS, all);
  }

  /**
   * Export all application data as a structured JSON object
   */
  exportAllData() {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      userProfile: this.getUserProfile(),
      settings: this.getSettings(),
      topicProgress: this.getTopicProgress(),
      dailyPlans: this.getDailyPlans(),
      revisionItems: this.getRevisionItems(),
      mockTests: this.getMockTestRecords(),
      pyqAttempts: this.getPYQAttempts(),
      studyNotes: this.getNotes(),
      currentAffairs: this.getCurrentAffairsState(),
      cachedArticles: this.getCachedArticles(),
      errorLogs: this.getErrorLogs(),
      mainsDrafts: this.getMainsDrafts(),
      scheduleChanges: this.getItem(STORAGE_KEYS.SCHEDULE_CHANGES, [])
    };
    return backup;
  }

  /**
   * Validate and import JSON data
   */
  importData(backupObject) {
    if (!backupObject || typeof backupObject !== "object") {
      throw new Error("Invalid import payload: Must be a valid JSON object.");
    }
    if (!backupObject.version) {
      throw new Error("Missing schema version in imported file.");
    }

    if (backupObject.userProfile) this.saveUserProfile(backupObject.userProfile);
    if (backupObject.settings) this.saveSettings(backupObject.settings);
    if (backupObject.topicProgress) this.saveTopicProgress(backupObject.topicProgress);
    if (backupObject.dailyPlans) this.saveDailyPlans(backupObject.dailyPlans);
    if (backupObject.revisionItems) this.saveRevisionItems(backupObject.revisionItems);
    if (backupObject.mockTests) this.saveMockTestRecords(backupObject.mockTests);
    if (backupObject.pyqAttempts) this.savePYQAttempts(backupObject.pyqAttempts);
    if (backupObject.studyNotes) this.saveNotes(backupObject.studyNotes);
    if (backupObject.currentAffairs) this.saveCurrentAffairsState(backupObject.currentAffairs);
    if (backupObject.cachedArticles) this.setItem(STORAGE_KEYS.CACHED_ARTICLES, backupObject.cachedArticles);
    if (backupObject.errorLogs) this.saveErrorLogs(backupObject.errorLogs);
    if (backupObject.mainsDrafts) this.setItem(STORAGE_KEYS.MAINS_DRAFTS, backupObject.mainsDrafts);
    if (backupObject.scheduleChanges) this.setItem(STORAGE_KEYS.SCHEDULE_CHANGES, backupObject.scheduleChanges);

    return true;
  }

  /**
   * Clear all application records
   */
  resetAllData() {
    Object.values(STORAGE_KEYS).forEach(k => {
      localStorage.removeItem(k);
    });
    return true;
  }
}

export const storageService = new StorageService();
