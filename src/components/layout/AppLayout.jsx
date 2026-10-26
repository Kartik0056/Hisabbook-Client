import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { PhonePairingModal } from '../modals/PhonePairingModal';
import { NewProjectModal } from '../modals/NewProjectModal';

export const AppLayout = () => {
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [phonePairingOpen, setPhonePairingOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  const handleQuickAdd = (type) => {
    switch (type) {
      case 'transaction':
        navigate('/transactions?add=true');
        break;
      case 'bill':
        navigate('/purchases?add=true');
        break;
      case 'contact':
        navigate('/contacts?add=true');
        break;
      case 'material':
        navigate('/materials?add=true');
        break;
      default:
        navigate('/transactions?add=true');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onOpenQuickAdd={handleQuickAdd}
          onOpenPhonePairing={() => setPhonePairingOpen(true)}
          onOpenNewProject={() => setNewProjectOpen(true)}
        />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Global Modals */}
      <PhonePairingModal
        isOpen={phonePairingOpen}
        onClose={() => setPhonePairingOpen(false)}
      />

      <NewProjectModal
        isOpen={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
      />
    </div>
  );
};
