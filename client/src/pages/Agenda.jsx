import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Phone,
  Filter,
} from 'lucide-react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';

export function Agenda() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [modalError, setModalError] = useState('');

  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    equipment_type: 'Notebook',
    brand: '',
    model: '',
    service_requested: 'Diagnóstico',
    problem_description: '',
    notes: '',
    status: 'pendiente',
  });

  useEffect(() => {
    loadAppointments();
  }, [selectedDate, statusFilter]);

  async function loadAppointments() {
    try {
      let url = `/appointments?date=${selectedDate}`;
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      const data = await api.get(url);
      setAppointments(data);
    } catch (err) {
      console.error('Error cargando turnos:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenCreate = () => {
    setEditingAppointment(null);
    setFormData({
      client_name: '',
      client_phone: '',
      date: selectedDate,
      time: '10:00',
      equipment_type: 'Notebook',
      brand: '',
      model: '',
      service_requested: 'Diagnóstico',
      problem_description: '',
      notes: '',
      status: 'pendiente',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (app) => {
    setEditingAppointment(app);
    setFormData({
      client_name: app.client_name || '',
      client_phone: app.client_phone || '',
      date: app.date || selectedDate,
      time: app.time || '10:00',
      equipment_type: app.equipment_type || 'Notebook',
      brand: app.brand || '',
      model: app.model || '',
      service_requested: app.service_requested || '',
      problem_description: app.problem_description || '',
      notes: app.notes || '',
      status: app.status || 'pendiente',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    try {
      if (editingAppointment) {
        await api.put(`/appointments/${editingAppointment.id}`, formData);
      } else {
        await api.post('/appointments', formData);
      }
      setIsModalOpen(false);
      loadAppointments();
    } catch (err) {
      setModalError(err.message || 'Error al guardar turno.');
    }
  };

  const handleStatusChange = async (app, newStatus) => {
    try {
      await api.put(`/appointments/${app.id}`, { status: newStatus });
      loadAppointments();
    } catch (err) {
      alert('Error actualizando estado del turno.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-nexblack-border">
        <div>
          <h1 className="text-2xl font-brand font-black uppercase tracking-wider text-white flex items-center space-x-2">
            <CalendarIcon className="w-6 h-6 text-nexcyan" />
            <span>Agenda y <span className="text-nexcyan">Turnos</span></span>
          </h1>
          <p className="text-xs text-nexgray mt-0.5">
            Gestión de citas técnicas, recepción programada y disponibilidad
          </p>
        </div>

        <div className="mt-3 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={handleOpenCreate}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-nexblue to-nexcyan hover:opacity-90 font-bold text-black text-xs uppercase tracking-wider rounded shadow-lumia-accent transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Turno</span>
          </button>
        </div>
      </div>

      {/* Selector de Fecha y Filtros */}
      <div className="bg-nexblack-card border border-nexblack-border rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <label className="text-xs uppercase font-bold text-nexgray tracking-wider">Fecha:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-nexblack border border-nexblack-border rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-nexcyan"
          />
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-3 py-1.5 rounded bg-nexblack-surface hover:bg-nexblack-border text-xs text-nexcyan font-bold"
          >
            Hoy
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-nexgray" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-nexblack border border-nexblack-border rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-nexcyan"
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="confirmado">Confirmados</option>
            <option value="en_camino">En Camino</option>
            <option value="atendido">Atendidos</option>
            <option value="cancelado">Cancelados</option>
            <option value="ausente">Ausentes</option>
          </select>
        </div>
      </div>

      {/* Lista de Turnos */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs text-nexgray">Cargando turnos...</div>
        ) : appointments.length === 0 ? (
          <div className="py-12 bg-nexblack-card border border-nexblack-border rounded text-center text-xs text-nexgray">
            No hay turnos registrados para el {selectedDate}.
          </div>
        ) : (
          appointments.map((app) => (
            <div
              key={app.id}
              className="bg-nexblack-card border border-nexblack-border hover:border-nexcyan/40 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-16 h-14 bg-nexblack-surface border border-nexblack-border rounded flex flex-col items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-nexcyan mb-0.5" />
                  <span className="text-xs font-mono font-black text-white">{app.time}</span>
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-white">{app.client_name || 'Cliente sin nombre'}</h3>
                    <StatusBadge status={app.status} />
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-nexgray mt-1">
                    {app.client_phone && (
                      <span className="flex items-center space-x-1 font-mono text-nexcyan font-bold">
                        <Phone className="w-3 h-3" />
                        <span>{app.client_phone}</span>
                      </span>
                    )}
                    <span>• {app.equipment_type} {app.brand} {app.model}</span>
                  </div>
                  {app.problem_description && (
                    <p className="text-xs text-nexgray-light mt-1.5 italic bg-nexblack-surface/60 p-2 rounded">
                      "{app.problem_description}"
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-center">
                {app.status === 'pendiente' && (
                  <button
                    onClick={() => handleStatusChange(app, 'confirmado')}
                    className="px-2.5 py-1 rounded bg-blue-500/15 border border-blue-500/30 text-[11px] font-bold text-blue-400 hover:bg-blue-500/25"
                  >
                    Confirmar
                  </button>
                )}
                {app.status !== 'atendido' && app.status !== 'cancelado' && (
                  <button
                    onClick={() => handleStatusChange(app, 'atendido')}
                    className="px-2.5 py-1 rounded bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/25"
                  >
                    Marcar Atendido
                  </button>
                )}
                <button
                  onClick={() => handleOpenEdit(app)}
                  className="px-2.5 py-1 rounded bg-nexblack-surface border border-nexblack-border text-[11px] font-bold text-nexgray-light hover:text-white"
                >
                  Editar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Turno */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAppointment ? 'Modificar Turno' : 'Registrar Nuevo Turno'}
      >
        {modalError && (
          <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded text-xs text-red-400">
            {modalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Cliente / Contacto *</label>
              <input
                type="text"
                required
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                placeholder="Nombre del cliente"
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Teléfono</label>
              <input
                type="text"
                value={formData.client_phone}
                onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                placeholder="351-1234567"
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Fecha *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Hora *</label>
              <input
                type="time"
                required
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Tipo de Equipo</label>
              <select
                value={formData.equipment_type}
                onChange={(e) => setFormData({ ...formData, equipment_type: e.target.value })}
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
              >
                <option value="PC de escritorio">PC de escritorio</option>
                <option value="Notebook">Notebook</option>
                <option value="Consola">Consola</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Marca</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="ASUS, HP, Sony..."
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Modelo</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Inspiron, PS5..."
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Servicio Solicitado</label>
            <input
              type="text"
              value={formData.service_requested}
              onChange={(e) => setFormData({ ...formData, service_requested: e.target.value })}
              placeholder="Limpieza integral, reparación, cambio de pantalla..."
              className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Problema Manifestado</label>
            <textarea
              rows={2}
              value={formData.problem_description}
              onChange={(e) => setFormData({ ...formData, problem_description: e.target.value })}
              placeholder="Descripción del fallo según el cliente..."
              className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Estado</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
            >
              <option value="pendiente">Pendiente</option>
              <option value="confirmado">Confirmado</option>
              <option value="en_camino">En Camino</option>
              <option value="atendido">Atendido</option>
              <option value="cancelado">Cancelado</option>
              <option value="ausente">Ausente</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-nexblack-border">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded bg-nexblack hover:bg-nexblack-border text-xs uppercase font-bold text-nexgray-light"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded bg-gradient-to-r from-nexblue to-nexcyan hover:opacity-90 font-bold text-black text-xs uppercase tracking-wider shadow-lumia-accent"
            >
              {editingAppointment ? 'Actualizar Turno' : 'Registrar Turno'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
