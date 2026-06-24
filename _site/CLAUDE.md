# CLAUDE.md

Guía de arquitectura para Claude Code al trabajar en este proyecto.

## Comandos

```bash
# Primera vez: instalar dependencias Ruby/Jekyll
bundle install

# Servidor local (usar puerto 4001 para no chocar con otros proyectos Jekyll)
bundle exec jekyll serve --port 4001

# Build estático a _site/
bundle exec jekyll build
```

**No hay build step para JS ni CSS** — son archivos estáticos servidos directamente. No introducir npm/bundler/transpiladores.

> ⚠️ **Problema conocido en Windows**: Si hay otro servidor Jekyll corriendo en el mismo puerto, el navegador servirá CSS del proyecto incorrecto. Siempre matar todos los procesos `ruby` antes de levantar: `Get-Process ruby | Stop-Process -Force`

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Vanilla JS (sin frameworks), CSS puro |
| Servidor dev | Jekyll (solo para servir archivos; no genera JS/CSS) |
| Backend | Supabase — Auth, PostgreSQL con RLS, Edge Functions |
| Hosting | GitHub Pages (compatible con Jekyll static output) |
| CDNs | flag-icons@7.2.3, Font Awesome, Google Fonts, YouTube IFrame API |

---

## Archivos principales

```
pollamundialista/
├── index.html                     # Shell de la SPA (~825 líneas)
├── assets/
│   ├── js/app.js                  # Toda la lógica (~3600 líneas)
│   └── css/style.css              # Todos los estilos (~3150 líneas)
├── supabase/
│   ├── schema.sql                 # Esquema PostgreSQL completo + migraciones
│   └── functions/create-user/    # Edge Function (Deno/TypeScript)
│       └── index.ts
├── game/                          # Subproyecto 3D (Vite build, NO tocar)
├── players/                       # Legacy (manifest.json, juan.json, maycol.json)
├── results/official.json          # Legacy (datos reales viven en Supabase)
├── _config.yml                    # Config Jekyll
└── Gemfile                        # Dependencias Ruby
```

---

## Arquitectura de app.js

### Fuente de verdad y persistencia

```
localStorage (borrador)  ←→  STATE (objeto global en memoria)  ←→  Supabase PostgreSQL
```

- **`STATE`** — objeto global central: `{ player, scores, bracket, bonuses }`
- **localStorage** — borrador en tiempo real mientras el usuario edita (sin guardar en BD)
- **Supabase** — fuente de verdad persistente; se sincroniza al "Enviar polla" y al cargar la app

### Variables globales de control

```js
IS_GROUPS_LOCKED      // bool — usuario bloqueó grupos+bonos
IMPORT_ENABLED        // bool — admin habilita/deshabilita el botón "Importar JSON" (cargado de official_results)
BRACKET_ROUNDS_OPEN   // {r32, r16, qf, sf, fin, third: bool} — admin abre/cierra rondas
BRACKET_ROUNDS_LOCKED // {r32, r16, qf, sf, fin, third: bool} — usuario bloquea predicciones por ronda
_bracketRoundsMigrated // bool — true si las columnas nuevas existen en Supabase
```

### Claves de datos

```js
STATE.scores   → "${group}-${matchIdx}-${side}"    // Ej: "A-0-0"  (grupos)
STATE.bracket  → "${rondaId}-${matchIdx}-${lado}"  // Ej: "r32-0-t0" (bracket)
STATE.bonuses  → objeto con claves de BONUS_LABELS
```

Tercer lugar usa claves especiales: `3rd-t0`, `3rd-t1`, `3rd-s0`, `3rd-s1`.

### Constantes de datos (top de app.js ~líneas 1–330)

| Constante | Contenido |
|-----------|-----------|
| `GROUPS` | 12 grupos (A–L), 4 equipos c/u, código ISO + nombre |
| `MATCH_INFO` | Fechas, horarios COT y estadios de 72 partidos de grupos |
| `ELIM_MATCH_INFO` | Info de partidos eliminatorios |
| `JORNADAS` | Índices de emparejamiento por jornada (reutilizados por todos los grupos) |
| `RONDAS` | Estructura del bracket: R32, R16, QF, SF, Final (3er lugar es sección aparte) |
| `_ALL_ROUNDS` | Array con todas las rondas incluyendo `third` — usado por admin para toggles y reset |
| `ROUND_PTS` | Puntos por ronda (exacto / resultado) |
| `BONUS_PTS` / `BONUS_LABELS` / `BONUS_GROUPS` | Sistema de bonos |

### Módulos funcionales (orden aproximado en app.js)

1. **Auth e init** — `initApp()`, `showLogin()`, `showApp()`, `loadCurrentUser()`, `initRouter()`, `route()`
2. **Home** — `loadAndRenderHome()`, `renderTodayMatches()`, `renderRanking()`, `renderUpcomingMatches()`, `renderBonosGanados()`, `renderMatchPoints()`, `calcScore()`
3. **Ver (readonly)** — `loadPlayerView()`, `renderGroupsReadonly()`, `renderBracketReadonly()`, `renderBonusesReadonly()`
4. **Polla (edición)** — `renderGroups()`, `buildGroupCard()`, `onScoreInput()`, `recalcGroup()`, `renderBracket()`, `buildRoundHTML()`, `onBracketInput()`, `detectWinner()`, `initThirdPlace()`
5. **Cierre de polla** — `lockPolla()` (grupos+bonos), `lockBracketRound(roundId)` (por ronda), `showConfirmModal()`, `showBracketLockModal()`
6. **Bonos** — `initTeamPickers()`, `initBonusInputs()`, `loadBonusInputs()`, `toggleManualBonus()`
7. **Persistencia** — `saveDraft()`, `syncToSupabase()`, `loadDraft()`, `exportFullPDF()`, `exportJSON()`, `importPollaJSON()`
8. **Participantes/ranking** — `loadParticipantsView()`, `openPlayerDetailModal()`
9. **Admin** — `initAdminPanel()`, `loadAdminResultsEditor()`, `saveAdminSection()`, `renderAdminRoundToggles()`, `toggleBracketRound()`, `renderAdminImportToggle()`, `toggleImportEnabled()`, `renderAdminBracketRoundReset()`, `clearUserBracketRound()`
10. **Modales** — `showConfirmModal()`, `showBracketLockModal()`, `showDeleteConfirmModal()`, `showErrorModal()`
11. **Reportes** — `loadReportesView()`, `loadSheetJS()`, `generateReportXLSX()`, `_appendSheet()`, `_xlsxSafeSheetName()`, `_matchEstado()`
12. **Utilidades** — `flag()`, `flagByName()`, `parseMatchDate()`, `isMatchLive()`, `isMatchFinished()`, `applyImportVisibility()`, `initMusicBtn()`, `initHamburger()`

---

## Base de datos (Supabase)

### Tablas

| Tabla | Descripción |
|-------|-------------|
| `profiles` | Vinculada a `auth.users` (id, name, is_admin). Auto-creada por trigger `on_auth_user_created` |
| `pollas` | Una fila por usuario (scores, bracket, bonuses, manual_bonus_pts, is_groups_locked, **bracket_rounds_locked**) |
| `official_results` | Fila única id=1; solo admin puede escribir (scores, bracket, bonuses, **bracket_rounds_open**, **import_enabled**) |

### Columnas nuevas — requieren migración

Ejecutar en Supabase SQL Editor (todas son retrocompatibles — si no existen, el código las ignora):

```sql
-- Rondas de eliminatorias (control por ronda)
alter table public.official_results
  add column if not exists bracket_rounds_open jsonb not null default '{}';

alter table public.pollas
  add column if not exists bracket_rounds_locked jsonb not null default '{}';

-- Control de importación JSON (admin habilita/deshabilita el botón para participantes)
alter table public.official_results
  add column if not exists import_enabled boolean not null default true;
```

El código es **retrocompatible**: cada columna nueva se consulta en un SELECT separado; si falla silenciosamente, la funcionalidad queda desactivada sin romper el resto. La flag `_bracketRoundsMigrated` controla si `bracket_rounds_locked` se incluye en los upserts.

### RLS

- Usuarios solo pueden leer/escribir su propia `polla`
- Cuando `is_groups_locked = true`, solo puede modificar `bracket` y `bracket_rounds_locked`
- Solo `is_admin = true` puede actualizar `official_results` y `manual_bonus_pts`
- `polla_update_admin`: el admin puede hacer `.update()` en cualquier fila de `pollas` — **usar siempre `.update().eq('user_id', id)`, nunca `.upsert()` para filas ajenas** (upsert intenta INSERT primero, que RLS bloquea)

### Edge Function

- `supabase/functions/create-user/index.ts` — crea usuarios desde el panel admin

---

## Vistas de la SPA

El enrutador usa hash-based routing. Vistas principales en `index.html`:

| Hash | Vista | Descripción |
|------|-------|-------------|
| `#home` | `view-home` | Dashboard: partidos hoy, ranking, próximos, bonos ganados |
| `#polla` | `view-polla` | Edición de quiniela (grupos, bracket, bonos) |
| `#ver/:nombre` | `view-ver` | Quiniela de otro participante en modo readonly |
| `#reglamento` | `view-reglamento` | Reglas del torneo (texto estático) |
| `#juego` | `view-juego` | Link al subproyecto 3D en `game/` |
| `#admin` | `view-admin` | Panel admin (solo is_admin) |
| `#reportes` | `view-reportes` | Generación de XLSX (solo is_admin) |

---

## Sistema de puntuación

| Fase | Exacto | Solo resultado |
|------|--------|----------------|
| Grupos | 3 pts | 1 pt |
| R32 | 4 pts | 2 pts |
| Octavos | 5 pts | 3 pts |
| Cuartos | 6 pts | 4 pts |
| Semis | 7 pts | 5 pts |
| 3er lugar | 8 pts | 6 pts |
| Final | 9 pts | 7 pts |

**Bonos principales:** Campeón 6pts, Subcampeón 5pts, 3er lugar 4pts, 4to 3pts.

---

## Flujo de eliminatorias — control por ronda

### Admin (panel `#admin` → pestaña Eliminatorias)
1. Panel **"Apertura de rondas"** arriba del bracket editor con 6 filas (r32, r16, qf, sf, fin, third)
2. Cada fila tiene badge de estado (Abierta/Cerrada) + botón toggle
3. `toggleBracketRound(roundId)` → guarda `bracket_rounds_open` en `official_results`
4. Al guardar grupos/bracket/bonos desde admin (`saveAdminSection`), también persiste `bracket_rounds_open`

### Admin (vista `#ver/:nombre` → pestaña Eliminatorias)
- Panel colapsable **"Borrar predicciones por ronda"** — una fila por cada ronda
- `clearUserBracketRound(roundId, userId, btn)` → borra las claves de esa ronda del `bracket` del usuario + desbloquea `bracket_rounds_locked[roundId]`
- Usa `.update().eq('user_id', id)` (no upsert) para respetar RLS
- El participante puede volver a ingresar predicciones siempre que la ronda esté abierta
- Muestra modal de confirmación estilizado (`showDeleteConfirmModal`) antes de borrar

### Usuario normal (pestaña Eliminatorias en `#polla`)
- **Ronda cerrada**: badge gris "El administrador abrirá esta ronda cuando corresponda"
- **Ronda abierta**: inputs de marcador editables + botón "Enviar [Ronda]"
- **Ronda enviada**: badge verde, inputs readonly — no se puede reabrir
- Equipos: si el admin los cargó en `official_results.bracket`, se muestran con bandera; si no, se muestra el placeholder ("1° Grp A", etc.)
- El `bm-pending` (opacidad + pointer-events: none) solo se aplica cuando la ronda está **cerrada** y no hay equipos

### Validación antes de enviar una ronda

`validateBracketRoundComplete(roundId)` recorre todas las llaves `s0`/`s1` de esa ronda en `STATE.bracket` y devuelve el número de valores vacíos/undefined. Si devuelve > 0, `lockBracketRound()` muestra un mensaje de error inline (`#brl-error-{roundId}`) en rojo justo encima del botón "Enviar" y no abre el modal de confirmación. Aplica a rondas normales (R32–Final) y a `third`.

### Lógica de `canEdit` en `buildRoundHTML`
```js
const roundOpen   = BRACKET_ROUNDS_OPEN[ronda.id] || false;
const roundLocked = BRACKET_ROUNDS_LOCKED[ronda.id] || false;
const canEdit     = roundOpen && !roundLocked;  // no depende de matchReady
const isPending   = !matchReady && !roundOpen;  // bm-pending solo si cerrada y sin equipos
```

---

## Reportes (admin)

Vista `#reportes` — solo visible para admins. Botón "Generar Excel" lanza `generateReportXLSX()`.

### Funciones

| Función | Descripción |
|---------|-------------|
| `loadReportesView()` | Conecta el botón "Generar Excel" (idempotente con `_wired`) |
| `loadSheetJS()` | Lazy-load de SheetJS desde CDN (solo si `window.XLSX` no existe) |
| `generateReportXLSX()` | Consulta `pollas` + `profiles` + `official_results`, construye el workbook y llama `XLSX.writeFile()` |
| `_appendSheet(wb, data, name)` | Atajo: `aoa_to_sheet` + `book_append_sheet` |
| `_xlsxSafeSheetName(name, used)` | Limpia caracteres inválidos, trunca a 28 chars, desambigua con sufijo numérico |
| `_matchEstado(p0, p1, r0, r1, ptsE, ptsR)` | Retorna `{ estado, pts }` según exacto / resultado / fallo |

### Estructura del XLSX generado

| Hoja | Contenido |
|------|-----------|
| **Ranking** | Posición, nombre, total, exactos, resultado, bonos (ordenado por puntos) |
| **Grupos** | Matriz: 72 partidos × todos los participantes — col Local, Visitante, Res L/V por participante |
| **Eliminatorias** | Matriz: partidos bracket (incluyendo 3er lugar) × todos los participantes |
| **Bonos** | Cada bono con predicción, ✓/✗ y pts de cada participante |
| **[Nombre]** | Una hoja por participante con grupos + eliminatorias + bonos detallados con estado textual |

Nombre de archivo: `polla-mundialista-2026-YYYY-MM-DD.xlsx`

SheetJS CDN: `https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js`

---

## Exportación PDF

Un solo botón **"PDF Completo"** (`#btn-export-pdf-full`) — exporta grupos + eliminatorias + bonos en una sola impresión.

- Función: `exportFullPDF()` — añade clase `printing-full` al body, llama `window.print()`, limpia en `afterprint`
- CSS: bloque `body.printing-full` en `@media print` de `style.css`
- Muestra: header (logo + "Polla Mundialista 2026") → nombre del participante en dorado (Bebas Neue) → grupos → eliminatorias (nueva página) → bonos (nueva página)
- Oculta: menú hamburger, user bar del header, tabs de navegación, barra de envío, mensajes de estado de rondas (`.brl-bar`), subtítulo "Llena tus predicciones…"
- El bracket en el PDF muestra banderas via `flagByName()` igual que en pantalla
- **No existe** `exportGroupsPDF()` ni el botón "PDF Grupos" — fueron eliminados

---

## Control de importación JSON (admin)

- El admin puede habilitar/deshabilitar el botón **"Importar JSON"** para todos los participantes
- Toggle en panel `#admin` → pestaña Grupos → sección "Controles de participantes"
- `IMPORT_ENABLED` (global bool) se carga desde `official_results.import_enabled` en `loadDraft()`
- `applyImportVisibility()` muestra/oculta `#btn-import-polla` según el valor
- `toggleImportEnabled()` → upsert en `official_results` + re-render toggle + aplica visibilidad
- Requiere migración SQL: `alter table public.official_results add column if not exists import_enabled boolean not null default true;`

---

## Bracket readonly (`renderBracketReadonly`)

Usado en `#ver/:nombre` y como base del PDF. Renderiza equipos con `flagByName()` + `<span class="bm-team bm-team-fixed">` cuando el nombre está disponible, o `<span class="bm-team bm-team-locked">` con placeholder si no. Los scores son `<input disabled>`.

---

## Modales

| ID | Función JS | Uso |
|----|-----------|-----|
| `error-modal` | `showErrorModal(msg, title)` | Errores genéricos |
| `lock-confirm-modal` | `showConfirmModal()` | Confirmar envío de polla (grupos+bonos) |
| `bracket-lock-modal` | `showBracketLockModal()` | Confirmar envío de ronda eliminatoria |
| `delete-confirm-modal` | `showDeleteConfirmModal(title, msg)` | Confirmar borrado destructivo (admin) — botón rojo |
| `player-detail-modal` | `openPlayerDetailModal()` | Detalle de participante desde ranking |
| `podium-names-modal` | `openPodiumNamesModal()` | Nombres empatados en el podio |

`showDeleteConfirmModal` retorna una Promise (igual que `showConfirmModal`). Cierra también al hacer clic en el overlay.

---

## Reglas de desarrollo

1. **Vanilla JS puro** — no introducir React, Vue, frameworks ni dependencias npm.
2. **Sin bundler** — el JS se sirve directamente; no usar `import`/`export` de módulos ES (todo vive en un solo `app.js` con scope global).
3. **No auto-propagar ganadores** — el bracket no avanza ganadores automáticamente entre rondas; el usuario los selecciona.
4. **Persistencia dual** — los drafts van a localStorage; los datos confirmados van a Supabase. No mezclar.
5. **Retrocompatibilidad de migraciones** — al agregar columnas nuevas a Supabase, hacer el SELECT en una query separada y verificar `error` antes de usar el dato. Nunca agregar columnas nuevas al SELECT principal que siempre existió.
6. **Admin updates sobre pollas ajenas** — usar siempre `.update().eq('user_id', id)`, nunca `.upsert()`. El upsert intenta INSERT primero, que la política `polla_insert_propia` bloquea para filas de otros usuarios.
7. **Flags** — usar `flagByName(name)` para nombre de equipo → código ISO → `<span class="fi fi-XX">`. Usar `flag(team)` solo cuando se tiene el objeto `{code}` directamente.
8. **`game/`** — subproyecto Vite compilado, no modificar sin contexto del subproyecto.
9. **`players/` y `results/official.json`** — archivos legacy; los datos reales viven en Supabase.
10. **Validación de rondas** — `validateBracketRoundComplete(roundId)` siempre revisa `STATE.bracket`, nunca Supabase directamente; los errores van inline en `.brl-error`, nunca en `showErrorModal` para este caso.
