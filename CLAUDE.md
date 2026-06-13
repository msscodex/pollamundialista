# CLAUDE.md

Guía de arquitectura para Claude Code al trabajar en este proyecto.

## Comandos

```bash
# Primera vez: instalar dependencias Ruby/Jekyll
bundle install

# Servidor local con live-reload
bundle exec jekyll serve --livereload

# Build estático a _site/
bundle exec jekyll build
```

**No hay build step para JS ni CSS** — son archivos estáticos servidos directamente. No introducir npm/bundler/transpiladores.

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
├── index.html                     # Shell de la SPA (~828 líneas)
├── assets/
│   ├── js/app.js                  # Toda la lógica (~3447 líneas)
│   └── css/style.css              # Todos los estilos (~2827 líneas)
├── supabase/
│   ├── schema.sql                 # Esquema PostgreSQL completo
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

### Claves de datos

```js
STATE.scores   → "${group}-${matchIdx}-${side}"    // Ej: "A-0-0"  (grupos)
STATE.bracket  → "${rondaId}-${matchIdx}-${lado}"  // Ej: "r32-0-t0" (bracket)
STATE.bonuses  → objeto con claves de BONUS_LABELS
```

### Constantes de datos (top de app.js ~líneas 1–330)

| Constante | Contenido |
|-----------|-----------|
| `GROUPS` | 12 grupos (A–L), 4 equipos c/u, código ISO + nombre |
| `MATCH_INFO` | Fechas, horarios COT y estadios de 72 partidos de grupos |
| `ELIM_MATCH_INFO` | Info de partidos eliminatorios |
| `JORNADAS` | Índices de emparejamiento por jornada (reutilizados por todos los grupos) |
| `RONDAS` | Estructura del bracket: R32, R16, QF, SF, Final, 3er lugar |
| `ROUND_PTS` | Puntos por ronda (exacto / resultado) |
| `BONUS_PTS` / `BONUS_LABELS` / `BONUS_GROUPS` | Sistema de bonos |

### Módulos funcionales (orden aproximado en app.js)

1. **Auth e init** (~líneas 372–540) — `initApp()`, `showLogin()`, `showApp()`, `loadCurrentUser()`, `initRouter()`, `route()`
2. **Home** (~líneas 541–1307) — `loadAndRenderHome()`, `renderTodayMatches()`, `renderRanking()`, `renderUpcomingMatches()`, `renderBonosGanados()`, `renderMatchPoints()`, `calcScore()`
3. **Ver (readonly)** (~líneas 1307–1531) — `loadPlayerView()`, `renderGroupsReadonly()`, `renderBracketReadonly()`, `renderBonusesReadonly()`
4. **Polla (edición)** (~líneas 1531–1883) — `renderGroups()`, `buildGroupCard()`, `onScoreInput()`, `recalcGroup()`, `renderBracket()`, `onBracketInput()`, `detectWinner()`, `lockPolla()`
5. **Bonos** (~líneas 1883–2300) — `initTeamPickers()`, `initBonusInputs()`, `loadBonusInputs()`, `toggleManualBonus()`
6. **Persistencia** (~líneas 2566–2630) — `saveDraft()`, `syncToSupabase()`, `loadDraft()`, `exportGroupsPDF()`, `exportJSON()`, `importPollaJSON()`
7. **Participantes/ranking** (~líneas 2630–2699) — `loadParticipantsView()`, `openPlayerDetailModal()`
8. **Admin** (~líneas 2699–3320) — `initAdminPanel()`, `loadAdminResultsEditor()`, `saveAdminSection()`
9. **Utilidades** (~líneas 3320–3447) — `flag()`, `flagByName()`, `parseMatchDate()`, `isMatchLive()`, `isMatchFinished()`, `showErrorModal()`, `initMusicBtn()`, `initHamburger()`

---

## Base de datos (Supabase)

### Tablas

| Tabla | Descripción |
|-------|-------------|
| `profiles` | Vinculada a `auth.users` (id, name, is_admin). Auto-creada por trigger `on_auth_user_created` |
| `pollas` | Una fila por usuario (scores, bracket, bonuses, manual_bonus_pts, is_groups_locked) |
| `official_results` | Fila única id=1; solo admin puede escribir (scores, bracket, bonuses) |

### RLS

- Usuarios solo pueden leer/escribir su propia `polla`
- Solo `is_admin = true` puede actualizar `official_results` y `manual_bonus_pts`

### Edge Function

- `supabase/functions/create-user/index.ts` — crea usuarios desde el panel admin (llama a Supabase Auth Admin API con service role key)

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

## Reglas de desarrollo

1. **Vanilla JS puro** — no introducir React, Vue, frameworks ni dependencias npm.
2. **Sin bundler** — el JS se sirve directamente; no usar `import`/`export` de módulos ES (todo vive en un solo `app.js` con scope global).
3. **No auto-propagar ganadores** — el bracket no avanza ganadores automáticamente entre rondas; el usuario los selecciona.
4. **Persistencia dual** — los drafts van a localStorage; los datos confirmados van a Supabase. No mezclar.
5. **`game/`** — subproyecto Vite compilado, no modificar sin contexto del subproyecto.
6. **`players/` y `results/official.json`** — archivos legacy; los datos reales viven en Supabase.
7. **Flags** — generadas con `flag(team)` que emite `<span class="fi fi-${team.code}">` usando flag-icons CDN. Usar siempre esta función.
