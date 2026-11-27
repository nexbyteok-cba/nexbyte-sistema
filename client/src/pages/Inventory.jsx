import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  History,
} from 'lucide-react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';

export function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Modales
  const [isNewItemOpen, setIsNewItemOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isMovementsOpen, setIsMovementsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemMovements, setItemMovements] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [itemForm, setItemForm] = useState({
    code: '',
    name: '',
    category_id: '',
    brand: '',
    model: '',
    description: '',
    quantity: 0,
    min_stock: 2,
    cost_price: 0,
    sale_price: 0,
    location: '',
  });

  const [adjustForm, setAdjustForm] = useState({
    type: 'ingreso',
    quantity: 1,
    notes: '',
  });

  useEffect(() => {
    loadInventory();
  }, [search, onlyLowStock]);

  async function loadInventory() {
    try {
      let url = '/inventory?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (onlyLowStock) url += `low_stock=true&`;

      const itemsRes = await api.get(url);
      setItems(itemsRes);
    } catch (err) {
      console.error('Error cargando inventario:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenAdjust = (item) => {
    setSelectedItem(item);
    setAdjustForm({ type: 'ingreso', quantity: 1, notes: '' });
    setErrorMsg('');
    setIsAdjustOpen(true);
  };

  const handleOpenMovements = async (item) => {
    setSelectedItem(item);
    try {
      const movs = await api.get(`/inventory/${item.id}/movements`);
      setItemMovements(movs);
      setIsMovementsOpen(true);
    } catch (err) {
      alert('Error consultando movimientos.');
    }
  };

  const handleCreateItemSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.post('/inventory', itemForm);
      setIsNewItemOpen(false);
      setItemForm({
        code: '',
        name: '',
        category_id: '',
        brand: '',
        model: '',
        description: '',
        quantity: 0,
        min_stock: 2,
        cost_price: 0,
        sale_price: 0,
        location: '',
      });
      loadInventory();
    } catch (err) {
      setErrorMsg(err.message || 'Error al registrar artículo.');
    }
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.post(`/inventory/${selectedItem.id}/adjust`, adjustForm);
      setIsAdjustOpen(false);
      loadInventory();
    } catch (err) {
      setErrorMsg(err.message || 'Error al ajustar stock.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-nexblack-border">
        <div>
          <h1 className="text-2xl font-brand font-black uppercase tracking-wider text-white flex items-center space-x-2">
            <Package className="w-6 h-6 text-nexcyan" />
            <span>Control de <span className="text-nexcyan">Inventario</span></span>
          </h1>
          <p className="text-xs text-nexgray mt-0.5">
            Gestión de componentes, repuestos, insumos de taller y alertas de stock crítico
          </p>
        </div>

        <div className="mt-3 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={() => setIsNewItemOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-nexblue to-nexcyan hover:opacity-90 font-bold text-black text-xs uppercase tracking-wider rounded shadow-lumia-accent transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Artículo</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-nexblack-card border border-nexblack-border rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-nexgray absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código, nombre, marca o modelo..."
            className="w-full bg-nexblack border border-nexblack-border rounded pl-10 pr-4 py-2 text-xs text-white placeholder-nexgray/60 focus:outline-none focus:border-nexcyan"
          />
        </div>

        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-xs font-bold text-red-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyLowStock}
              onChange={(e) => setOnlyLowStock(e.target.checked)}
              className="rounded bg-nexblack border-nexblack-border text-red-500 focus:ring-0"
            />
            <span>Solo Stock Crítico</span>
          </label>
        </div>
      </div>

      {/* Tabla de Artículos */}
      <div className="bg-nexblack-card border border-nexblack-border rounded overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-nexgray">Cargando catálogo...</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-xs text-nexgray">
            No se encontraron artículos con los criterios seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-nexblack-surface text-nexgray uppercase font-bold border-b border-nexblack-border">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Artículo</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4 text-center">Stock</th>
                  <th className="py-3 px-4 text-right">Costo</th>
                  <th className="py-3 px-4 text-right">Venta</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nexblack-border/60 text-nexgray-light">
                {items.map((it) => {
                  const isCritical = it.quantity <= it.min_stock;
                  return (
                    <tr key={it.id} className="hover:bg-nexblack-cardHover transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-nexcyan">{it.code}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-white block">{it.name}</span>
                        <span className="text-[10px] text-nexgray">{it.brand} {it.model} {it.location ? `• Ubic: ${it.location}` : ''}</span>
                      </td>
                      <td className="py-3 px-4 text-nexgray">{it.category_name || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-xs ${
                          isCritical ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-nexblack text-white'
                        }`}>
                          {isCritical && <AlertTriangle className="w-3 h-3 mr-1 text-red-400" />}
                          {it.quantity} u.
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-nexgray">${Number(it.cost_price).toLocaleString('es-AR')}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">${Number(it.sale_price).toLocaleString('es-AR')}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleOpenAdjust(it)}
                            title="Ajustar Stock"
                            className="px-2.5 py-1 rounded bg-nexblack hover:bg-nexcyan/20 hover:text-nexcyan text-nexgray border border-nexblack-border font-bold text-[11px]"
                          >
                            Ajustar
                          </button>
                          <button
                            onClick={() => handleOpenMovements(it)}
                            title="Historial de Movimientos"
                            className="p-1 rounded bg-nexblack hover:bg-nexblack-border text-nexgray hover:text-white border border-nexblack-border"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nuevo Artículo */}
      <Modal isOpen={isNewItemOpen} onClose={() => setIsNewItemOpen(false)} title="Registrar Artículo en Inventario">
        {errorMsg && <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded text-xs text-red-400">{errorMsg}</div>}
        <form onSubmit={handleCreateItemSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Código Único *</label>
              <input
                type="text"
                required
                value={itemForm.code}
                onChange={(e) => setItemForm({ ...itemForm, code: e.target.value })}
                placeholder="SSD-480-KING"
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white uppercase font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Nombre / Título *</label>
              <input
                type="text"
                required
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                placeholder="SSD Kingston 480GB A400"
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Marca</label>
              <input
                type="text"
                value={itemForm.brand}
                onChange={(e) => setItemForm({ ...itemForm, brand: e.target.value })}
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Modelo</label>
              <input
                type="text"
                value={itemForm.model}
                onChange={(e) => setItemForm({ ...itemForm, model: e.target.value })}
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Stock Inicial</label>
              <input
                type="number"
                min="0"
                value={itemForm.quantity}
                onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white font-bold"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Stock Mínimo</label>
              <input
                type="number"
                min="1"
                value={itemForm.min_stock}
                onChange={(e) => setItemForm({ ...itemForm, min_stock: e.target.value })}
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Precio Costo ($)</label>
              <input
                type="number"
                min="0"
                value={itemForm.cost_price}
                onChange={(e) => setItemForm({ ...itemForm, cost_price: e.target.value })}
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Precio Venta ($)</label>
              <input
                type="number"
                min="0"
                value={itemForm.sale_price}
                onChange={(e) => setItemForm({ ...itemForm, sale_price: e.target.value })}
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white font-mono font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-nexblack-border">
            <button type="button" onClick={() => setIsNewItemOpen(false)} className="px-4 py-2 rounded bg-nexblack text-xs text-nexgray-light">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2 rounded bg-gradient-to-r from-nexblue to-nexcyan font-bold text-black text-xs uppercase shadow-lumia-accent">
              Guardar Artículo
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Ajustar Stock */}
      <Modal isOpen={isAdjustOpen} onClose={() => setIsAdjustOpen(false)} title={`Ajustar Stock: ${selectedItem?.name}`}>
        {errorMsg && <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded text-xs text-red-400">{errorMsg}</div>}
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <div className="p-3 bg-nexblack-surface rounded border border-nexblack-border text-xs flex justify-between">
            <span className="text-nexgray">Stock actual disponible:</span>
            <span className="font-mono font-bold text-white">{selectedItem?.quantity} unidades</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Tipo de Movimiento</label>
              <select
                value={adjustForm.type}
                onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white"
              >
                <option value="ingreso">Ingreso (+ Compra / Recepción)</option>
                <option value="egreso">Egreso (- Merma / Salida)</option>
                <option value="ajuste">Ajuste Directo (= Conteo real)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase font-bold text-nexgray-light mb-1">Cantidad *</label>
              <input
                type="number"
                min="1"
                required
                value={adjustForm.quantity}
                onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                className="w-full bg-nexblack border border-nexblack-border rounded px-3 py-2 text-xs text-white font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-nexblack-border">
            <button type="button" onClick={() => setIsAdjustOpen(false)} className="px-4 py-2 rounded bg-nexblack text-xs text-nexgray-light">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2 rounded bg-gradient-to-r from-nexblue to-nexcyan font-bold text-black text-xs uppercase shadow-lumia-accent">
              Aplicar Ajuste
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Historial Movimientos */}
      <Modal isOpen={isMovementsOpen} onClose={() => setIsMovementsOpen(false)} title={`Movimientos: ${selectedItem?.name}`}>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {itemMovements.length === 0 ? (
            <p className="text-xs text-nexgray py-4 text-center">No hay movimientos registrados.</p>
          ) : (
            itemMovements.map((m) => (
              <div key={m.id} className="p-2.5 bg-nexblack-surface rounded border border-nexblack-border flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold uppercase text-white">{m.type}</span>
                  <span className="text-nexgray ml-2">Cant: {m.quantity} (Previo: {m.previous_quantity} → Nuevo: {m.new_quantity})</span>
                </div>
                <span className="text-[10px] font-mono text-nexgray">
                  {new Date(m.created_at).toLocaleDateString('es-AR')}
                </span>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
