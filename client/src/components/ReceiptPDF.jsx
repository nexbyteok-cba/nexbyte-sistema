import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, Printer, QrCode } from 'lucide-react';

export function ReceiptPDF({ orderData, onPrinted }) {
  const receiptRef = useRef(null);

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;

    try {
      const element = receiptRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFFFF',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Comprobante-Recepcion-${orderData?.order_number || 'NB'}.pdf`);

      if (onPrinted) onPrinted();
    } catch (err) {
      console.error('Error generando PDF:', err);
      alert('Error al generar el documento PDF.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const {
    order_number = 'NB-2026-00001',
    reception_date = new Date().toISOString(),
    client = {},
    equipment = {},
    services = [],
    accessories = [],
    condition = {},
    signature = {},
    estimated_days = 3,
    estimated_completion_date = '',
    total_amount = 0,
    deposit_amount = 0,
    balance_amount = 0,
  } = orderData || {};

  return (
    <div>
      {/* Botones de acción superiores */}
      <div className="flex items-center justify-end space-x-3 mb-4 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center space-x-2 px-4 py-2 rounded bg-nexblack-card hover:bg-nexblack-border border border-nexblack-border text-xs uppercase font-bold tracking-wider text-white transition-colors"
        >
          <Printer className="w-4 h-4 text-nexcyan" />
          <span>Imprimir A4</span>
        </button>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center space-x-2 px-4 py-2 rounded bg-gradient-to-r from-nexblue to-nexcyan font-bold text-black text-xs uppercase tracking-wider shadow-lumia-accent transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Descargar PDF</span>
        </button>
      </div>

      {/* Contenedor del Comprobante (Diseño limpio en blanco con acentos oficiales NEXBYTE) */}
      <div
        ref={receiptRef}
        id="print-section"
        className="bg-white text-black p-8 sm:p-10 rounded shadow-xl max-w-4xl mx-auto border border-gray-200 text-xs font-sans"
        style={{ minHeight: '1050px' }}
      >
        {/* Encabezado Comercial con Logo Oficial */}
        <div className="flex justify-between items-start border-b-2 border-cyan-600 pb-5 mb-5">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-cyan-500 flex-shrink-0 bg-black">
              <img src="/logo-square.jpg" alt="Logo NEXBYTE" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-baseline space-x-2">
                <h1 className="text-2xl font-black tracking-wider text-black font-brand">NEXBYTE</h1>
                <span className="text-[11px] font-bold tracking-widest text-cyan-600 uppercase">TECHNICAL WORKSHOP</span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-700 italic">
                "Tu tecnología, como nueva."
              </p>
              <p className="text-[10px] text-gray-600 mt-0.5">
                Computadoras • Notebooks • Consolas • Electrónica • Diagnóstico Técnico
              </p>
              <p className="text-[10px] text-gray-500">
                Córdoba, Argentina | Tel: 351 123 4567 | nexbyte.ok@gmail.com | @nexbyte
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="inline-block bg-black text-cyan-400 px-3 py-1 rounded text-sm font-black tracking-wider font-mono border border-cyan-500">
              {order_number}
            </div>
            <p className="text-[11px] font-bold text-gray-800 mt-1">COMPROBANTE DE RECEPCIÓN</p>
            <p className="text-[10px] text-gray-500">
              Fecha: {new Date(reception_date).toLocaleString('es-AR')}
            </p>
          </div>
        </div>

        {/* Datos del Cliente y Equipo */}
        <div className="grid grid-cols-2 gap-4 mb-5 pb-5 border-b border-gray-200">
          <div className="bg-gray-50 p-3 rounded border border-gray-200">
            <h3 className="font-bold text-xs uppercase tracking-wider text-black border-b border-gray-300 pb-1 mb-2">
              Datos del Cliente
            </h3>
            <p><span className="font-semibold">Nombre:</span> {client.first_name} {client.last_name}</p>
            <p><span className="font-semibold">Teléfono:</span> {client.phone}</p>
            {client.phone_alt && <p><span className="font-semibold">Tel. Alternativo:</span> {client.phone_alt}</p>}
            {client.email && <p><span className="font-semibold">Correo:</span> {client.email}</p>}
            {client.dni && <p><span className="font-semibold">DNI:</span> {client.dni}</p>}
          </div>

          <div className="bg-gray-50 p-3 rounded border border-gray-200">
            <h3 className="font-bold text-xs uppercase tracking-wider text-black border-b border-gray-300 pb-1 mb-2">
              Datos del Equipo
            </h3>
            <p><span className="font-semibold">Tipo:</span> {equipment.equipment_type_name || equipment.type_name || 'Equipo'}</p>
            <p><span className="font-semibold">Marca y Modelo:</span> {equipment.brand} {equipment.model}</p>
            {equipment.serial_number && <p><span className="font-semibold">N° Serie:</span> {equipment.serial_number}</p>}
            {equipment.color && <p><span className="font-semibold">Color:</span> {equipment.color}</p>}
            {equipment.os && <p><span className="font-semibold">S.O.:</span> {equipment.os}</p>}
          </div>
        </div>

        {/* Accesorios y Servicios */}
        <div className="grid grid-cols-2 gap-4 mb-5 pb-5 border-b border-gray-200">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-black mb-2">
              Accesorios Entregados
            </h3>
            {accessories && accessories.length > 0 ? (
              <ul className="list-disc list-inside text-gray-700 space-y-0.5">
                {accessories.map((acc, idx) => (
                  <li key={idx}>{typeof acc === 'string' ? acc : acc.name}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">Sin accesorios adicionales.</p>
            )}
          </div>

          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-black mb-2">
              Servicios Solicitados
            </h3>
            {services && services.length > 0 ? (
              <ul className="list-disc list-inside text-gray-700 space-y-0.5">
                {services.map((serv, idx) => (
                  <li key={idx}>
                    <span className="font-medium">{serv.service_name}</span> - ${Number(serv.price || 0).toLocaleString('es-AR')}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">Diagnóstico e inspección general.</p>
            )}
          </div>
        </div>

        {/* Estado Físico y Condiciones de Recepción (Apartado Obligatorio) */}
        <div className="mb-5 pb-5 border-b border-gray-200">
          <h3 className="font-bold text-xs uppercase tracking-wider text-black mb-2">
            Condición Física al Momento de la Recepción
          </h3>
          <div className="bg-gray-50 p-3 rounded border border-gray-200">
            {condition?.has_no_issues ? (
              <p className="text-emerald-700 font-bold">
                ✓ El equipo se recibe sin observaciones físicas aparentes.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                {condition?.scratches ? <p className="text-red-600 font-medium">⚠️ Rayones visibles</p> : null}
                {condition?.dents ? <p className="text-red-600 font-medium">⚠️ Golpes / Abolladuras</p> : null}
                {condition?.cracks ? <p className="text-red-600 font-medium">⚠️ Roturas en carcasa</p> : null}
                {condition?.damaged_screen ? <p className="text-red-600 font-medium">⚠️ Pantalla dañada</p> : null}
                {condition?.damaged_hinges ? <p className="text-red-600 font-medium">⚠️ Bisagras dañadas</p> : null}
                {condition?.missing_screws ? <p className="text-red-600 font-medium">⚠️ Tornillos faltantes</p> : null}
                {condition?.damaged_ports ? <p className="text-red-600 font-medium">⚠️ Puertos dañados</p> : null}
                {condition?.previous_tampering ? <p className="text-red-600 font-medium">⚠️ Manipulación previa</p> : null}
                {condition?.visible_humidity ? <p className="text-red-600 font-medium">⚠️ Humedad visible</p> : null}
                {condition?.dirtiness ? <p className="text-amber-600 font-medium">⚠️ Suciedad considerable</p> : null}
              </div>
            )}
            {condition?.detailed_notes && (
              <p className="mt-2 text-gray-700 border-t border-gray-200 pt-1">
                <span className="font-semibold">Detalle:</span> {condition.detailed_notes}
              </p>
            )}
          </div>
        </div>

        {/* Plazo y Resumen Económico */}
        <div className="grid grid-cols-2 gap-4 mb-5 pb-5 border-b border-gray-200">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-black mb-1">
              Plazo Estimado
            </h3>
            <p className="text-gray-700">
              Estimado: <span className="font-bold">{estimated_days} días hábiles</span>
            </p>
            {estimated_completion_date && (
              <p className="text-gray-700">
                Fecha estimada: <span className="font-bold">{estimated_completion_date}</span>
              </p>
            )}
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-600">Presupuesto inicial: <span className="font-bold text-black">${Number(total_amount).toLocaleString('es-AR')}</span></p>
            <p className="text-xs text-gray-600">Seña abonada: <span className="font-bold text-emerald-600">${Number(deposit_amount).toLocaleString('es-AR')}</span></p>
            <p className="text-sm font-black text-black mt-1">Saldo restante: ${Number(balance_amount).toLocaleString('es-AR')}</p>
          </div>
        </div>

        {/* Términos Legales de Consentimiento Aceptados */}
        <div className="mb-6 text-[10px] text-gray-600 leading-tight">
          <p className="font-bold text-black uppercase mb-1">Términos y Declaración de Conformidad:</p>
          <p>
            El cliente declara conocer el servicio técnico solicitado y autoriza a NEXBYTE a realizar las intervenciones y aperturas necesarias. Se deja expresa constancia del estado físico y accesorios recibidos. Los plazos son estimativos. Las reparaciones adicionales requerirán autorización previa. NEXBYTE recomienda el respaldo preventivo de datos personales.
          </p>
        </div>

        {/* Sección de Firma del Cliente y Sello */}
        <div className="grid grid-cols-2 gap-8 items-end pt-4">
          <div className="text-center">
            {signature?.signature_data_url ? (
              <div className="flex flex-col items-center">
                <img
                  src={signature.signature_data_url}
                  alt="Firma del Cliente"
                  className="h-16 max-w-[200px] object-contain mb-1 filter contrast-200 invert"
                />
                <div className="border-t border-black w-48 mt-1"></div>
                <p className="font-bold text-black text-[11px] mt-1">{signature.client_name || client.first_name}</p>
                <p className="text-[10px] text-gray-500">Firma del Cliente / DNI: {signature.client_dni_or_phone || client.phone}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="h-16"></div>
                <div className="border-t border-black w-48 mt-1"></div>
                <p className="font-bold text-black text-[11px] mt-1">{client.first_name} {client.last_name}</p>
                <p className="text-[10px] text-gray-500">Firma del Cliente</p>
              </div>
            )}
          </div>

          <div className="text-center">
            <div className="flex flex-col items-center">
              <div className="h-16 flex items-center justify-center">
                <div className="w-12 h-12 border border-gray-400 flex items-center justify-center text-gray-400">
                  <QrCode className="w-10 h-10" />
                </div>
              </div>
              <div className="border-t border-black w-48 mt-1"></div>
              <p className="font-bold text-black text-[11px] mt-1 font-brand tracking-wider">NEXBYTE TECHNICAL WORKSHOP</p>
              <p className="text-[10px] text-gray-500">Verificación e Identificación de Orden</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
