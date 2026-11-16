import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, BookOpen, Award, FileText, Newspaper, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { allSyllabusTopics } from '../../data/syllabus';
import { authenticPrelimsPYQs, authenticMainsPYQs } from '../../data/pyqs';
import { curatedCurrentAffairs } from '../../data/currentAffairs/items';

export default function GlobalSearchModal() {
  const { globalSearchOpen, setGlobalSearchOpen, notes } = useApp();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  // Listen for Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape' && globalSearchOpen) {
        setGlobalSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [globalSearchOpen, setGlobalSearchOpen]);

  // Perform search across entities
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    // 1. Syllabus topics
    const matchingTopics = allSyllabusTopics
      .filter(t => t.topicName.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q) || t.subtopics.some(s => s.toLowerCase().includes(q)))
      .slice(0, 5)
      .map(t => ({
        type: 'Syllabus Topic',
        title: `${t.id}: ${t.topicName}`,
        subtitle: `${t.subject} — ${t.parentTopic}`,
        icon: BookOpen,
        action: () => {
          navigate(t.subject.includes('PSIR') ? '/psir-planner' : '/gs-planner');
          setGlobalSearchOpen(false);
        }
      }));

    // 2. Authentic PYQs
    const matchingPyqs = [...authenticPrelimsPYQs, ...authenticMainsPYQs]
      .filter(p => p.question.toLowerCase().includes(q) || (p.topic && p.topic.toLowerCase().includes(q)))
      .slice(0, 4)
      .map(p => ({
        type: 'Authentic PYQ',
        title: `UPSC ${p.year} (${p.stage}): ${p.question.slice(0, 75)}...`,
        subtitle: `${p.paper} — ${p.subject}`,
        icon: Award,
        action: () => {
          navigate('/pyq-practice');
          setGlobalSearchOpen(false);
        }
      }));

    // 3. Current affairs
    const matchingCA = curatedCurrentAffairs
      .filter(c => c.headline.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q) || c.category.toLowerCase().includes(q))
      .slice(0, 3)
      .map(c => ({
        type: 'Current Affairs',
        title: c.headline,
        subtitle: `${c.category} — ${c.publicationDate}`,
        icon: Newspaper,
        action: () => {
          navigate('/current-affairs');
          setGlobalSearchOpen(false);
        }
      }));

    // 4. Notes
    const matchingNotes = notes
      .filter(n => n.title?.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q))
      .slice(0, 3)
      .map(n => ({
        type: 'Study Note',
        title: n.title,
        subtitle: `${n.subject || 'General'} — ${n.updatedAt?.split('T')[0]}`,
        icon: FileText,
        action: () => {
          navigate('/notes');
          setGlobalSearchOpen(false);
        }
      }));

    return [...matchingTopics, ...matchingPyqs, ...matchingCA, ...matchingNotes];
  }, [query, notes, navigate, setGlobalSearchOpen]);

  if (!globalSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={() => setGlobalSearchOpen(false)}
      />

      <div className="relative z-10 w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        {/* Search Input bar */}
        <div className="flex items-center border-b border-slate-200 px-4 py-3 bg-white">
          <Search className="h-5 w-5 text-slate-400 shrink-0 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search syllabus topics, authentic PYQs, notes, current affairs..."
            className="w-full text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block ml-2 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="max-h-96 overflow-y-auto p-2">
          {query.trim() === '' ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Type to search syllabus topics, authentic PYQs, current affairs, and personal notes.
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching records found for "{query}".
            </div>
          ) : (
            <div className="space-y-1">
              {searchResults.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={item.action}
                    className="flex w-full items-center justify-between rounded-lg p-2.5 text-left hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-600 shrink-0 group-hover:bg-slate-200">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                            {item.type}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 shrink-0 ml-2" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
