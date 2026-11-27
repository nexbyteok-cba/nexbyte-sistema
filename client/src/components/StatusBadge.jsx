import React from 'react';

const statusConfig = {
  recibido: { label: 'Recibido', bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  en_control: { label: 'En Control', bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  pendiente_diagnostico: { label: 'Pend. Diagnóstico', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  diagnosticado: { label: 'Diagnosticado', bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' },
  esperando_autorizacion: { label: 'Esperando Autoriz.', bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
  esperando_repuestos: { label: 'Esperando Repuestos', bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  en_reparacion: { label: 'En Reparación', bg: 'bg-nexcyan/15', text: 'text-nexcyan', border: 'border-nexcyan/40' },
  en_pruebas: { label: 'En Pruebas', bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
  reparado: { label: 'Reparado', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  listo_para_entregar: { label: 'Listo p/ Entregar', bg: 'bg-teal-500/15', text: 'text-teal-400', border: 'border-teal-500/30' },
  entregado: { label: 'Entregado', bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/30' },
  sin_reparacion: { label: 'Sin Reparación', bg: 'bg-gray-500/15', text: 'text-gray-400', border: 'border-gray-500/30' },
  cancelado: { label: 'Cancelado', bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
  // Turnos
  pendiente: { label: 'Pendiente', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  confirmado: { label: 'Confirmado', bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  en_camino: { label: 'En Camino', bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  atendido: { label: 'Atendido', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  ausente: { label: 'Ausente', bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' },
};

export function StatusBadge({ status, className = '' }) {
  const normalized = status ? status.toLowerCase() : 'recibido';
  const cfg = statusConfig[normalized] || {
    label: status,
    bg: 'bg-nexblack-border',
    text: 'text-white',
    border: 'border-nexblack-border',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] uppercase tracking-wider font-bold border ${cfg.bg} ${cfg.text} ${cfg.border} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {cfg.label}
    </span>
  );
}
