import React from 'react';

const BADGE_VARIANTS = {
  // Statuses
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  IN_PROGRESS: "bg-indigo-50 text-indigo-700 border-indigo-200",
  NOT_STARTED: "bg-slate-100 text-slate-600 border-slate-200",
  REVISION_REQUIRED: "bg-amber-50 text-amber-700 border-amber-200",
  READ: "bg-sky-50 text-sky-700 border-sky-200",
  REVISED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  PRACTISED: "bg-emerald-50 text-emerald-700 border-emerald-200",

  // Importance
  Crucial: "bg-rose-50 text-rose-700 border-rose-200 font-semibold",
  High: "bg-amber-50 text-amber-700 border-amber-200",
  Medium: "bg-slate-100 text-slate-700 border-slate-200",
  Low: "bg-slate-50 text-slate-500 border-slate-200",

  // Papers / Subjects
  "GS I": "bg-slate-100 text-slate-800 border-slate-300",
  "GS II": "bg-blue-50 text-blue-800 border-blue-200",
  "GS III": "bg-emerald-50 text-emerald-800 border-emerald-200",
  "GS IV": "bg-purple-50 text-purple-800 border-purple-200",
  "CSAT": "bg-orange-50 text-orange-800 border-orange-200",
  "Essay": "bg-amber-50 text-amber-800 border-amber-200",
  "PSIR Optional": "bg-indigo-50 text-indigo-800 border-indigo-200",

  // Default
  default: "bg-slate-100 text-slate-700 border-slate-200"
};

export default function Badge({ label, variant, size = "md", className = "" }) {
  const variantClass = BADGE_VARIANTS[variant || label] || BADGE_VARIANTS.default;
  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-xs px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium tracking-wide ${sizeClass} ${variantClass} ${className}`}
    >
      {label}
    </span>
  );
}
