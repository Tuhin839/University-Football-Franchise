import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, getErrorMessage } from '../../services/api';
import { X, Lock, Mail, ShieldCheck } from 'lucide-react';

interface LoginModalProps {
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      onClose();
    } catch (err: any) {
      setError(getErrorMessage(err, 'Invalid credentials'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <div className="glass-hud border border-cyan-500/30 rounded-3xl w-full max-w-md p-6 sm:p-8 relative shadow-neon-cyan">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-black text-white tracking-tight mb-1 font-mono flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-neon-cyan" />
          <span>Access Terminal</span>
        </h2>
        <p className="text-xs text-slate-400 mb-6 font-mono">Authenticate credentials to access designated role portal</p>

        {error && (
          <div className="mb-4 p-3 bg-neon-rose/15 border border-neon-rose/40 rounded-xl text-neon-rose text-xs font-mono font-medium shadow-neon-rose">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Identity</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@university.edu"
                className="w-full bg-cyber-950 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-neon-cyan transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Security Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-cyber-950 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-neon-cyan transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-neon-cyan to-neon-emerald hover:from-cyan-400 hover:to-emerald-400 disabled:opacity-40 text-cyber-950 font-black py-3 rounded-xl shadow-neon-cyan transition-all text-xs uppercase font-mono mt-2"
          >
            {isLoading ? 'Verifying...' : 'Authorize Login'}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="mt-6 pt-4 border-t border-white/10 font-mono">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Instant Demo Credentials
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickLogin('superadmin@university.edu', 'admin123')}
              className="px-3 py-2 bg-cyber-900 hover:bg-cyber-850 text-[11px] text-neon-purple rounded-xl border border-purple-500/30 text-left font-bold"
            >
              👑 Super Admin
            </button>
            <button
              onClick={() => handleQuickLogin('podium@university.edu', 'podium123')}
              className="px-3 py-2 bg-cyber-900 hover:bg-cyber-850 text-[11px] text-neon-amber rounded-xl border border-amber-500/30 text-left font-bold"
            >
              🔨 Podium Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
