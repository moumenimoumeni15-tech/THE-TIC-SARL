import React, { useState } from 'react';
import { X, Lock, Mail, UserPlus, LogIn, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { signInWithEmail, signUpWithEmail } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { refreshUser } = useAuth();
  const { showNotification } = useNotification();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUpWithEmail(email, password);
        if (error) throw error;
        showNotification(
          'success',
          'Compte créé avec succès',
          'Bienvenue sur THE TIC MANAGER ! Vous êtes désormais connecté.'
        );
      } else {
        const { error } = await signInWithEmail(email, password);
        if (error) throw error;
        showNotification('success', 'Connexion réussie', 'Bienvenue sur THE TIC MANAGER !');
      }
      await refreshUser();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      showNotification('error', 'Erreur d\'authentification', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const demoEmail = 'responsable.tic@entreprise.com';
      const demoPass = 'password123';
      const { error } = await signInWithEmail(demoEmail, demoPass);
      if (error) throw error;
      showNotification('success', 'Connexion réussie', 'Session de démonstration active.');
      await refreshUser();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={onClose} />

      <div className="relative bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-slate-200/80 shadow-xs flex items-center justify-center shrink-0 p-0.5">
              <img
                src="/logo-128.png"
                alt="THE TIC MANAGER"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {isSignUp ? 'Créer un compte' : 'Connexion'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">THE TIC MANAGER</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Adresse email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@entreprise.com"
                className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-900"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-900"
                required
                minLength={6}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Au moins 6 caractères</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : isSignUp ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Créer mon compte</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Se connecter</span>
              </>
            )}
          </button>
        </form>

        {/* Bouton de connexion rapide en 1 clic */}
        <div className="mt-3">
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            disabled={loading}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Connexion rapide (Mode Test)</span>
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg(null);
            }}
            className="text-xs text-orange-600 hover:text-orange-700 font-semibold cursor-pointer"
          >
            {isSignUp ? 'Déjà un compte ? Se connecter' : 'Pas encore de compte ? S\'inscrire'}
          </button>
        </div>
      </div>
    </div>
  );
};
