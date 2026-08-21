import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSystemState } from '../context/SystemStateContext';
import { Trophy, User as UserIcon, LogOut, Shield, Gavel, Users, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoginModal from './Modals/LoginModal';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentPhase } = useSystemState();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const getPhaseBadgeColor = (phase: string) => {
    switch (phase) {
      case 'SETUP':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'REGISTRATION':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'AUCTION':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse';
      case 'TOURNAMENT':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-800 text-slate-400';
    }
  };

  return (
    <>
      <nav className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-900/40 group-hover:scale-105 transition-transform">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-white tracking-tight flex items-center gap-2">
              UniFootball <span className="text-xs bg-emerald-500/20 text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">PRO</span>
            </h1>
            <p className="text-xs text-slate-400">Franchise & Tournament Hub</p>
          </div>
        </Link>

        {/* Phase Indicator */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Active Phase:</span>
          <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getPhaseBadgeColor(currentPhase)}`}>
            {currentPhase}
          </span>
        </div>

        {/* Navigation Links & User Menu */}
        <div className="flex items-center space-x-4">
          <Link to="/" className="text-sm text-slate-300 hover:text-white transition-colors">
            Main Hub
          </Link>

          {user?.role === 'SUPER_ADMIN' && (
            <Link to="/admin/super" className="flex items-center space-x-1.5 text-sm bg-purple-600/20 text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-lg hover:bg-purple-600/30 transition-colors">
              <Shield className="w-4 h-4" />
              <span>Super Admin</span>
            </Link>
          )}

          {(user?.role === 'SUPER_ADMIN' || user?.role === 'PODIUM_ADMIN') && (
            <Link to="/admin/podium" className="flex items-center space-x-1.5 text-sm bg-amber-600/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg hover:bg-amber-600/30 transition-colors">
              <Gavel className="w-4 h-4" />
              <span>Podium Stage</span>
            </Link>
          )}

          {user?.role === 'TEAM_MANAGER' && (
            <Link to="/manager/dashboard" className="flex items-center space-x-1.5 text-sm bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg hover:bg-emerald-600/30 transition-colors">
              <Users className="w-4 h-4" />
              <span>Franchise Desk</span>
            </Link>
          )}

          {user ? (
            <div className="flex items-center space-x-3 border-l border-slate-800 pl-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{user.name}</p>
                <p className="text-xs text-slate-400 capitalize">{user.role.replace('_', ' ').toLowerCase()}</p>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-emerald-600/20 transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </nav>

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </>
  );
};
