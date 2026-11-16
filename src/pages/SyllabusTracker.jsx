import React, { useState, useMemo } from 'react';
import {
  ListTree,
  Filter,
  CheckCircle2,
  Clock,
  Search,
  Star,
  ChevronDown,
  ChevronRight,
  Calendar,
  AlertCircle,
  Sliders,
  CheckSquare,
  Square
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  allSyllabusTopics,
  syllabusSubjects,
  calculateSubtopicProgress,
  canTopicBeCompleted,
  getTopicEffectiveDuration
} from '../data/syllabus';
import { buildTopicStudySessions } from '../engine/planningEngine';
import Badge from '../components/common/Badge';
import SearchInput from '../components/common/SearchInput';

export default function SyllabusTracker() {
  const { topicProgressMap, updateTopicProgress, settings } = useApp();

  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [importanceFilter, setImportanceFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTopicIds, setExpandedTopicIds] = useState(new Set());

  const toggleExpand = (topicId) => {
    setExpandedTopicIds(prev => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  };

  // Filtered topics
  const filteredTopics = useMemo(() => {
    return allSyllabusTopics.filter(t => {
      // Subject filter
      if (subjectFilter !== "ALL" && t.subject !== subjectFilter) return false;

      // Status filter
      const prog = topicProgressMap[t.id];
      const status = prog?.status || "NOT_STARTED";
      if (statusFilter !== "ALL" && status !== statusFilter) return false;

      // Importance filter
      if (importanceFilter !== "ALL" && t.importance !== importanceFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = t.topicName.toLowerCase().includes(q);
        const matchId = t.id.toLowerCase().includes(q);
        const matchSub = t.subtopics.some(s => (typeof s === 'string' ? s : s.title).toLowerCase().includes(q));
        if (!matchName && !matchId && !matchSub) return false;
      }

      return true;
    });
  }, [subjectFilter, statusFilter, importanceFilter, searchQuery, topicProgressMap]);

  // Subject-wise stats
  const stats = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    let totalEstHours = 0;
    let totalDoneHours = 0;

    allSyllabusTopics.forEach(t => {
      const effHours = getTopicEffectiveDuration(t, topicProgressMap, settings);
      totalEstHours += effHours;
      const p = topicProgressMap[t.id];
      if (p?.status === 'COMPLETED') {
        completed++;
        totalDoneHours += effHours;
      } else if (p?.status === 'IN_PROGRESS' || p?.status === 'REVISION_REQUIRED') {
        inProgress++;
        if (p.completedHours) totalDoneHours += p.completedHours;
      }
    });

    return {
      total: allSyllabusTopics.length,
      completed,
      inProgress,
      totalEstHours: Math.round(totalEstHours),
      totalDoneHours: Math.round(totalDoneHours),
      overallPercent: Math.round((completed / allSyllabusTopics.length) * 100)
    };
  }, [topicProgressMap, settings]);

  const handleUpdateStatus = (topic, newStatus) => {
    if (newStatus === 'COMPLETED' && !canTopicBeCompleted(topic, topicProgressMap)) {
      alert("Incomplete Subtopics Warning: A parent topic cannot be marked COMPLETED until all its required subtopics are completed. Please complete all subtopics first.");
      return;
    }

    const currentProg = topicProgressMap[topic.id] || {};
    const effHours = getTopicEffectiveDuration(topic, topicProgressMap, settings);
    updateTopicProgress(topic.id, {
      status: newStatus,
      completedHours: newStatus === 'COMPLETED' ? effHours : currentProg.completedHours || 0,
      lastStudiedDate: new Date().toISOString().split('T')[0]
    });
  };

  const handleToggleSubtopic = (topic, subtopicId) => {
    const currentProg = topicProgressMap[topic.id] || {};
    const subProg = { ...(currentProg.subtopicProgress || {}) };
    const currentSubState = subProg[subtopicId] || {};
    const isNowCompleted = currentSubState.status !== 'COMPLETED';

    const subObj = topic.subtopics.find(s => s.id === subtopicId);
    const subHours = subObj?.estimatedHours || 2;

    subProg[subtopicId] = {
      status: isNowCompleted ? 'COMPLETED' : 'NOT_STARTED',
      completedHours: isNowCompleted ? subHours : 0
    };

    const updatedProg = {
      ...currentProg,
      subtopicProgress: subProg
    };

    const { allCompleted, completedHours } = calculateSubtopicProgress(topic, {
      [topic.id]: updatedProg
    });

    let newStatus = currentProg.status || 'NOT_STARTED';
    if (allCompleted) {
      newStatus = 'COMPLETED';
    } else if (completedHours > 0) {
      newStatus = 'IN_PROGRESS';
    } else {
      newStatus = 'NOT_STARTED';
    }

    updateTopicProgress(topic.id, {
      status: newStatus,
      completedHours,
      subtopicProgress: subProg,
      lastStudiedDate: new Date().toISOString().split('T')[0]
    });
  };

  const handleUpdateCustomHours = (topicId, hours) => {
    const num = Math.max(1, Number(hours));
    updateTopicProgress(topicId, { customHours: num });
  };

  const handleUpdateConfidence = (topicId, confidence) => {
    updateTopicProgress(topicId, { confidence });
  };

  const handleUpdateDifficulty = (topicId, difficulty) => {
    updateTopicProgress(topicId, { difficulty });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Hierarchical UPSC Syllabus Tracker
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Complete syllabus covering GS I–IV, CSAT, Essay, and PSIR Papers I & II
          </p>
        </div>

        {/* Global Stats Capsule */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Overall Mastered
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-slate-900">{stats.completed} / {stats.total}</span>
              <span className="text-xs font-semibold text-emerald-600">({stats.overallPercent}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search syllabus by ID, title, or subtopic..."
          />

          {/* Subject Filter */}
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
          >
            <option value="ALL">All Subjects & Papers</option>
            {syllabusSubjects.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="REVISION_REQUIRED">Revision Required</option>
          </select>

          {/* Importance Filter */}
          <select
            value={importanceFilter}
            onChange={(e) => setImportanceFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
          >
            <option value="ALL">All Importance Tiers</option>
            <option value="Crucial">Crucial</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
          </select>
        </div>
      </div>

      {/* Topics List Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-4 py-3">Topic & Subject</th>
                <th className="px-3 py-3">Difficulty & Hours</th>
                <th className="px-3 py-3">Subtopics</th>
                <th className="px-3 py-3">Completed / Rem.</th>
                <th className="px-3 py-3">Allocated Sessions</th>
                <th className="px-3 py-3">Confidence</th>
                <th className="px-4 py-3 text-right">Status Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTopics.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No syllabus modules match the active filters.
                  </td>
                </tr>
              ) : (
                filteredTopics.map(topic => {
                  const prog = topicProgressMap[topic.id] || {};
                  const status = prog.status || 'NOT_STARTED';
                  const confidence = prog.confidence || 3;
                  const difficulty = topic.difficulty || 'Moderate';
                  const effHours = getTopicEffectiveDuration(topic, topicProgressMap, settings);
                  const subStats = calculateSubtopicProgress(topic, topicProgressMap);
                  const sessions = buildTopicStudySessions(topic, effHours);
                  const isExpanded = expandedTopicIds.has(topic.id);

                  return (
                    <React.Fragment key={topic.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 max-w-sm">
                          <div className="flex items-start gap-2">
                            <button
                              onClick={() => toggleExpand(topic.id)}
                              className="p-1 rounded hover:bg-slate-200/60 text-slate-500 mt-0.5"
                              title={isExpanded ? "Collapse Subtopics" : "Expand Subtopics"}
                            >
                              <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-90 text-indigo-600' : ''}`} />
                            </button>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-800">{topic.id}</span>
                                <Badge label={topic.subject} variant={topic.subject} size="sm" />
                              </div>
                              <p className="font-bold text-slate-900 mt-0.5">{topic.topicName}</p>
                              <p className="text-[11px] text-slate-400 line-clamp-1">{topic.parentTopic}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="space-y-1">
                            <Badge label={difficulty} variant={difficulty} size="sm" />
                            <div className="flex items-center gap-1 text-[11px] text-slate-500">
                              <input
                                type="number"
                                min={1}
                                max={40}
                                value={effHours}
                                onChange={(e) => handleUpdateCustomHours(topic.id, e.target.value)}
                                className="w-12 rounded border border-slate-200 px-1 py-0.5 text-center font-bold text-slate-800"
                                title="Click to adjust estimated study hours"
                              />
                              <span>hrs</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap">
                          <button
                            onClick={() => toggleExpand(topic.id)}
                            className="text-left group"
                          >
                            <span className="font-bold text-slate-800 block text-xs group-hover:text-indigo-600">
                              {subStats.completedCount} / {subStats.totalCount} Done
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {isExpanded ? "Hide Subtopics" : "Click to view subtopics"}
                            </span>
                          </button>
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="text-xs">
                            <span className="font-bold text-emerald-700">{subStats.completedHours}h done</span>
                            <span className="text-slate-400 block text-[11px]">{subStats.remainingHours}h remaining</span>
                          </div>
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                            {sessions.length} {sessions.length === 1 ? 'Session' : 'Sessions'}
                          </span>
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(rating => (
                              <button
                                key={rating}
                                onClick={() => handleUpdateConfidence(topic.id, rating)}
                                className={`h-5 w-5 rounded text-[11px] font-bold ${
                                  confidence >= rating
                                    ? 'bg-amber-400 text-amber-950'
                                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                }`}
                                title={`Rate confidence ${rating}/5`}
                              >
                                {rating}
                              </button>
                            ))}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <select
                            value={status}
                            onChange={(e) => handleUpdateStatus(topic, e.target.value)}
                            className={`rounded-md px-2.5 py-1 text-xs font-semibold border ${
                              status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : status === 'IN_PROGRESS'
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                                : status === 'REVISION_REQUIRED'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                            <option value="NOT_STARTED">Not Started</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="REVISION_REQUIRED">Revision Required</option>
                            <option value="COMPLETED">Completed</option>
                          </select>
                        </td>
                      </tr>

                      {/* Expandable Subtopic Tracking Checklist */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                  Subtopic Mastery Tracking ({topic.subtopics.length} Required Subtopics)
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  Rule: Parent topic can only be marked COMPLETED when all subtopics are finished
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {topic.subtopics.map((sub) => {
                                  const subProg = prog.subtopicProgress?.[sub.id] || {};
                                  const isSubDone = subProg.status === 'COMPLETED';

                                  return (
                                    <div
                                      key={sub.id}
                                      onClick={() => handleToggleSubtopic(topic, sub.id)}
                                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer ${
                                        isSubDone
                                          ? 'bg-emerald-50/70 border-emerald-200'
                                          : 'bg-white border-slate-200 hover:border-slate-300'
                                      }`}
                                    >
                                      <button
                                        type="button"
                                        className="mt-0.5 text-slate-400 hover:text-emerald-600"
                                      >
                                        {isSubDone ? (
                                          <CheckSquare className="h-4 w-4 text-emerald-600" />
                                        ) : (
                                          <Square className="h-4 w-4 text-slate-300" />
                                        )}
                                      </button>

                                      <div className="flex-1">
                                        <div className="flex items-center justify-between gap-1">
                                          <span className="font-mono text-[10px] text-slate-400 font-bold">{sub.id}</span>
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] text-slate-500 font-semibold">{sub.estimatedHours}h</span>
                                            <Badge label={sub.difficulty} size="xs" />
                                          </div>
                                        </div>
                                        <p className={`text-xs mt-0.5 ${isSubDone ? 'text-emerald-950 font-semibold' : 'text-slate-800'}`}>
                                          {sub.title}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
