import React, { createContext, useContext, useState, useEffect } from 'react';
import { storageService, DEFAULT_SETTINGS, DEFAULT_USER_PROFILE } from '../services/storageService';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [userProfile, setUserProfileState] = useState(() => storageService.getUserProfile());
  const [settings, setSettingsState] = useState(() => storageService.getSettings());
  const [topicProgressMap, setTopicProgressState] = useState(() => storageService.getTopicProgress());
  const [notes, setNotesState] = useState(() => storageService.getNotes());
  const [mockTests, setMockTestsState] = useState(() => storageService.getMockTestRecords());
  const [pyqAttempts, setPyqAttemptsState] = useState(() => storageService.getPYQAttempts());
  const [errorLogs, setErrorLogsState] = useState(() => storageService.getErrorLogs());
  const [currentAffairsState, setCurrentAffairsState] = useState(() => storageService.getCurrentAffairsState());
  const [notifications, setNotifications] = useState([]);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);

  // Sync helpers
  const setUserProfile = (profile) => {
    setUserProfileState(profile);
    storageService.saveUserProfile(profile);
  };

  const updateSettings = (newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettingsState(updated);
    storageService.saveSettings(updated);
  };

  const updateTopicProgress = (topicId, updates) => {
    const updatedMap = {
      ...topicProgressMap,
      [topicId]: {
        ...(topicProgressMap[topicId] || {
          status: "NOT_STARTED",
          confidence: 3,
          difficulty: "Moderate",
          lastStudiedDate: null,
          lastRevisedDate: null,
          revisionCount: 0,
          readLevel: "Unread"
        }),
        ...updates
      }
    };
    setTopicProgressState(updatedMap);
    storageService.saveTopicProgress(updatedMap);
    return updatedMap[topicId];
  };

  const addNote = (note) => {
    const newNote = {
      id: `NOTE-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...note
    };
    const updated = [newNote, ...notes];
    setNotesState(updated);
    storageService.saveNotes(updated);
    return newNote;
  };

  const updateNote = (id, updates) => {
    const updated = notes.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n);
    setNotesState(updated);
    storageService.saveNotes(updated);
  };

  const deleteNote = (id) => {
    const updated = notes.filter(n => n.id !== id);
    setNotesState(updated);
    storageService.saveNotes(updated);
  };

  const addMockTest = (testRecord) => {
    const newRecord = {
      id: `TEST-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...testRecord
    };
    const updated = [newRecord, ...mockTests];
    setMockTestsState(updated);
    storageService.saveMockTestRecords(updated);
    return newRecord;
  };

  const recordPyqAttempt = (attempt) => {
    const record = {
      id: `ATTEMPT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...attempt
    };
    const updatedAttempts = [record, ...pyqAttempts];
    setPyqAttemptsState(updatedAttempts);
    storageService.savePYQAttempts(updatedAttempts);

    // If incorrect, automatically add to error logs
    if (!attempt.isCorrect && attempt.errorCategory) {
      const errLog = {
        id: `ERR-${Date.now()}`,
        timestamp: new Date().toISOString(),
        questionId: attempt.questionId,
        topicId: attempt.syllabusTopicId,
        subject: attempt.subject,
        category: attempt.errorCategory, // "Conceptual" | "Guessing" | "Revision/Silly Mistake" | "Time Crunch"
        notes: attempt.userNotes || ""
      };
      const updatedLogs = [errLog, ...errorLogs];
      setErrorLogsState(updatedLogs);
      storageService.saveErrorLogs(updatedLogs);
    }
  };

  const updateCurrentAffairsStatus = (id, updates) => {
    const updated = {
      ...currentAffairsState,
      [id]: {
        ...(currentAffairsState[id] || {}),
        ...updates
      }
    };
    setCurrentAffairsState(updated);
    storageService.saveCurrentAffairsState(updated);
  };

  const resetAllData = () => {
    storageService.resetAllData();
    setUserProfileState(DEFAULT_USER_PROFILE);
    setSettingsState(DEFAULT_SETTINGS);
    setTopicProgressState({});
    setNotesState([]);
    setMockTestsState([]);
    setPyqAttemptsState([]);
    setErrorLogsState([]);
    setCurrentAffairsState({});
    setNotifications([{ id: Date.now(), title: "System Reset", message: "All application data has been safely cleared.", type: "info" }]);
  };

  const importAllData = (backupObj) => {
    storageService.importData(backupObj);
    setUserProfileState(storageService.getUserProfile());
    setSettingsState(storageService.getSettings());
    setTopicProgressState(storageService.getTopicProgress());
    setNotesState(storageService.getNotes());
    setMockTestsState(storageService.getMockTestRecords());
    setPyqAttemptsState(storageService.getPYQAttempts());
    setErrorLogsState(storageService.getErrorLogs());
    setCurrentAffairsState(storageService.getCurrentAffairsState());
    setNotifications([{ id: Date.now(), title: "Data Restored", message: "Backup successfully loaded and verified.", type: "success" }]);
  };

  return (
    <AppContext.Provider
      value={{
        userProfile,
        setUserProfile,
        settings,
        updateSettings,
        topicProgressMap,
        updateTopicProgress,
        notes,
        addNote,
        updateNote,
        deleteNote,
        mockTests,
        addMockTest,
        pyqAttempts,
        recordPyqAttempt,
        errorLogs,
        currentAffairsState,
        updateCurrentAffairsStatus,
        notifications,
        setNotifications,
        globalSearchOpen,
        setGlobalSearchOpen,
        resetAllData,
        importAllData
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
