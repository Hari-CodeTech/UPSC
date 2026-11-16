import React, { useState, useEffect, useMemo } from 'react';
import {
  Newspaper,
  Search,
  Filter,
  Bookmark,
  BookmarkCheck,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  FileText,
  Calendar,
  Sparkles,
  Info,
  Globe,
  Clock
} from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import { useApp } from '../context/AppContext';
import { fetchLiveCurrentAffairs, containsHindiOrDevanagari } from '../services/currentAffairsService';
import { curatedCurrentAffairs } from '../data/currentAffairs/items';
import Badge from '../components/common/Badge';
import SearchInput from '../components/common/SearchInput';
import Modal from '../components/common/Modal';

export default function CurrentAffairs() {
  const { currentAffairsState, updateCurrentAffairsStatus } = useApp();

  const [feedState, setFeedState] = useState({
    sourceType: "CURATED_VERIFIED",
    status: "IDLE",
    items: curatedCurrentAffairs,
    lastUpdated: "2026-11-16T12:00:00.000Z",
    errorMessage: null,
    corsRestricted: false
  });
  const [isFetching, setIsFetching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedDateFilter, setSelectedDateFilter] = useState("ALL"); // "ALL" | "TODAY" | "YESTERDAY" | "LAST_7_DAYS" | "LAST_30_DAYS"
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBookmarkedOnly, setFilterBookmarkedOnly] = useState(false);
  const [activeNotesModal, setActiveNotesModal] = useState(null);
  const [notesText, setNotesText] = useState("");

  // Attempt live feed on mount
  useEffect(() => {
    attemptLiveFetch();
  }, []);

  const attemptLiveFetch = async () => {
    setIsFetching(true);
    const result = await fetchLiveCurrentAffairs();
    setFeedState(result);
    setIsFetching(false);
  };

  // Merge items with local persistence state and ensure 100% English integrity
  const mergedItems = useMemo(() => {
    return feedState.items
      .filter(item => !containsHindiOrDevanagari(item.headline) && !containsHindiOrDevanagari(item.summary))
      .map(item => {
        const local = currentAffairsState[item.id] || {};
        return {
          ...item,
          read: local.read !== undefined ? local.read : !!item.read,
          bookmarked: local.bookmarked !== undefined ? local.bookmarked : !!item.bookmarked,
          userNotes: local.userNotes !== undefined ? local.userNotes : (item.userNotes || "")
        };
      });
  }, [feedState.items, currentAffairsState]);

  // Filter items by category, search query, and date range
  const filteredItems = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    const sevenDaysAgoStr = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    const thirtyDaysAgoStr = format(subDays(new Date(), 30), 'yyyy-MM-dd');

    return mergedItems.filter(item => {
      if (filterBookmarkedOnly && !item.bookmarked) return false;
      if (selectedCategory !== "ALL" && item.category !== selectedCategory) return false;

      // Date range filtering
      if (selectedDateFilter === "TODAY" && item.publicationDate !== todayStr) return false;
      if (selectedDateFilter === "YESTERDAY" && item.publicationDate !== yesterdayStr) return false;
      if (selectedDateFilter === "LAST_7_DAYS" && item.publicationDate < sevenDaysAgoStr) return false;
      if (selectedDateFilter === "LAST_30_DAYS" && item.publicationDate < thirtyDaysAgoStr) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.headline.toLowerCase().includes(q);
        const matchSummary = item.summary.toLowerCase().includes(q);
        const matchGs = item.gsMapping?.some(m => m.toLowerCase().includes(q));
        const matchPsir = item.psirMapping?.some(m => m.toLowerCase().includes(q));
        if (!matchTitle && !matchSummary && !matchGs && !matchPsir) return false;
      }
      return true;
    });
  }, [mergedItems, filterBookmarkedOnly, selectedCategory, selectedDateFilter, searchQuery]);

  const categories = useMemo(() => {
    const set = new Set(mergedItems.map(i => i.category));
    return ["ALL", ...Array.from(set)];
  }, [mergedItems]);

  const toggleBookmark = (id, currentVal) => {
    updateCurrentAffairsStatus(id, { bookmarked: !currentVal });
  };

  const toggleRead = (id, currentVal) => {
    updateCurrentAffairsStatus(id, { read: !currentVal });
  };

  const openNotes = (item) => {
    setActiveNotesModal(item);
    setNotesText(item.userNotes || "");
  };

  const saveNotes = () => {
    if (activeNotesModal) {
      updateCurrentAffairsStatus(activeNotesModal.id, { userNotes: notesText });
      setActiveNotesModal(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Syllabus-Mapped Current Affairs Workspace
            </h1>
            <span className="flex items-center gap-1 rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
              <Globe className="h-3 w-3 text-slate-500" /> English Edition
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Verified official publications (PIB, PRS Legislative Research, NITI Aayog, Supreme Court) mapped to GS I–IV and PSIR
          </p>
        </div>

        {/* Live sync trigger */}
        <button
          onClick={attemptLiveFetch}
          disabled={isFetching}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
          <span>{isFetching ? "Verifying English Feeds..." : "Sync Public Feeds"}</span>
        </button>
      </div>

      {/* Honest CORS / Fallback Status Banner */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {feedState.sourceType === 'LIVE_FEED' ? (
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            )}
            <span className="text-xs font-bold text-slate-800">
              Data Pipeline Status: {feedState.sourceType === 'LIVE_FEED' ? "Verified English Public Feed" : "Verified Curated Government Repository Active"}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
            <Clock className="h-3 w-3 text-slate-400" />
            Last Updated: {feedState.lastUpdated ? format(parseISO(feedState.lastUpdated), 'dd MMM yyyy, hh:mm a') : "Nov 2026"}
          </span>
        </div>

        {feedState.corsRestricted && (
          <div className="rounded bg-amber-50/70 border border-amber-200 p-2.5 text-xs text-amber-900 leading-relaxed">
            <p>
              <strong>Transparent Pipeline Notice:</strong> {feedState.errorMessage}
            </p>
            <p className="mt-1 text-[11px] text-amber-800">
              Only authentic English releases are displayed. Non-English items without official translations are strictly excluded to preserve linguistic accuracy and prevent fabricated text.
            </p>
          </div>
        )}
      </div>

      {/* Date Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-2">
        <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 text-slate-400" /> Date Range:
        </span>
        {[
          { id: "ALL", label: "All Dates" },
          { id: "TODAY", label: "Today" },
          { id: "YESTERDAY", label: "Yesterday" },
          { id: "LAST_7_DAYS", label: "Last 7 Days" },
          { id: "LAST_30_DAYS", label: "Last 30 Days" }
        ].map(df => (
          <button
            key={df.id}
            onClick={() => setSelectedDateFilter(df.id)}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold border transition-all ${
              selectedDateFilter === df.id
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {df.label}
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search headlines, syllabus topics, or keywords..."
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
          >
            {categories.map(c => (
              <option key={c} value={c}>{c === "ALL" ? "All Categories" : c}</option>
            ))}
          </select>

          <button
            onClick={() => setFilterBookmarkedOnly(!filterBookmarkedOnly)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
              filterBookmarkedOnly
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Bookmark className="h-3.5 w-3.5" />
            <span>Bookmarks</span>
          </button>
        </div>
      </div>

      {/* Articles Feed */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-white border border-dashed rounded-xl">
            No verified English articles match the current filters.
          </div>
        ) : (
          filteredItems.map(item => (
            <div
              key={item.id}
              className={`rounded-xl border bg-white p-5 shadow-2xs space-y-4 transition-all ${
                item.read ? 'border-slate-200 opacity-90' : 'border-slate-300'
              }`}
            >
              {/* Headline & Metadata */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap text-[11px]">
                    <span className="font-semibold text-indigo-700">{item.source}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">{item.publicationDate}</span>
                    <Badge label={item.category} size="sm" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {item.headline}
                  </h3>
                </div>

                {/* Actions: Bookmark & Read */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleBookmark(item.id, item.bookmarked)}
                    className={`rounded p-1.5 transition-colors ${
                      item.bookmarked ? 'text-amber-500 hover:text-amber-600' : 'text-slate-400 hover:text-slate-600'
                    }`}
                    title={item.bookmarked ? "Remove Bookmark" : "Bookmark this issue"}
                  >
                    <Bookmark className={`h-4 w-4 ${item.bookmarked ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    onClick={() => toggleRead(item.id, item.read)}
                    className={`rounded px-2 py-1 text-xs font-semibold border transition-all ${
                      item.read
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {item.read ? "Read" : "Mark as Read"}
                  </button>
                </div>
              </div>

              {/* Summary */}
              <p className="text-xs text-slate-700 leading-relaxed">
                {item.summary}
              </p>

              {/* Syllabus Mapping Badges */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Syllabus Intersection
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {item.gsMapping?.map((m, i) => (
                    <span key={i} className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      {m}
                    </span>
                  ))}
                  {item.psirMapping?.map((m, i) => (
                    <span key={i} className="rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[11px] font-medium text-indigo-800">
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              {/* Prelims Facts & Mains Questions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                <div className="rounded-lg bg-amber-50/40 border border-amber-200/60 p-3 space-y-1.5">
                  <span className="font-bold text-amber-900 block text-[11px] uppercase tracking-wider">
                    High-Yield Prelims Pointers
                  </span>
                  <ul className="space-y-1 text-slate-700 pl-3 list-disc">
                    {item.prelimsPointers?.map((p, idx) => (
                      <li key={idx} className="leading-relaxed">{p}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg bg-indigo-50/40 border border-indigo-200/60 p-3 space-y-1.5">
                  <span className="font-bold text-indigo-900 block text-[11px] uppercase tracking-wider">
                    Mains Analytical Inquiries
                  </span>
                  <ul className="space-y-1 text-slate-700 pl-3 list-disc">
                    {item.mainsQuestions?.map((q, idx) => (
                      <li key={idx} className="leading-relaxed">{q}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Footer: User notes & Source Link */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => openNotes(item)}
                  className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-medium"
                >
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <span>{item.userNotes ? "View/Edit Personal Synthesis" : "Add Personal Notes"}</span>
                </button>

                {item.originalUrl && (
                  <a
                    href={item.originalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-indigo-600 hover:underline"
                  >
                    <span>Original Source</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Notes Modal */}
      <Modal
        isOpen={!!activeNotesModal}
        onClose={() => setActiveNotesModal(null)}
        title={`Synthesis Notes: ${activeNotesModal?.headline?.slice(0, 45)}...`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Write down your analytical perspectives, connections to static syllabus themes, or quotes to cite in Mains.
          </p>

          <textarea
            rows={6}
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            placeholder="Key arguments, committee names, constitutional provisions..."
            className="w-full rounded-lg border border-slate-200 p-3 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none font-mono"
          />

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setActiveNotesModal(null)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={saveNotes}
              className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Save Notes
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
