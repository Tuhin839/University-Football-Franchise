import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SystemStateProvider } from './context/SystemStateContext';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { SuperAdminDashboard } from './pages/admin/SuperAdminDashboard';
import { PodiumAdminDashboard } from './pages/admin/PodiumAdminDashboard';
import { TeamManagerDashboard } from './pages/manager/TeamManagerDashboard';

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <SystemStateProvider>
          <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
            <Navbar />
            <main className="flex-1 px-4 sm:px-6 lg:px-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/admin/super" element={<SuperAdminDashboard />} />
                <Route path="/admin/podium" element={<PodiumAdminDashboard />} />
                <Route path="/manager/dashboard" element={<TeamManagerDashboard />} />
              </Routes>
            </main>
            <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
              © 2026 University Football Franchise & Tournament Platform. Built for Hackathon Excellence.
            </footer>
          </div>
        </SystemStateProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
