import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ShieldAlert, Cpu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Credenciales inválidas. Compruebe correo y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-nexblack flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background Cyber Glowing Accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-nexcyan/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-nexblue/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md">
        {/* Brand Header con Isotipo Oficial */}
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-nexcyan shadow-lumia-accent mb-4">
            <img src="/logo-square.jpg" alt="NEXBYTE Logo" className="w-full h-full object-cover" />
          </div>

          <h1 className="text-3xl font-brand font-black tracking-wider text-white uppercase flex items-center justify-center space-x-1">
            <span>NEXBYTE</span>
            <span className="text-nexcyan">MANAGER</span>
          </h1>
          <p className="text-xs uppercase tracking-widest text-nexcyan mt-0.5 font-bold">
            TECHNICAL WORKSHOP
          </p>
          <p className="text-[11px] text-nexgray-light mt-1 font-medium italic">
            "Tu tecnología, como nueva."
          </p>
        </div>

        {/* Card de Inicio de Sesión */}
        <div className="bg-nexblack-card border border-nexblack-border shadow-2xl rounded-lg p-8">
          <div className="flex items-center space-x-2 border-b border-nexblack-border pb-4 mb-6">
            <Lock className="w-5 h-5 text-nexcyan" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Acceso Administrativo
            </h2>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/15 border border-red-500/30 rounded text-xs text-red-400 flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light tracking-wider mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-nexgray absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nexbyte.ok@gmail.com"
                  className="w-full bg-nexblack border border-nexblack-border rounded pl-10 pr-3 py-2 text-sm text-white placeholder-nexgray/50 focus:outline-none focus:border-nexcyan transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-nexgray absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-nexblack border border-nexblack-border rounded pl-10 pr-3 py-2 text-sm text-white placeholder-nexgray/50 focus:outline-none focus:border-nexcyan transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded bg-gradient-to-r from-nexblue to-nexcyan hover:opacity-90 font-black text-black text-xs uppercase tracking-widest shadow-lumia-accent transition-all duration-150 disabled:opacity-50 mt-2"
            >
              {loading ? 'Validando Acceso...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-nexblack-border text-center">
            <p className="text-[11px] text-nexgray flex items-center justify-center space-x-1">
              <Cpu className="w-3.5 h-3.5 text-nexcyan mr-1" />
              <span>NEXBYTE Manager v1.0 • Córdoba, Argentina</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
