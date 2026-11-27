import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  FileText,
  Clock,
  Edit2,
  Trash2,
  History,
  AlertCircle,
} from 'lucide-react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';

export function Clients() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientHistory, setClientHistory] = useState(null);
  const [formError, setFormError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    dni: '',
    phone: '',
    phone_alt: '',
    email: '',
    address: '',
    notes: '',
  });

  const [clientToDelete, setClientToDelete] = useState(null);
  const [isDeletingClient, setIsDeletingClient] = useState(false);

  useEffect(() => {
    loadClients();
  }, [search]);

  async function loadClients() {
    try {
      const res = await api.get(`/clients?search=${encodeURIComponent(search)}`);
      setClients(res);
    } catch (err) {
      console.error('Error cargando clientes:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenCreate = () => {
    setSelectedClient(null);
    setFormData({
      first_name: '',
      last_name: '',
      dni: '',
      phone: '',
      phone_alt: '',
      email: '',
      address: '',
      notes: '',
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (client) => {
    setSelectedClient(client);
    setFormData({
      first_name: client.first_name || '',
      last_name: client.last_name || '',
      dni: client.dni || '',
      phone: client.phone || '',
      phone_alt: client.phone_alt || '',
      email: client.email || '',
      address: client.address || '',
      notes: client.notes || '',
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleOpenHistory = async (client) => {
    try {
      const historyData = await api.get(`/clients/${client.id}`);
      setClientHistory(historyData);
      setIsHistoryOpen(true);
    } catch (err) {
      alert('Error cargando historial del cliente.');
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      if (selectedClient) {
        await api.put(`/clients/${selectedClient.id}`, formData);
      } else {
        await api.post('/clients', formData);
      }
      setIsFormOpen(false);
      loadClients();
    } catch (err) {
      setFormError(err.message || 'Error al guardar cliente.');
    }
  };

  const handleDeleteClick = (client) => {
    setClientToDelete(client);
  };

  const handleConfirmDeleteClient = async (hard = false) => {
    if (!clientToDelete) return;
    try {
      setIsDeletingClient(true);
      await api.delete(`/clients/${clientToDelete.id}${hard ? '?hard=true' : ''}`);
      setClientToDelete(null);
      await loadClients();
    } catch (err) {
      alert(err.message || 'Error al eliminar cliente.');
    } finally {
      setIsDeletingClient(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-nexblack-border">
        <div>
          <h1 className="text-2xl font-brand font-black uppercase tracking-wider text-white flex items-center space-x-2">
            <Users className="w-6 h-6 text-nexcyan" />
            <span>Agenda de <span className="text-nexcyan">Clientes</span></span>
          </h1>
          <p className="text-xs text-nexgray mt-0.5">
            Base de datos unificada con verificación anti-duplicados e historial de equipos
          </p>
        </div>

        <div className="mt-3 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={handleOpenCreate}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-nexblue to-nexcyan hover:opacity-90 font-bold text-black text-xs uppercase tracking-wider rounded shadow-lumia-accent transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Cliente</span>
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-nexblack-card border border-nexblack-border rounded p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-nexgray absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, apellido, teléfono, correo o DNI..."
            className="w-full bg-nexblack border border-nexblack-border rounded pl-10 pr-4 py-2 text-sm text-white placeholder-nexgray/60 focus:outline-none focus:border-nexcyan transition-colors"
          />
        </div>
      </div>

      {/* Listado de Clientes */}
      <div className="bg-nexblack-card border border-nexblack-border rounded overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-nexgray">Cargando directorio de clientes...</div>
        ) : clients.length === 0 ? (
          <div className="py-12 text-center text-xs text-nexgray">
            {search ? 'No se encontraron clientes que coincidan con la búsqueda.' : 'No hay clientes registrados aún.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-nexblack-surface text-nexgray uppercase font-bold tracking-wider border-b border-nexblack-border">
                <tr>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Teléfono</th>
                  <th className="py-3 px-4">Correo</th>
                  <th className="py-3 px-4">DNI / Dirección</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nexblack-border/60 text-nexgray-light">
                {clients.map((c) => (
                  <tr key={c.id} className="hover:bg-nexblack-cardHover transition-colors">
                    <td className="py-3 px-4 font-bold text-white">
                      {c.first_name} {c.last_name}
                      {c.notes && <span className="block text-[10px] text-nexgray font-normal">{c.notes}</span>}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-nexcyan">
                      <div className="flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-nexgray" />
                        <span>{c.phone}</span>
                      </div>
                      {c.phone_alt && <span className="text-[10px] text-nexgray block">Alt: {c.phone_alt}</span>}
                    </td>
                    <td className="py-3 px-4">
                      {c.email ? (
                        <div className="flex items-center space-x-1">
                          <Mail className="w-3 h-3 text-nexgray" />
                          <span>{c.email}</span>
                        </div>
                      ) : (
                        <span className="text-nexgray/50 italic">Sin correo</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div>{c.dni ? `DNI: ${c.dni}` : '-'}</div>
                      {c.address && <div className="text-[10px] text-nexgray">{c.address}</div>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenHistory(c)}
                          title="Ver Historial Completo"
                          className="p-1.5 rounded bg-nexblack hover:bg-nexcyan/20 hover:text-nexcyan text-nexgray border border-nexblack-border transition-colors"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          title="Editar Información"
                          className="p-1.5 rounded bg-nexblack hover:bg-nexblue/20 hover:text-nexblue text-nexgray border border-nexblack-border transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(c)}
                          title="Eliminar o dar de baja"
                          className="p-1.5 rounded bg-nexblack hover:bg-red-500/20 hover:text-red-400 text-nexgray border border-nexblack-border transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear / Editar Cliente */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedClient ? 'Editar Cliente' : 'Nuevo Cliente'}
      >
        {formError && (
          <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded text-xs text-red-400 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Nombre *</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Apellido *</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Teléfono Principal *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="351-1234567"
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Teléfono Alternativo</label>
              <input
                type="text"
                value={formData.phone_alt}
                onChange={(e) => setFormData({ ...formData, phone_alt: e.target.value })}
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Correo Electrónico</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="cliente@ejemplo.com"
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">DNI (Opcional)</label>
              <input
                type="text"
                value={formData.dni}
                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Dirección</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Calle, Número, Barrio..."
              className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Observaciones</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas internas sobre el cliente..."
              className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-nexblack-border">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 rounded bg-nexblack hover:bg-nexblack-border text-xs uppercase font-bold text-nexgray-light"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded bg-gradient-to-r from-nexblue to-nexcyan hover:opacity-90 font-bold text-black text-xs uppercase tracking-wider shadow-lumia-accent"
            >
              Guardar Cliente
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Historial Completo */}
      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title={`Historial de ${clientHistory?.first_name} ${clientHistory?.last_name}`}
        maxWidth="max-w-3xl"
      >
        {clientHistory && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-nexblack-surface p-3 rounded border border-nexblack-border text-center">
                <span className="text-[10px] text-nexgray uppercase font-bold">Total Facturado</span>
                <p className="text-base font-black text-white mt-1 font-mono">
                  ${Number(clientHistory.summary?.total_invoiced || 0).toLocaleString('es-AR')}
                </p>
              </div>
              <div className="bg-nexblack-surface p-3 rounded border border-nexblack-border text-center">
                <span className="text-[10px] text-nexgray uppercase font-bold">Total Abonado</span>
                <p className="text-base font-black text-emerald-400 mt-1 font-mono">
                  ${Number(clientHistory.summary?.total_paid || 0).toLocaleString('es-AR')}
                </p>
              </div>
              <div className="bg-nexblack-surface p-3 rounded border border-nexblack-border text-center">
                <span className="text-[10px] text-nexgray uppercase font-bold">Deuda Pendiente</span>
                <p className={`text-base font-black mt-1 font-mono ${clientHistory.summary?.total_pending_debt > 0 ? 'text-red-400' : 'text-nexgray'}`}>
                  ${Number(clientHistory.summary?.total_pending_debt || 0).toLocaleString('es-AR')}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xs uppercase font-bold tracking-wider text-white mb-2 flex items-center space-x-1">
                <FileText className="w-3.5 h-3.5 text-nexcyan" />
                <span className="font-brand">Órdenes de Trabajo Anteriores ({clientHistory.orders?.length || 0})</span>
              </h3>
              {clientHistory.orders?.length === 0 ? (
                <p className="text-xs text-nexgray italic">No tiene órdenes registradas.</p>
              ) : (
                <div className="space-y-2">
                  {clientHistory.orders.map((o) => (
                    <div key={o.id} className="p-3 bg-nexblack-surface border border-nexblack-border rounded flex justify-between items-center text-xs">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white font-mono">{o.order_number}</span>
                          <StatusBadge status={o.current_status} />
                        </div>
                        <p className="text-nexgray mt-0.5">{o.type_name} {o.brand} {o.model}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-white font-mono">${Number(o.total_amount).toLocaleString('es-AR')}</span>
                        {o.balance_amount > 0 && (
                          <span className="block text-[10px] text-red-400 font-bold font-mono">
                            Debe: ${Number(o.balance_amount).toLocaleString('es-AR')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xs uppercase font-bold tracking-wider text-white mb-2 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-nexcyan" />
                <span className="font-brand">Equipos Registrados ({clientHistory.equipment?.length || 0})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {clientHistory.equipment?.map((eq) => (
                  <div key={eq.id} className="p-2.5 bg-nexblack-surface border border-nexblack-border rounded">
                    <p className="font-bold text-white">{eq.type_name} • {eq.brand} {eq.model}</p>
                    {eq.serial_number && <p className="text-[10px] text-nexgray font-mono">S/N: {eq.serial_number}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Eliminar / Desactivar Cliente */}
      {clientToDelete && (
        <Modal
          isOpen={!!clientToDelete}
          onClose={() => setClientToDelete(null)}
          title={`Gestionar Cliente: ${clientToDelete.first_name} ${clientToDelete.last_name}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-red-500/15 border border-red-500/40 rounded flex items-start space-x-3">
              <Trash2 className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-200">
                <span className="font-bold block text-white text-sm mb-1">
                  {clientToDelete.first_name} {clientToDelete.last_name}
                </span>
                <span className="font-mono text-white/80 block mb-2">
                  Tel: {clientToDelete.phone} {clientToDelete.email ? `• ${clientToDelete.email}` : ''}
                </span>
                <p>
                  Si cargaste este cliente por error o deseas limpiar el sistema, podés <strong>eliminarlo definitivamente</strong> de la base de datos.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t border-nexblack-border">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="px-3 py-2 rounded bg-nexblack hover:bg-white/10 text-xs text-nexgray cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDeleteClient(false)}
                disabled={isDeletingClient}
                className="px-3 py-2 rounded bg-nexblack hover:bg-white/15 border border-white/20 text-xs text-white cursor-pointer"
                title="Ocultar de la lista manteniendo órdenes existentes"
              >
                Desactivar (Baja Lógica)
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDeleteClient(true)}
                disabled={isDeletingClient}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
                title="Borrar completamente el cliente de la base de datos"
              >
                {isDeletingClient ? 'Eliminando...' : 'Eliminar Definitivamente'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
