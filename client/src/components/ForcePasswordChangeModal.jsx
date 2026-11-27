import React, { useState } from 'react';
import { Lock, AlertTriangle, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function ForcePasswordChangeModal() {
  const { mustChangePassword, changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!mustChangePassword) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }

    try {
      setLoading(true);
      await changePassword(currentPassword, newPassword);
    } catch (err) {
      setError(err.message || 'Error al actualizar contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-nexblack-card border-2 border-nexcyan rounded-lg p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center space-x-3 mb-4 text-nexcyan">
          <div className="p-3 bg-nexcyan/15 rounded">
            <KeyRound className="w-6 h-6 text-nexcyan" />
          </div>
          <div>
            <h2 className="text-lg font-brand font-black uppercase tracking-wider text-white">
              Cambio Obligatorio de Contraseña
            </h2>
            <p className="text-xs text-nexgray">Primer inicio de sesión seguro</p>
          </div>
        </div>

        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded p-3 mb-4 flex items-start space-x-2 text-xs text-cyan-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            Por estrictas políticas de seguridad informática de NEXBYTE, debe cambiar la contraseña inicial temporal antes de acceder al sistema.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">
              Contraseña Temporal Actual
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Contraseña inicial"
              className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-nexcyan"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">
              Nueva Contraseña Personal
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-nexcyan"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">
              Confirmar Nueva Contraseña
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repetir nueva contraseña"
              className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-nexcyan"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded bg-gradient-to-r from-nexblue to-nexcyan hover:opacity-90 font-black text-black text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            {loading ? 'Actualizando seguridad...' : 'Establecer Contraseña y Continuar'}
          </button>
        </form>
      </div>
    </div>
  );
}
