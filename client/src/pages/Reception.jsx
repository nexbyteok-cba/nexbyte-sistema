import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Monitor,
  Laptop,
  Gamepad2,
  Camera,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  User,
  ShieldCheck,
  Plus,
  Printer,
  Download,
  Search,
} from 'lucide-react';
import { api } from '../api/client';
import { SignaturePad } from '../components/SignaturePad';
import { ReceiptPDF } from '../components/ReceiptPDF';

export function Reception() {
  const navigate = useNavigate();

  // Settings & Catalogs
  const [nextOrderNumber, setNextOrderNumber] = useState('NB-2026-00001');
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [equipmentBrands, setEquipmentBrands] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [settings, setSettings] = useState({});
  const [existingClients, setExistingClients] = useState([]);

  // Modo cliente: 'select' o 'new'
  const [clientMode, setClientMode] = useState('select');
  const [selectedClientId, setSelectedClientId] = useState('');

  // Form State
  const [clientData, setClientData] = useState({
    first_name: '',
    last_name: '',
    dni: '',
    phone: '',
    phone_alt: '',
    email: '',
    address: '',
  });

  const [selectedType, setSelectedType] = useState('notebook');
  const [brand, setBrand] = useState('ASUS');
  const [customBrand, setCustomBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [color, setColor] = useState('');
  const [os, setOs] = useState('');
  const [equipmentNotes, setEquipmentNotes] = useState('');

  // Accesorios
  const defaultAccessories = ['Cargador', 'Cable de alimentación', 'HDMI', 'Joystick', 'Batería', 'Funda'];
  const [selectedAccessories, setSelectedAccessories] = useState([]);
  const [extraAccessory, setExtraAccessory] = useState('');

  // Servicios
  const [selectedServices, setSelectedServices] = useState([]);

  // Condiciones físicas (Regla de incompatibilidad)
  const [conditions, setConditions] = useState({
    has_no_issues: true,
    general_condition: 'Excelente / Sin observaciones',
    scratches: false,
    dents: false,
    cracks: false,
    damaged_screen: false,
    damaged_hinges: false,
    missing_screws: false,
    missing_components: false,
    damaged_ports: false,
    previous_tampering: false,
    dirtiness: false,
    visible_humidity: false,
    detailed_notes: '',
  });

  // Fotografías
  const [photos, setPhotos] = useState([]);
  const [photoCategory, setPhotoCategory] = useState('frente');
  const [photoDescription, setPhotoDescription] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Plazo
  const [estimatedDays, setEstimatedDays] = useState(3);
  const [calculatedCompletionDate, setCalculatedCompletionDate] = useState('');

  // Pagos y seña inicial
  const [initialDeposit, setInitialDeposit] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');

  // Firma y Consentimiento
  const [signatureDataUrl, setSignatureDataUrl] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Estados de éxito y comprobante generado
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [generatedReceiptData, setGeneratedReceiptData] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    const days = parseInt(estimatedDays, 10) || 3;
    const dateObj = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    setCalculatedCompletionDate(dateObj.toISOString().split('T')[0]);
  }, [estimatedDays]);

  async function loadInitialData() {
    try {
      const [nextNumRes, settingsRes, clientsRes] = await Promise.all([
        api.get('/reception/next-number'),
        api.get('/settings'),
        api.get('/clients'),
      ]);

      setNextOrderNumber(nextNumRes.nextOrderNumber);
      setEquipmentTypes(settingsRes.equipmentTypes || []);
      setEquipmentBrands(settingsRes.equipmentBrands || []);
      setServiceCategories(settingsRes.serviceCategories || []);
      setSettings(settingsRes.settings || {});
      setExistingClients(clientsRes || []);

      if (settingsRes.serviceCategories?.length > 0) {
        setSelectedServices([settingsRes.serviceCategories[0]]);
      }
    } catch (err) {
      console.error('Error cargando catálogos:', err);
    }
  }

  const currentTypeObj = equipmentTypes.find((t) => t.code === selectedType);
  const availableBrands = equipmentBrands.filter(
    (b) => currentTypeObj && b.equipment_type_id === currentTypeObj.id
  );

  const handleHasNoIssuesToggle = (checked) => {
    if (checked) {
      setConditions({
        ...conditions,
        has_no_issues: true,
        general_condition: 'Excelente / Sin observaciones',
        scratches: false,
        dents: false,
        cracks: false,
        damaged_screen: false,
        damaged_hinges: false,
        missing_screws: false,
        missing_components: false,
        damaged_ports: false,
        previous_tampering: false,
        dirtiness: false,
        visible_humidity: false,
      });
    } else {
      setConditions({
        ...conditions,
        has_no_issues: false,
        general_condition: 'Con observaciones físicas',
      });
    }
  };

  const handleDamageCheckboxChange = (field, checked) => {
    setConditions((prev) => ({
      ...prev,
      [field]: checked,
      has_no_issues: false,
      general_condition: 'Con observaciones físicas',
    }));
  };

  const handleAccessoryToggle = (acc) => {
    if (selectedAccessories.includes(acc)) {
      setSelectedAccessories(selectedAccessories.filter((a) => a !== acc));
    } else {
      setSelectedAccessories([...selectedAccessories, acc]);
    }
  };

  const handleAddExtraAccessory = () => {
    if (extraAccessory.trim() && !selectedAccessories.includes(extraAccessory.trim())) {
      setSelectedAccessories([...selectedAccessories, extraAccessory.trim()]);
      setExtraAccessory('');
    }
  };

  const handleServiceToggle = (serv) => {
    const exists = selectedServices.some((s) => s.id === serv.id);
    if (exists) {
      setSelectedServices(selectedServices.filter((s) => s.id !== serv.id));
    } else {
      setSelectedServices([...selectedServices, serv]);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploadingPhoto(true);
      const formData = new FormData();
      formData.append('photo', file);

      const res = await api.post('/reception/upload-photo', formData);
      setPhotos([
        ...photos,
        {
          photo_url: res.url,
          public_id: res.publicId,
          category: photoCategory,
          description: photoDescription || `Foto de ${photoCategory}`,
        },
      ]);
      setPhotoDescription('');
    } catch (err) {
      alert('Error al subir la fotografía: ' + err.message);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = (idx) => {
    setPhotos(photos.filter((_, i) => i !== idx));
  };

  const totalAmount = selectedServices.reduce((acc, s) => acc + (parseFloat(s.default_price || s.price) || 0), 0);
  const deposit = Math.max(0, parseFloat(initialDeposit) || 0);
  const balance = Math.max(0, totalAmount - deposit);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    let clientPayload = {};
    if (clientMode === 'select') {
      if (!selectedClientId) {
        setFormError('Debe seleccionar un cliente existente o registrar uno nuevo.');
        return;
      }
      clientPayload = { id: selectedClientId };
    } else {
      if (!clientData.first_name || !clientData.last_name || !clientData.phone) {
        setFormError('Complete el nombre, apellido y teléfono del cliente.');
        return;
      }
      clientPayload = clientData;
    }

    if (!model.trim()) {
      setFormError('Debe especificar el modelo del equipo.');
      return;
    }

    if (!signatureDataUrl) {
      setFormError('La firma manuscrita digitalizada del cliente es obligatoria.');
      return;
    }

    if (!agreedToTerms) {
      setFormError('El cliente debe aceptar las condiciones de recepción y consentimiento.');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        client_data: clientPayload,
        equipment_data: {
          equipment_type_id: currentTypeObj ? currentTypeObj.id : 1,
          brand: brand === 'Otra' && customBrand.trim() ? customBrand.trim() : brand,
          model: model.trim(),
          serial_number: serialNumber.trim() || null,
          color: color.trim() || null,
          os: os.trim() || null,
          notes: equipmentNotes.trim() || null,
        },
        services_data: selectedServices.map((s) => ({
          service_id: s.id,
          service_name: s.name,
          price: parseFloat(s.default_price || s.price) || 0,
        })),
        accessories_data: selectedAccessories,
        conditions_data: conditions,
        photos_data: photos,
        estimated_days: estimatedDays,
        signature_data: {
          signature_data_url: signatureDataUrl,
          client_name: clientMode === 'select'
            ? existingClients.find((c) => String(c.id) === String(selectedClientId))?.first_name + ' ' + existingClients.find((c) => String(c.id) === String(selectedClientId))?.last_name
            : `${clientData.first_name} ${clientData.last_name}`,
          client_dni_or_phone: clientMode === 'select'
            ? existingClients.find((c) => String(c.id) === String(selectedClientId))?.phone
            : clientData.phone,
        },
        consent_data: {
          consent_text: settings.receipt_terms || 'Condiciones generales de servicio aceptadas.',
          agreed: true,
        },
        initial_deposit: deposit,
        payment_method: paymentMethod,
      };

      const res = await api.post('/reception', payload);

      const clientObj = clientMode === 'select'
        ? existingClients.find((c) => String(c.id) === String(selectedClientId))
        : clientData;

      setGeneratedReceiptData({
        order_number: res.orderNumber,
        reception_date: new Date().toISOString(),
        client: clientObj,
        equipment: {
          equipment_type_name: currentTypeObj ? currentTypeObj.name : 'Equipo',
          brand: brand === 'Otra' && customBrand.trim() ? customBrand.trim() : brand,
          model: model.trim(),
          serial_number: serialNumber,
          color,
          os,
        },
        services: selectedServices.map((s) => ({ service_name: s.name, price: s.default_price || s.price })),
        accessories: selectedAccessories,
        condition: conditions,
        signature: {
          signature_data_url: signatureDataUrl,
          client_name: `${clientObj.first_name} ${clientObj.last_name}`,
          client_dni_or_phone: clientObj.phone,
        },
        estimated_days: estimatedDays,
        estimated_completion_date: calculatedCompletionDate,
        total_amount: totalAmount,
        deposit_amount: deposit,
        balance_amount: balance,
      });
    } catch (err) {
      setFormError(err.message || 'Error al procesar la recepción.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (generatedReceiptData) {
    return (
      <div className="space-y-6">
        <div className="bg-emerald-500/15 border border-emerald-500/30 rounded p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-emerald-400">
            <CheckCircle className="w-6 h-6 flex-shrink-0" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white font-brand text-base">
                Recepción {generatedReceiptData.order_number} Registrada con Éxito
              </h2>
              <p className="text-xs text-emerald-300">
                El comprobante legal ha sido emitido, firmado y bloqueado para trazabilidad permanente.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setGeneratedReceiptData(null);
                loadInitialData();
              }}
              className="px-4 py-2 rounded bg-nexblack-card hover:bg-nexblack-border text-xs uppercase font-bold text-white border border-nexblack-border"
            >
              Nueva Recepción
            </button>
            <button
              onClick={() => navigate('/ordenes')}
              className="px-4 py-2 rounded bg-gradient-to-r from-nexblue to-nexcyan font-bold text-black text-xs uppercase tracking-wider shadow-lumia-accent"
            >
              Ir a Órdenes
            </button>
          </div>
        </div>

        <ReceiptPDF orderData={generatedReceiptData} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-nexblack-border">
        <div>
          <h1 className="text-2xl font-brand font-black uppercase tracking-wider text-white flex items-center space-x-2">
            <FileText className="w-6 h-6 text-nexcyan" />
            <span>Recepción de <span className="text-nexcyan">Dispositivos</span></span>
          </h1>
          <p className="text-xs text-nexgray mt-0.5">
            Módulo central • Generación de comprobante legal de ingreso y condición física
          </p>
        </div>

        <div className="mt-3 sm:mt-0 flex items-center space-x-3">
          <div className="px-3 py-1.5 rounded bg-nexblack-card border border-nexcyan/40 text-right shadow-lumia">
            <span className="text-[10px] uppercase font-bold text-nexgray block">Identificador Único</span>
            <span className="text-sm font-mono font-black text-nexcyan">{nextOrderNumber}</span>
          </div>
        </div>
      </div>

      {formError && (
        <div className="p-4 bg-red-500/15 border border-red-500/30 rounded text-xs text-red-400 flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. SECCIÓN CLIENTE */}
        <div className="bg-nexblack-card border border-nexblack-border rounded p-5">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-nexblack-border">
            <h2 className="text-xs uppercase font-black tracking-widest text-white flex items-center space-x-2">
              <span className="w-2 h-2 bg-nexcyan rounded-full shadow-[0_0_8px_#10DDF2]"></span>
              <span className="font-brand text-sm">1. Datos del Cliente</span>
            </h2>

            <div className="flex items-center space-x-2 text-xs">
              <button
                type="button"
                onClick={() => setClientMode('select')}
                className={`px-3 py-1 rounded font-bold uppercase tracking-wider transition-colors ${
                  clientMode === 'select' ? 'bg-nexcyan text-black' : 'bg-nexblack text-nexgray hover:text-white'
                }`}
              >
                Buscar Existente
              </button>
              <button
                type="button"
                onClick={() => setClientMode('new')}
                className={`px-3 py-1 rounded font-bold uppercase tracking-wider transition-colors ${
                  clientMode === 'new' ? 'bg-nexcyan text-black' : 'bg-nexblack text-nexgray hover:text-white'
                }`}
              >
                + Nuevo Cliente
              </button>
            </div>
          </div>

          {clientMode === 'select' ? (
            <div className="space-y-3">
              <label className="block text-xs uppercase font-bold text-nexgray-light">Seleccionar Cliente Registrado</label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
              >
                <option value="">-- Seleccionar cliente de la agenda --</option>
                {existingClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name} ({c.phone}) {c.email ? `- ${c.email}` : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  value={clientData.first_name}
                  onChange={(e) => setClientData({ ...clientData, first_name: e.target.value })}
                  placeholder="Ej: Nahuel"
                  className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Apellido *</label>
                <input
                  type="text"
                  required
                  value={clientData.last_name}
                  onChange={(e) => setClientData({ ...clientData, last_name: e.target.value })}
                  placeholder="Ej: Silva"
                  className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Teléfono Principal *</label>
                <input
                  type="text"
                  required
                  value={clientData.phone}
                  onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                  placeholder="351-1234567"
                  className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Teléfono Alternativo</label>
                <input
                  type="text"
                  value={clientData.phone_alt}
                  onChange={(e) => setClientData({ ...clientData, phone_alt: e.target.value })}
                  className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={clientData.email}
                  onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                  placeholder="cliente@gmail.com"
                  className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">DNI (Opcional)</label>
                <input
                  type="text"
                  value={clientData.dni}
                  onChange={(e) => setClientData({ ...clientData, dni: e.target.value })}
                  className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
                />
              </div>
            </div>
          )}
        </div>

        {/* 2. SECCIÓN TIPO DE EQUIPO Y MARCA */}
        <div className="bg-nexblack-card border border-nexblack-border rounded p-5">
          <h2 className="text-xs uppercase font-black tracking-widest text-white pb-3 mb-4 border-b border-nexblack-border flex items-center space-x-2">
            <span className="w-2 h-2 bg-nexcyan rounded-full shadow-[0_0_8px_#10DDF2]"></span>
            <span className="font-brand text-sm">2. Categoría y Marca del Dispositivo</span>
          </h2>

          {/* Selector de Tarjetas Grandes Lumia con Resplandor Cyan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div
              onClick={() => { setSelectedType('pc_escritorio'); setBrand('ASUS'); }}
              className={`p-4 border rounded cursor-pointer transition-all flex flex-col items-center text-center ${
                selectedType === 'pc_escritorio'
                  ? 'border-nexcyan bg-nexcyan/10 text-white shadow-lumia-accent'
                  : 'border-nexblack-border bg-nexblack-surface text-nexgray hover:text-white hover:border-nexcyan/40'
              }`}
            >
              <Monitor className={`w-8 h-8 mb-2 ${selectedType === 'pc_escritorio' ? 'text-nexcyan' : ''}`} />
              <span className="text-xs font-bold uppercase tracking-wider font-brand text-sm">PC de Escritorio</span>
            </div>

            <div
              onClick={() => { setSelectedType('notebook'); setBrand('ASUS'); }}
              className={`p-4 border rounded cursor-pointer transition-all flex flex-col items-center text-center ${
                selectedType === 'notebook'
                  ? 'border-nexcyan bg-nexcyan/10 text-white shadow-lumia-accent'
                  : 'border-nexblack-border bg-nexblack-surface text-nexgray hover:text-white hover:border-nexcyan/40'
              }`}
            >
              <Laptop className={`w-8 h-8 mb-2 ${selectedType === 'notebook' ? 'text-nexcyan' : ''}`} />
              <span className="text-xs font-bold uppercase tracking-wider font-brand text-sm">Notebook</span>
            </div>

            <div
              onClick={() => { setSelectedType('consola'); setBrand('Sony'); }}
              className={`p-4 border rounded cursor-pointer transition-all flex flex-col items-center text-center ${
                selectedType === 'consola'
                  ? 'border-nexcyan bg-nexcyan/10 text-white shadow-lumia-accent'
                  : 'border-nexblack-border bg-nexblack-surface text-nexgray hover:text-white hover:border-nexcyan/40'
              }`}
            >
              <Gamepad2 className={`w-8 h-8 mb-2 ${selectedType === 'consola' ? 'text-nexcyan' : ''}`} />
              <span className="text-xs font-bold uppercase tracking-wider font-brand text-sm">Consola de Juegos</span>
            </div>
          </div>

          {/* Especificaciones del Equipo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Marca Precargada</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
              >
                {availableBrands.map((b) => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
                <option value="Otra">Otra Marca</option>
              </select>
            </div>

            {brand === 'Otra' && (
              <div>
                <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Especificar Marca</label>
                <input
                  type="text"
                  required
                  value={customBrand}
                  onChange={(e) => setCustomBrand(e.target.value)}
                  placeholder="Nombre de la marca..."
                  className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
                />
              </div>
            )}

            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Modelo Exacto *</label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Ej: TUF Gaming F15 / PS5 Slim"
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Número de Serie (S/N)</label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="Serial del fabricante..."
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan font-mono"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Color</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Negro, Gris, Blanco..."
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Sistema Operativo</label>
              <input
                type="text"
                value={os}
                onChange={(e) => setOs(e.target.value)}
                placeholder="Windows 11, Linux, N/A..."
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
              />
            </div>
          </div>
        </div>

        {/* 3. SECCIÓN ACCESORIOS Y SERVICIOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Accesorios */}
          <div className="bg-nexblack-card border border-nexblack-border rounded p-5">
            <h2 className="text-xs uppercase font-black tracking-widest text-white pb-3 mb-4 border-b border-nexblack-border flex items-center space-x-2">
              <span className="w-2 h-2 bg-nexcyan rounded-full"></span>
              <span className="font-brand text-sm">3. Accesorios Entregados</span>
            </h2>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {defaultAccessories.map((acc) => (
                <label key={acc} className="flex items-center space-x-2 text-xs text-nexgray-light cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedAccessories.includes(acc)}
                    onChange={() => handleAccessoryToggle(acc)}
                    className="rounded bg-nexblack border-nexblack-border text-nexcyan focus:ring-0"
                  />
                  <span>{acc}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-nexblack-border">
              <input
                type="text"
                value={extraAccessory}
                onChange={(e) => setExtraAccessory(e.target.value)}
                placeholder="Otro accesorio..."
                className="flex-1 bg-nexblack border border-nexblack-border rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-nexcyan"
              />
              <button
                type="button"
                onClick={handleAddExtraAccessory}
                className="px-3 py-1.5 rounded bg-nexblack-surface hover:bg-nexblack-border text-xs text-nexcyan font-bold"
              >
                + Agregar
              </button>
            </div>
          </div>

          {/* Servicios Solicitados */}
          <div className="bg-nexblack-card border border-nexblack-border rounded p-5">
            <h2 className="text-xs uppercase font-black tracking-widest text-white pb-3 mb-4 border-b border-nexblack-border flex items-center space-x-2">
              <span className="w-2 h-2 bg-nexcyan rounded-full"></span>
              <span className="font-brand text-sm">4. Servicios Solicitados</span>
            </h2>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {serviceCategories.map((serv) => {
                const isChecked = selectedServices.some((s) => s.id === serv.id);
                return (
                  <div
                    key={serv.id}
                    onClick={() => handleServiceToggle(serv)}
                    className={`p-2.5 rounded border text-xs cursor-pointer flex justify-between items-center transition-colors ${
                      isChecked
                        ? 'border-nexcyan/60 bg-nexcyan/10 text-white shadow-sm'
                        : 'border-nexblack-border bg-nexblack-surface text-nexgray hover:border-nexcyan/30'
                    }`}
                  >
                    <div>
                      <span className="font-bold">{serv.name}</span>
                      {serv.description && <p className="text-[10px] text-nexgray line-clamp-1">{serv.description}</p>}
                    </div>
                    <span className="font-mono font-bold text-nexcyan">${Number(serv.default_price || 0).toLocaleString('es-AR')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. CONDICIÓN FÍSICA AL MOMENTO DE LA RECEPCIÓN */}
        <div className="bg-nexblack-card border border-nexblack-border rounded p-5">
          <h2 className="text-xs uppercase font-black tracking-widest text-white pb-3 mb-4 border-b border-nexblack-border flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-nexcyan rounded-full shadow-[0_0_8px_#10DDF2]"></span>
              <span className="font-brand text-sm">5. ESTADO DEL EQUIPO AL MOMENTO DE LA RECEPCIÓN</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-cyan-400 bg-cyan-500/15 px-2 py-0.5 rounded border border-cyan-500/30">
              Apartado Obligatorio
            </span>
          </h2>

          <div className="p-3 mb-4 rounded bg-emerald-500/10 border border-emerald-500/30">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={conditions.has_no_issues}
                onChange={(e) => handleHasNoIssuesToggle(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-0"
              />
              <span className="text-xs font-bold text-emerald-300">
                El equipo se recibe sin observaciones físicas aparentes (Incompatible con daños o roturas)
              </span>
            </label>
          </div>

          <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 transition-opacity ${conditions.has_no_issues ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            {[
              { field: 'scratches', label: 'Rayones / Desgaste' },
              { field: 'dents', label: 'Golpes / Abolladuras' },
              { field: 'cracks', label: 'Roturas en chasis' },
              { field: 'damaged_screen', label: 'Pantalla dañada' },
              { field: 'damaged_hinges', label: 'Bisagras dañadas' },
              { field: 'missing_screws', label: 'Tornillos faltantes' },
              { field: 'missing_components', label: 'Componentes faltantes' },
              { field: 'damaged_ports', label: 'Puertos USB/Carga dañados' },
              { field: 'previous_tampering', label: 'Manipulación anterior' },
              { field: 'dirtiness', label: 'Suciedad visible' },
              { field: 'visible_humidity', label: 'Humedad o líquidos' },
            ].map(({ field, label }) => (
              <label key={field} className="flex items-center space-x-2 text-xs text-nexgray-light cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={Boolean(conditions[field])}
                  onChange={(e) => handleDamageCheckboxChange(field, e.target.checked)}
                  className="rounded bg-nexblack border-nexblack-border text-red-500 focus:ring-0"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-nexblack-border">
            <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">
              Descripción Detallada de la Condición de Entrega
            </label>
            <textarea
              rows={2}
              value={conditions.detailed_notes}
              onChange={(e) => setConditions({ ...conditions, detailed_notes: e.target.value })}
              placeholder="Describa cualquier detalle físico particular manifestado al recibir el equipo..."
              className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexcyan"
            />
          </div>
        </div>

        {/* 5. REGISTRO FOTOGRÁFICO Y PLAZOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Fotografías */}
          <div className="bg-nexblack-card border border-nexblack-border rounded p-5">
            <h2 className="text-xs uppercase font-black tracking-widest text-white pb-3 mb-4 border-b border-nexblack-border flex items-center space-x-2">
              <span className="w-2 h-2 bg-nexcyan rounded-full"></span>
              <span className="font-brand text-sm">6. Registro Fotográfico</span>
            </h2>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <select
                  value={photoCategory}
                  onChange={(e) => setPhotoCategory(e.target.value)}
                  className="bg-nexblack border border-nexblack-border rounded px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="frente">Frente</option>
                  <option value="dorso">Dorso</option>
                  <option value="laterales">Laterales</option>
                  <option value="pantalla">Pantalla</option>
                  <option value="conexiones">Conexiones / Puertos</option>
                  <option value="daño_detectado">Daño detectado</option>
                  <option value="otro">Otro</option>
                </select>

                <input
                  type="text"
                  value={photoDescription}
                  onChange={(e) => setPhotoDescription(e.target.value)}
                  placeholder="Descripción..."
                  className="flex-1 bg-nexblack border border-nexblack-border rounded px-2.5 py-1.5 text-xs text-white"
                />

                <label className="cursor-pointer px-3 py-1.5 rounded bg-gradient-to-r from-nexblue to-nexcyan hover:opacity-90 font-bold text-black text-xs uppercase flex items-center space-x-1 shadow-lumia-accent">
                  <Camera className="w-3.5 h-3.5" />
                  <span>{isUploadingPhoto ? '...' : '+ Foto'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoUpload}
                    disabled={isUploadingPhoto}
                    className="hidden"
                  />
                </label>
              </div>

              {photos.length === 0 ? (
                <p className="text-xs text-nexgray py-4 text-center italic border border-dashed border-nexblack-border rounded">
                  No se han cargado fotografías aún. Puede tomar fotos desde el celular o subir archivos.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((ph, idx) => (
                    <div key={idx} className="relative group rounded border border-nexblack-border overflow-hidden bg-black h-20">
                      <img src={ph.photo_url} alt={ph.category} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="p-1 rounded bg-red-600 text-white"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="absolute bottom-0 left-0 right-0 bg-black/80 text-[9px] text-white px-1 truncate">
                        {ph.category}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Plazo y Presupuesto */}
          <div className="bg-nexblack-card border border-nexblack-border rounded p-5">
            <h2 className="text-xs uppercase font-black tracking-widest text-white pb-3 mb-4 border-b border-nexblack-border flex items-center space-x-2">
              <span className="w-2 h-2 bg-nexcyan rounded-full"></span>
              <span className="font-brand text-sm">7. Plazo Estimado y Seña</span>
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Plazo Estimado (Días)</label>
                  <input
                    type="number"
                    min="1"
                    value={estimatedDays}
                    onChange={(e) => setEstimatedDays(e.target.value)}
                    className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-nexcyan font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Fecha Estimada</label>
                  <div className="bg-nexblack border border-nexblack-border rounded px-3 py-1.5 text-xs text-nexcyan font-mono font-bold">
                    {calculatedCompletionDate}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-nexblack-border grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Seña Inicial ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={initialDeposit}
                    onChange={(e) => setInitialDeposit(e.target.value)}
                    placeholder="0"
                    className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-nexcyan font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Medio de Pago</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-nexcyan"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="mercado_pago">Mercado Pago</option>
                    <option value="tarjeta">Tarjeta</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-nexblack-surface rounded border border-nexblack-border flex justify-between items-center text-xs">
                <div>
                  <span className="text-nexgray">Total Inicial: </span>
                  <span className="font-bold text-white">${totalAmount.toLocaleString('es-AR')}</span>
                </div>
                <div>
                  <span className="text-nexgray">Saldo Restante: </span>
                  <span className="font-black text-nexcyan font-mono">${balance.toLocaleString('es-AR')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 6. FIRMA ELECTRÓNICA Y CONSENTIMIENTO OBLIGATORIO */}
        <div className="bg-nexblack-card border border-nexblack-border rounded p-5">
          <h2 className="text-xs uppercase font-black tracking-widest text-white pb-3 mb-4 border-b border-nexblack-border flex items-center space-x-2">
            <span className="w-2 h-2 bg-nexcyan rounded-full shadow-[0_0_8px_#10DDF2]"></span>
            <span className="font-brand text-sm">8. Firma Electrónica del Cliente y Aceptación de Condiciones</span>
          </h2>

          <div className="space-y-4">
            <div className="bg-nexblack-surface p-3 rounded border border-nexblack-border text-[11px] text-nexgray-light max-h-32 overflow-y-auto leading-relaxed">
              <p className="font-bold text-white mb-1 uppercase font-brand">Términos de Recepción:</p>
              {settings.receipt_terms || (
                <p>
                  El cliente declara entregar el equipo especificado en las condiciones físicas registradas. Los plazos son estimativos. Las reparaciones adicionales requerirán autorización previa. NEXBYTE recomienda el respaldo previo de la información personal.
                </p>
              )}
            </div>

            <label className="flex items-center space-x-3 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 rounded text-nexcyan focus:ring-0"
              />
              <span className="text-xs font-bold text-white">
                El cliente leyó y acepta expresamente las condiciones de recepción descritas arriba *
              </span>
            </label>

            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">
                Firma Manuscrita del Cliente (Dedo, Mouse o Lápiz Digital) *
              </label>
              <SignaturePad onSave={(dataUrl) => setSignatureDataUrl(dataUrl)} />
            </div>
          </div>
        </div>

        {/* Botón Final de Confirmación */}
        <div className="flex justify-end pt-4 pb-8">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-nexblue to-nexcyan hover:opacity-90 font-black text-black text-xs uppercase tracking-widest rounded shadow-lumia-accent transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>{isSubmitting ? 'Generando Comprobante Seguro...' : 'Confirmar Recepción y Emitir Comprobante'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
