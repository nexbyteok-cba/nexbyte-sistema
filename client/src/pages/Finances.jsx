import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';

export function Finances() {
  const [data, setData] = useState({ movements: [], summary: {} });
  const [loading, setLoading] = useState(true);

  // Filtros
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'ingreso',
    category: 'Venta de accesorios',
    description: '',
    amount: '',
    payment_method: 'efectivo',
    reference_code: '',
    notes: '',
  });

  useEffect(() => {
    loadFinances();
  }, [typeFilter, categoryFilter, fromDate, toDate]);

  async function loadFinances() {
    try {
      let url = '/finances?';
      if (typeFilter) url += `type=${typeFilter}&`;
      if (categoryFilter) url += `category=${categoryFilter}&`;
      if (fromDate) url += `from=${fromDate}&`;
      if (toDate) url += `to=${toDate}&`;

      const res = await api.get(url);
      setData(res);
    } catch (err) {
      console.error('Error cargando finanzas:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.post('/finances', form);
      setIsModalOpen(false);
      setForm({
        date: new Date().toISOString().split('T')[0],
        type: 'ingreso',
        category: 'Venta de accesorios',
        description: '',
        amount: '',
        payment_method: 'efectivo',
        reference_code: '',
        notes: '',
      });
      loadFinances();
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar movimiento.');
    }
  };

  const { movements = [], summary = {} } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-nexblack-border">
        <div>
          <h1 className="text-2xl font-brand font-black uppercase tracking-wider text-white flex items-center space-x-2">
            <DollarSign className="w-6 h-6 text-nexcyan" />
            <span>Administración <span className="text-nexcyan">Financiera</span></span>
          </h1>
          <p className="text-xs text-nexgray mt-0.5">
            Control de ingresos efectivamente cobrados, egresos operativos y rentabilidad
          </p>
        </div>

        <div className="mt-3 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-nexblue to-nexcyan hover:opacity-90 font-bold text-black text-xs uppercase tracking-wider rounded shadow-lumia-accent transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Movimiento</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-nexblack-card border border-emerald-500/30 rounded p-5">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-500/15 rounded text-emerald-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Ingresos Efectivos</span>
              <p className="text-2xl font-black text-white mt-1 font-mono">
                ${Number(summary.totalIncome || 0).toLocaleString('es-AR')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-nexblack-card border border-red-500/30 rounded p-5">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-500/15 rounded text-red-400">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">Egresos Totales</span>
              <p className="text-2xl font-black text-white mt-1 font-mono">
                ${Number(summary.totalExpense || 0).toLocaleString('es-AR')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-nexblack-card border border-nexcyan/40 rounded p-5 bg-gradient-to-br from-nexblack-card to-[#061e38]">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-nexcyan/15 rounded text-nexcyan">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-nexcyan tracking-wider">Resultado Neto</span>
              <p className="text-2xl font-black text-nexcyan mt-1 font-mono">
                ${Number(summary.netResult || 0).toLocaleString('es-AR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-nexblack-card border border-nexblack-border rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Filter className="w-3.5 h-3.5 text-nexgray" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-nexblack border border-nexblack-border rounded px-3 py-1.5 text-xs text-white"
          >
            <option value="">Todos los tipos</option>
            <option value="ingreso">Solo Ingresos</option>
            <option value="egreso">Solo Egresos</option>
          </select>
        </div>

        <div className="flex items-center space-x-2 text-xs text-nexgray">
          <span>Desde:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-nexblack border border-nexblack-border rounded px-2 py-1 text-xs text-white"
          />
          <span>Hasta:</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-nexblack border border-nexblack-border rounded px-2 py-1 text-xs text-white"
          />
        </div>
      </div>

      {/* Tabla de Movimientos */}
      <div className="bg-nexblack-card border border-nexblack-border rounded overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-nexgray">Cargando movimientos...</div>
        ) : movements.length === 0 ? (
          <div className="py-12 text-center text-xs text-nexgray">No hay movimientos financieros registrados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-nexblack-surface text-nexgray uppercase font-bold border-b border-nexblack-border">
                <tr>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Descripción</th>
                  <th className="py-3 px-4">Medio</th>
                  <th className="py-3 px-4 text-right">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nexblack-border/60 text-nexgray-light">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-nexblack-cardHover transition-colors">
                    <td className="py-3 px-4 font-mono">{m.date}</td>
                    <td className="py-3 px-4">
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
                    <td className="py-3 px-4 text-nexgray font-medium">{m.category}</td>
                    <td className="py-3 px-4 font-bold text-white">{m.description}</td>
                    <td className="py-3 px-4 uppercase text-[10px] text-nexgray">{m.payment_method}</td>
                    <td className="py-3 px-4 text-right font-mono font-black">
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

      {/* Modal Nuevo Movimiento */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Movimiento Financiero">
        {errorMsg && <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded text-xs text-red-400">{errorMsg}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white"
              >
                <option value="ingreso">Ingreso</option>
                <option value="egreso">Egreso</option>
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Importe ($) *</label>
              <input
                type="number"
                min="1"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Categoría</label>
              <input
                type="text"
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Servicios, Repuestos..."
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Medio de Pago</label>
              <select
                value={form.payment_method}
                onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white"
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="mercado_pago">Mercado Pago</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Descripción *</label>
            <input
              type="text"
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-nexblack-border">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded bg-nexblack text-xs text-nexgray-light">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2 rounded bg-gradient-to-r from-nexblue to-nexcyan font-bold text-black text-xs uppercase shadow-lumia-accent">
              Guardar Movimiento
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
