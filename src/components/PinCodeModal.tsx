import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, ShieldCheck, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { ThemeMode } from '../types';
import { getPlayerPin, setPlayerPin, auth } from '../lib/firebase';

interface PinCodeModalProps {
  isOpen: boolean;
  playerName: string;
  onClose: () => void;
  onSuccess: (verifiedPlayerName: string) => void;
  themeMode: ThemeMode;
  isApproved?: boolean;
}

export const PinCodeModal: React.FC<PinCodeModalProps> = ({
  isOpen,
  playerName,
  onClose,
  onSuccess,
  themeMode,
  isApproved,
}) => {
  const [hasExistingPin, setHasExistingPin] = useState<boolean | null>(null);
  const [pinInput, setPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const isDark = themeMode === 'dark';
  const isSunlight = themeMode === 'sunlight';

  useEffect(() => {
    if (isOpen && playerName) {
      setPinInput('');
      setConfirmPinInput('');
      setError(null);
      setLoading(true);
      getPlayerPin(playerName)
        .then((existing) => {
          setHasExistingPin(!!existing);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, playerName]);

  if (!isOpen || !playerName) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (pinInput.length !== 4 || !/^\d{4}$/.test(pinInput)) {
      setError('PIN code must be exactly 4 numeric digits (e.g. 1234).');
      return;
    }

    if (hasExistingPin) {
      // Validate PIN
      const storedPin = await getPlayerPin(playerName);
      if (storedPin === pinInput) {
        onSuccess(playerName);
        onClose();
      } else {
        setError('Incorrect PIN code for ' + playerName + '. Please try again.');
      }
    } else {
      // Creating a new PIN
      if (pinInput !== confirmPinInput) {
        setError('PIN code and Confirm PIN do not match.');
        return;
      }
      setLoading(true);
      try {
        await setPlayerPin(playerName, pinInput, auth.currentUser?.uid);
        onSuccess(playerName);
        onClose();
      } catch (err: any) {
        setError('Error saving PIN code. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl relative border ${
          isSunlight
            ? 'bg-yellow-50 border-4 border-black text-black'
            : isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-500/10 transition"
        >
          <X className="w-5 h-5 opacity-70" />
        </button>

        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 mb-1">
            <KeyRound className="w-7 h-7 stroke-[2.2]" />
          </div>

          <div>
            <h2 className="text-xl font-black tracking-tight">
              {hasExistingPin ? 'Enter Player PIN' : 'Create 4-Digit PIN'}
            </h2>
            <p className="text-xs opacity-80 mt-1">
              Player: <strong className="text-emerald-600">{playerName}</strong>
            </p>
          </div>

          <p className="text-xs opacity-70 leading-relaxed max-w-[260px]">
            {hasExistingPin
              ? 'Enter your 4-digit PIN code to unlock tournament selection and access your scorecards.'
              : 'Create a 4-digit PIN code for this Player Name to protect your scorecards and enable tournament selection.'}
          </p>

          {error && (
            <div className="w-full p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3 mt-2">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-left mb-1 opacity-80">
                {hasExistingPin ? '4-Digit PIN Code' : 'New 4-Digit PIN'}
              </label>
              <input
                type="password"
                maxLength={4}
                pattern="\d{4}"
                required
                autoFocus
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className={`w-full text-center text-2xl font-black tracking-[0.5em] py-3 rounded-2xl transition focus:outline-none ${
                  isSunlight
                    ? 'bg-yellow-100 border-2 border-black text-black'
                    : isDark
                    ? 'bg-slate-800 border border-slate-700 text-white focus:border-emerald-500'
                    : 'bg-slate-100 border border-slate-300 text-slate-900 focus:border-emerald-600'
                }`}
              />
            </div>

            {!hasExistingPin && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-left mb-1 opacity-80">
                  Confirm 4-Digit PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  pattern="\d{4}"
                  required
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className={`w-full text-center text-2xl font-black tracking-[0.5em] py-3 rounded-2xl transition focus:outline-none ${
                    isSunlight
                      ? 'bg-yellow-100 border-2 border-black text-black'
                      : isDark
                      ? 'bg-slate-800 border border-slate-700 text-white focus:border-emerald-500'
                      : 'bg-slate-100 border border-slate-300 text-slate-900 focus:border-emerald-600'
                  }`}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || pinInput.length !== 4 || (!hasExistingPin && confirmPinInput.length !== 4)}
              className={`w-full py-3.5 mt-2 rounded-2xl font-black text-sm shadow-lg transition active:scale-95 disabled:opacity-50 ${
                isSunlight
                  ? 'bg-black text-white hover:bg-slate-900 border-2 border-black'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
              }`}
            >
              {loading ? 'Verifying...' : hasExistingPin ? 'Unlock & Sign In' : 'Set PIN & Unlock'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
