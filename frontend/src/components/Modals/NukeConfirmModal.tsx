import React, { useState } from 'react';
import { api } from '../../services/api';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface NukeModalProps {
  level: 1 | 2 | 3;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const NukeConfirmModal: React.FC<NukeModalProps> = ({ level, onClose, onSuccess }) => {
  const [confirmationWord, setConfirmationWord] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const requiredWord = level === 1 ? 'TOURNAMENT' : level === 2 ? 'ROSTER' : 'NUKE';

  const getLevelInfo = () => {
    switch (level) {
      case 1:
        return {
          title: 'Level 1: Tournament Wipe',
          desc: 'Permanently deletes all match fixtures, live scores, football statistics, and standings. Reverts system to post-auction state.',
          badge: 'Medium Impact',
        };
      case 2:
        return {
          title: 'Level 2: Roster & Media Wipe',
          desc: 'Permanently deletes all players, teams, managers, bidding ledgers, and triggers batch deletion of all player images on Cloudinary. Retains tournament rules.',
          badge: 'High Impact (Media Cleared)',
        };
      case 3:
        return {
          title: 'Level 3: Factory Reset',
          desc: 'Total system wipe! Drops all tables, wipes all media folders, resets all configurations. Only Super Admin credentials are retained.',
          badge: 'Catastrophic Reset',
        };
    }
  };

  const handleNuke = async () => {
    if (confirmationWord !== requiredWord) {
      setError(`Type "${requiredWord}" to confirm`);
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await api.post('/nuke/execute', { level });
      onSuccess(res.data.message);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Nuke execution failed');
    } finally {
      setIsLoading(false);
    }
  };

  const info = getLevelInfo();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-rose-600/50 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 text-rose-500 mb-3">
          <AlertTriangle className="w-7 h-7" />
          <h2 className="text-xl font-black">{info.title}</h2>
        </div>

        <span className="inline-block px-3 py-1 bg-rose-500/20 text-rose-400 text-xs font-bold rounded-full mb-3">
          {info.badge}
        </span>

        <p className="text-xs text-slate-300 leading-relaxed mb-6 bg-slate-950 p-4 rounded-xl border border-slate-800">
          {info.desc}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            To proceed, type <span className="text-rose-400 font-mono font-bold">{requiredWord}</span> below:
          </label>
          <input
            type="text"
            value={confirmationWord}
            onChange={(e) => setConfirmationWord(e.target.value.toUpperCase())}
            placeholder={`Type ${requiredWord}`}
            className="w-full bg-slate-950 border border-rose-500/40 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 font-mono tracking-widest uppercase"
          />
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl"
          >
            Abort
          </button>
          <button
            onClick={handleNuke}
            disabled={confirmationWord !== requiredWord || isLoading}
            className="flex-1 flex items-center justify-center space-x-2 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-sm font-bold rounded-xl shadow-lg shadow-rose-900/40"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isLoading ? 'Executing Nuke...' : 'Execute Reset'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NukeConfirmModal;
