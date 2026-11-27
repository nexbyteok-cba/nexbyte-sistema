import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  ArrowLeft,
  Clock,
  Wrench,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  User,
  Phone,
  FileText,
  Package,
  Printer,
  ShieldCheck,
  Plus,
  Send,
  Eye,
} from 'lucide-react';
import { api } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { ReceiptPDF } from '../components/ReceiptPDF';

export function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modales
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [isPartOpen, setIsPartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Catálogo de inventario para repuestos
  const [inventoryItems, setInventoryItems] = useState([]);

  // Estados de formularios
  const [statusUpdate, setStatusUpdate] = useState('');
  const [statusNote, setStatusNote] = useState('');

  const [diagnosticForm, setDiagnosticForm] = useState({
    reported_issue: '',
    technical_diagnosis: '',
    tests_performed: '',
    detected_failures: '',
    damaged_components: '',
    proposed_solution: '',
    required_parts: '',
    estimated_cost: 0,
    notes: '',
  });

  const [partForm, setPartForm] = useState({
    item_id: '',
    part_name: '',
    quantity: 1,
    unit_price: 0,
  });

  const [authForm, setAuthForm] = useState({
    authorized_by: '',
    authorization_method: 'WhatsApp',
    authorized_amount: 0,
    notes: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_type: 'pago_parcial',
    payment_method: 'efectivo',
    reference_code: '',
    notes: '',
  });

  const [deliveryForm, setDeliveryForm] = useState({
    delivery_notes: '',
    authorize_debt: false,
    returned_accessories: [],
  });

  const [actionError, setActionError] = useState('');

  useEffect(() => {
    loadOrderDetail();
    loadInventory();
  }, [id]);

  async function loadOrderDetail() {
    try {
      const data = await api.get(`/orders/${id}`);
      setOrder(data);
      setStatusUpdate(data.current_status);

      if (data.diagnostic) {
        setDiagnosticForm({
          reported_issue: data.diagnostic.reported_issue || '',
          technical_diagnosis: data.diagnostic.technical_diagnosis || '',
          tests_performed: data.diagnostic.tests_performed || '',
          detected_failures: data.diagnostic.detected_failures || '',
          damaged_components: data.diagnostic.damaged_components || '',
          proposed_solution: data.diagnostic.proposed_solution || '',
          required_parts: data.diagnostic.required_parts || '',
          estimated_cost: data.diagnostic.estimated_cost || 0,
          notes: data.diagnostic.notes || '',
        });
      }

      if (data.accessories) {
        setDeliveryForm((prev) => ({
          ...prev,
          returned_accessories: data.accessories.map((a) => a.id),
        }));
      }
    } catch (err) {
      console.error('Error cargando orden:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadInventory() {
    try {
      const items = await api.get('/inventory');
      setInventoryItems(items);
    } catch {}
  }

  const handleStatusChangeSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      await api.patch(`/orders/${id}/status`, {
        status: statusUpdate,
        notes: statusNote || `Cambio a estado ${statusUpdate}`,
      });
      setStatusNote('');
      loadOrderDetail();
    } catch (err) {
      setActionError(err.message || 'Error al cambiar estado.');
    }
  };

  const handleSaveDiagnostic = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      await api.post(`/orders/${id}/diagnostic`, diagnosticForm);
      setIsDiagnosticOpen(false);
      loadOrderDetail();
    } catch (err) {
      setActionError(err.message || 'Error al guardar diagnóstico.');
    }
  };

  const handleAddPart = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      await api.post(`/orders/${id}/parts`, partForm);
      setIsPartOpen(false);
      setPartForm({ item_id: '', part_name: '', quantity: 1, unit_price: 0 });
      loadOrderDetail();
    } catch (err) {
      setActionError(err.message || 'Error al agregar repuesto.');
    }
  };

  const handleAddAuth = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      await api.post(`/orders/${id}/authorizations`, authForm);
      setIsAuthOpen(false);
      loadOrderDetail();
    } catch (err) {
      setActionError(err.message || 'Error al registrar autorización.');
    }
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      await api.post(`/payments/order/${id}`, paymentForm);
      setIsPaymentOpen(false);
      setPaymentForm({ amount: '', payment_type: 'pago_parcial', payment_method: 'efectivo', reference_code: '', notes: '' });
      loadOrderDetail();
    } catch (err) {
      setActionError(err.message || 'Error al registrar pago.');
    }
  };

  const handleDeliverySubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      await api.post(`/orders/${id}/delivery`, deliveryForm);
      setIsDeliveryOpen(false);
      loadOrderDetail();
    } catch (err) {
      setActionError(err.message || 'Error al registrar entrega.');
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-nexgray">Cargando orden...</div>;
  }

  if (!order) {
    return <div className="py-12 text-center text-xs text-red-400">Orden de trabajo no encontrada.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-nexblack-border gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/ordenes')}
            className="p-2 rounded bg-nexblack-card hover:bg-nexblack-border text-nexgray hover:text-white border border-nexblack-border"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-mono font-black text-white">
                {order.order_number}
              </h1>
              <StatusBadge status={order.current_status} />
            </div>
            <p className="text-xs text-nexgray mt-0.5">
              Ingreso: {new Date(order.reception_date).toLocaleString('es-AR')} • Técnico: {order.technician_name || 'Admin'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsReceiptModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-nexblack-card hover:bg-nexblack-border border border-nexblack-border text-xs font-bold text-white uppercase"
          >
            <Printer className="w-3.5 h-3.5 text-nexcyan" />
            <span>Comprobante</span>
          </button>
          {order.current_status !== 'entregado' && (
            <button
              onClick={() => setIsDeliveryOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded bg-gradient-to-r from-emerald-500 to-teal-400 hover:opacity-90 text-black text-xs font-black uppercase tracking-wider"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Entregar Equipo</span>
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="p-3 bg-red-500/15 border border-red-500/30 rounded text-xs text-red-400">
          {actionError}
        </div>
      )}

      {/* Grid de 3 Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda */}
        <div className="space-y-6">
          {/* Tarjeta Cliente */}
          <div className="bg-nexblack-card border border-nexblack-border rounded p-5">
            <h2 className="text-xs uppercase font-black tracking-widest text-white pb-2 mb-3 border-b border-nexblack-border flex items-center space-x-2">
              <User className="w-3.5 h-3.5 text-nexcyan" />
              <span className="font-brand text-sm">Cliente</span>
            </h2>
            <p className="font-bold text-sm text-white">{order.first_name} {order.last_name}</p>
            <p className="text-xs font-mono text-nexcyan mt-0.5 font-bold">{order.client_phone}</p>
            {order.client_email && <p className="text-xs text-nexgray mt-0.5">{order.client_email}</p>}
            {order.client_address && <p className="text-[11px] text-nexgray mt-0.5">{order.client_address}</p>}
          </div>

          {/* Tarjeta Dispositivo */}
          <div className="bg-nexblack-card border border-nexblack-border rounded p-5">
            <h2 className="text-xs uppercase font-black tracking-widest text-white pb-2 mb-3 border-b border-nexblack-border flex items-center space-x-2">
              <Package className="w-3.5 h-3.5 text-nexblue" />
              <span className="font-brand text-sm">Dispositivo</span>
            </h2>
            <p className="font-bold text-sm text-white">{order.equipment_type_name}</p>
            <p className="text-xs text-nexgray mt-0.5">{order.brand} {order.model}</p>
            {order.serial_number && <p className="text-xs font-mono text-nexgray mt-0.5">S/N: {order.serial_number}</p>}
            {order.color && <p className="text-[11px] text-nexgray mt-0.5">Color: {order.color}</p>}
          </div>

          {/* Accesorios y Condiciones */}
          <div className="bg-nexblack-card border border-nexblack-border rounded p-5">
            <h2 className="text-xs uppercase font-black tracking-widest text-white pb-2 mb-3 border-b border-nexblack-border flex items-center space-x-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-brand text-sm">Condición de Ingreso</span>
            </h2>

            <div className="mb-3">
              <span className="text-[10px] text-nexgray uppercase font-bold block mb-1">Accesorios recibidos:</span>
              {order.accessories?.length > 0 ? (
                <ul className="list-disc list-inside text-xs text-nexgray-light space-y-0.5">
                  {order.accessories.map((a) => (
                    <li key={a.id}>
                      {a.name} {a.returned ? <span className="text-emerald-400 text-[10px]">(Devuelto)</span> : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-xs text-nexgray italic">Sin accesorios.</span>
              )}
            </div>

            <div className="border-t border-nexblack-border pt-3">
              <span className="text-[10px] text-nexgray uppercase font-bold block mb-1">Estado Físico:</span>
              {order.condition?.has_no_issues ? (
                <p className="text-xs text-emerald-400 font-bold">✓ Sin observaciones físicas aparentes</p>
              ) : (
                <div className="text-[11px] text-red-400 space-y-0.5">
                  {order.condition?.scratches ? <p>• Rayones</p> : null}
                  {order.condition?.dents ? <p>• Golpes / Abolladuras</p> : null}
                  {order.condition?.cracks ? <p>• Roturas</p> : null}
                  {order.condition?.damaged_screen ? <p>• Pantalla dañada</p> : null}
                  {order.condition?.damaged_hinges ? <p>• Bisagras dañadas</p> : null}
                  {order.condition?.visible_humidity ? <p>• Humedad visible</p> : null}
                  {order.condition?.detailed_notes && (
                    <p className="text-nexgray mt-1 italic">"{order.condition.detailed_notes}"</p>
                  )}
                </div>
              )}
            </div>

            {/* Galería de Fotografías */}
            {order.photos && order.photos.length > 0 && (
              <div className="border-t border-nexblack-border pt-3 mt-3">
                <span className="text-[10px] text-nexgray uppercase font-bold block mb-2">Fotos de Recepción:</span>
                <div className="grid grid-cols-2 gap-2">
                  {order.photos.map((ph) => (
                    <a key={ph.id} href={ph.photo_url} target="_blank" rel="noreferrer" className="block rounded overflow-hidden border border-nexblack-border hover:opacity-80">
                      <img src={ph.photo_url} alt={ph.category} className="w-full h-20 object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Columna Central */}
        <div className="lg:col-span-2 space-y-6">
          {/* Selector de Estado */}
          <div className="bg-nexblack-card border border-nexblack-border rounded p-5">
            <h2 className="text-xs uppercase font-black tracking-widest text-white pb-2 mb-3 border-b border-nexblack-border flex items-center space-x-2">
              <Clock className="w-3.5 h-3.5 text-nexcyan" />
              <span className="font-brand text-sm">Control de Flujo de Trabajo</span>
            </h2>

            <form onSubmit={handleStatusChangeSubmit} className="flex flex-col sm:flex-row items-center gap-3">
              <select
                value={statusUpdate}
                onChange={(e) => setStatusUpdate(e.target.value)}
                className="w-full sm:w-60 bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan font-bold"
              >
                <option value="recibido">Recibido</option>
                <option value="en_control">En Control</option>
                <option value="pendiente_diagnostico">Pendiente Diagnóstico</option>
                <option value="diagnosticado">Diagnosticado</option>
                <option value="esperando_autorizacion">Esperando Autorización</option>
                <option value="esperando_repuestos">Esperando Repuestos</option>
                <option value="en_reparacion">En Reparación</option>
                <option value="en_pruebas">En Pruebas</option>
                <option value="reparado">Reparado</option>
                <option value="listo_para_entregar">Listo para Entregar</option>
                <option value="entregado">Entregado</option>
                <option value="sin_reparacion">Sin Reparación</option>
                <option value="cancelado">Cancelado</option>
              </select>

              <input
                type="text"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Observación del cambio de estado..."
                className="w-full flex-1 bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
              />

              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-nexblue to-nexcyan hover:opacity-90 font-bold text-black text-xs uppercase rounded shadow-lumia-accent"
              >
                Actualizar Estado
              </button>
            </form>
          </div>

          {/* Diagnóstico Técnico */}
          <div className="bg-nexblack-card border border-nexblack-border rounded p-5">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-nexblack-border">
              <h2 className="text-xs uppercase font-black tracking-widest text-white flex items-center space-x-2">
                <Wrench className="w-3.5 h-3.5 text-nexcyan" />
                <span className="font-brand text-sm">Diagnóstico Técnico</span>
              </h2>
              <button
                onClick={() => setIsDiagnosticOpen(true)}
                className="px-3 py-1 rounded bg-nexblack hover:bg-nexcyan/20 hover:text-nexcyan text-xs font-bold text-nexgray-light border border-nexblack-border"
              >
                {order.diagnostic ? 'Editar Diagnóstico' : '+ Registrar Diagnóstico'}
              </button>
            </div>

            {order.diagnostic ? (
              <div className="space-y-3 text-xs">
                {order.diagnostic.technical_diagnosis && (
                  <div>
                    <span className="text-[10px] text-nexgray uppercase font-bold">Diagnóstico Profesional:</span>
                    <p className="text-white mt-0.5 bg-nexblack-surface p-2.5 rounded border border-nexblack-border">
                      {order.diagnostic.technical_diagnosis}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-nexgray uppercase font-bold">Fallas Detectadas:</span>
                    <p className="text-red-400 mt-0.5">{order.diagnostic.detected_failures || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-nexgray uppercase font-bold">Solución Propuesta:</span>
                    <p className="text-emerald-400 mt-0.5">{order.diagnostic.proposed_solution || 'N/A'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-nexgray italic py-4 text-center">
                Aún no se ha registrado el diagnóstico técnico para esta orden.
              </p>
            )}
          </div>

          {/* Repuestos */}
          <div className="bg-nexblack-card border border-nexblack-border rounded p-5">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-nexblack-border">
              <h2 className="text-xs uppercase font-black tracking-widest text-white flex items-center space-x-2">
                <Package className="w-3.5 h-3.5 text-nexcyan" />
                <span className="font-brand text-sm">Repuestos e Insumos ({order.parts?.length || 0})</span>
              </h2>
              <button
                onClick={() => setIsPartOpen(true)}
                className="px-3 py-1 rounded bg-nexblack hover:bg-nexcyan/20 hover:text-nexcyan text-xs font-bold text-nexgray-light border border-nexblack-border"
              >
                + Cargar Repuesto
              </button>
            </div>

            {order.parts?.length === 0 ? (
              <p className="text-xs text-nexgray italic py-2 text-center">No se han utilizado repuestos en esta orden.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {order.parts.map((p) => (
                  <div key={p.id} className="p-2.5 bg-nexblack-surface rounded border border-nexblack-border flex justify-between items-center">
                    <div>
                      <span className="font-bold text-white">{p.part_name}</span>
                      <span className="text-[11px] text-nexgray ml-2">Cant: {p.quantity} x ${Number(p.unit_price).toLocaleString('es-AR')}</span>
                    </div>
                    <span className="font-mono font-bold text-nexcyan">${Number(p.total_price).toLocaleString('es-AR')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Finanzas y Pagos */}
          <div className="bg-nexblack-card border border-nexblack-border rounded p-5">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-nexblack-border">
              <h2 className="text-xs uppercase font-black tracking-widest text-white flex items-center space-x-2">
                <DollarSign className="w-3.5 h-3.5 text-nexcyan" />
                <span className="font-brand text-sm">Resumen Económico y Pagos</span>
              </h2>
              {order.balance_amount > 0 && (
                <button
                  onClick={() => setIsPaymentOpen(true)}
                  className="px-3 py-1 rounded bg-gradient-to-r from-nexblue to-nexcyan text-black text-xs font-bold uppercase shadow-lumia-accent"
                >
                  + Cobrar / Seña
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4 text-center">
              <div className="bg-nexblack-surface p-3 rounded border border-nexblack-border">
                <span className="text-[10px] text-nexgray uppercase font-bold">Total Orden</span>
                <p className="text-base font-black text-white mt-1 font-mono">${Number(order.total_amount).toLocaleString('es-AR')}</p>
              </div>
              <div className="bg-nexblack-surface p-3 rounded border border-nexblack-border">
                <span className="text-[10px] text-nexgray uppercase font-bold">Total Abonado</span>
                <p className="text-base font-black text-emerald-400 mt-1 font-mono">${Number(order.paid_amount).toLocaleString('es-AR')}</p>
              </div>
              <div className="bg-nexblack-surface p-3 rounded border border-nexblack-border">
                <span className="text-[10px] text-nexgray uppercase font-bold">Saldo Pendiente</span>
                <p className={`text-base font-black mt-1 font-mono ${order.balance_amount > 0 ? 'text-red-400' : 'text-nexgray'}`}>
                  ${Number(order.balance_amount).toLocaleString('es-AR')}
                </p>
              </div>
            </div>

            {/* Historial de Pagos */}
            <div className="space-y-1.5 text-xs">
              {order.payments?.map((pay) => (
                <div key={pay.id} className="p-2 bg-nexblack-surface rounded border border-nexblack-border flex justify-between items-center text-[11px]">
                  <div>
                    <span className="font-bold uppercase text-white">{pay.payment_type}</span>
                    <span className="text-nexgray ml-2">({pay.payment_method})</span>
                    <span className="text-nexgray ml-2">• {new Date(pay.created_at).toLocaleDateString('es-AR')}</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">+${Number(pay.amount).toLocaleString('es-AR')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Línea de Tiempo de Estados */}
          <div className="bg-nexblack-card border border-nexblack-border rounded p-5">
            <h2 className="text-xs uppercase font-black tracking-widest text-white pb-2 mb-3 border-b border-nexblack-border flex items-center space-x-2">
              <Clock className="w-3.5 h-3.5 text-nexcyan" />
              <span className="font-brand text-sm">Línea de Tiempo de Estados</span>
            </h2>

            <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-nexblack-border">
              {order.statusHistory?.map((hist) => (
                <div key={hist.id} className="pl-6 relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-nexcyan absolute left-1 top-1.5 shadow-[0_0_6px_#10DDF2]" />
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={hist.new_status} />
                    <span className="text-[10px] font-mono text-nexgray">
                      {new Date(hist.created_at).toLocaleString('es-AR')}
                    </span>
                  </div>
                  {hist.notes && <p className="text-xs text-nexgray-light mt-1">{hist.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Diagnóstico */}
      <Modal isOpen={isDiagnosticOpen} onClose={() => setIsDiagnosticOpen(false)} title="Diagnóstico Técnico del Dispositivo">
        <form onSubmit={handleSaveDiagnostic} className="space-y-4">
          <div>
            <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Diagnóstico Técnico *</label>
            <textarea
              rows={3}
              required
              value={diagnosticForm.technical_diagnosis}
              onChange={(e) => setDiagnosticForm({ ...diagnosticForm, technical_diagnosis: e.target.value })}
              placeholder="Explicación técnica detallada del problema detectado..."
              className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Fallas Detectadas</label>
              <input
                type="text"
                value={diagnosticForm.detected_failures}
                onChange={(e) => setDiagnosticForm({ ...diagnosticForm, detected_failures: e.target.value })}
                placeholder="Corto en línea de 19V, pasta seca..."
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Solución Propuesta</label>
              <input
                type="text"
                value={diagnosticForm.proposed_solution}
                onChange={(e) => setDiagnosticForm({ ...diagnosticForm, proposed_solution: e.target.value })}
                placeholder="Reemplazo de MOSFET y mantenimiento..."
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Pruebas Realizadas</label>
              <input
                type="text"
                value={diagnosticForm.tests_performed}
                onChange={(e) => setDiagnosticForm({ ...diagnosticForm, tests_performed: e.target.value })}
                placeholder="Medición con multímetro..."
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Costo Estimado Adicional ($)</label>
              <input
                type="number"
                value={diagnosticForm.estimated_cost}
                onChange={(e) => setDiagnosticForm({ ...diagnosticForm, estimated_cost: e.target.value })}
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-nexblack-border">
            <button type="button" onClick={() => setIsDiagnosticOpen(false)} className="px-4 py-2 rounded bg-nexblack text-xs text-nexgray-light">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2 rounded bg-gradient-to-r from-nexblue to-nexcyan font-bold text-black text-xs uppercase shadow-lumia-accent">
              Guardar Diagnóstico
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Cargar Repuesto */}
      <Modal isOpen={isPartOpen} onClose={() => setIsPartOpen(false)} title="Incorporar Repuesto de Inventario">
        <form onSubmit={handleAddPart} className="space-y-4">
          <div>
            <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Seleccionar desde Inventario</label>
            <select
              value={partForm.item_id}
              onChange={(e) => {
                const selected = inventoryItems.find((it) => String(it.id) === e.target.value);
                if (selected) {
                  setPartForm({
                    ...partForm,
                    item_id: selected.id,
                    part_name: selected.name,
                    unit_price: selected.sale_price,
                  });
                }
              }}
              className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
            >
              <option value="">-- Cargar repuesto del catálogo --</option>
              {inventoryItems.map((it) => (
                <option key={it.id} value={it.id}>
                  [{it.code}] {it.name} (Stock: {it.quantity}) - ${Number(it.sale_price).toLocaleString('es-AR')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Descripción del Repuesto *</label>
            <input
              type="text"
              required
              value={partForm.part_name}
              onChange={(e) => setPartForm({ ...partForm, part_name: e.target.value })}
              className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Cantidad *</label>
              <input
                type="number"
                min="1"
                required
                value={partForm.quantity}
                onChange={(e) => setPartForm({ ...partForm, quantity: e.target.value })}
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Precio Unitario ($) *</label>
              <input
                type="number"
                min="0"
                required
                value={partForm.unit_price}
                onChange={(e) => setPartForm({ ...partForm, unit_price: e.target.value })}
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-nexblack-border">
            <button type="button" onClick={() => setIsPartOpen(false)} className="px-4 py-2 rounded bg-nexblack text-xs text-nexgray-light">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2 rounded bg-gradient-to-r from-nexblue to-nexcyan font-bold text-black text-xs uppercase shadow-lumia-accent">
              Agregar a la Orden
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Registrar Pago */}
      <Modal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} title={`Registrar Pago - Saldo: $${Number(order.balance_amount).toLocaleString('es-AR')}`}>
        <form onSubmit={handleCreatePayment} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Importe ($) *</label>
              <input
                type="number"
                min="1"
                max={order.balance_amount}
                required
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                placeholder={`Máx $${order.balance_amount}`}
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Tipo de Pago</label>
              <select
                value={paymentForm.payment_type}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_type: e.target.value })}
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
              >
                <option value="pago_parcial">Pago Parcial</option>
                <option value="pago_total">Pago Total (Saldar)</option>
                <option value="seña">Seña / Anticipo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Método de Pago</label>
              <select
                value={paymentForm.payment_method}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="mercado_pago">Mercado Pago</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Comprobante / Referencia</label>
              <input
                type="text"
                value={paymentForm.reference_code}
                onChange={(e) => setPaymentForm({ ...paymentForm, reference_code: e.target.value })}
                placeholder="N° operación o ticket..."
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-nexblack-border">
            <button type="button" onClick={() => setIsPaymentOpen(false)} className="px-4 py-2 rounded bg-nexblack text-xs text-nexgray-light">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2 rounded bg-gradient-to-r from-nexblue to-nexcyan font-bold text-black text-xs uppercase shadow-lumia-accent">
              Confirmar Cobro
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Entrega */}
      <Modal isOpen={isDeliveryOpen} onClose={() => setIsDeliveryOpen(false)} title="Registrar Entrega de Dispositivo al Cliente">
        <form onSubmit={handleDeliverySubmit} className="space-y-4">
          {order.balance_amount > 0 && (
            <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded text-xs text-amber-300 space-y-2">
              <div className="flex items-center space-x-2 font-bold">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Atención: La orden tiene un saldo pendiente de ${Number(order.balance_amount).toLocaleString('es-AR')}.</span>
              </div>
              <p>Según el instructivo de NEXBYTE, solo se puede entregar con deuda si el administrador lo autoriza formalmente.</p>
              <label className="flex items-center space-x-2 cursor-pointer font-bold text-white pt-1">
                <input
                  type="checkbox"
                  checked={deliveryForm.authorize_debt}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, authorize_debt: e.target.checked })}
                  className="rounded text-nexcyan focus:ring-0"
                />
                <span>Autorizo expresamente la entrega con saldo pendiente de pago</span>
              </label>
            </div>
          )}

          <div>
            <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">
              Observaciones de Entrega
            </label>
            <textarea
              rows={3}
              value={deliveryForm.delivery_notes}
              onChange={(e) => setDeliveryForm({ ...deliveryForm, delivery_notes: e.target.value })}
              placeholder="Constancia de pruebas realizadas en presencia del cliente..."
              className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-nexblack-border">
            <button type="button" onClick={() => setIsDeliveryOpen(false)} className="px-4 py-2 rounded bg-nexblack text-xs text-nexgray-light">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2 rounded bg-gradient-to-r from-emerald-500 to-teal-400 font-bold text-black text-xs uppercase">
              Confirmar Entrega
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Comprobante PDF */}
      <Modal isOpen={isReceiptModalOpen} onClose={() => setIsReceiptModalOpen(false)} title={`Comprobante de Recepción ${order.order_number}`} maxWidth="max-w-4xl">
        <ReceiptPDF
          orderData={{
            order_number: order.order_number,
            reception_date: order.reception_date,
            client: {
              first_name: order.first_name,
              last_name: order.last_name,
              phone: order.client_phone,
              phone_alt: order.client_phone_alt,
              email: order.client_email,
              dni: order.client_dni,
            },
            equipment: {
              equipment_type_name: order.equipment_type_name,
              brand: order.brand,
              model: order.model,
              serial_number: order.serial_number,
              color: order.color,
              os: order.os,
            },
            services: order.services,
            accessories: order.accessories,
            condition: order.condition,
            signature: order.signature,
            estimated_days: order.estimated_days,
            estimated_completion_date: order.estimated_completion_date,
            total_amount: order.total_amount,
            deposit_amount: order.paid_amount,
            balance_amount: order.balance_amount,
          }}
        />
      </Modal>
    </div>
  );
}
