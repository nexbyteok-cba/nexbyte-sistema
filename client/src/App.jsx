import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ForcePasswordChangeModal } from './components/ForcePasswordChangeModal';
import {
  ArrowLeft,
  Grid,
  Power,
  Clock,
  Maximize2,
  Minimize2,
  PlusCircle,
  ClipboardList,
  Users,
  Calendar,
  Package,
  Landmark,
  DollarSign,
  BarChart3,
  Settings as SettingsIcon,
  ChevronDown,
} from 'lucide-react';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Reception } from './pages/Reception';
import { Orders } from './pages/Orders';
import { OrderDetail } from './pages/OrderDetail';
import { Clients } from './pages/Clients';
import { Agenda } from './pages/Agenda';
import { Inventory } from './pages/Inventory';
import { CashRegister } from './pages/CashRegister';
import { Finances } from './pages/Finances';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

/**
 * Shell del Sistema Operativo NEXBYTE
 * Sin navbars web tradicionales. Maneja la pantalla Inicio y las aplicaciones a pantalla completa.
 */
function ProtectedLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Escuchar tecla Escape para volver al Inicio al estilo del sistema operativo
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        const activeTag = document.activeElement?.tagName;
        if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA') {
          navigate('/');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#0b0e14] flex flex-col items-center justify-center text-white/60">
        <div className="w-10 h-10 border-4 border-[#0078D7] border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs uppercase font-bold tracking-widest text-[#10DDF2]">Iniciando sistema...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isHome = location.pathname === '/';

  // Si estamos en la pantalla Inicio, mostramos el mosaico completo sin marco
  if (isHome) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-[#0b0e14]">
        <ForcePasswordChangeModal />
        {children}
      </div>
    );
  }

  // Títulos oficiales de las aplicaciones full-screen
  const appTitles = {
    '/recepcion': 'recepción de dispositivos',
    '/ordenes': 'órdenes de trabajo',
    '/clientes': 'base de clientes',
    '/agenda': 'agenda técnica y citas',
    '/inventario': 'inventario y repuestos',
    '/caja': 'caja diaria en taller',
    '/finanzas': 'finanzas y facturación',
    '/reportes': 'reportes y métricas',
    '/configuracion': 'configuración comercial',
  };

  const currentAppPath = Object.keys(appTitles).find(p => location.pathname.startsWith(p)) || '';
  const currentAppTitle = appTitles[currentAppPath] || 'taller técnico';

  const modules = [
    { name: 'Inicio', path: '/', icon: Grid, color: 'bg-[#0078D7]' },
    { name: 'Recepción', path: '/recepcion', icon: PlusCircle, color: 'bg-[#0078D7]' },
    { name: 'Órdenes', path: '/ordenes', icon: ClipboardList, color: 'bg-[#00A4EF]' },
    { name: 'Clientes', path: '/clientes', icon: Users, color: 'bg-[#2B3643]' },
    { name: 'Agenda', path: '/agenda', icon: Calendar, color: 'bg-[#D24726]' },
    { name: 'Inventario', path: '/inventario', icon: Package, color: 'bg-[#D24726]' },
    { name: 'Caja', path: '/caja', icon: Landmark, color: 'bg-[#107C41]' },
    { name: 'Finanzas', path: '/finanzas', icon: DollarSign, color: 'bg-[#00A4EF]' },
    { name: 'Reportes', path: '/reportes', icon: BarChart3, color: 'bg-[#744DA9]' },
    { name: 'Configuración', path: '/configuracion', icon: SettingsIcon, color: 'bg-[#181B20]' },
  ];

  return (
    <div className="w-screen h-screen overflow-y-auto bg-[#0b0e14] text-white flex flex-col selection:bg-[#0078D7] selection:text-white relative">
      <ForcePasswordChangeModal />

      {/* ========================================================
          BARRA SUPERIOR DEL SISTEMA OPERATIVO PARA APLICACIONES
         ======================================================== */}
      <header className="sticky top-0 z-40 bg-[#0b0e14]/95 backdrop-blur-md px-4 sm:px-10 py-3.5 flex items-center justify-between border-b border-white/10 select-none">
        
        {/* Botón Circular de Retroceso (←) y Título de la Aplicación */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            onClick={() => navigate('/')}
            title="Volver a Inicio (Esc)"
            className="w-10 h-10 rounded-full border border-white/20 bg-white/5 hover:bg-[#0078D7] hover:border-[#0078D7] flex items-center justify-center text-white transition-all transform active:scale-95 group shadow-sm cursor-pointer flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </button>

          <div className="flex flex-col">
            <h1 className="font-sans font-light text-xl sm:text-2xl text-white tracking-tight lowercase">
              {currentAppTitle}
            </h1>
            <span className="text-[10px] text-[#10DDF2] -mt-0.5 uppercase tracking-widest font-mono hidden sm:block">
              NEXBYTE TECHNICAL WORKSHOP • "Tu tecnología, como nueva."
            </span>
          </div>
        </div>

        {/* Acciones del Sistema, Conmutador de Módulos y Usuario */}
        <div className="flex items-center space-x-2 sm:space-x-3 relative">
          
          {/* Conmutador Rápido de Módulos (OS App Switcher) */}
          <div className="relative">
            <button
              onClick={() => setShowSwitcher(!showSwitcher)}
              className="py-1.5 px-3 bg-white/5 hover:bg-white/15 border border-white/10 text-white text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Grid className="w-3.5 h-3.5 text-[#10DDF2]" />
              <span className="hidden sm:inline font-sans">Módulos</span>
              <ChevronDown className="w-3 h-3 text-white/60" />
            </button>

            {showSwitcher && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSwitcher(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-[#181B20] border border-white/15 shadow-2xl z-50 p-2 grid grid-cols-2 gap-2 animate-in fade-in zoom-in-95 duration-100">
                  {modules.map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.path}
                        onClick={() => {
                          navigate(m.path);
                          setShowSwitcher(false);
                        }}
                        className={`p-2.5 ${m.color} text-white flex flex-col items-center justify-center text-center transition-all hover:brightness-110 active:scale-95`}
                      >
                        <Icon className="w-5 h-5 mb-1" />
                        <span className="text-[11px] font-sans lowercase">{m.name}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Pantalla completa */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            className="p-2 bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors hidden sm:block"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Botón de Inicio Rápido ⊞ */}
          <button
            onClick={() => navigate('/')}
            title="Ir a Inicio"
            className="p-2 bg-white/5 hover:bg-[#0078D7] text-white/80 hover:text-white transition-colors"
          >
            <Grid className="w-4 h-4" />
          </button>

          {/* Avatar del Usuario */}
          <div className="w-8 h-8 border border-[#10DDF2]/40 overflow-hidden hidden sm:block bg-black">
            <img src="/logo-square.jpg" alt="Perfil" className="w-full h-full object-cover" />
          </div>

          {/* Botón Cerrar Sesión */}
          <button
            onClick={logout}
            title="Cerrar sesión"
            className="p-2 bg-white/5 hover:bg-[#D13438] text-white/70 hover:text-white transition-colors"
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Contenedor de la Aplicación */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6">
        {children}
      </main>

      {/* Barra de Estado Inferior */}
      <footer className="border-t border-white/5 py-2.5 text-center text-[10px] sm:text-[11px] text-white/40 font-mono">
        NEXBYTE TECHNICAL WORKSHOP • Sistema Operativo de Gestión Técnica
      </footer>
    </div>
  );
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#0b0e14] flex flex-col items-center justify-center text-white/60">
        <div className="w-10 h-10 border-4 border-[#0078D7] border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs uppercase font-bold tracking-widest text-[#10DDF2]">Cargando...</span>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedLayout>
                <Dashboard />
              </ProtectedLayout>
            }
          />
          <Route
            path="/recepcion"
            element={
              <ProtectedLayout>
                <Reception />
              </ProtectedLayout>
            }
          />
          <Route
            path="/ordenes"
            element={
              <ProtectedLayout>
                <Orders />
              </ProtectedLayout>
            }
          />
          <Route
            path="/ordenes/:id"
            element={
              <ProtectedLayout>
                <OrderDetail />
              </ProtectedLayout>
            }
          />
          <Route
            path="/clientes"
            element={
              <ProtectedLayout>
                <Clients />
              </ProtectedLayout>
            }
          />
          <Route
            path="/agenda"
            element={
              <ProtectedLayout>
                <Agenda />
              </ProtectedLayout>
            }
          />
          <Route
            path="/inventario"
            element={
              <ProtectedLayout>
                <Inventory />
              </ProtectedLayout>
            }
          />
          <Route
            path="/caja"
            element={
              <ProtectedLayout>
                <CashRegister />
              </ProtectedLayout>
            }
          />
          <Route
            path="/finanzas"
            element={
              <ProtectedLayout>
                <Finances />
              </ProtectedLayout>
            }
          />
          <Route
            path="/reportes"
            element={
              <ProtectedLayout>
                <Reports />
              </ProtectedLayout>
            }
          />
          <Route
            path="/configuracion"
            element={
              <ProtectedLayout>
                <Settings />
              </ProtectedLayout>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
