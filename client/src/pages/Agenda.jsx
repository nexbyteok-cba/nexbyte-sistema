import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Phone,
  Filter,
  Search,
  MessageCircle,
  Copy,
  Check,
  Ban,
  Trash2,
  CheckCircle,
  ArrowRight,
  User,
  AlertTriangle,
  CalendarDays,
  Wrench,
} from 'lucide-react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';

export function Agenda() {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [viewMode, setViewMode] = useState('date'); // 'date' o 'upcoming'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [modalError, setModalError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Formulario
  const [formData, setFormData] = useState({
    client_id: '',
    client_name: '',
    client_phone: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    equipment_type: 'Notebook',
    brand: '',
    model: '',
    service_requested: 'Diagnóstico y Revisión',
    problem_description: '',
    notes: '',
    status: 'pendiente',
  });

  useEffect(() => {
    loadClientsList();
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [selectedDate, statusFilter, viewMode]);

  async function loadClientsList() {
    try {
      const data = await api.get('/clients');
      setClients(data || []);
    } catch (err) {
      console.error('Error cargando clientes:', err);
    }
  }

  async function loadAppointments() {
    try {
      setLoading(true);
      let url = '/appointments?';
      if (viewMode === 'date') {
        url += `date=${selectedDate}`;
      } else {
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        url += `from=${today}&to=${nextWeek}`;
      }

      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }

      const data = await api.get(url);
      setAppointments(data || []);
    } catch (err) {
      console.error('Error cargando turnos:', err);
    } finally {
      setLoading(false);
    }
  }

  // Filtrado en memoria por búsqueda de texto
  const filteredAppointments = appointments.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = (app.client_name || `${app.first_name || ''} ${app.last_name || ''}`).toLowerCase();
    const phone = (app.client_phone || app.client_phone_db || '').toLowerCase();
    const equip = `${app.equipment_type || ''} ${app.brand || ''} ${app.model || ''}`.toLowerCase();
    const service = (app.service_requested || '').toLowerCase();
    return name.includes(q) || phone.includes(q) || equip.includes(q) || service.includes(q);
  });

  const handleOpenCreate = () => {
    setEditingAppointment(null);
    setFormData({
      client_id: '',
      client_name: '',
      client_phone: '',
      date: selectedDate,
      time: '10:00',
      equipment_type: 'Notebook',
      brand: '',
      model: '',
      service_requested: 'Diagnóstico y Revisión',
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
      client_id: app.client_id || '',
      client_name: app.client_name || (app.first_name ? `${app.first_name} ${app.last_name}` : ''),
      client_phone: app.client_phone || app.client_phone_db || '',
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

  const handleSelectClient = (clientId) => {
    if (!clientId) {
      setFormData({ ...formData, client_id: '' });
      return;
    }
    const client = clients.find((c) => String(c.id) === String(clientId));
    if (client) {
      setFormData({
        ...formData,
        client_id: client.id,
        client_name: `${client.first_name} ${client.last_name}`.trim(),
        client_phone: client.phone || '',
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    try {
      setIsProcessing(true);
      if (editingAppointment) {
        await api.put(`/appointments/${editingAppointment.id}`, formData);
      } else {
        await api.post('/appointments', formData);
      }
      setIsModalOpen(false);
      await loadAppointments();
    } catch (err) {
      setModalError(err.message || 'Error al guardar turno.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatusChange = async (app, newStatus) => {
    try {
      await api.put(`/appointments/${app.id}`, { status: newStatus });
      await loadAppointments();
    } catch (err) {
      alert('Error actualizando estado del turno.');
    }
  };

  // Cancelar Turno
  const handleConfirmCancel = async () => {
    if (!appointmentToCancel) return;
    try {
      setIsProcessing(true);
      await api.put(`/appointments/${appointmentToCancel.id}`, { status: 'cancelado' });
      setAppointmentToCancel(null);
      await loadAppointments();
    } catch (err) {
      alert(err.message || 'Error al cancelar el turno.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Eliminar Turno Definitivamente
  const handleConfirmDelete = async () => {
    if (!appointmentToDelete) return;
    try {
      setIsProcessing(true);
      await api.delete(`/appointments/${appointmentToDelete.id}`);
      setAppointmentToDelete(null);
      await loadAppointments();
    } catch (err) {
      alert(err.message || 'Error al eliminar el turno.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Generar texto de recordatorio para WhatsApp
  const generateReminderText = (app) => {
    const clientName = app.client_name || (app.first_name ? `${app.first_name} ${app.last_name}` : 'Estimado/a cliente');
    const [year, month, day] = (app.date || '').split('-');
    const formattedDate = `${day}/${month}/${year}`;
    const deviceText = [app.equipment_type, app.brand, app.model].filter(Boolean).join(' ');

    return `¡Hola ${clientName}! 🔧 Te recordamos tu turno en *NEXBYTE Technical Workshop* programado para el día *${formattedDate}* a las *${app.time} hs* para la atención de tu equipo *${deviceText || 'informático'}*. Te esperamos en nuestro laboratorio. Si necesitas reprogramar o cancelar, por favor avísanos por este medio. ¡Muchas gracias!`;
  };

  // Enviar por WhatsApp
  const handleSendWhatsAppReminder = (app) => {
    const rawPhone = app.client_phone || app.client_phone_db || '';
    let phone = rawPhone.replace(/\D/g, '');
    if (!phone) {
      alert('El turno no tiene un número de teléfono registrado.');
      return;
    }
    if (phone.startsWith('0')) phone = phone.substring(1);
    if (phone.startsWith('15')) phone = phone.substring(2);
    if (!phone.startsWith('549') && !phone.startsWith('54')) {
      phone = '549' + phone;
    }

    const message = generateReminderText(app);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Copiar recordatorio al portapapeles
  const handleCopyReminder = (app) => {
    const message = generateReminderText(app);
    navigator.clipboard.writeText(message);
    setCopiedId(app.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Iniciar Recepción con datos del turno
  const handleStartReception = (app) => {
    navigate('/recepcion', {
      state: {
        clientName: app.client_name || (app.first_name ? `${app.first_name} ${app.last_name}` : ''),
        clientPhone: app.client_phone || app.client_phone_db || '',
        equipmentType: app.equipment_type || 'Notebook',
        brand: app.brand || '',
        model: app.model || '',
        notes: app.problem_description || app.notes || '',
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-nexblack-border gap-4">
        <div>
          <h1 className="text-2xl font-brand font-black uppercase tracking-wider text-white flex items-center space-x-2">
            <CalendarIcon className="w-6 h-6 text-nexcyan" />
            <span>Agenda de <span className="text-nexcyan">Turnos y Citas</span></span>
          </h1>
          <p className="text-xs text-nexgray mt-0.5">
            Registro, recordatorios por WhatsApp, confirmación y cancelación de citas de clientes
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleOpenCreate}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-nexblue to-nexcyan hover:opacity-90 font-bold text-black text-xs uppercase tracking-wider rounded shadow-lumia-accent transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Turno</span>
          </button>
        </div>
      </div>

      {/* Barra de Modos de Vista, Fecha y Filtros */}
      <div className="bg-nexblack-card border border-nexblack-border rounded p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Selector de Modo de Vista */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('date')}
              className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                viewMode === 'date'
                  ? 'bg-nexcyan text-black shadow-sm'
                  : 'bg-nexblack text-nexgray hover:text-white border border-nexblack-border'
              }`}
            >
              Día Específico
            </button>
            <button
              onClick={() => setViewMode('upcoming')}
              className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center space-x-1.5 ${
                viewMode === 'upcoming'
                  ? 'bg-nexcyan text-black shadow-sm'
                  : 'bg-nexblack text-nexgray hover:text-white border border-nexblack-border'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Próximos 7 Días</span>
            </button>
          </div>

          {/* Selector de Fecha (solo activo si modo date) */}
          {viewMode === 'date' && (
            <div className="flex items-center space-x-2">
              <label className="text-xs uppercase font-bold text-nexgray tracking-wider">Fecha:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-nexblack border border-nexblack-border rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-nexcyan font-bold"
              />
              <button
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-3 py-1.5 rounded bg-nexblack hover:bg-nexcyan/20 border border-nexblack-border text-xs text-nexcyan font-bold cursor-pointer"
              >
                Hoy
              </button>
            </div>
          )}

          {/* Filtro de Estado */}
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-nexgray" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-nexblack border border-nexblack-border rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-nexcyan font-bold"
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

        {/* Buscador de turnos */}
        <div className="relative">
          <Search className="w-4 h-4 text-nexgray absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar turno por cliente, teléfono, marca, modelo o servicio..."
            className="w-full bg-nexblack border border-nexblack-border rounded pl-10 pr-4 py-2 text-xs text-white placeholder-nexgray/60 focus:outline-none focus:border-nexcyan"
          />
        </div>
      </div>

      {/* Lista de Turnos */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs text-nexgray">Cargando agenda de turnos...</div>
        ) : filteredAppointments.length === 0 ? (
          <div className="py-12 bg-nexblack-card border border-nexblack-border rounded text-center text-xs text-nexgray">
            No se encontraron turnos para la vista seleccionada.
          </div>
        ) : (
          filteredAppointments.map((app) => (
            <div
              key={app.id}
              className={`bg-nexblack-card border rounded p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                app.status === 'cancelado'
                  ? 'border-red-500/20 opacity-75'
                  : app.status === 'atendido'
                  ? 'border-emerald-500/20'
                  : 'border-nexblack-border hover:border-nexcyan/40'
              }`}
            >
              {/* Información del Turno */}
              <div className="flex items-start space-x-4">
                {/* Cuadrante Horario & Fecha */}
                <div className="flex-shrink-0 w-20 h-16 bg-nexblack-surface border border-nexblack-border rounded flex flex-col items-center justify-center text-center p-1">
                  <span className="text-[10px] text-nexcyan font-bold uppercase tracking-wider block">
                    {app.date ? new Date(app.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' }) : ''}
                  </span>
                  <div className="flex items-center space-x-1 text-white font-mono font-black text-sm">
                    <Clock className="w-3 h-3 text-nexcyan" />
                    <span>{app.time}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <h3 className="text-sm font-bold text-white">
                      {app.client_name || (app.first_name ? `${app.first_name} ${app.last_name}` : 'Cliente')}
                    </h3>
                    <StatusBadge status={app.status} />
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-nexgray mt-1">
                    {(app.client_phone || app.client_phone_db) && (
                      <span className="flex items-center space-x-1 font-mono text-nexcyan font-bold">
                        <Phone className="w-3 h-3" />
                        <span>{app.client_phone || app.client_phone_db}</span>
                      </span>
                    )}
                    <span>• {app.equipment_type} {app.brand} {app.model}</span>
                    {app.service_requested && (
                      <span className="text-white/80">• Servicio: {app.service_requested}</span>
                    )}
                  </div>

                  {app.problem_description && (
                    <p className="text-xs text-nexgray-light mt-1.5 italic bg-nexblack-surface/60 p-2 rounded max-w-2xl">
                      "{app.problem_description}"
                    </p>
                  )}
                </div>
              </div>

              {/* Botones de Acción y Recordatorio */}
              <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                {/* Botón WhatsApp Recordatorio */}
                <button
                  onClick={() => handleSendWhatsAppReminder(app)}
                  title="Enviar recordatorio automático por WhatsApp"
                  className="px-2.5 py-1.5 rounded bg-emerald-600/15 hover:bg-emerald-600/30 border border-emerald-500/40 text-[11px] font-bold text-emerald-300 flex items-center space-x-1 cursor-pointer transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp</span>
                </button>

                {/* Copiar Recordatorio */}
                <button
                  onClick={() => handleCopyReminder(app)}
                  title="Copiar texto del recordatorio al portapapeles"
                  className="p-1.5 rounded bg-nexblack hover:bg-white/10 border border-nexblack-border text-nexgray hover:text-white transition-colors cursor-pointer"
                >
                  {copiedId === app.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Iniciar Recepción (convertir turno a OT) */}
                {app.status !== 'cancelado' && app.status !== 'atendido' && (
                  <button
                    onClick={() => handleStartReception(app)}
                    title="Pasar a recepción de equipo y generar Orden de Trabajo"
                    className="px-2.5 py-1.5 rounded bg-nexblue/20 hover:bg-nexblue/30 border border-nexblue/50 text-[11px] font-bold text-nexcyan flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <Wrench className="w-3 h-3" />
                    <span>Recibir</span>
                  </button>
                )}

                {/* Confirmar Turno */}
                {app.status === 'pendiente' && (
                  <button
                    onClick={() => handleStatusChange(app, 'confirmado')}
                    className="px-2.5 py-1.5 rounded bg-blue-500/20 border border-blue-500/40 text-[11px] font-bold text-blue-300 hover:bg-blue-500/30 cursor-pointer"
                  >
                    Confirmar
                  </button>
                )}

                {/* Marcar Atendido */}
                {app.status !== 'atendido' && app.status !== 'cancelado' && (
                  <button
                    onClick={() => handleStatusChange(app, 'atendido')}
                    className="px-2.5 py-1.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/25 cursor-pointer"
                  >
                    Atendido
                  </button>
                )}

                {/* Cancelar Turno */}
                {app.status !== 'cancelado' && (
                  <button
                    onClick={() => setAppointmentToCancel(app)}
                    title="Cancelar turno del cliente"
                    className="p-1.5 rounded bg-nexblack hover:bg-amber-500/20 border border-nexblack-border text-nexgray hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Editar */}
                <button
                  onClick={() => handleOpenEdit(app)}
                  className="px-2.5 py-1.5 rounded bg-nexblack-surface border border-nexblack-border text-[11px] font-bold text-nexgray-light hover:text-white cursor-pointer"
                >
                  Editar
                </button>

                {/* Eliminar Definitivamente */}
                <button
                  onClick={() => setAppointmentToDelete(app)}
                  title="Eliminar turno definitivamente del sistema"
                  className="p-1.5 rounded bg-nexblack hover:bg-red-500/20 border border-nexblack-border text-nexgray hover:text-red-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL CREAR / EDITAR TURNO */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAppointment ? 'Modificar Turno de Cliente' : 'Registrar Nuevo Turno en Agenda'}
      >
        {modalError && (
          <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded text-xs text-red-400">
            {modalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selector de Cliente Registrado */}
          <div>
            <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">
              Seleccionar Cliente Registrado (Opcional)
            </label>
            <select
              value={formData.client_id}
              onChange={(e) => handleSelectClient(e.target.value)}
              className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan font-bold"
            >
              <option value="">-- Cliente nuevo o ingreso manual --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Cliente / Contacto *</label>
              <input
                type="text"
                required
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                placeholder="Nombre y Apellido"
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Teléfono / WhatsApp *</label>
              <input
                type="text"
                required
                value={formData.client_phone}
                onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                placeholder="Ej: 3511234567"
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Fecha del Turno *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan font-bold"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Hora *</label>
              <input
                type="time"
                required
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Tipo de Dispositivo</label>
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
                placeholder="ASUS, Dell, Sony, HP..."
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Modelo</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="TUF F15, PS5 Slim, Inspiron..."
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Motivo / Servicio Solicitado</label>
            <input
              type="text"
              value={formData.service_requested}
              onChange={(e) => setFormData({ ...formData, service_requested: e.target.value })}
              placeholder="Ej: Mantenimiento térmico, cambio de pasta, diagnóstico sin encendido..."
              className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Problema Manifestado</label>
            <textarea
              rows={2}
              value={formData.problem_description}
              onChange={(e) => setFormData({ ...formData, problem_description: e.target.value })}
              placeholder="Detalle de fallas informadas por el cliente..."
              className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Estado</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan font-bold"
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
              Cerrar
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-5 py-2 rounded bg-gradient-to-r from-nexblue to-nexcyan hover:opacity-90 font-bold text-black text-xs uppercase tracking-wider shadow-lumia-accent cursor-pointer"
            >
              {isProcessing ? 'Guardando...' : editingAppointment ? 'Guardar Cambios' : 'Agendar Turno'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL CANCELAR TURNO */}
      {appointmentToCancel && (
        <Modal
          isOpen={!!appointmentToCancel}
          onClose={() => setAppointmentToCancel(null)}
          title={`Cancelar Turno de ${appointmentToCancel.client_name || 'Cliente'}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-200">
                <span className="font-bold block">¿Confirmás la cancelación de este turno?</span>
                El turno de las <strong>{appointmentToCancel.time} hs</strong> para el día{' '}
                <strong>{appointmentToCancel.date}</strong> pasará al estado <strong>CANCELADO</strong>.
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-nexblack-border">
              <button
                type="button"
                onClick={() => setAppointmentToCancel(null)}
                className="px-3 py-1.5 rounded bg-nexblack hover:bg-white/10 text-xs text-nexgray cursor-pointer"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isProcessing}
                className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs uppercase cursor-pointer"
              >
                {isProcessing ? 'Cancelando...' : 'Confirmar Cancelación'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL ELIMINAR TURNO DEFINITIVAMENTE */}
      {appointmentToDelete && (
        <Modal
          isOpen={!!appointmentToDelete}
          onClose={() => setAppointmentToDelete(null)}
          title={`Eliminar Turno Definitivamente`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-red-500/15 border border-red-500/40 rounded flex items-start space-x-3">
              <Trash2 className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-200">
                <span className="font-bold block text-red-300">¡Acción definitiva!</span>
                Estás a punto de borrar definitivamente el turno de{' '}
                <strong>{appointmentToDelete.client_name || 'Cliente'}</strong> programado para el{' '}
                <strong>{appointmentToDelete.date}</strong> a las <strong>{appointmentToDelete.time} hs</strong>.
                <p className="mt-1 text-white/80">Esta acción limpiará el turno de la base de datos.</p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-nexblack-border">
              <button
                type="button"
                onClick={() => setAppointmentToDelete(null)}
                className="px-3 py-1.5 rounded bg-nexblack hover:bg-white/10 text-xs text-nexgray cursor-pointer"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isProcessing}
                className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                {isProcessing ? 'Eliminando...' : 'Sí, Eliminar Turno'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
