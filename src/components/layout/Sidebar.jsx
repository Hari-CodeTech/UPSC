import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarRange,
  BookOpen,
  Scale,
  ListTree,
  Newspaper,
  Award,
  Calculator,
  PenTool,
  Scroll,
  RotateCcw,
  GraduationCap,
  FileText,
  BarChart3,
  Settings,
  ChevronRight
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    heading: "Core Preparation",
    items: [
      { name: "Dashboard", path: "/", icon: LayoutDashboard },
      { name: "Today's Study Plan", path: "/today", icon: CalendarCheck, badge: "6 Sessions" },
      { name: "Complete Plan Viewer", path: "/complete-plan", icon: CalendarRange },
      { name: "GS Subject Planner", path: "/gs-planner", icon: BookOpen },
      { name: "PSIR Optional Planner", path: "/psir-planner", icon: Scale },
      { name: "Syllabus Tracker", path: "/syllabus-tracker", icon: ListTree }
    ]
  },
  {
    heading: "Active Practice & Testing",
    items: [
      { name: "Current Affairs", path: "/current-affairs", icon: Newspaper },
      { name: "Authentic PYQ Practice", path: "/pyq-practice", icon: Award },
      { name: "CSAT Drill & RC", path: "/csat-practice", icon: Calculator },
      { name: "Mains Answer Writing", path: "/answer-writing", icon: PenTool },
      { name: "Essay Practice", path: "/essay-practice", icon: Scroll },
      { name: "Revision Centre", path: "/revision-centre", icon: RotateCcw },
      { name: "Mock Tests & Records", path: "/mock-tests", icon: GraduationCap }
    ]
  },
  {
    heading: "Repository & Configuration",
    items: [
      { name: "Study Notes & Tags", path: "/notes", icon: FileText },
      { name: "Progress Analytics", path: "/analytics", icon: BarChart3 },
      { name: "Settings & Backup", path: "/settings", icon: Settings }
    ]
  }
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Academic Header */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white font-serif font-black text-lg tracking-wider">
            U
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-slate-900">
              UPSC MASTER PLANNER
            </span>
            <span className="text-[10px] font-medium tracking-wider uppercase text-slate-500">
              Academic CSE Studio
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {NAV_SECTIONS.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {section.heading}
              </p>
              <div className="space-y-0.5 pt-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-2.5 truncate">
                            <Icon
                              className={`h-4 w-4 shrink-0 ${
                                isActive ? 'text-white' : 'text-slate-400'
                              }`}
                            />
                            <span className="truncate">{item.name}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`ml-2 rounded px-1.5 py-0.2 text-[10px] font-medium ${
                                isActive
                                  ? 'bg-slate-800 text-slate-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Profile Footer */}
        <div className="border-t border-slate-200 p-3 bg-slate-50">
          <div className="flex items-center justify-between rounded-lg px-2 py-1.5">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-800">Target Year 2027</span>
              <span className="text-[10px] text-slate-500">GS I-IV + PSIR Optional</span>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500" title="System Operational" />
          </div>
        </div>
      </aside>
    </>
  );
}
