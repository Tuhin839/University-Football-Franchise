import React, { useState, useEffect } from 'react';
import { useSystemState } from '../../context/SystemStateContext';
import { api, getErrorMessage } from '../../services/api';
import { Player } from '../../types';
import { TiltCard } from '../../components/TiltCard';
import { Upload, CheckCircle, Shield, User, Trash2, Sparkles } from 'lucide-react';

export const RegistrationView: React.FC = () => {
  const { rules, tiers } = useSystemState();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [academicSession, setAcademicSession] = useState('');
  const [jerseyName, setJerseyName] = useState('');
  const [primaryPosition, setPrimaryPosition] = useState('');
  const [secondaryPositions, setSecondaryPositions] = useState<string[]>([]);
  const [tierId, setTierId] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const availableSessions =
    rules?.academicSessions && rules.academicSessions.length > 0
      ? rules.academicSessions
      : ['2021-2022', '2022-2023', '2023-2024', '2024-2025', '2025-2026'];

  const fetchRegisteredPlayers = async () => {
    try {
      const res = await api.get('/players');
      setPlayers(res.data.players || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRegisteredPlayers();
  }, []);

  useEffect(() => {
    if (!academicSession && availableSessions.length > 0) {
      setAcademicSession(availableSessions[0]);
    }
    if (!tierId && tiers.length > 0) {
      setTierId(tiers[0].id);
    }
  }, [rules, tiers, availableSessions]);

  const handlePositionToggle = (pos: string) => {
    if (pos === primaryPosition) return;
    if (secondaryPositions.includes(pos)) {
      setSecondaryPositions(secondaryPositions.filter((p) => p !== pos));
    } else {
      setSecondaryPositions([...secondaryPositions, pos]);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const finalSession = academicSession || availableSessions[0];
    const finalTier = tierId || (tiers.length > 0 ? tiers[0].id : '');

    if (!finalTier) {
      setErrorMsg('Please select a player tier.');
      return;
    }

    if (!imageFile) {
      setErrorMsg('Profile photo is required and will be hosted securely on Cloudinary');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('studentId', studentId);
    formData.append('academicSession', finalSession);
    formData.append('jerseyName', jerseyName);
    formData.append('primaryPosition', primaryPosition);
    formData.append('secondaryPositions', JSON.stringify(secondaryPositions));
    formData.append('tierId', finalTier);
    formData.append('image', imageFile);

    setLoading(true);
    try {
      await api.post('/players/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccessMsg('Player registered successfully! Image safely stored in Cloudinary.');
      setName('');
      setStudentId('');
      setJerseyName('');
      setPrimaryPosition('');
      setSecondaryPositions([]);
      setImageFile(null);
      setPreviewUrl(null);
      fetchRegisteredPlayers();
    } catch (err: any) {
      setErrorMsg(getErrorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (playerId: string) => {
    if (!confirm('Are you sure you want to withdraw registration? Your media will be deleted from Cloudinary.')) return;
    try {
      await api.delete(`/players/${playerId}`);
      fetchRegisteredPlayers();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Withdrawal failed'));
    }
  };

  const positions = rules?.allowedPositions || ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-4">
      <div className="glass-hud rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-cyan-500/30 shadow-neon-cyan relative overflow-hidden">
        <div className="space-y-2">
          <span className="px-3 py-1 bg-cyan-500/15 text-neon-cyan border border-cyan-500/40 rounded-full text-xs font-black uppercase font-mono tracking-wider shadow-neon-cyan">
            PHASE 2: PLAYER DRAFT REGISTRATION
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">University Draft Terminal</h2>
          <p className="text-xs text-slate-400 font-mono max-w-xl">
            Register for the live auction draft. Set your primary and secondary positions, upload your identity photo, and receive tier appraisal.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Registration Form with 3D Tilt (5 cols) */}
        <div className="lg:col-span-5">
          <TiltCard glowColor="cyan" tiltStrength={6}>
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-xs font-black text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-neon-cyan" />
                  <span>Player Draft Card Entry</span>
                </h3>
              </div>

              {successMsg && (
                <div className="p-4 bg-neon-emerald/15 border border-neon-emerald/40 rounded-2xl text-neon-emerald text-xs font-mono font-semibold shadow-neon-emerald">
                  {successMsg}
                </div>
              )}

              {errorMsg && (
                <div className="p-4 bg-neon-rose/15 border border-neon-rose/40 rounded-2xl text-neon-rose text-xs font-mono font-semibold shadow-neon-rose">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono font-semibold text-slate-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="w-full bg-cyber-950 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-neon-cyan focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono font-semibold text-slate-300 mb-1">Student ID</label>
                    <input
                      type="text"
                      required
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="e.g. 2024-CSE-042"
                      className="w-full bg-cyber-950 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-neon-cyan focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono font-semibold text-slate-300 mb-1">Jersey Name</label>
                    <input
                      type="text"
                      required
                      value={jerseyName}
                      onChange={(e) => setJerseyName(e.target.value)}
                      placeholder="e.g. MORGAN"
                      className="w-full bg-cyber-950 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-neon-cyan focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono font-semibold text-slate-300 mb-1">Academic Session</label>
                    <select
                      value={academicSession || availableSessions[0]}
                      onChange={(e) => setAcademicSession(e.target.value)}
                      className="w-full bg-cyber-950 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-neon-cyan focus:outline-none"
                    >
                      {availableSessions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-semibold text-slate-300 mb-1">Player Tier Appraisal</label>
                  <select
                    value={tierId || (tiers[0]?.id || '')}
                    onChange={(e) => setTierId(e.target.value)}
                    className="w-full bg-cyber-950 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-neon-cyan focus:outline-none"
                  >
                    {tiers.length > 0 ? (
                      tiers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} (Base Price: ${t.basePrice.toLocaleString()})
                        </option>
                      ))
                    ) : (
                      <option value="">Loading tiers from database...</option>
                    )}
                  </select>
                </div>

                {/* Primary Position Grid */}
                <div>
                  <label className="block text-[11px] font-mono font-semibold text-slate-300 mb-1.5">
                    Primary Position (Select Exactly 1)
                  </label>
                  <div className="grid grid-cols-5 gap-1.5 mb-3">
                    {positions.map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => {
                          setPrimaryPosition(pos);
                          setSecondaryPositions(secondaryPositions.filter((p) => p !== pos));
                        }}
                        className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                          primaryPosition === pos
                            ? 'bg-neon-emerald text-cyber-950 shadow-neon-emerald'
                            : 'bg-cyber-950 text-slate-400 border border-white/10 hover:border-white/30'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>

                  <label className="block text-[11px] font-mono font-semibold text-slate-300 mb-1.5">
                    Secondary Positions (Multi-Select)
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {positions.map((pos) => {
                      const isPrimary = primaryPosition === pos;
                      const isSec = secondaryPositions.includes(pos);
                      return (
                        <button
                          key={pos}
                          type="button"
                          disabled={isPrimary}
                          onClick={() => handlePositionToggle(pos)}
                          className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                            isPrimary
                              ? 'opacity-20 cursor-not-allowed bg-cyber-950 text-slate-600'
                              : isSec
                              ? 'bg-neon-cyan text-cyber-950 shadow-neon-cyan'
                              : 'bg-cyber-950 text-slate-400 border border-white/10 hover:border-white/30'
                          }`}
                        >
                          {pos}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cloudinary Image Picker */}
                <div>
                  <label className="block text-[11px] font-mono font-semibold text-slate-300 mb-1.5">
                    Profile Hologram Image (Cloudinary)
                  </label>
                  <div className="flex items-center gap-3">
                    {previewUrl && (
                      <img src={previewUrl} alt="Preview" className="w-12 h-12 rounded-xl object-cover border border-neon-cyan" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={handleImageChange}
                      className="w-full text-xs font-mono text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-gradient-to-r file:from-neon-cyan file:to-cyan-500 file:text-cyber-950 hover:file:opacity-90 cursor-pointer bg-cyber-950 border border-white/15 rounded-xl p-1"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !primaryPosition}
                  className="w-full py-4 bg-gradient-to-r from-neon-cyan to-neon-emerald hover:from-cyan-400 hover:to-emerald-400 disabled:opacity-30 text-cyber-950 text-xs font-black uppercase font-mono rounded-2xl shadow-neon-cyan transition-all flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>{loading ? 'Transmitting to Cloudinary...' : 'Authorize Registration'}</span>
                </button>
              </form>
            </div>
          </TiltCard>
        </div>

        {/* Registered Draft Pool Deck (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black uppercase text-white font-mono tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-neon-cyan" />
              <span>Registered Candidate Roster ({players.length})</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Updates Allowed in Phase 2</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[620px] overflow-y-auto pr-1">
            {players.map((p) => (
              <TiltCard key={p.id} glowColor="purple" tiltStrength={5}>
                <div className="p-4 flex gap-3 relative group">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-white/10 bg-cyber-950"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white truncate">{p.name}</h4>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-neon-purple border border-purple-500/30 font-mono">
                        {p.tier?.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">#{p.jerseyName} • {p.studentId}</p>

                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-lg bg-neon-emerald/15 text-neon-emerald text-[10px] font-black font-mono border border-neon-emerald/30">
                        {p.primaryPosition} (Primary)
                      </span>
                      {p.secondaryPositions?.map((sp) => (
                        <span key={sp} className="px-1.5 py-0.5 rounded bg-cyber-800 text-slate-400 text-[10px] font-mono">
                          {sp}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleWithdraw(p.id)}
                    title="Withdraw Registration"
                    className="absolute top-3 right-3 text-slate-600 hover:text-neon-rose transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
