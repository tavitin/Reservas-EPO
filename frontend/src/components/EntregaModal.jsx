import { useRef, useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/* ── Pad de firma ── */
function FirmaPad({ onFirmaChange }) {
  const canvasRef   = useRef(null);
  const drawingRef  = useRef(false);
  const hasFirmaRef = useRef(false);
  const cbRef       = useRef(onFirmaChange);
  const [hasFirma, setHasFirma] = useState(false);

  useEffect(() => { cbRef.current = onFirmaChange; }, [onFirmaChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';

    const pos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const src  = e.touches ? e.touches[0] : e;
      return {
        x: (src.clientX - rect.left) * (canvas.width  / rect.width),
        y: (src.clientY - rect.top)  * (canvas.height / rect.height),
      };
    };

    const onStart = (e) => {
      e.preventDefault();
      drawingRef.current = true;
      const p = pos(e);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    };

    const onMove = (e) => {
      e.preventDefault();
      if (!drawingRef.current) return;
      const p = pos(e);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      if (!hasFirmaRef.current) {
        hasFirmaRef.current = true;
        setHasFirma(true);
      }
    };

    const onEnd = () => {
      drawingRef.current = false;
      if (hasFirmaRef.current) cbRef.current(canvas.toDataURL('image/png'));
    };

    canvas.addEventListener('mousedown',  onStart);
    canvas.addEventListener('mousemove',  onMove);
    canvas.addEventListener('mouseup',    onEnd);
    canvas.addEventListener('mouseleave', onEnd);
    canvas.addEventListener('touchstart', onStart, { passive: false });
    canvas.addEventListener('touchmove',  onMove,  { passive: false });
    canvas.addEventListener('touchend',   onEnd);

    return () => {
      canvas.removeEventListener('mousedown',  onStart);
      canvas.removeEventListener('mousemove',  onMove);
      canvas.removeEventListener('mouseup',    onEnd);
      canvas.removeEventListener('mouseleave', onEnd);
      canvas.removeEventListener('touchstart', onStart);
      canvas.removeEventListener('touchmove',  onMove);
      canvas.removeEventListener('touchend',   onEnd);
    };
  }, []);

  const limpiar = () => {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    hasFirmaRef.current = false;
    setHasFirma(false);
    cbRef.current(null);
  };

  return (
    <div>
      <div className={`relative border-2 rounded-xl overflow-hidden bg-gray-50 transition-colors ${
        hasFirma ? 'border-blue-300' : 'border-dashed border-gray-300'
      }`}>
        <canvas
          ref={canvasRef}
          width={600} height={160}
          className="w-full touch-none cursor-crosshair block"
        />
        {!hasFirma && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-1">
            <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span className="text-gray-300 text-sm">Firme aquí</span>
          </div>
        )}
      </div>
      {hasFirma && (
        <button type="button" onClick={limpiar}
          className="mt-1.5 flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Borrar y volver a firmar
        </button>
      )}
    </div>
  );
}

/* ── Modal principal ── */
export default function EntregaModal({ reserva, onClose, onSuccess }) {
  const [firma, setFirma]           = useState(null);
  const [comentario, setComentario] = useState('');
  const [loading, setLoading]       = useState(false);

  const handleFirma = useCallback((data) => setFirma(data), []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firma) return toast.error('Se requiere la firma del maestro para confirmar la entrega');

    setLoading(true);
    try {
      await api.put(`/reservas/${reserva.id}/entregar`, {
        firma_base64: firma,
        comentario_entrega: comentario,
      });
      toast.success('Entrega registrada correctamente');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al registrar la entrega');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] sm:max-h-[95vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-4.5 h-4.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">Recepción de artículo</h3>
              <p className="text-[11px] sm:text-xs text-gray-400">Confirmar entrega del recurso reservado</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar"
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-colors -mr-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cuerpo */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">

          {/* Resumen de reserva */}
          <div className="bg-blue-50/80 border border-blue-100 rounded-xl p-3.5 sm:p-4">
            <p className="text-[10px] sm:text-xs font-bold text-blue-500 uppercase tracking-wider mb-2.5 sm:mb-3">Detalle del artículo</p>

            {/* Maestro y Recurso — stack en mobile */}
            <div className="space-y-2.5 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-3">
              <div className="bg-white/60 rounded-lg p-2.5 sm:p-0 sm:bg-transparent">
                <p className="text-gray-400 text-[10px] sm:text-xs mb-0.5 font-medium">Maestro</p>
                <p className="font-semibold text-gray-800 text-sm">{reserva.maestro_nombre}</p>
              </div>
              <div className="bg-white/60 rounded-lg p-2.5 sm:p-0 sm:bg-transparent">
                <p className="text-gray-400 text-[10px] sm:text-xs mb-0.5 font-medium">Recurso</p>
                <p className="font-semibold text-gray-800 text-sm">
                  {reserva.recurso_nombre}
                  <span className="text-gray-400 font-normal text-xs ml-1">({reserva.recurso_tipo})</span>
                </p>
              </div>
            </div>

            {/* Fechas — siempre en fila, texto compacto */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mt-2.5 sm:mt-3">
              <div className="bg-white/60 rounded-lg p-2.5 sm:p-0 sm:bg-transparent">
                <p className="text-gray-400 text-[10px] sm:text-xs mb-0.5 font-medium">Inicio</p>
                <p className="font-medium text-gray-700 text-xs">
                  {format(new Date(reserva.fecha_inicio), "dd MMM yyyy", { locale: es })}
                </p>
                <p className="font-semibold text-gray-800 text-xs">
                  {format(new Date(reserva.fecha_inicio), "HH:mm", { locale: es })}
                </p>
              </div>
              <div className="bg-white/60 rounded-lg p-2.5 sm:p-0 sm:bg-transparent">
                <p className="text-gray-400 text-[10px] sm:text-xs mb-0.5 font-medium">Fin</p>
                <p className="font-medium text-gray-700 text-xs">
                  {format(new Date(reserva.fecha_fin), "dd MMM yyyy", { locale: es })}
                </p>
                <p className="font-semibold text-gray-800 text-xs">
                  {format(new Date(reserva.fecha_fin), "HH:mm", { locale: es })}
                </p>
              </div>
            </div>

            {reserva.notas && (
              <div className="mt-2.5 pt-2.5 border-t border-blue-100">
                <p className="text-gray-400 text-[10px] sm:text-xs mb-0.5 font-medium">Notas originales</p>
                <p className="text-gray-600 text-xs leading-relaxed">{reserva.notas}</p>
              </div>
            )}
          </div>

          {/* Comentarios de entrega */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Observaciones de entrega
              <span className="text-gray-400 font-normal ml-1 text-xs">(opcional)</span>
            </label>
            <textarea
              rows={3}
              maxLength={500}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-colors resize-none bg-gray-50/50"
              placeholder="Estado del artículo, observaciones, daños, faltantes..."
              value={comentario}
              onChange={e => setComentario(e.target.value)}
            />
            <p className="text-[10px] sm:text-xs text-gray-400 text-right mt-0.5">{comentario.length}/500</p>
          </div>

          {/* Firma */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-gray-700">
                Firma del maestro
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              {firma && (
                <span className="flex items-center gap-1 text-[11px] sm:text-xs text-emerald-600 font-semibold">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Firma capturada
                </span>
              )}
            </div>
            <FirmaPad onFirmaChange={handleFirma} />
            <p className="text-[10px] sm:text-xs text-gray-400 mt-1.5 leading-relaxed">
              El maestro firma con el dedo o ratón para confirmar la entrega.
            </p>
          </div>

        </form>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t bg-gray-50 rounded-b-2xl flex items-center justify-between gap-3 shrink-0">
          <button type="button" onClick={onClose}
            className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors font-medium">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!firma || loading}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white px-4 sm:px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm">
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Guardando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Confirmar entrega
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
