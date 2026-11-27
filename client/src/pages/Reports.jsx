import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  TrendingUp,
  PieChart as PieIcon,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../api/client';

export function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    try {
      const res = await api.get('/reports/detailed');
      setData(res);
    } catch (err) {
      console.error('Error cargando reportes:', err);
    } finally {
      setLoading(false);
    }
  }

  const exportCSV = () => {
    if (!data?.topClients) return;
    let csv = 'ID,Nombre,Telefono,Total_Ordenes,Total_Invertido\n';
    data.topClients.forEach((c) => {
      csv += `${c.id},"${c.first_name} ${c.last_name}",${c.phone},${c.total_orders},${c.total_spent}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NEXBYTE-Reporte-Clientes-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const {
    equipmentByType = [],
    topServices = [],
    ordersByStatus = [],
    topClients = [],
    monthlyFlow = [],
  } = data || {};

  const COLORS = ['#10DDF2', '#087BFF', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-nexblack-border">
        <div>
          <h1 className="text-2xl font-brand font-black uppercase tracking-wider text-white flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-nexcyan" />
            <span>Estadísticas y <span className="text-nexcyan">Reportes</span></span>
          </h1>
          <p className="text-xs text-nexgray mt-0.5">
            Analítica de rendimiento técnico, demanda de servicios y flujo financiero
          </p>
        </div>

        <div className="mt-3 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={exportCSV}
            className="flex items-center space-x-2 px-4 py-2 bg-nexblack-card hover:bg-nexblack-border border border-nexblack-border font-bold text-white text-xs uppercase tracking-wider rounded transition-colors"
          >
            <Download className="w-4 h-4 text-nexcyan" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-nexgray">Generando analítica...</div>
      ) : (
        <div className="space-y-6">
          {/* Gráfico 1: Flujo Financiero Mensual */}
          <div className="bg-nexblack-card border border-nexblack-border rounded p-5">
            <h2 className="text-xs uppercase font-black tracking-widest text-white pb-3 mb-4 border-b border-nexblack-border flex items-center space-x-2">
              <TrendingUp className="w-3.5 h-3.5 text-nexcyan" />
              <span className="font-brand text-sm">Flujo Financiero Mensual (Ingresos vs Egresos)</span>
            </h2>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyFlow}>
                  <XAxis dataKey="month" stroke="#8FA0B8" fontSize={11} />
                  <YAxis stroke="#8FA0B8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#071629', borderColor: '#122C4D', color: '#FFF' }}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Ingresos ($)" fill="#10DDF2" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Egresos ($)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráficos de 2 Columnas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-nexblack-card border border-nexblack-border rounded p-5">
              <h2 className="text-xs uppercase font-black tracking-widest text-white pb-3 mb-4 border-b border-nexblack-border flex items-center space-x-2">
                <Award className="w-3.5 h-3.5 text-nexcyan" />
                <span className="font-brand text-sm">Servicios Más Solicitados</span>
              </h2>

              <div className="space-y-3">
                {topServices.map((s, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-white">{s.service_name}</span>
                      <span className="text-[10px] text-nexgray block">{s.count} órdenes realizadas</span>
                    </div>
                    <span className="font-mono font-bold text-nexcyan">
                      ${Number(s.total_revenue || 0).toLocaleString('es-AR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-nexblack-card border border-nexblack-border rounded p-5">
              <h2 className="text-xs uppercase font-black tracking-widest text-white pb-3 mb-4 border-b border-nexblack-border flex items-center space-x-2">
                <PieIcon className="w-3.5 h-3.5 text-nexblue" />
                <span className="font-brand text-sm">Distribución de Equipos Recibidos</span>
              </h2>

              <div className="h-52 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={equipmentByType}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {equipmentByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#071629', borderColor: '#122C4D', color: '#FFF' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Tabla Clientes Frecuentes */}
          <div className="bg-nexblack-card border border-nexblack-border rounded p-5">
            <h2 className="text-xs uppercase font-black tracking-widest text-white pb-3 mb-4 border-b border-nexblack-border flex items-center space-x-2">
              <Award className="w-3.5 h-3.5 text-nexcyan" />
              <span className="font-brand text-sm">Ranking de Clientes Más Frecuentes</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-nexblack-surface text-nexgray uppercase font-bold border-b border-nexblack-border">
                  <tr>
                    <th className="py-2.5 px-3">Cliente</th>
                    <th className="py-2.5 px-3">Teléfono</th>
                    <th className="py-2.5 px-3 text-center">Órdenes</th>
                    <th className="py-2.5 px-3 text-right">Inversión Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexblack-border/60 text-nexgray-light">
                  {topClients.map((c) => (
                    <tr key={c.id} className="hover:bg-nexblack-cardHover transition-colors">
                      <td className="py-2.5 px-3 font-bold text-white">{c.first_name} {c.last_name}</td>
                      <td className="py-2.5 px-3 font-mono text-nexcyan font-bold">{c.phone}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-white">{c.total_orders}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-400">
                        ${Number(c.total_spent || 0).toLocaleString('es-AR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
