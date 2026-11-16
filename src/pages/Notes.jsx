import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  FileText,
  Plus,
  Trash2,
  Edit3,
  Bookmark,
  Eye,
  Search,
  Tag,
  Check,
  BookOpen
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { allSyllabusTopics } from '../data/syllabus';
import SearchInput from '../components/common/SearchInput';
import Badge from '../components/common/Badge';

const NOTE_CATEGORIES = ["ALL", "GS", "PSIR", "Essay", "Ethics", "Current Affairs"];

export default function Notes() {
  const { notes, addNote, updateNote, deleteNote } = useApp();

  const [selectedNoteId, setSelectedNoteId] = useState(notes[0]?.id || null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Editor states
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("GS");
  const [editTags, setEditTags] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editLinkedTopicId, setEditLinkedTopicId] = useState("");

  // Filtered notes list
  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      if (categoryFilter !== "ALL" && n.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mTitle = n.title?.toLowerCase().includes(q);
        const mBody = n.content?.toLowerCase().includes(q);
        const mTag = n.tags?.some(t => t.toLowerCase().includes(q));
        if (!mTitle && !mBody && !mTag) return false;
      }
      return true;
    });
  }, [notes, categoryFilter, searchQuery]);

  const activeNote = notes.find(n => n.id === selectedNoteId) || filteredNotes[0] || null;

  const handleStartNewNote = () => {
    setEditTitle("Untitled Preparation Note");
    setEditCategory("GS");
    setEditTags("Polity, Mains, Revision");
    setEditLinkedTopicId("GS2-POL-01");
    setEditContent("# Note Title\n\n- Key Argument 1:\n- Constitutional Article / Case Law:\n- Critique & Contemporary Dimension:\n");
    setIsEditing(true);
    setPreviewMode(false);
    setSelectedNoteId(null);
  };

  const handleStartEdit = (note) => {
    setSelectedNoteId(note.id);
    setEditTitle(note.title);
    setEditCategory(note.category || "GS");
    setEditTags(note.tags ? note.tags.join(", ") : "");
    setEditLinkedTopicId(note.linkedTopicId || "");
    setEditContent(note.content || "");
    setIsEditing(true);
    setPreviewMode(false);
  };

  const handleSaveNote = () => {
    const tagsArray = editTags.split(',').map(t => t.trim()).filter(Boolean);
    if (selectedNoteId) {
      updateNote(selectedNoteId, {
        title: editTitle,
        category: editCategory,
        tags: tagsArray,
        linkedTopicId: editLinkedTopicId,
        content: editContent
      });
    } else {
      const created = addNote({
        title: editTitle,
        category: editCategory,
        tags: tagsArray,
        linkedTopicId: editLinkedTopicId,
        content: editContent,
        bookmarked: false
      });
      setSelectedNoteId(created.id);
    }
    setIsEditing(false);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to permanently delete this study note?")) {
      deleteNote(id);
      if (selectedNoteId === id) {
        setSelectedNoteId(null);
      }
    }
  };

  const handleToggleBookmark = (note) => {
    updateNote(note.id, { bookmarked: !note.bookmarked });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Topic-Wise Markdown Notes & Knowledge Base
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Syllabus-linked notes • Markdown syntax support • Tagged academic taxonomy
          </p>
        </div>

        <button
          onClick={handleStartNewNote}
          className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-2xs"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Note</span>
        </button>
      </div>

      {/* Main Split Layout: Sidebar list (1/3) + Content/Editor Area (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Notes List & Search */}
        <div className="space-y-4">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search notes by title, tag, or content..."
          />

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1">
            {NOTE_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`rounded px-2.5 py-1 text-xs font-semibold border transition-all ${
                  categoryFilter === cat
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Notes items list */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-2xs max-h-[600px] overflow-y-auto divide-y divide-slate-100">
            {filteredNotes.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No notes found. Click "Create New Note" to begin.
              </div>
            ) : (
              filteredNotes.map(note => {
                const isSelected = activeNote?.id === note.id;
                return (
                  <div
                    key={note.id}
                    onClick={() => { setSelectedNoteId(note.id); setIsEditing(false); }}
                    className={`p-3.5 text-xs cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50/40 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 line-clamp-1">{note.title}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleBookmark(note); }}
                        className={`p-1 ${note.bookmarked ? 'text-amber-500' : 'text-slate-300 hover:text-slate-500'}`}
                      >
                        <Bookmark className={`h-3.5 w-3.5 ${note.bookmarked ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    <p className="text-slate-500 line-clamp-2 leading-relaxed">
                      {note.content?.replace(/[#*`_]/g, '') || "Empty note"}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-medium text-slate-600">{note.category || 'General'}</span>
                      <span>{note.updatedAt?.split('T')[0]}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 2 Columns: Viewer or Editor */}
        <div className="lg:col-span-2">
          {isEditing ? (
            /* NOTE EDITOR */
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedNoteId ? "Edit Study Note" : "Compose New Note"}
                </h3>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className="flex items-center gap-1 rounded border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>{previewMode ? "Editor View" : "Markdown Preview"}</span>
                  </button>

                  <button
                    onClick={handleSaveNote}
                    className="flex items-center gap-1 rounded bg-slate-900 px-3.5 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Save Note</span>
                  </button>
                </div>
              </div>

              {/* Title & Metadata inputs */}
              <div className="space-y-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Note title..."
                  className="w-full text-base font-bold text-slate-900 border-b border-slate-200 pb-2 focus:outline-none focus:border-indigo-600"
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Category</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full rounded border border-slate-200 p-1.5 text-slate-800 focus:outline-none"
                    >
                      {NOTE_CATEGORIES.filter(c => c !== "ALL").map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Linked Topic</label>
                    <select
                      value={editLinkedTopicId}
                      onChange={(e) => setEditLinkedTopicId(e.target.value)}
                      className="w-full rounded border border-slate-200 p-1.5 text-slate-800 focus:outline-none"
                    >
                      <option value="">None (General)</option>
                      {allSyllabusTopics.map(t => (
                        <option key={t.id} value={t.id}>{t.id} — {t.topicName.slice(0, 30)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Tags (Comma-separated)</label>
                    <input
                      type="text"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="Polity, Case Laws, 2027"
                      className="w-full rounded border border-slate-200 p-1.5 text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Editor / Preview Area */}
              {previewMode ? (
                <div className="rounded-lg border border-slate-200 p-4 min-h-[350px] prose prose-sm max-w-none bg-slate-50/30 overflow-y-auto">
                  <ReactMarkdown>{editContent}</ReactMarkdown>
                </div>
              ) : (
                <textarea
                  rows={14}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Use Markdown: # Heading, **bold**, - list items, > quotes, etc."
                  className="w-full rounded-lg border border-slate-200 p-3.5 text-xs text-slate-800 font-mono leading-relaxed focus:border-indigo-600 focus:outline-none"
                />
              )}
            </div>
          ) : activeNote ? (
            /* NOTE VIEWER */
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-5">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge label={activeNote.category || 'General'} size="sm" />
                    {activeNote.linkedTopicId && (
                      <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-1.5 py-0.5">
                        {activeNote.linkedTopicId}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">
                      Last edited {activeNote.updatedAt?.split('T')[0]}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {activeNote.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleStartEdit(activeNote)}
                    className="flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDelete(activeNote.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                    title="Delete Note"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Tags */}
              {activeNote.tags && activeNote.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {activeNote.tags.map((tag, i) => (
                    <span key={i} className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Markdown Content */}
              <div className="text-xs text-slate-800 leading-relaxed overflow-y-auto max-h-[500px] border-t border-slate-100 pt-4 prose prose-slate max-w-none">
                <ReactMarkdown>{activeNote.content || "_No content recorded for this note._"}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-xs text-slate-400">
              Select a note from the left panel or click "Create New Note".
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
