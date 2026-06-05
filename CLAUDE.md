# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Instalar dependencias Jekyll (primera vez)
bundle install

# Servidor local con live-reload
bundle exec jekyll serve --livereload

# Build estático a _site/
bundle exec jekyll build
```

No hay build step para JS ni CSS — son archivos estáticos servidos directamente.

## Arquitectura

SPA estática de una sola página (`index.html`). Todo el JS vive en `assets/js/app.js` (~635 líneas) y todos los estilos en `assets/css/style.css`.

**Flujo de datos:**
1. `STATE` (objeto global) es la única fuente de verdad — se hidrata desde `localStorage` al cargar y se persiste en cada cambio.
2. El render es imperativo: `renderGroups()` y `renderBracket()` generan HTML desde las constantes `GROUPS`, `MATCH_INFO`, `JORNADAS` y `RONDAS`, inyectando los valores de `STATE.scores` y `STATE.bracket`.
3. Los inputs delegan a `onScoreInput` (grupos) y `onBracketInput` (bracket), que actualizan `STATE` y llaman a `recalcGroup()` para recalcular la tabla de posiciones del grupo afectado.

**Constantes de datos** (top del `app.js`):
- `GROUPS` — 12 grupos con los 4 equipos cada uno (código ISO para flag-icons + nombre).
- `MATCH_INFO` — fechas, horarios COT y estadio de los 72 partidos de grupos.
- `JORNADAS` — índices de emparejamiento (equipo0 vs equipo1, etc.) reutilizados por todos los grupos.
- `RONDAS` — rondas eliminatorias con número de partidos y placeholders de origen.

**Claves de `STATE.scores`:** `"${group}-${matchIdx}-${side}"` (ej. `"A-0-0"`).  
**Claves de `STATE.bracket`:** `"${rondaId}-${matchIdx}-${t0|t1|s0|s1}"` (ej. `"r32-0-t0"`).

**Banderas:** se generan con la función `flag(t)` que produce `<span class="fi fi-${t.code}">` usando la librería `flag-icons@7.2.3` cargada desde CDN.

**Sin propagación automática de ganadores** — el bracket no avanza al ganador automáticamente entre rondas; el usuario lo escribe manualmente.
