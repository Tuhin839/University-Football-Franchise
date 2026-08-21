import React, { useState, useEffect } from 'react';
import { useSystemState } from '../../context/SystemStateContext';
import { api } from '../../services/api';
import { Player } from '../../types';
import { Upload, CheckCircle, Shield, User, Image, Trash2 } from 'lucide-react';

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

  const fetchRegisteredPlayers = async () => {
    try {
      const res = await api.get('/players');
      setPlayers(res.data.players);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRegisteredPlayers();
    if (rules?.academicSessions?.length) {
      setAcademicSession(rules.academicSessions[0]);
    }
    if (tiers.length) {
      setTierId(tiers[0].id);
    }
  }, [rules, tiers]);

  const handlePositionToggle = (pos: string) => {
    if (pos === primaryPosition) return;
    if (secondaryPositions.includes(pos)) {
      setSecondaryPositions(secondaryPositions.filter((p) => p !== pos));
    } else {
      setSecondaryPositions([...secondaryPositions, pos]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!imageFile) {
      setErrorMsg('Profile photo is required and will be hosted securely on Cloudinary');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('studentId', studentId);
    formData.append('academicSession', academicSession);
    formData.append('jerseyName', jerseyName);
    formData.append('primaryPosition', primaryPosition);
    formData.append('secondaryPositions', JSON.stringify(secondaryPositions));
    formData.append('tierId', tierId);
    formData.append('image', imageFile);

    setLoading(true);
    try {
      await api.post('/players/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccessMsg('Player registered successfully! Image safely uploaded to Cloudinary.');
      // Reset form
      setName('');
      setStudentId('');
      setJerseyName('');
      setPrimaryPosition('');
      setSecondaryPositions([]);
      setImageFile(null);
      fetchRegisteredPlayers();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (playerId: string) => {
    if (!confirm('Are you sure you want to withdraw your registration? Your media will be deleted.')) return;
    try {
      await api.delete(`/players/${playerId}`);
      fetchRegisteredPlayers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Withdrawal failed');
    }
  };

  const positions = rules?.allowedPositions || ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];

  return (
    <div className="max-w-7xl mx-auto space-y-12 py-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
          Phase 2: Player Registration Portal Open
        </span>
        <h2 className="text-3xl font-black text-white">Join The University Draft</h2>
        <p className="text-xs text-slate-400">
          Register for the upcoming auction draft. Choose your primary and secondary positions, upload your photo, and get classified into player tiers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Registration Form (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-400" />
            <span>Player Registration Form</span>
          </h3>

          {successMsg && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold">
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Student ID</label>
                <input
                  type="text"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. 2024-CSE-042"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Jersey Name</label>
                <input
                  type="text"
                  required
                  value={jerseyName}
                  onChange={(e) => setJerseyName(e.target.value)}
                  placeholder="e.g. MORGAN"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Session</label>
                <select
                  value={academicSession}
                  onChange={(e) => setAcademicSession(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  {rules?.academicSessions?.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Player Tier</label>
              <select
                value={tierId}
                onChange={(e) => setTierId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                {tiers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (Base: ${t.basePrice})
                  </option>
                ))}
              </select>
            </div>

            {/* Position Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Primary Position (Select 1)
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
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                      primaryPosition === pos
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>

              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Secondary Positions (Optional, Multi-Select)
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
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isPrimary
                          ? 'opacity-20 cursor-not-allowed bg-slate-950 text-slate-600'
                          : isSec
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      {pos}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cloudinary Image Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Profile Photo (Cloudinary Cloud Storage)
              </label>
              <input
                type="file"
                accept="image/*"
                required
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer bg-slate-950 border border-slate-800 rounded-xl p-1"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !primaryPosition}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>{loading ? 'Uploading & Registering...' : 'Register for Draft'}</span>
            </button>
          </form>
        </div>

        {/* Registered Players List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Registered Draft Pool ({players.length})</h3>
            <span className="text-xs text-slate-400">Updates allowed during Registration</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-1">
            {players.map((p) => (
              <div
                key={p.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex gap-3 relative group hover:border-slate-700 transition-all"
              >
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-16 h-16 rounded-xl object-cover border border-slate-800 bg-slate-950"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white truncate">{p.name}</h4>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {p.tier?.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">#{p.jerseyName} • {p.studentId}</p>
                  
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-black">
                      {p.primaryPosition} (Primary)
                    </span>
                    {p.secondaryPositions?.map((sp) => (
                      <span key={sp} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                        {sp}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleWithdraw(p.id)}
                  title="Withdraw Registration"
                  className="absolute top-3 right-3 text-slate-600 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
