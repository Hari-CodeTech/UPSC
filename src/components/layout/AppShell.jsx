import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import GlobalSearchModal from '../navigation/GlobalSearchModal';
import AdaptiveRebalanceModal from '../planner/AdaptiveRebalanceModal';
import { usePlanner } from '../../context/PlannerContext';

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rebalanceModalOpen, setRebalanceModalOpen] = useState(false);
  const { rebalanceResult, applyRebalanceProposals } = usePlanner();

  const handleOpenRebalance = (proposal) => {
    setRebalanceModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content layout wrapper */}
      <div className="flex flex-1 flex-col md:pl-64 min-w-0">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          onOpenRebalanceModal={handleOpenRebalance}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal />
      <AdaptiveRebalanceModal
        isOpen={rebalanceModalOpen}
        onClose={() => setRebalanceModalOpen(false)}
        proposal={rebalanceResult}
        onApply={applyRebalanceProposals}
      />
    </div>
  );
}
