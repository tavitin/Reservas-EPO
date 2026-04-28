import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { format, addHours, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';

function toLocalInput(date) {
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDuracion(inicio, fin) {
  if (!inicio || !fin) return null;
  const mins = differenceInMinutes(new Date(fin), new Date(inicio));
  if (mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

const STEPS = [
  { num: 1, label: 'Seleccionar recurso' },
  { num: 2, label: 'Elegir horario' },
  { num: 3, label: 'Confirmar' },
];

function Stepper({ paso }) {
  return (
    <div className="flex items-center mb-8">
      {STEPS.map((s, idx) => (
        <div key={s.num} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              paso > s.num
                ? 'bg-emerald-500 text-white shadow-md'
                : paso === s.num
                ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-100'
                : 'bg-gray-100 text-gray-400'
            }`}>
              {paso > s.num ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : s.num}
            </div>
            <span className={`mt-1.5 text-xs font-medium whitespace-nowrap ${
              paso === s.num ? 'text-blue-600' : paso > s.num ? 'text-emerald-600' : 'text-gray-400'
            }`}>
              {s.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 mb-5 rounded-full transition-colors ${
              paso > s.num ? 'bg-emerald-400' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function NuevaReserva() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';
  const [recursos, setRecursos]     = useState([]);
  const [form, setForm]             = useState({ recurso_id: '', fecha_inicio: '', fecha_fin: '', notas: '' });
  const [disponible, setDisponible] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [ocupados, setOcupados]     = useState([]);
  const [paso, setPaso]             = useState(1);

  const minDate = toLocalInput(new Date());

  useEffect(() => { api.get('/recursos').then(r => setRecursos(r.data)).catch(() => {}); }, []);

  useEffect(() => {
    if (!form.recurso_id || !form.fecha_inicio) { setOcupados([]); return; }
    const dia = form.fecha_inicio.split('T')[0];
    api.get('/reservas', { params: { recurso_id: form.recurso_id } })
      .then(r => {
        setOcupados(r.data.filter(res =>
          res.estado === 'confirmada' && res.fecha_inicio.startsWith(dia)
        ));
      })
      .catch(() => setOcupados([]));
  }, [form.recurso_id, form.fecha_inicio]);

  const checkDisponibilidad = async (override = {}) => {
    const recurso_id = form.recurso_id;
    const fecha_inicio = override.fecha_inicio ?? form.fecha_inicio;
    const fecha_fin    = override.fecha_fin    ?? form.fecha_fin;
    if (!recurso_id || !fecha_inicio || !fecha_fin) return;
    try {
      const { data } = await api.get('/reservas/disponibilidad', {
        params: { recurso_id, fecha_inicio, fecha_fin },
      });
      setDisponible(data.disponible);
    } catch { setDisponible(null); }
  };

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setDisponible(null); };

  const setDuracion = (horas) => {
    if (!form.fecha_inicio) { toast.error('Primero selecciona la fecha de inicio'); return; }
    const inicio = new Date(form.fecha_inicio);
    const finStr = toLocalInput(addHours(inicio, horas));
    set('fecha_fin', finStr);
    checkDisponibilidad({ fecha_fin: finStr });
  };

  const recursoSeleccionado = recursos.find(r => String(r.id) === String(form.recurso_id));
  const duracion = formatDuracion(form.fecha_inicio, form.fecha_fin);

  /* Validaciones por paso */
  const paso1Ok = !!form.recurso_id;
  const paso2Ok = !!form.fecha_inicio && !!form.fecha_fin && disponible === true;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(form.fecha_inicio) < new Date())
      return toast.error('No puedes reservar en una fecha pasada');
    if (new Date(form.fecha_inicio) >= new Date(form.fecha_fin))
      return toast.error('La fecha de inicio debe ser anterior a la de fin');
    setLoading(true);
    try {
      await api.post('/reservas', form);
      toast.success('¡Reserva creada exitosamente!');
      navigate(isAdmin ? '/admin/mis-reservas' : '/maestro/mis-reservas');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al crear reserva');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} title="Volver"
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Nueva Reserva</h1>
          <p className="text-sm text-gray-500">Completa los pasos para reservar un recurso</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <Stepper paso={paso} />

        <form onSubmit={handleSubmit}>
          {/* PASO 1: Seleccionar recurso */}
          {paso === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ¿Qué recurso necesitas?
                </label>
                {recursos.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-48 mx-auto mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-32 mx-auto" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {recursos.map(r => (
                      <button key={r.id} type="button"
                        onClick={() => set('recurso_id', String(r.id))}
                        className={`text-left p-4 rounded-xl border-2 transition-all ${
                          String(form.recurso_id) === String(r.id)
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            String(form.recurso_id) === String(r.id) ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            <svg className={`w-5 h-5 ${String(form.recurso_id) === String(r.id) ? 'text-blue-600' : 'text-gray-500'}`}
                              fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          <div>
                            <p className={`font-semibold text-sm ${String(form.recurso_id) === String(r.id) ? 'text-blue-700' : 'text-gray-800'}`}>
                              {r.nombre}
                            </p>
                            <p className={`text-xs ${String(form.recurso_id) === String(r.id) ? 'text-blue-500' : 'text-gray-400'}`}>
                              {r.tipo}
                            </p>
                          </div>
                          {String(form.recurso_id) === String(r.id) && (
                            <div className="ml-auto">
                              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button type="button"
                  disabled={!paso1Ok}
                  onClick={() => setPaso(2)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors">
                  Siguiente
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* PASO 2: Elegir horario */}
          {paso === 2 && (
            <div className="space-y-5">
              {recursoSeleccionado && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-800">{recursoSeleccionado.nombre}</p>
                    <p className="text-xs text-blue-600">{recursoSeleccionado.tipo}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha y hora inicio</label>
                  <input required type="datetime-local"
                    min={minDate}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-colors"
                    value={form.fecha_inicio}
                    onChange={e => set('fecha_inicio', e.target.value)}
                    onBlur={e => checkDisponibilidad({ fecha_inicio: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha y hora fin</label>
                  <input required type="datetime-local"
                    min={form.fecha_inicio || minDate}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-colors"
                    value={form.fecha_fin}
                    onChange={e => set('fecha_fin', e.target.value)}
                    onBlur={checkDisponibilidad} />
                </div>
              </div>

              {/* Duración rápida */}
              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium">Duración rápida:</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(h => (
                    <button key={h} type="button" onClick={() => setDuracion(h)}
                      className="px-4 py-2 bg-gray-100 hover:bg-blue-100 hover:text-blue-700 rounded-lg text-xs font-semibold transition-colors border border-transparent hover:border-blue-200">
                      {h}h
                    </button>
                  ))}
                </div>
              </div>

              {/* Horarios ocupados */}
              {ocupados.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-xs font-semibold text-amber-800">Horarios ya ocupados ese día:</p>
                  </div>
                  <div className="space-y-1">
                    {ocupados.map(o => (
                      <p key={o.id} className="text-xs text-amber-700 flex items-center gap-1.5">
                        <span className="w-1 h-1 bg-amber-500 rounded-full" />
                        {format(new Date(o.fecha_inicio), 'HH:mm')} — {format(new Date(o.fecha_fin), 'HH:mm')}
                        {o.maestro_nombre && <span className="text-amber-500">({o.maestro_nombre})</span>}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Indicador de disponibilidad */}
              {disponible !== null && (
                <div className={`flex items-center gap-2.5 p-3.5 rounded-xl text-sm font-medium border ${
                  disponible
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {disponible ? (
                    <>
                      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      El recurso está disponible en ese horario
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      El recurso ya está reservado, elige otro horario
                    </>
                  )}
                </div>
              )}

              <div className="flex justify-between pt-2">
                <button type="button" onClick={() => setPaso(1)}
                  className="flex items-center gap-1.5 text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Atrás
                </button>
                <button type="button"
                  disabled={!paso2Ok}
                  onClick={() => setPaso(3)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors">
                  Siguiente
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: Confirmar */}
          {paso === 3 && (
            <div className="space-y-5">
              <p className="text-sm font-semibold text-gray-700">Revisa el resumen de tu reserva antes de confirmar:</p>

              {/* Panel resumen */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-blue-100">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{recursoSeleccionado?.nombre}</p>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {recursoSeleccionado?.tipo}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Inicio</p>
                    <p className="font-semibold text-gray-800">
                      {form.fecha_inicio
                        ? format(new Date(form.fecha_inicio), "dd MMM yyyy HH:mm", { locale: es })
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Fin</p>
                    <p className="font-semibold text-gray-800">
                      {form.fecha_fin
                        ? format(new Date(form.fecha_fin), "dd MMM yyyy HH:mm", { locale: es })
                        : '—'}
                    </p>
                  </div>
                </div>

                {duracion && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-blue-700 font-semibold">Duración: {duracion}</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <span className="text-xs text-emerald-700 font-medium">Recurso disponible</span>
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Notas <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea rows={3}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-colors resize-none"
                  value={form.notas} onChange={e => set('notas', e.target.value)}
                  placeholder="Para qué clase, grupo, observaciones..." />
              </div>

              <div className="flex justify-between pt-2">
                <button type="button" onClick={() => setPaso(2)}
                  className="flex items-center gap-1.5 text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Atrás
                </button>
                <button type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-7 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-md hover:shadow-lg">
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Confirmar reserva
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
