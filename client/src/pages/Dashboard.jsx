import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  Activity,
  CheckCircle2,
  Calendar,
  Users,
  DollarSign,
  AlertTriangle,
  PlusCircle,
  ClipboardList,
  Clock,
  Package,
  Settings,
  ShieldCheck,
  Search,
  Power,
  RefreshCw,
  PieChart,
  Bell,
  Cpu,
  Truck,
  Flame,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { api } from '../api/client';
import { Tile } from '../components/Tile';
import { useAuth } from '../context/AuthContext';

export function Dashboard() {
  const [data, setData] = useState(null);
  const [cashStatus, setCashStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const panoramaRef = useRef(null);

  // Estados de mouse drag para scroll horizontal fluido
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  useEffect(() => {
    loadAllData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function loadAllData() {
    try {
      setLoading(true);
      const [overviewRes, cashRes] = await Promise.all([
        api.get('/reports/overview').catch(() => null),
        api.get('/cash/current').catch(() => null),
      ]);
      if (overviewRes) setData(overviewRes);
      if (cashRes) setCashStatus(cashRes);
    } catch (err) {
      console.error('Error al cargar datos del tablero:', err);
    } finally {
      setLoading(false);
    }
  }

  // Scroll horizontal mediante rueda del ratón (No-passive listener)
  useEffect(() => {
    const el = panoramaRef.current;
    if (!el) return;

    const onWheel = (e) => {
      // Solo en modo apaisado o desktop cuando hay scroll horizontal
      if (window.innerWidth >= 768 && e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * 1.3;
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Navegación por teclado (Flechas izquierda y derecha)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' && panoramaRef.current) {
        panoramaRef.current.scrollBy({ left: 320, behavior: 'smooth' });
      } else if (e.key === 'ArrowLeft' && panoramaRef.current) {
        panoramaRef.current.scrollBy({ left: -320, behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Arrastre con el ratón (Mouse Drag / Swipe)
  const handleMouseDown = (e) => {
    if (e.target.closest('button, [role="button"], a, input')) return;
    isDownRef.current = true;
    startXRef.current = e.pageX - panoramaRef.current.offsetLeft;
    scrollLeftRef.current = panoramaRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDownRef.current = false;
  };

  const handleMouseUp = () => {
    isDownRef.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isDownRef.current) return;
    e.preventDefault();
    const x = e.pageX - panoramaRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    panoramaRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const scrollByAmount = (amount) => {
    if (panoramaRef.current) {
      panoramaRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

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

  const { tiles = {}, recent_activity = [] } = data || {};
  const isCashOpen = cashStatus?.is_open === true || cashStatus?.status === 'abierta';

  const formattedDate = currentTime.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const formattedTime = currentTime.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      style={{
        '--tile-unit': 'clamp(115px, calc((100vh - 190px) / 3), 160px)',
      }}
      className="w-full h-screen bg-[#0b0e14] text-white flex flex-col justify-between select-none overflow-hidden relative"
    >
      {/* ========================================================
          CABECERA PRINCIPAL DEL SISTEMA (START HEADER)
         ======================================================== */}
      <header className="flex items-center justify-between px-6 sm:px-12 pt-6 pb-2 flex-shrink-0 z-20">
        {/* Título Inicio y Marca */}
        <div className="flex items-baseline space-x-4">
          <h1 className="text-4xl sm:text-5xl font-light font-sans tracking-tight text-white">
            Inicio
          </h1>
          <div className="hidden md:flex flex-col">
            <span className="font-rajdhani font-bold text-base tracking-wider text-[#10DDF2]">
              NEXBYTE TECHNICAL WORKSHOP
            </span>
            <span className="text-[10px] uppercase tracking-widest text-white/50 -mt-1 font-medium">
              "Tu tecnología, como nueva."
            </span>
          </div>
        </div>

        {/* Reloj en Vivo, Perfil de Usuario y Acciones Rápidas */}
        <div className="flex items-center space-x-3 sm:space-x-5">
          {/* Reloj y Fecha */}
          <div className="text-right hidden lg:block mr-2">
            <div className="text-sm font-light text-white tracking-wide">
              {formattedTime}
            </div>
            <div className="text-[11px] text-white/50 capitalize">
              {formattedDate}
            </div>
          </div>

          {/* Nombre y Rol */}
          <div className="text-right hidden sm:block">
            <span className="block text-sm font-light text-white leading-tight">
              {user?.full_name || 'Nahuel Silva'}
            </span>
            <span className="block text-[10px] text-white/50 tracking-wider">
              {user?.role === 'admin' ? 'Administrador Taller' : 'Técnico Especialista'}
            </span>
          </div>

          {/* Logo Cuadrado Oficial como Avatar */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 border border-[#10DDF2]/40 overflow-hidden flex-shrink-0 shadow-sm bg-black">
            <img src="/logo-square.jpg" alt="Perfil" className="w-full h-full object-cover" />
          </div>

          {/* Botón Refrescar */}
          <button
            onClick={loadAllData}
            title="Actualizar métricas"
            className="p-2 bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#10DDF2]' : ''}`} />
          </button>

          {/* Botón Pantalla Completa */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            className="p-2 bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors hidden sm:block"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Botón Apagar / Salir */}
          <button
            onClick={logout}
            title="Cerrar sesión"
            className="p-2 bg-white/5 hover:bg-[#D13438] text-white/70 hover:text-white transition-colors"
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Botones de navegación flotantes para scroll horizontal en Desktop */}
      <button
        onClick={() => scrollByAmount(-380)}
        className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-30 w-9 h-14 bg-black/60 hover:bg-[#0078D7] text-white/60 hover:text-white items-center justify-center backdrop-blur-sm transition-all border border-white/10"
        title="Desplazar a la izquierda"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={() => scrollByAmount(380)}
        className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-30 w-9 h-14 bg-black/60 hover:bg-[#0078D7] text-white/60 hover:text-white items-center justify-center backdrop-blur-sm transition-all border border-white/10"
        title="Desplazar a la derecha"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* ========================================================
          LIENZO DE MOSAICOS (PANORAMA CANVAS)
          - Landscape (PC/Tablet): Scroll Horizontal armónico de 3 filas
          - Portrait (Móvil/Vertical): Scroll Vertical tipo Windows Phone
         ======================================================== */}
      <div
        ref={panoramaRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className="flex-1 min-h-0 flex flex-col landscape:flex-row overflow-y-auto landscape:overflow-y-hidden landscape:overflow-x-auto items-stretch landscape:items-center gap-8 sm:gap-10 px-4 sm:px-12 py-4 landscape:py-0 cursor-grab active:cursor-grabbing no-scrollbar scroll-smooth"
      >
        {/* ========================================================
            GRUPO 1: OPERACIONES PRINCIPALES (2 cols x 3 rows)
           ======================================================== */}
        <div className="flex flex-col flex-shrink-0 w-full landscape:w-[calc(var(--tile-unit)*2+10px)] max-w-sm landscape:max-w-none mx-auto landscape:mx-0">
          <div className="mb-2">
            <h2 className="text-xs sm:text-sm font-normal lowercase tracking-tight text-white/70">
              operaciones
            </h2>
          </div>

          <div className="grid grid-cols-2 grid-rows-3 gap-2.5 w-full landscape:h-[calc(var(--tile-unit)*3+20px)]">
            {/* Fila 1: Recepción de Equipos (Wide 2x1) */}
            <Tile
              size="wide"
              color="blue"
              icon={PlusCircle}
              title="recepción de dispositivos"
              count="+"
              subtitle="Nuevo ingreso con comprobante legal, firma táctil y fotografías"
              badge="ACCESO RÁPIDO"
              onClick={() => navigate('/recepcion')}
            />

            {/* Fila 2: Órdenes Activas (Wide 2x1) */}
            <Tile
              size="wide"
              color="cyan"
              icon={ClipboardList}
              title="órdenes activas en taller"
              count={(tiles.in_repair || 0) + (tiles.pending_diagnostic || 0)}
              subtitle="Equipos actualmente en proceso técnico"
              badge="EN TALLER"
              onClick={() => navigate('/ordenes')}
            />

            {/* Fila 3 - Columna 1: 4 Mini-Mosaicos de Acceso Directo */}
            <div className="col-span-1 aspect-square w-full landscape:w-[var(--tile-unit)] landscape:h-[var(--tile-unit)] grid grid-cols-2 gap-2">
              <Tile
                size="small"
                color="red"
                icon={PlusCircle}
                title="Nuevo"
                onClick={() => navigate('/recepcion')}
              />
              <Tile
                size="small"
                color="green"
                icon={DollarSign}
                title="Caja"
                onClick={() => navigate('/caja')}
              />
              <Tile
                size="small"
                color="purple"
                icon={Search}
                title="Buscar"
                onClick={() => navigate('/ordenes')}
              />
              <Tile
                size="small"
                color="lime"
                icon={Calendar}
                title="Turno"
                onClick={() => navigate('/agenda')}
              />
            </div>

            {/* Fila 3 - Columna 2: Urgencias (1x1 Standard) */}
            <Tile
              size="standard"
              color="crimson"
              icon={Flame}
              title="urgencias activas"
              count={tiles.urgent || 0}
              subtitle="Prioridad alta"
              badge={tiles.urgent > 0 ? 'CRÍTICO' : 'NORMAL'}
              badgeColor={tiles.urgent > 0 ? 'red' : 'black'}
              onClick={() => navigate('/ordenes?urgent=1')}
            />
          </div>
        </div>

        {/* ========================================================
            GRUPO 2: LABORATORIO Y CONTROL (2 cols x 3 rows)
           ======================================================== */}
        <div className="flex flex-col flex-shrink-0 w-full landscape:w-[calc(var(--tile-unit)*2+10px)] max-w-sm landscape:max-w-none mx-auto landscape:mx-0">
          <div className="mb-2">
            <h2 className="text-xs sm:text-sm font-normal lowercase tracking-tight text-white/70">
              laboratorio y control
            </h2>
          </div>

          <div className="grid grid-cols-2 grid-rows-3 gap-2.5 w-full landscape:h-[calc(var(--tile-unit)*3+20px)]">
            {/* Fila 1 - Columna 1: Diagnósticos Pendientes (1x1 Standard) */}
            <Tile
              size="standard"
              color="purple"
              icon={Activity}
              title="diagnóstico técnico"
              count={tiles.pending_diagnostic || 0}
              subtitle="Pendientes de revisión técnica"
              onClick={() => navigate('/ordenes?status=pendiente_diagnostico')}
            />

            {/* Fila 1 - Columna 2: Control de Calidad / Pruebas (1x1 Standard) */}
            <Tile
              size="standard"
              color="red"
              icon={CheckCircle2}
              title="control de calidad"
              count={tiles.ready_for_pickup || 0}
              subtitle="Pruebas finales antes de entrega"
              badge="EN PRUEBAS"
              onClick={() => navigate('/ordenes?status=listo_para_entregar')}
            />

            {/* Fila 2 y 3: Laboratorio Central NEXBYTE (Large 2x2) */}
            <Tile
              size="large"
              color="blue"
              icon={Cpu}
              title="laboratorio central nexbyte"
              count={tiles.in_repair || 0}
              subtitle="Equipos en banco de trabajo con intervención de hardware activa"
              liveText="Trazabilidad y Calidad Garantizada"
              onClick={() => navigate('/ordenes?status=en_reparacion')}
            />
          </div>
        </div>

        {/* ========================================================
            GRUPO 3: ADMINISTRACIÓN Y FINANZAS (2 cols x 3 rows)
           ======================================================== */}
        <div className="flex flex-col flex-shrink-0 w-full landscape:w-[calc(var(--tile-unit)*2+10px)] max-w-sm landscape:max-w-none mx-auto landscape:mx-0">
          <div className="mb-2">
            <h2 className="text-xs sm:text-sm font-normal lowercase tracking-tight text-white/70">
              administración
            </h2>
          </div>

          <div className="grid grid-cols-2 grid-rows-3 gap-2.5 w-full landscape:h-[calc(var(--tile-unit)*3+20px)]">
            {/* Fila 1: Caja Diaria (Wide 2x1) */}
            <Tile
              size="wide"
              color={isCashOpen ? 'green' : 'crimson'}
              icon={DollarSign}
              title="caja diaria en taller"
              count={isCashOpen ? 'ABIERTA' : 'CERRADA'}
              subtitle={isCashOpen ? 'Caja activa. Clic para arqueo o movimientos' : 'Clic para iniciar apertura de caja diaria'}
              badge={isCashOpen ? 'ABIERTA' : 'CERRADA'}
              badgeColor={isCashOpen ? 'green' : 'red'}
              onClick={() => navigate('/caja')}
            />

            {/* Fila 2: Ingresos del Mes (Wide 2x1) */}
            <Tile
              size="wide"
              color="cyan"
              icon={Clock}
              title="ingresos mensuales del taller"
              count={`$${(tiles.monthly_income || 0).toLocaleString('es-AR')}`}
              subtitle="Total facturado acumulado en el mes en curso"
              onClick={() => navigate('/finanzas')}
            />

            {/* Fila 3 - Columna 1: Base de Clientes (1x1 Standard) */}
            <Tile
              size="standard"
              color="steel"
              icon={Users}
              title="base de clientes"
              count={tiles.total_clients || 0}
              subtitle="Contactos e historial"
              onClick={() => navigate('/clientes')}
            />

            {/* Fila 3 - Columna 2: Stock Crítico (1x1 Standard) */}
            <Tile
              size="standard"
              color="orange"
              icon={Package}
              title="stock crítico"
              count={tiles.low_stock_items || 0}
              subtitle="Repuestos en alerta"
              badge={tiles.low_stock_items > 0 ? 'ALERTA' : 'NORMAL'}
              badgeColor={tiles.low_stock_items > 0 ? 'red' : 'black'}
              onClick={() => navigate('/inventario')}
            />
          </div>
        </div>

        {/* ========================================================
            GRUPO 4: AGENDA Y HERRAMIENTAS (2 cols x 3 rows)
           ======================================================== */}
        <div className="flex flex-col flex-shrink-0 w-full landscape:w-[calc(var(--tile-unit)*2+10px)] max-w-sm landscape:max-w-none mx-auto landscape:mx-0">
          <div className="mb-2">
            <h2 className="text-xs sm:text-sm font-normal lowercase tracking-tight text-white/70">
              agenda y herramientas
            </h2>
          </div>

          <div className="grid grid-cols-2 grid-rows-3 gap-2.5 w-full landscape:h-[calc(var(--tile-unit)*3+20px)]">
            {/* Fila 1: Turnos de Hoy (Wide 2x1) */}
            <Tile
              size="wide"
              color="orange"
              icon={Calendar}
              title="agenda técnica de turnos"
              count={tiles.today_appointments || 0}
              subtitle="Citas y visitas programadas para hoy"
              badge="TURNOS"
              onClick={() => navigate('/agenda')}
            />

            {/* Fila 2: Rendimiento y Reportes (Wide 2x1) */}
            <Tile
              size="wide"
              color="purple"
              icon={PieChart}
              title="reportes y estadísticas"
              subtitle="Rendimiento del taller, efectividad y tiempos de entrega"
              onClick={() => navigate('/reportes')}
            />

            {/* Fila 3: Configuración Comercial y Técnica (Wide 2x1) */}
            <Tile
              size="wide"
              color="dark"
              icon={Settings}
              title="configuración comercial"
              subtitle="Parámetros del taller, marcas, repuestos y comprobantes"
              onClick={() => navigate('/configuracion')}
            />
          </div>
        </div>

        {/* ========================================================
            GRUPO 5: ACTIVIDAD DEL TALLER EN VIVO (Mosaico Live 3 Filas)
           ======================================================== */}
        <div className="flex flex-col flex-shrink-0 w-full landscape:w-[calc(var(--tile-unit)*2+10px)] max-w-sm landscape:max-w-none mx-auto landscape:mx-0">
          <div className="mb-2">
            <h2 className="text-xs sm:text-sm font-normal lowercase tracking-tight text-white/70">
              actividad del taller
            </h2>
          </div>

          <div className="bg-[#181B20] border border-white/5 p-4 sm:p-4.5 flex flex-col justify-between w-full h-[380px] landscape:h-[calc(var(--tile-unit)*3+20px)] select-none">
            {/* Cabecera del Panel Live */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#10DDF2] flex items-center">
                <span className="w-2 h-2 rounded-full bg-[#10DDF2] animate-ping mr-2" />
                Historial reciente
              </span>
              <span className="text-[10px] text-white/40 font-mono">
                EN VIVO
              </span>
            </div>

            {/* Lista de Eventos Recientes con Scroll Sutil */}
            <div className="flex-1 overflow-y-auto my-2 pr-1 space-y-2 no-scrollbar">
              {recent_activity.length > 0 ? (
                recent_activity.map((act, i) => (
                  <div
                    key={act.id || i}
                    onClick={() => navigate(`/ordenes`)}
                    className="p-2 bg-black/30 hover:bg-[#0078D7]/30 border-l-2 border-[#10DDF2] transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-rajdhani font-bold text-xs text-white">
                        {act.order_number || 'OT'}
                      </span>
                      <span className="text-[9px] text-white/50 font-mono">
                        {act.created_at ? new Date(act.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/80 line-clamp-1 mt-0.5">
                      {act.new_status ? act.new_status.replace(/_/g, ' ') : 'Actualización de orden'}
                    </p>
                    {act.user_name && (
                      <span className="text-[9px] text-[#10DDF2]/70 block truncate">
                        {act.user_name}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-white/40 text-xs py-8">
                  <ShieldCheck className="w-8 h-8 mb-2 opacity-30 text-[#10DDF2]" />
                  <span>Sin eventos pendientes</span>
                  <span className="text-[10px] text-white/30">Taller al día</span>
                </div>
              )}
            </div>

            {/* Accesos Rápidos Inferiores */}
            <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate('/recepcion')}
                className="py-1.5 px-2 bg-[#0078D7] hover:bg-[#087BFF] text-white text-[11px] font-sans font-medium flex items-center justify-center space-x-1 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                <span>NUEVA OT</span>
              </button>
              <button
                onClick={() => navigate('/ordenes')}
                className="py-1.5 px-2 bg-white/10 hover:bg-white/20 text-white text-[11px] font-sans font-medium flex items-center justify-center space-x-1 transition-colors"
              >
                <Search className="w-3.5 h-3.5 mr-1" />
                <span>BUSCAR</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          BARRA DE ESTADO INFERIOR DEL SISTEMA OPERATIVO
         ======================================================== */}
      <footer className="px-6 sm:px-12 py-2 flex items-center justify-between text-[11px] text-white/40 border-t border-white/5 select-none z-10 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <span className="font-mono text-[#10DDF2]/80">
            NEXBYTE Workshop OS • v2.6
          </span>
          <span className="hidden sm:inline-block text-white/20">•</span>
          <span className="hidden sm:inline-block">
            Taller Informático & Servicio Técnico Especializado
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-[10px] uppercase font-mono tracking-wider text-white/60">
            Sistema Conectado
          </span>
        </div>
      </footer>
    </div>
  );
}
