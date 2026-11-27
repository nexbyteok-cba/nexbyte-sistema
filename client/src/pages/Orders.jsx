import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ClipboardList,
  Search,
  Filter,
  Eye,
  PlusCircle,
  Phone,
  Clock,
  Calendar,
} from 'lucide-react';
import { api } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';

export function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const statusParam = searchParams.get('status') || '';
  const [selectedStatus, setSelectedStatus] = useState(statusParam);
  const [searchQuery, setSearchQuery] = useState('');

  const statuses = [
    { code: '', label: 'Todos los estados' },
    { code: 'recibido', label: 'Recibido' },
    { code: 'en_control', label: 'En Control' },
    { code: 'pendiente_diagnostico', label: 'Pendiente Diagnóstico' },
    { code: 'diagnosticado', label: 'Diagnosticado' },
    { code: 'esperando_autorizacion', label: 'Esperando Autorización' },
    { code: 'esperando_repuestos', label: 'Esperando Repuestos' },
    { code: 'en_reparacion', label: 'En Reparación' },
    { code: 'en_pruebas', label: 'En Pruebas' },
    { code: 'reparado', label: 'Reparado' },
    { code: 'listo_para_entregar', label: 'Listo para Entregar' },
    { code: 'entregado', label: 'Entregado' },
    { code: 'sin_reparacion', label: 'Sin Reparación' },
    { code: 'cancelado', label: 'Cancelado' },
  ];

  useEffect(() => {
    loadOrders();
  }, [selectedStatus, searchQuery]);

  async function loadOrders() {
    try {
      let url = '/orders?';
      if (selectedStatus) url += `status=${selectedStatus}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;

      const data = await api.get(url);
      setOrders(data);
    } catch (err) {
      console.error('Error cargando órdenes:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleStatusFilterChange = (status) => {
    setSelectedStatus(status);
    if (status) {
      setSearchParams({ status });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-nexblack-border">
        <div>
          <h1 className="text-2xl font-brand font-black uppercase tracking-wider text-white flex items-center space-x-2">
            <ClipboardList className="w-6 h-6 text-nexcyan" />
            <span>Órdenes de <span className="text-nexcyan">Trabajo</span></span>
          </h1>
          <p className="text-xs text-nexgray mt-0.5">
            Trazabilidad integral desde el ingreso hasta la entrega final del equipo
          </p>
        </div>

        <div className="mt-3 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={() => navigate('/recepcion')}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-nexblue to-nexcyan hover:opacity-90 font-bold text-black text-xs uppercase tracking-wider rounded shadow-lumia-accent transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nueva Recepción</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-nexblack-card border border-nexblack-border rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-nexgray absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por N° Orden (NB-...), cliente, teléfono, marca, modelo o serie..."
            className="w-full bg-nexblack border border-nexblack-border rounded pl-10 pr-4 py-2 text-xs text-white placeholder-nexgray/60 focus:outline-none focus:border-nexcyan"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-nexgray" />
          <select
            value={selectedStatus}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
          >
            {statuses.map((s) => (
              <option key={s.code} value={s.code}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Listado de Órdenes */}
      <div className="bg-nexblack-card border border-nexblack-border rounded overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-nexgray">Cargando órdenes de trabajo...</div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-xs text-nexgray">
            No se encontraron órdenes registradas con los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-nexblack-surface text-nexgray uppercase font-bold tracking-wider border-b border-nexblack-border">
                <tr>
                  <th className="py-3 px-4">N° Orden</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Dispositivo</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Plazo / Fechas</th>
                  <th className="py-3 px-4 text-right">Importe / Saldo</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nexblack-border/60 text-nexgray-light">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-nexblack-cardHover transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-nexcyan">
                      {o.order_number}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-white block">{o.first_name} {o.last_name}</span>
                      <span className="text-[10px] text-nexgray flex items-center space-x-1 font-mono">
                        <Phone className="w-2.5 h-2.5" />
                        <span>{o.client_phone}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-white">{o.equipment_type_name} • {o.brand} {o.model}</span>
                      {o.serial_number && <span className="text-[10px] text-nexgray block font-mono">S/N: {o.serial_number}</span>}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={o.current_status} />
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-white block">Ingreso: {new Date(o.reception_date).toLocaleDateString('es-AR')}</span>
                      <span className="text-[10px] text-nexgray block">
                        Est: {o.estimated_completion_date} ({o.estimated_days}d)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-bold text-white block font-mono">${Number(o.total_amount).toLocaleString('es-AR')}</span>
                      {o.balance_amount > 0 ? (
                        <span className="text-[10px] text-red-400 font-bold block font-mono">
                          Resta: ${Number(o.balance_amount).toLocaleString('es-AR')}
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-bold block">Saldado</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => navigate(`/ordenes/${o.id}`)}
                        className="px-3 py-1.5 rounded bg-nexblack hover:bg-nexcyan/20 hover:text-nexcyan text-nexgray border border-nexblack-border font-bold flex items-center space-x-1 ml-auto transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detalle</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
