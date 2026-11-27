import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  CheckCircle,
  Building,
  Tag,
} from 'lucide-react';
import { api } from '../api/client';

export function Settings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [settings, setSettings] = useState({
    company_name: 'NEXBYTE',
    company_activity: 'TECHNICAL WORKSHOP • Tu tecnología, como nueva',
    company_phone: '351 123 4567',
    company_email: 'nexbyte.ok@gmail.com',
    company_address: 'Córdoba, Argentina',
    company_instagram: '@nexbyte',
    receipt_terms: '',
    default_warranty_days: '90',
  });

  const [newBrand, setNewBrand] = useState({ equipment_type_id: 1, name: '' });
  const [newService, setNewService] = useState({ name: '', description: '', default_price: 0 });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const res = await api.get('/settings');
      setData(res);
      setSettings(res.settings || {});
      if (res.equipmentTypes?.length > 0) {
        setNewBrand({ equipment_type_id: res.equipmentTypes[0].id, name: '' });
      }
    } catch (err) {
      console.error('Error cargando configuración:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavedSuccess(false);
    try {
      await api.put('/settings', { settings });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert('Error guardando configuración.');
    }
  };

  const handleAddBrand = async (e) => {
    e.preventDefault();
    if (!newBrand.name.trim()) return;
    try {
      await api.post('/settings/brands', newBrand);
      setNewBrand({ ...newBrand, name: '' });
      loadSettings();
    } catch (err) {
      alert(err.message || 'Error agregando marca.');
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!newService.name.trim()) return;
    try {
      await api.post('/settings/services', newService);
      setNewService({ name: '', description: '', default_price: 0 });
      loadSettings();
    } catch (err) {
      alert(err.message || 'Error agregando servicio.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-nexblack-border">
        <div>
          <h1 className="text-2xl font-brand font-black uppercase tracking-wider text-white flex items-center space-x-2">
            <SettingsIcon className="w-6 h-6 text-nexcyan" />
            <span>Configuración del <span className="text-nexcyan">Sistema</span></span>
          </h1>
          <p className="text-xs text-nexgray mt-0.5">
            Identidad comercial, términos de consentimiento legal, marcas y tarifas
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/15 px-3 py-1.5 rounded border border-emerald-500/30">
            <CheckCircle className="w-4 h-4" />
            <span>Configuración guardada</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Identidad de Marca */}
        <div className="bg-nexblack-card border border-nexblack-border rounded p-5 space-y-4">
          <div className="flex items-center space-x-4 border-b border-nexblack-border pb-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-nexcyan shadow-lumia-accent bg-black">
              <img src="/logo-square.jpg" alt="Logo NEXBYTE" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-sm font-brand font-black uppercase tracking-wider text-white">
                Identidad de Marca Oficial NEXBYTE TECHNICAL WORKSHOP
              </h2>
              <p className="text-xs text-nexcyan font-bold italic">
                "TU TECNOLOGÍA, COMO NUEVA."
              </p>
              <p className="text-[10px] text-nexgray">Paleta activa: Cyber Cyan (#10DDF2) • Electric Blue (#087BFF) • Deep Navy (#071629)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Nombre Comercial</label>
              <input
                type="text"
                value={settings.company_name || 'NEXBYTE'}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Teléfono de Contacto</label>
              <input
                type="text"
                value={settings.company_phone || '351 123 4567'}
                onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })}
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Correo Electrónico</label>
              <input
                type="email"
                value={settings.company_email || 'nexbyte.ok@gmail.com'}
                onChange={(e) => setSettings({ ...settings, company_email: e.target.value })}
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Dirección del Taller</label>
              <input
                type="text"
                value={settings.company_address || 'Córdoba, Argentina'}
                onChange={(e) => setSettings({ ...settings, company_address: e.target.value })}
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Actividad / Eslogan</label>
            <input
              type="text"
              value={settings.company_activity || 'TECHNICAL WORKSHOP • Tu tecnología, como nueva.'}
              onChange={(e) => setSettings({ ...settings, company_activity: e.target.value })}
              className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white"
            />
          </div>
        </div>

        {/* Términos de Consentimiento Legal */}
        <div className="bg-nexblack-card border border-nexblack-border rounded p-5 space-y-4">
          <h2 className="text-xs uppercase font-black tracking-widest text-white pb-2 border-b border-nexblack-border flex items-center space-x-2">
            <span className="w-2 h-2 bg-nexcyan rounded-full"></span>
            <span className="font-brand text-sm">Condiciones de Recepción y Consentimiento Legal (Texto del Comprobante)</span>
          </h2>

          <div>
            <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">
              Cláusulas y Declaración de Conformidad del Cliente (Aparece en el comprobante A4 impreso)
            </label>
            <textarea
              rows={8}
              value={settings.receipt_terms || ''}
              onChange={(e) => setSettings({ ...settings, receipt_terms: e.target.value })}
              className="w-full bg-nexblack border border-nexblack-border rounded p-3 text-xs text-white font-mono leading-relaxed"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-nexblue to-nexcyan hover:opacity-90 font-bold text-black text-xs uppercase tracking-wider rounded shadow-lumia-accent"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Configuración General</span>
          </button>
        </div>
      </form>

      {/* Marcas de Dispositivos */}
      <div className="bg-nexblack-card border border-nexblack-border rounded p-5 space-y-4">
        <h2 className="text-xs uppercase font-black tracking-widest text-white pb-2 border-b border-nexblack-border flex items-center space-x-2">
          <Tag className="w-3.5 h-3.5 text-nexcyan" />
          <span className="font-brand text-sm">Administración de Marcas Precargadas</span>
        </h2>

        <form onSubmit={handleAddBrand} className="flex items-center space-x-2">
          <select
            value={newBrand.equipment_type_id}
            onChange={(e) => setNewBrand({ ...newBrand, equipment_type_id: parseInt(e.target.value, 10) })}
            className="bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white"
          >
            {data?.equipmentTypes?.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <input
            type="text"
            required
            value={newBrand.name}
            onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
            placeholder="Nueva marca..."
            className="flex-1 bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white"
          />
          <button type="submit" className="px-4 py-2 bg-gradient-to-r from-nexblue to-nexcyan font-bold text-black text-xs uppercase rounded">
            + Agregar Marca
          </button>
        </form>

        <div className="flex flex-wrap gap-1.5 pt-2">
          {data?.equipmentBrands?.map((b) => (
            <span key={b.id} className="px-2.5 py-1 bg-nexblack-surface border border-nexblack-border rounded text-[11px] text-white">
              {b.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
