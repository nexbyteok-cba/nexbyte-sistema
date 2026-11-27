import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Lock,
  Unlock,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';

export function CashRegister() {
  const [cashState, setCashState] = useState({ isOpen: false, session: null });
  const [loading, setLoading] = useState(true);

  // Modales
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Formularios
  const [initialBalance, setInitialBalance] = useState('');
  const [openNotes, setOpenNotes] = useState('');

  const [actualBalance, setActualBalance] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

  const [movForm, setMovForm] = useState({
    type: 'egreso',
    category: 'Gastos de taller',
    description: '',
    amount: '',
    payment_method: 'efectivo',
    notes: '',
  });

  useEffect(() => {
    loadCashSession();
  }, []);

  async function loadCashSession() {
    try {
      const data = await api.get('/cash/current');
      setCashState(data);
    } catch (err) {
      console.error('Error cargando caja:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenCash = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.post('/cash/open', {
        initial_balance: parseFloat(initialBalance) || 0,
        notes: openNotes,
      });
      setIsOpenModalOpen(false);
      setInitialBalance('');
      setOpenNotes('');
      loadCashSession();
    } catch (err) {
      setErrorMsg(err.message || 'Error al abrir caja.');
    }
  };

  const handleCloseCash = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.post('/cash/close', {
        actual_balance: parseFloat(actualBalance) || 0,
        notes: closeNotes,
      });
      setIsCloseModalOpen(false);
      setActualBalance('');
      setCloseNotes('');
      loadCashSession();
    } catch (err) {
      setErrorMsg(err.message || 'Error al cerrar caja.');
    }
  };

  const handleAddMovement = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.post('/cash/movement', movForm);
      setIsMovementModalOpen(false);
      setMovForm({
        type: 'egreso',
        category: 'Gastos de taller',
        description: '',
        amount: '',
        payment_method: 'efectivo',
        notes: '',
      });
      loadCashSession();
    } catch (err) {
      setErrorMsg(err.message || 'Error al registrar movimiento.');
    }
  };

  const session = cashState.session;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-nexblack-border">
        <div>
          <h1 className="text-2xl font-brand font-black uppercase tracking-wider text-white flex items-center space-x-2">
            <Landmark className="w-6 h-6 text-nexcyan" />
            <span>Control de <span className="text-nexcyan">Caja</span></span>
          </h1>
          <p className="text-xs text-nexgray mt-0.5">
            Apertura, arqueo, ingresos, egresos diarios y cierre de sesión de efectivo
          </p>
        </div>

        <div className="mt-3 sm:mt-0 flex items-center space-x-3">
          {cashState.isOpen ? (
            <>
              <button
                onClick={() => setIsMovementModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-2 rounded bg-nexblack-card hover:bg-nexblack-border border border-nexblack-border text-xs uppercase font-bold text-white transition-colors"
              >
                <PlusCircle className="w-4 h-4 text-nexcyan" />
                <span>+ Movimiento</span>
              </button>
              <button
                onClick={() => setIsCloseModalOpen(true)}
                className="flex items-center space-x-1.5 px-4 py-2 rounded bg-red-600 hover:bg-red-500 font-bold text-white text-xs uppercase tracking-wider transition-colors shadow-lumia"
              >
                <Lock className="w-4 h-4" />
                <span>Cerrar Caja (Arqueo)</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsOpenModalOpen(true)}
              className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-nexblue to-nexcyan hover:opacity-90 font-bold text-black text-xs uppercase tracking-wider rounded shadow-lumia-accent transition-all"
            >
              <Unlock className="w-4 h-4" />
              <span>Apertura de Caja</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-nexgray">Cargando estado de la caja...</div>
      ) : !cashState.isOpen ? (
        <div className="bg-nexblack-card border border-nexblack-border rounded p-10 text-center space-y-4 max-w-xl mx-auto">
          <div className="w-16 h-16 bg-nexblack-surface rounded-full flex items-center justify-center mx-auto border border-nexblack-border text-nexgray">
            <Lock className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-base font-bold uppercase tracking-wider text-white font-brand text-lg">
            La caja se encuentra actualmente cerrada
          </h2>
          <p className="text-xs text-nexgray leading-relaxed">
            Para registrar cobros en efectivo o registrar gastos de taller, debe iniciar una sesión de caja estableciendo el saldo inicial del día.
          </p>
          <button
            onClick={() => setIsOpenModalOpen(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-nexblue to-nexcyan hover:opacity-90 font-bold text-black text-xs uppercase tracking-wider rounded shadow-lumia-accent inline-flex items-center space-x-2"
          >
            <Unlock className="w-4 h-4" />
            <span>Realizar Apertura Ahora</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Mosaicos de Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-nexblack-card border border-nexblack-border rounded p-4">
              <span className="text-[10px] uppercase font-bold text-nexgray">Saldo Inicial</span>
              <p className="text-2xl font-black text-white mt-1 font-mono">${Number(session.initial_balance).toLocaleString('es-AR')}</p>
              <span className="text-[10px] text-nexgray block mt-0.5">Apertura: {new Date(session.opened_at).toLocaleTimeString('es-AR')}</span>
            </div>

            <div className="bg-nexblack-card border border-emerald-500/30 rounded p-4">
              <span className="text-[10px] uppercase font-bold text-emerald-400">Ingresos Sesión</span>
              <p className="text-2xl font-black text-emerald-400 mt-1 font-mono">+${Number(session.total_in).toLocaleString('es-AR')}</p>
              <span className="text-[10px] text-nexgray block mt-0.5">Cobros de órdenes y señas</span>
            </div>

            <div className="bg-nexblack-card border border-red-500/30 rounded p-4">
              <span className="text-[10px] uppercase font-bold text-red-400">Egresos Sesión</span>
              <p className="text-2xl font-black text-red-400 mt-1 font-mono">-${Number(session.total_out).toLocaleString('es-AR')}</p>
              <span className="text-[10px] text-nexgray block mt-0.5">Retiros o compras menores</span>
            </div>

            <div className="bg-nexblack-card border border-nexcyan/40 rounded p-4 bg-gradient-to-br from-nexblack-card to-[#061e38]">
              <span className="text-[10px] uppercase font-bold text-nexcyan">Saldo Esperado en Caja</span>
              <p className="text-2xl font-black text-nexcyan mt-1 font-mono">${Number(session.expected_balance).toLocaleString('es-AR')}</p>
              <span className="text-[10px] text-nexgray block mt-0.5">Debe coincidir en el arqueo</span>
            </div>
          </div>

          {/* Tabla de Movimientos */}
          <div className="bg-nexblack-card border border-nexblack-border rounded p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-nexblack-border">
              <h2 className="text-xs uppercase font-black tracking-widest text-white flex items-center space-x-2">
                <Clock className="w-3.5 h-3.5 text-nexcyan" />
                <span className="font-brand text-sm">Movimientos de Efectivo de la Sesión Actual ({session.movements?.length || 0})</span>
              </h2>
            </div>

            {session.movements?.length === 0 ? (
              <p className="text-xs text-nexgray italic py-6 text-center">No hay movimientos registrados en esta sesión de caja aún.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-nexblack-surface text-nexgray uppercase font-bold border-b border-nexblack-border">
                    <tr>
                      <th className="py-2.5 px-3">Hora</th>
                      <th className="py-2.5 px-3">Tipo</th>
                      <th className="py-2.5 px-3">Concepto</th>
                      <th className="py-2.5 px-3">Categoría</th>
                      <th className="py-2.5 px-3 text-right">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexblack-border/60 text-nexgray-light">
                    {session.movements.map((m) => (
                      <tr key={m.id} className="hover:bg-nexblack-cardHover transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[11px]">
                          {new Date(m.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-3">
                          {m.type === 'ingreso' ? (
                            <span className="inline-flex items-center text-emerald-400 font-bold uppercase text-[10px]">
                              <ArrowDownRight className="w-3 h-3 mr-0.5" /> Ingreso
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-red-400 font-bold uppercase text-[10px]">
                              <ArrowUpRight className="w-3 h-3 mr-0.5" /> Egreso
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-white">{m.description}</td>
                        <td className="py-2.5 px-3 text-nexgray">{m.category}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          <span className={m.type === 'ingreso' ? 'text-emerald-400' : 'text-red-400'}>
                            {m.type === 'ingreso' ? '+' : '-'}${Number(m.amount).toLocaleString('es-AR')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Apertura */}
      <Modal isOpen={isOpenModalOpen} onClose={() => setIsOpenModalOpen(false)} title="Apertura de Caja Diaria">
        {errorMsg && <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded text-xs text-red-400">{errorMsg}</div>}
        <form onSubmit={handleOpenCash} className="space-y-4">
          <div>
            <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Saldo Inicial en Efectivo ($) *</label>
            <input
              type="number"
              min="0"
              required
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              placeholder="0.00"
              className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-nexcyan font-bold font-mono"
            />
          </div>
          <div>
            <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Observaciones</label>
            <textarea
              rows={2}
              value={openNotes}
              onChange={(e) => setOpenNotes(e.target.value)}
              placeholder="Cambio inicial..."
              className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-3 border-t border-nexblack-border">
            <button type="button" onClick={() => setIsOpenModalOpen(false)} className="px-4 py-2 rounded bg-nexblack text-xs text-nexgray-light">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2 rounded bg-gradient-to-r from-nexblue to-nexcyan font-bold text-black text-xs uppercase shadow-lumia-accent">
              Iniciar Caja
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Cierre */}
      <Modal isOpen={isCloseModalOpen} onClose={() => setIsCloseModalOpen(false)} title="Cierre de Caja y Arqueo">
        {errorMsg && <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded text-xs text-red-400">{errorMsg}</div>}
        <form onSubmit={handleCloseCash} className="space-y-4">
          <div className="p-3 bg-nexblack-surface rounded border border-nexblack-border text-xs flex justify-between">
            <span className="text-nexgray">Saldo Esperado por Sistema:</span>
            <span className="font-mono font-bold text-nexcyan">${Number(session?.expected_balance || 0).toLocaleString('es-AR')}</span>
          </div>

          <div>
            <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Saldo Real Recontado en Mano ($) *</label>
            <input
              type="number"
              min="0"
              required
              value={actualBalance}
              onChange={(e) => setActualBalance(e.target.value)}
              placeholder="Total en efectivo"
              className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-nexcyan font-bold font-mono"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Observaciones del Arqueo</label>
            <textarea
              rows={2}
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
              placeholder="Explicación si hubo diferencias..."
              className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-nexblack-border">
            <button type="button" onClick={() => setIsCloseModalOpen(false)} className="px-4 py-2 rounded bg-nexblack text-xs text-nexgray-light">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2 rounded bg-red-600 font-bold text-white text-xs uppercase">
              Confirmar Cierre y Arqueo
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Movimiento Manual */}
      <Modal isOpen={isMovementModalOpen} onClose={() => setIsMovementModalOpen(false)} title="Registrar Movimiento de Efectivo">
        {errorMsg && <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded text-xs text-red-400">{errorMsg}</div>}
        <form onSubmit={handleAddMovement} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Tipo</label>
              <select
                value={movForm.type}
                onChange={(e) => setMovForm({ ...movForm, type: e.target.value })}
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white"
              >
                <option value="egreso">Egreso (Salida de dinero)</option>
                <option value="ingreso">Ingreso (Entrada de dinero)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Importe ($) *</label>
              <input
                type="number"
                min="1"
                required
                value={movForm.amount}
                onChange={(e) => setMovForm({ ...movForm, amount: e.target.value })}
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Concepto / Motivo *</label>
            <input
              type="text"
              required
              value={movForm.description}
              onChange={(e) => setMovForm({ ...movForm, description: e.target.value })}
              placeholder="Compra de insumos, café..."
              className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Categoría</label>
            <input
              type="text"
              value={movForm.category}
              onChange={(e) => setMovForm({ ...movForm, category: e.target.value })}
              className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-nexblack-border">
            <button type="button" onClick={() => setIsMovementModalOpen(false)} className="px-4 py-2 rounded bg-nexblack text-xs text-nexgray-light">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2 rounded bg-gradient-to-r from-nexblue to-nexcyan font-bold text-black text-xs uppercase shadow-lumia-accent">
              Registrar Movimiento
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
