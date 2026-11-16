import React, { createContext, useContext, useState, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { generateRevisionRecommendations, recordRevisionCompletion } from '../engine/revisionEngine';
import { useApp } from './AppContext';

const RevisionContext = createContext();

export function RevisionProvider({ children }) {
  const { topicProgressMap, updateTopicProgress } = useApp();
  const [revisionItems, setRevisionItemsState] = useState(() => storageService.getRevisionItems());

  const saveItems = (items) => {
    setRevisionItemsState(items);
    storageService.saveRevisionItems(items);
  };

  // Dynamically compute active recommendations
  const activeRecommendations = useMemo(() => {
    return generateRevisionRecommendations(topicProgressMap, revisionItems);
  }, [topicProgressMap, revisionItems]);

  const completeRevisionSession = (item, confidence, durationMinutes = 30) => {
    const { updatedItem, nextRevisionDate } = recordRevisionCompletion(item, confidence, durationMinutes);

    // Update revisionItems array
    const existingIndex = revisionItems.findIndex(i => i.id === item.id || i.topicId === item.topicId);
    let updatedList;
    if (existingIndex >= 0) {
      updatedList = revisionItems.map((it, idx) => idx === existingIndex ? updatedItem : it);
    } else {
      updatedList = [...revisionItems, updatedItem];
    }
    saveItems(updatedList);

    // Update syllabus topic progress without downgrading completed learning status
    if (item.topicId) {
      const currentProg = topicProgressMap[item.topicId] || {};
      const isAlreadyCompleted = currentProg.status === 'COMPLETED' || currentProg.readLevel === 'Practised';
      updateTopicProgress(item.topicId, {
        lastRevisedDate: new Date().toISOString().split('T')[0],
        nextRevisionDate,
        confidence,
        revisionCount: (currentProg.revisionCount || 0) + 1,
        status: isAlreadyCompleted ? 'COMPLETED' : (currentProg.status || 'IN_PROGRESS'),
        readLevel: isAlreadyCompleted ? 'Practised' : 'Revised'
      });
    }

    return updatedItem;
  };

  const rescheduleRevision = (itemId, newDateStr) => {
    const existing = revisionItems.find(i => i.id === itemId);
    let updatedList;
    if (existing) {
      updatedList = revisionItems.map(i => i.id === itemId ? {
        ...i,
        scheduledDate: newDateStr,
        isUserOverridden: true
      } : i);
    } else {
      // Find from recommendations
      const rec = activeRecommendations.find(r => r.id === itemId);
      if (rec) {
        updatedList = [...revisionItems, {
          ...rec,
          scheduledDate: newDateStr,
          isUserOverridden: true,
          status: 'ACTIVE'
        }];
      } else {
        return;
      }
    }
    saveItems(updatedList);
  };

  const updateItemPriority = (itemId, priority) => {
    const existing = revisionItems.find(i => i.id === itemId);
    let updatedList;
    if (existing) {
      updatedList = revisionItems.map(i => i.id === itemId ? { ...i, priority, isUserOverridden: true } : i);
    } else {
      const rec = activeRecommendations.find(r => r.id === itemId);
      if (rec) {
        updatedList = [...revisionItems, { ...rec, priority, isUserOverridden: true, status: 'ACTIVE' }];
      } else {
        return;
      }
    }
    saveItems(updatedList);
  };

  const updateItemDuration = (itemId, estimatedDurationMinutes) => {
    const duration = Math.max(10, Number(estimatedDurationMinutes));
    const existing = revisionItems.find(i => i.id === itemId);
    let updatedList;
    if (existing) {
      updatedList = revisionItems.map(i => i.id === itemId ? { ...i, estimatedDurationMinutes: duration, isUserOverridden: true } : i);
    } else {
      const rec = activeRecommendations.find(r => r.id === itemId);
      if (rec) {
        updatedList = [...revisionItems, { ...rec, estimatedDurationMinutes: duration, isUserOverridden: true, status: 'ACTIVE' }];
      } else {
        return;
      }
    }
    saveItems(updatedList);
  };

  const updateItemNotes = (itemId, notes) => {
    const existing = revisionItems.find(i => i.id === itemId);
    let updatedList;
    if (existing) {
      updatedList = revisionItems.map(i => i.id === itemId ? { ...i, notes, isUserOverridden: true } : i);
    } else {
      const rec = activeRecommendations.find(r => r.id === itemId);
      if (rec) {
        updatedList = [...revisionItems, { ...rec, notes, isUserOverridden: true, status: 'ACTIVE' }];
      } else {
        return;
      }
    }
    saveItems(updatedList);
  };

  const rejectRecommendation = (itemId) => {
    const existing = revisionItems.find(i => i.id === itemId);
    let updatedList;
    if (existing) {
      updatedList = revisionItems.map(i => i.id === itemId ? { ...i, isRejected: true } : i);
    } else {
      const rec = activeRecommendations.find(r => r.id === itemId);
      if (rec) {
        updatedList = [...revisionItems, { ...rec, isRejected: true }];
      } else {
        return;
      }
    }
    saveItems(updatedList);
  };

  return (
    <RevisionContext.Provider
      value={{
        revisionItems,
        activeRecommendations,
        completeRevisionSession,
        rescheduleRevision,
        updateItemPriority,
        updateItemDuration,
        updateItemNotes,
        rejectRecommendation
      }}
    >
      {children}
    </RevisionContext.Provider>
  );
}

export function useRevision() {
  const context = useContext(RevisionContext);
  if (!context) throw new Error("useRevision must be used within RevisionProvider");
  return context;
}
