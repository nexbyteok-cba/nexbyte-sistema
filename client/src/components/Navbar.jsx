import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Wrench,
  Calendar,
  Users,
  ClipboardList,
  Package,
  DollarSign,
  Landmark,
  BarChart3,
  Settings,
  LogOut,
  ShieldCheck,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Wrench },
    { name: 'Recepción', path: '/recepcion', icon: PlusCircle, highlight: true },
    { name: 'Órdenes', path: '/ordenes', icon: ClipboardList },
    { name: 'Clientes', path: '/clientes', icon: Users },
    { name: 'Agenda', path: '/agenda', icon: Calendar },
    { name: 'Inventario', path: '/inventario', icon: Package },
    { name: 'Caja', path: '/caja', icon: Landmark },
    { name: 'Finanzas', path: '/finanzas', icon: DollarSign },
    { name: 'Reportes', path: '/reportes', icon: BarChart3 },
    { name: 'Config', path: '/configuracion', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-nexblack/95 backdrop-blur-md border-b border-nexblack-border shadow-lumia">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo con Isotipo oficial */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-nexcyan/40 shadow-lumia-accent group-hover:scale-105 transition-transform flex-shrink-0">
              <img src="/logo-square.jpg" alt="NEXBYTE Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-baseline space-x-1">
                <span className="font-brand font-black text-xl tracking-wider text-white">NEXBYTE</span>
                <span className="text-[10px] font-bold text-nexcyan uppercase tracking-widest">WORKSHOP</span>
              </div>
              <span className="text-[9px] uppercase tracking-widest text-nexgray block -mt-1 font-medium">
                Tu tecnología, como nueva
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all ${
                    item.highlight
                      ? 'bg-gradient-to-r from-nexblue to-nexcyan text-black hover:opacity-90 font-bold shadow-lumia-accent'
                      : isActive
                      ? 'bg-nexblack-card text-nexcyan border border-nexcyan/40 shadow-[0_0_12px_rgba(16,221,242,0.15)]'
                      : 'text-nexgray-light hover:text-white hover:bg-nexblack-card/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User profile & Logout */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 bg-nexblack-card px-3 py-1.5 rounded border border-nexblack-border text-xs">
              <ShieldCheck className="w-4 h-4 text-nexcyan" />
              <span className="text-white font-medium">{user?.full_name || 'Admin'}</span>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar Sesión"
              className="p-2 rounded bg-nexblack-card hover:bg-red-950/40 border border-nexblack-border hover:border-red-500/50 text-nexgray-light hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile quick scrollable nav */}
        <div className="lg:hidden flex items-center space-x-2 overflow-x-auto py-2 border-t border-nexblack-border/50 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex-shrink-0 flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider ${
                  item.highlight
                    ? 'bg-nexcyan text-black font-bold'
                    : isActive
                    ? 'bg-nexblack-card text-nexcyan border border-nexcyan/50'
                    : 'text-nexgray hover:text-white bg-nexblack-card/40'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
