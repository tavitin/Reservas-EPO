# Reserva EPO — Registro de Tareas

> Última actualización: 2026-05-01 · 19:45  
> Producción: https://frontend-production-d92a.up.railway.app

---

## ✅ TAREAS COMPLETADAS

### 🔒 Seguridad — Crítica / Alta
| # | Tarea | Commit | Notas |
|---|-------|--------|-------|
| 1 | JWT migrado a cookies httpOnly (eliminado de localStorage) | `de44ccc` | Cookie `auth_token`, `secure: true` en prod, `SameSite: none` cross-origin |
| 2 | Contraseña removida de toasts (ya no se expone en pantalla) | `de44ccc` | Reemplazado por mensaje genérico seguro |
| 3 | Validación de `JWT_SECRET` débil al iniciar el servidor | `de44ccc` | Proceso aborta en producción si el secret tiene < 32 chars o es "changeme" |
| 4 | Validación de `CORS_ORIGIN` (bloquea localhost en producción) | `de44ccc` | Startup check con `process.exit(1)` si el origen es localhost |
| 5 | Complejidad mínima de contraseña (8 chars, mayúscula, número) | `de44ccc` | Validación en backend (`usuarios.controller.js`) y hint en frontend |
| 6 | Límite de tamaño para `firma_base64` (200 KB) | `de44ccc` | `express.json({ limit: '200kb' })` en `app.js` |
| 7 | `cookie-parser` instalado y configurado en Express | `de44ccc` | Requerido para leer `req.cookies.auth_token` |
| 8 | `withCredentials: true` en cliente Axios | `de44ccc` | Necesario para enviar cookies cross-origin |
| 9 | Interceptor de token eliminado del cliente (ya no pone `Authorization`) | `de44ccc` | La cookie viaja automáticamente |

### 🔒 Seguridad — Media / Baja
| # | Tarea | Commit | Notas |
|---|-------|--------|-------|
| 10 | Log de auditoría estructurado para operaciones sensibles | `d514d21` | `backend/src/utils/audit.js` — JSON a console, capturado por Railway logs |
| 11 | Máquina de estados para transiciones de reservas | `d514d21` | `TRANSICIONES` en `reservas.controller.js` — previene saltos inválidos de estado |
| 12 | JWT alineado a 30 min con sliding expiration | `d514d21` | Middleware renueva la cookie si quedan < 10 min — usuarios activos no son expulsados |
| 13 | Auto-logout por inactividad en frontend (30 min) | `9763c2b` | Timer con evento de actividad del mouse/teclado |
| 14 | Widget visual `SessionTimer` en UI | `e8d83bc` | Muestra tiempo restante de sesión |
| 15 | Rate limiting en Railway (`trust proxy`) | `3057afa` | Fix para que IP detection funcione detrás del load balancer |

### 📄 Paginación
| # | Tarea | Commit | Notas |
|---|-------|--------|-------|
| 16 | Paginación en **Recursos** (6 cards / página, grid 3×2) | `9ec6992`, `c35a46e` | `PAGE_SIZE=6`, grid fijo `grid-cols-3` |
| 17 | Paginación en **Maestros** (8 por página) | `1a82ac5` | Paginador con flechas + números |
| 18 | Paginación en **ReservasAdmin** (10 por página) | `1a82ac5` | Aplica a tabla y a vista mobile de cards |
| 19 | Paginación en **MisReservas** (6 por página) | `1a82ac5` | Resetea a página 1 al cambiar filtro o búsqueda |

### 🐛 Bugs corregidos
| # | Bug | Commit | Detalle |
|---|-----|--------|---------|
| 20 | Puntos de **completada** no aparecían en calendario | `8e2f61c` | Se agregó el array `completadas` y renderizado de puntos azules |
| 21 | Cards del panel de día mostraban **completada en rojo** | `8e2f61c` | `CalendarioReservas.jsx` — rama `esCompletada` con paleta azul |
| 22 | Reservas aparecían como **completada inmediatamente** (bug de timezone) | `e7a33b2` | Comparación de fechas corregida con offset UTC |
| 23 | Botones de acción en recursos no siempre visibles | `22c66e2` | Removida la visibilidad condicional `group-hover` |

### 🎨 UI / UX
| # | Tarea | Commit | Descripción |
|---|-------|--------|-------------|
| 24 | Redesign **MisReservas** completo | `3f01523` | Colores correctos (completada=azul), stats para todos los usuarios, conteos en pestañas, panel búsqueda+filtros unificado, hover micro-animación |
| 25 | Redesign **Usuarios** completo | `a30849f` | Stats grid, pestañas con conteo, filas contact-list con menú `···`, secciones por rol con cabecera de color, modales consistentes |
| 26 | Stat cards de Usuarios mejorados | `35873e1` | Cards individuales con `border-t-4` de acento de color, icono en caja redondeada, número `text-3xl`, hover shadow |
| 27 | Overhaul global de contraste y tema | `30a099d` | Bordes, textos y fondos con mejor legibilidad |
| 28 | Dashboard — cards de reservas recientes | `4165863` | Rediseño de tabla a cards con más información |
| 29 | Dashboard — paginator en reservas recientes | `6f9f669` | 3 cards por página |
| 30 | Dashboard — modales interactivos con detalles de reserva | `d031252` | Click en card abre modal con info completa |
| 31 | Navbar — barra compacta desktop + drawer mobile | `832db68` | Slide-in para móvil |
| 32 | Responsive improvements generales | `9c90a1b` | Ajustes en todas las páginas |

### 🚀 Funcionalidades
| # | Tarea | Commit | Descripción |
|---|-------|--------|-------------|
| 33 | Módulo de recepción con firma digital (admin) | `c0e431d` | Admin puede registrar entrega con firma `firma_base64` |
| 34 | Admin puede crear reservas propias | `92870ab` | Flujo de nueva reserva disponible para rol admin |
| 35 | Tests de integración (53/53 passing) | `b264e1e` | Suite completa de pruebas backend |
| 36 | UI/UX overhaul P3 — barra de stats admin, progress bars | `6ec1e69` | Tiempo restante visual en reservas activas |
| 37 | Redesign página **Login** — responsive + border accent | `2128251` | Breakpoints sm: para padding/tipografía/spacing, border-t-4 azul, inputs border-2, botón sólido |

---

## 🔴 TAREAS PENDIENTES

### Prioridad Alta — Seguridad / Integridad

| # | Tarea | Motivo | Estado |
|---|-------|--------|--------|
| ✅ P1 | **Helmet.js** — cabeceras HTTP de seguridad | CSP robusta, frame security, HSTS, XSS protection | `6cdf34f` |
| P2 | **Rate limiting en `/auth/login`** | ✅ YA IMPLEMENTADO — 10 intentos / 15 min por IP | Completado |
| P3 | **Forzar cambio de contraseña en primer login** | Los usuarios creados por admin usan contraseña temporal. No hay mecanismo que los obligue a cambiarla al entrar por primera vez |
| P4 | **Endpoint `POST /auth/logout`** — registrar en audit log | El logout no genera entrada de auditoría, quedando invisible en los logs |

### Prioridad Media — UX / Funcionalidad

| # | Tarea | Motivo |
|---|-------|--------|
| P5 | **Redesign página `ReservasAdmin`** | Sigue usando tabla plana sin stats, sin panel de búsqueda/filtros integrado. Inconsistente con el nuevo estilo de MisReservas/Usuarios |
| P6 | **Redesign página `Recursos` (admin)** | Cards tienen el diseño anterior. Falta stat bar (total recursos, por tipo) y mejorar la cabecera |
| P7 | **Redesign Dashboard maestro** | La vista del maestro tiene menos información que la del admin. Podría mostrar próximas reservas del día y acceso rápido a nueva reserva |
| P8 | **Notificaciones por email** | El sistema no envía emails al crear/confirmar/cancelar una reserva. Los maestros se enteran solo si revisan el sistema manualmente |
| P9 | **Exportar reservas a Excel / PDF** | El admin no puede descargar el listado de reservas para reportes o impresión |

### Prioridad Baja — Mantenimiento / Calidad

| # | Tarea | Motivo |
|---|-------|--------|
| P10 | **Eliminar archivos muertos** — `Admins.jsx` y `Maestros.jsx` | Ya no están en el router (`App.jsx` solo usa `Usuarios.jsx`). Generan confusión y ocupan espacio |
| P11 | **Actualizar `README.md`** | Sigue documentando JWT de 8h, no menciona cookies httpOnly, variables nuevas (`CORS_ORIGIN`), ni el checklist de seguridad actualizado |
| P12 | **Error boundaries en React** | Si un componente falla en runtime, toda la app se rompe sin mensaje amigable. Agregar `<ErrorBoundary>` en el layout principal |
| P13 | **Reservas recurrentes** | No es posible crear una reserva que se repita (diaria/semanal). Solicitud frecuente en entornos escolares |
| P14 | **Vista de disponibilidad de recursos (admin)** | El admin no tiene una vista rápida de qué recursos están disponibles hoy/mañana sin entrar a cada reserva |
| P15 | **Skeleton loading en Dashboards** | Al cargar las páginas de Dashboard se ve un flash de contenido vacío antes de que lleguen los datos. Agregar skeletons como en Maestros/Usuarios |

---

## 📊 Resumen

```
Completadas : 38 tareas
Pendientes  : 13 tareas  (2 alta · 5 media · 6 baja)
```

---

## 🗂 Archivos clave modificados en esta sesión

```
backend/
  src/app.js                          ← cookie-parser, CORS credentials, Helmet pendiente
  src/utils/audit.js                  ← NUEVO — log de auditoría estructurado
  src/middlewares/auth.js             ← lee cookie httpOnly, sliding expiration
  src/controllers/auth.controller.js  ← JWT 30min, logout, cookie options
  src/controllers/reservas.controller.js ← máquina de estados, audit logs
  src/controllers/usuarios.controller.js ← validación complejidad contraseña, audit logs
  src/controllers/recursos.controller.js ← audit logs

frontend/
  src/api/axios.js                    ← withCredentials: true, sin interceptor de token
  src/context/AuthContext.jsx         ← sin token en localStorage, logout llama backend
  src/components/CalendarioReservas.jsx ← bug completada corregido (puntos + colores)
  src/pages/admin/Usuarios.jsx        ← redesign completo
  src/pages/admin/Recursos.jsx        ← paginación
  src/pages/admin/ReservasAdmin.jsx   ← paginación
  src/pages/admin/Maestros.jsx        ← paginación (archivo legacy, no en router)
  src/pages/maestro/MisReservas.jsx   ← redesign completo + paginación
  src/pages/maestro/Dashboard.jsx     ← redesign completo (stats grid + CTA)
  src/pages/Login.jsx                 ← responsive design + border accent
```
