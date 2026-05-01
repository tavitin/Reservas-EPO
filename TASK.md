# 📋 TASK.md — UI/UX Overhaul Admin Panel

> **Branch:** `feature/ui-ux-overhaul`
> **Base:** `develop`
> **Inicio:** 2026-04-30
> **Objetivo:** Mejorar UX de las 8 pantallas administrativas conservando funcionalidad y endpoints actuales.

---

## 🎯 Alcance

Refactor visual y de interacción de TODAS las pantallas del rol admin + el shell de navegación. Sin romper APIs ni cambiar contratos del backend.

**Endpoints intactos:** `/reservas`, `/reservas/:id/entregar`, `/usuarios`, `/recursos`, etc.

---

## 📦 Pantallas afectadas

| # | Archivo | Prioridad | Estado |
|---|--------|-----------|--------|
| 1 | `frontend/src/components/Layout.jsx` | 🔴 P1 | ⏳ pendiente |
| 2 | `frontend/src/pages/admin/ReservasAdmin.jsx` | 🔴 P1 | ⏳ pendiente |
| 3 | `frontend/src/pages/admin/Dashboard.jsx` | 🟡 P2 | ⏳ pendiente |
| 4 | `frontend/src/pages/admin/Maestros.jsx` | 🟡 P2 | ⏳ pendiente |
| 5 | `frontend/src/pages/admin/Recursos.jsx` | 🟡 P2 | ⏳ pendiente |
| 6 | `frontend/src/pages/admin/Usuarios.jsx` | 🟢 P3 | ⏳ pendiente |
| 7 | `frontend/src/pages/admin/Admins.jsx` | 🟢 P3 | ⏳ pendiente |
| 8 | `frontend/src/pages/maestro/MisReservas.jsx` | 🟢 P3 | ⏳ pendiente |

---

## 🛠️ Cambios planificados por pantalla

### 1. Layout.jsx — Shell de navegación
- Drawer móvil desde la **izquierda** (convención).
- Avatar con **dropdown** (perfil / mis reservas / logout).
- Estado activo más fuerte (subrayado o pill sólido).
- Breadcrumbs opcionales bajo la barra superior.

### 2. ReservasAdmin.jsx — Pantalla más crítica
- Filtros plegables (acordeón) en mobile.
- Tabla → tarjetas en mobile.
- Jerarquía de acciones: **[Recibir]** verde prominente, *Cancelar* secundario.
- Lightbox para firma digital.
- Columna de duración.
- Export PDF con marca y formato.

### 3. Dashboard.jsx
- Tarjetas de stats limpias (icono + número, sin gradientes saturados).
- Reemplazar gráfico semanal "artesanal" por uno consistente.
- Timeline del día (`8h──10h──12h──...`) con bloques de reservas.
- Saludo dinámico con fecha.

### 4. Maestros.jsx
- Estilo lista de contactos (avatar + nombre + email + 1 stat).
- Acciones colapsadas en menú `···`.
- Stat por fila: "reservas del mes".
- Side drawer con historial al pinchar la fila.

### 5. Recursos.jsx
- Borde izquierdo verde/naranja según estado.
- Acciones (editar/eliminar) icon-only revealed on hover.
- Chips de tipo con scroll horizontal en mobile.
- Preview en vivo dentro del modal de creación.

### 6. Usuarios.jsx
- Dos secciones visualmente separadas: **Maestros** / **Admins**, cada una con su propio botón "+".
- Cabecera con dos cards-resumen (count maestros, count admins).

### 7. Admins.jsx
- Banner informativo (azul, no alarmista).
- Resaltar fila propia con chip `★ Tu cuenta`.
- Mostrar sólo acciones permitidas; tooltip en deshabilitadas.

### 8. MisReservas.jsx (admin/maestro compartida)
- Stat bar contextual para admin (`2 activas · 1 esta semana · 8 históricas`).
- Barra de progreso de tiempo en reservas en curso.

---

## 🔁 Flujo de trabajo

1. Implementar pantalla por pantalla en orden de prioridad.
2. Probar localmente (`npm run dev`) tras cada pantalla relevante.
3. Commits atómicos por pantalla (`feat(ui): refactor Layout`, `feat(ui): redesign ReservasAdmin`, …).
4. Al final: merge `feature/ui-ux-overhaul` → `develop` → `main` (Railway auto-deploy).

---

## 📝 Bitácora de cambios

> Cada vez que se finalice una tarea se anota aquí (commit hash + resumen).

- _Pendiente_ — comenzando con Layout.jsx.

---

## ✅ Checklist final antes de merge

- [ ] 8 pantallas refactorizadas
- [ ] Tests backend siguen pasando (53/53)
- [ ] `npm run build` sin warnings nuevos
- [ ] Revisar responsive (mobile / tablet / desktop)
- [ ] Verificar dark-mode si aplica
- [ ] Merge a `develop` y `main` con `--no-ff`
