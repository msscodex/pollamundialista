/* ================================================================
   POLLA MUNDIALISTA FIFA 2026
   app.js — Polla multi-participante, ranking y partidos del día
================================================================ */

/* ----------------------------------------------------------------
   DATOS: 12 Grupos (Sorteo diciembre 2024)
---------------------------------------------------------------- */
const GROUPS = {
  A: { teams: [
    { code:'mx',     n:'México' },        { code:'za',     n:'Sudáfrica' },
    { code:'kr',     n:'Corea del Sur' }, { code:'cz',     n:'Rep. Checa' }
  ]},
  B: { teams: [
    { code:'ca',     n:'Canadá' },        { code:'ba',     n:'Bosnia-Herz.' },
    { code:'qa',     n:'Catar' },         { code:'ch',     n:'Suiza' }
  ]},
  C: { teams: [
    { code:'br',     n:'Brasil' },        { code:'ma',     n:'Marruecos' },
    { code:'ht',     n:'Haití' },         { code:'gb-sct', n:'Escocia' }
  ]},
  D: { teams: [
    { code:'us',     n:'EE.UU.' },        { code:'py',     n:'Paraguay' },
    { code:'au',     n:'Australia' },     { code:'tr',     n:'Turquía' }
  ]},
  E: { teams: [
    { code:'de',     n:'Alemania' },      { code:'cw',     n:'Curazao' },
    { code:'ci',     n:'Costa de Marfil' },{ code:'ec',   n:'Ecuador' }
  ]},
  F: { teams: [
    { code:'nl',     n:'Países Bajos' },  { code:'jp',     n:'Japón' },
    { code:'se',     n:'Suecia' },        { code:'tn',     n:'Túnez' }
  ]},
  G: { teams: [
    { code:'be',     n:'Bélgica' },       { code:'eg',     n:'Egipto' },
    { code:'ir',     n:'Irán' },          { code:'nz',     n:'Nueva Zelanda' }
  ]},
  H: { teams: [
    { code:'es',     n:'España' },        { code:'cv',     n:'Cabo Verde' },
    { code:'sa',     n:'Arabia Saudita' },{ code:'uy',     n:'Uruguay' }
  ]},
  I: { teams: [
    { code:'fr',     n:'Francia' },       { code:'sn',     n:'Senegal' },
    { code:'iq',     n:'Iraq' },          { code:'no',     n:'Noruega' }
  ]},
  J: { teams: [
    { code:'ar',     n:'Argentina' },     { code:'dz',     n:'Argelia' },
    { code:'at',     n:'Austria' },       { code:'jo',     n:'Jordania' }
  ]},
  K: { teams: [
    { code:'pt',     n:'Portugal' },      { code:'cd',     n:'RD Congo' },
    { code:'uz',     n:'Uzbekistán' },    { code:'co',     n:'Colombia' }
  ]},
  L: { teams: [
    { code:'gb-eng', n:'Inglaterra' },    { code:'hr',     n:'Croacia' },
    { code:'gh',     n:'Ghana' },         { code:'pa',     n:'Panamá' }
  ]}
};

const MATCH_INFO = {
  A: [
    { date:'11 jun', time:'14:00', venue:'Est. Azteca, Cd. de México' },
    { date:'11 jun', time:'21:00', venue:'Est. Akron, Guadalajara' },
    { date:'18 jun', time:'20:00', venue:'Est. Akron, Guadalajara' },
    { date:'18 jun', time:'11:00', venue:'Mercedes-Benz Stadium, Atlanta' },
    { date:'24 jun', time:'20:00', venue:'Est. Azteca, Cd. de México' },
    { date:'24 jun', time:'20:00', venue:'Est. BBVA, Monterrey' },
  ],
  B: [
    { date:'12 jun', time:'14:00', venue:'BMO Field, Toronto' },
    { date:'13 jun', time:'14:00', venue:"Levi's Stadium, San Francisco" },
    { date:'18 jun', time:'17:00', venue:'BC Place, Vancouver' },
    { date:'18 jun', time:'14:00', venue:'SoFi Stadium, Los Ángeles' },
    { date:'24 jun', time:'14:00', venue:'BC Place, Vancouver' },
    { date:'24 jun', time:'14:00', venue:'Lumen Field, Seattle' },
  ],
  C: [
    { date:'13 jun', time:'17:00', venue:'MetLife Stadium, Nueva York' },
    { date:'13 jun', time:'20:00', venue:'Gillette Stadium, Boston' },
    { date:'19 jun', time:'20:00', venue:'Lincoln Financial Field, Filadelfia' },
    { date:'19 jun', time:'17:00', venue:'Gillette Stadium, Boston' },
    { date:'24 jun', time:'17:00', venue:'Hard Rock Stadium, Miami' },
    { date:'24 jun', time:'17:00', venue:'Mercedes-Benz Stadium, Atlanta' },
  ],
  D: [
    { date:'12 jun', time:'20:00', venue:'SoFi Stadium, Los Ángeles' },
    { date:'12 jun', time:'23:00', venue:'BC Place, Vancouver' },
    { date:'19 jun', time:'14:00', venue:'Lumen Field, Seattle' },
    { date:'18 jun', time:'23:00', venue:"Levi's Stadium, San Francisco" },
    { date:'25 jun', time:'21:00', venue:'SoFi Stadium, Los Ángeles' },
    { date:'25 jun', time:'21:00', venue:"Levi's Stadium, San Francisco" },
  ],
  E: [
    { date:'14 jun', time:'12:00', venue:'NRG Stadium, Houston' },
    { date:'14 jun', time:'18:00', venue:'Lincoln Financial Field, Filadelfia' },
    { date:'20 jun', time:'15:00', venue:'BMO Field, Toronto' },
    { date:'20 jun', time:'19:00', venue:'Arrowhead Stadium, Kansas City' },
    { date:'25 jun', time:'15:00', venue:'MetLife Stadium, Nueva York' },
    { date:'25 jun', time:'15:00', venue:'Lincoln Financial Field, Filadelfia' },
  ],
  F: [
    { date:'14 jun', time:'15:00', venue:'AT&T Stadium, Dallas' },
    { date:'14 jun', time:'21:00', venue:'Est. BBVA, Monterrey' },
    { date:'20 jun', time:'12:00', venue:'NRG Stadium, Houston' },
    { date:'19 jun', time:'23:00', venue:'Est. BBVA, Monterrey' },
    { date:'25 jun', time:'18:00', venue:'Arrowhead Stadium, Kansas City' },
    { date:'25 jun', time:'18:00', venue:'AT&T Stadium, Dallas' },
  ],
  G: [
    { date:'15 jun', time:'14:00', venue:'Lumen Field, Seattle' },
    { date:'15 jun', time:'20:00', venue:'SoFi Stadium, Los Ángeles' },
    { date:'21 jun', time:'14:00', venue:'SoFi Stadium, Los Ángeles' },
    { date:'21 jun', time:'20:00', venue:'BC Place, Vancouver' },
    { date:'26 jun', time:'22:00', venue:'BC Place, Vancouver' },
    { date:'26 jun', time:'22:00', venue:'Lumen Field, Seattle' },
  ],
  H: [
    { date:'15 jun', time:'11:00', venue:'Mercedes-Benz Stadium, Atlanta' },
    { date:'15 jun', time:'17:00', venue:'Hard Rock Stadium, Miami' },
    { date:'21 jun', time:'11:00', venue:'Mercedes-Benz Stadium, Atlanta' },
    { date:'21 jun', time:'17:00', venue:'Hard Rock Stadium, Miami' },
    { date:'26 jun', time:'19:00', venue:'Est. Akron, Guadalajara' },
    { date:'26 jun', time:'19:00', venue:'NRG Stadium, Houston' },
  ],
  I: [
    { date:'16 jun', time:'14:00', venue:'MetLife Stadium, Nueva York' },
    { date:'16 jun', time:'17:00', venue:'Gillette Stadium, Boston' },
    { date:'22 jun', time:'16:00', venue:'Lincoln Financial Field, Filadelfia' },
    { date:'22 jun', time:'19:00', venue:'MetLife Stadium, Nueva York' },
    { date:'26 jun', time:'14:00', venue:'Gillette Stadium, Boston' },
    { date:'26 jun', time:'14:00', venue:'BMO Field, Toronto' },
  ],
  J: [
    { date:'16 jun', time:'20:00', venue:'Arrowhead Stadium, Kansas City' },
    { date:'15 jun', time:'23:00', venue:"Levi's Stadium, San Francisco" },
    { date:'22 jun', time:'12:00', venue:'AT&T Stadium, Dallas' },
    { date:'22 jun', time:'22:00', venue:"Levi's Stadium, San Francisco" },
    { date:'27 jun', time:'21:00', venue:'AT&T Stadium, Dallas' },
    { date:'27 jun', time:'21:00', venue:'Arrowhead Stadium, Kansas City' },
  ],
  K: [
    { date:'17 jun', time:'12:00', venue:'NRG Stadium, Houston' },
    { date:'17 jun', time:'21:00', venue:'Est. Azteca, Cd. de México' },
    { date:'23 jun', time:'12:00', venue:'NRG Stadium, Houston' },
    { date:'23 jun', time:'21:00', venue:'Est. Akron, Guadalajara' },
    { date:'27 jun', time:'18:30', venue:'Hard Rock Stadium, Miami' },
    { date:'27 jun', time:'18:30', venue:'Mercedes-Benz Stadium, Atlanta' },
  ],
  L: [
    { date:'17 jun', time:'15:00', venue:'AT&T Stadium, Dallas' },
    { date:'17 jun', time:'18:00', venue:'BMO Field, Toronto' },
    { date:'23 jun', time:'15:00', venue:'Gillette Stadium, Boston' },
    { date:'23 jun', time:'18:00', venue:'BMO Field, Toronto' },
    { date:'27 jun', time:'16:00', venue:'MetLife Stadium, Nueva York' },
    { date:'27 jun', time:'16:00', venue:'Lincoln Financial Field, Filadelfia' },
  ],
};

const JORNADAS = [
  { label: 'Jornada 1', pares: [[0,1],[2,3]] },
  { label: 'Jornada 2', pares: [[0,2],[1,3]] },
  { label: 'Jornada 3', pares: [[0,3],[1,2]] }
];

const RONDAS = [
  {
    id: 'r32', label: 'Ronda de 32', partidos: 16,
    placeholders: [
      '1° Grp A', 'Mejor 3°', '2° Grp A', '1° Grp B',
      '2° Grp B', 'Mejor 3°', '1° Grp C', '2° Grp D',
      '2° Grp C', '1° Grp D', '1° Grp E', 'Mejor 3°',
      '2° Grp E', '1° Grp F', '2° Grp F', 'Mejor 3°',
      '1° Grp G', '2° Grp H', '2° Grp G', '1° Grp H',
      '1° Grp I', 'Mejor 3°', '2° Grp I', '1° Grp J',
      '2° Grp J', 'Mejor 3°', '1° Grp K', '2° Grp L',
      '2° Grp K', '1° Grp L', 'Mejor 3°', 'Mejor 3°'
    ]
  },
  { id: 'r16', label: 'Octavos de Final', partidos: 8,  placeholders: [] },
  { id: 'qf',  label: 'Cuartos de Final', partidos: 4,  placeholders: [] },
  { id: 'sf',  label: 'Semifinales',      partidos: 2,  placeholders: [] },
  { id: 'fin', label: 'FINAL 🏆',          partidos: 1,  placeholders: [] }
];

/* ----------------------------------------------------------------
   PUNTUACIÓN (reglamento oficial)
---------------------------------------------------------------- */
const ROUND_PTS = {
  groups: { exact: 3, result: 1 },
  r32:    { exact: 4, result: 2 },
  r16:    { exact: 5, result: 3 },
  qf:     { exact: 6, result: 4 },
  sf:     { exact: 7, result: 5 },
  third:  { exact: 8, result: 6 },
  fin:    { exact: 9, result: 7 }
};

const BONUS_PTS = {
  campeon: 6, subcampeon: 5, tercero: 4, cuarto: 3,
  goleador: 3, mejorJugador: 3, mejorArquero: 3,
  vallaMin: 3, vallaMax: 2,
  masPuntosGrupos: 3, menosPuntosGrupos: 2,
  primerGolInaugural: 2, colPrimerGolUzb: 2, colPrimerAmarillaUzb: 2
};

const BONUS_LABELS = {
  campeon: 'Campeón', subcampeon: 'Subcampeón', tercero: '3° Puesto', cuarto: '4° Puesto',
  goleador: 'Goleador', mejorJugador: 'Mejor jugador', mejorArquero: 'Mejor arquero',
  vallaMin: 'Valla menos vencida', vallaMax: 'Valla más vencida',
  masPuntosGrupos: 'Más puntos en grupos', menosPuntosGrupos: 'Menos puntos en grupos',
  primerGolInaugural: '1° gol inaugural', colPrimerGolUzb: 'Col. 1° gol vs Uzb.',
  colPrimerAmarillaUzb: 'Col. 1° amarilla vs Uzb.'
};

// Mapeo rondaId → clave de ROUND_PTS
const ROUND_KEY = { r32:'r32', r16:'r16', qf:'qf', sf:'sf', fin:'fin', third:'third' };

/* ----------------------------------------------------------------
   ESTADO en memoria para la polla activa
---------------------------------------------------------------- */
let STATE = { player: '', scores: {}, bracket: {}, bonuses: {} };
const LS_DRAFT = 'mundial2026_draft';

/* ================================================================
   INIT
================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  loadDraft();
  initRouter();
  initInnerTabs();
  initInnerTabsVer();
  initPollaControls();
  initThirdPlace();
  initBonusInputs();
});

/* ================================================================
   ROUTING — hash-based
================================================================ */
function initRouter() {
  window.addEventListener('hashchange', route);
  route();
}

function route() {
  const hash = location.hash || '#home';
  hideAllViews();

  if (hash === '#home') {
    showView('view-home');
    setActiveTab('#home');
    loadAndRenderHome();
  } else if (hash === '#polla') {
    showView('view-polla');
    setActiveTab('#polla');
    renderGroups();
    renderBracket();
    recalcAllGroups();
    loadSavedBracketInputs();
    loadBonusInputs();
    initThirdPlace();
  } else if (hash === '#reglamento') {
    showView('view-reglamento');
    setActiveTab('#reglamento');
  } else if (hash.startsWith('#ver/')) {
    const nombre = decodeURIComponent(hash.slice(5));
    showView('view-ver');
    setActiveTab(null);
    loadPlayerView(nombre);
  }
}

function hideAllViews() {
  document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
}

function showView(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function setActiveTab(hash) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.hash === hash);
  });
}

/* ================================================================
   TABS DE NAVEGACIÓN PRINCIPAL
================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      location.hash = btn.dataset.hash;
    });
  });
});

/* ================================================================
   TABS INTERNOS (grupos / bracket / bonos)
================================================================ */
function initInnerTabs() {
  document.querySelectorAll('.inner-tab[data-inner]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.inner-tab[data-inner]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('#view-polla .inner-section').forEach(s => s.classList.add('hidden'));
      const target = document.getElementById('inner-' + btn.dataset.inner);
      if (target) target.classList.remove('hidden');
    });
  });
}

function initInnerTabsVer() {
  document.querySelectorAll('.inner-tab[data-inner-ver]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.inner-tab[data-inner-ver]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('#view-ver .inner-section').forEach(s => s.classList.add('hidden'));
      const target = document.getElementById('inner-' + btn.dataset.innerVer);
      if (target) target.classList.remove('hidden');
    });
  });
}

/* ================================================================
   HOME — carga datos y renderiza
================================================================ */
async function loadAndRenderHome() {
  const homeEl = document.getElementById('view-home');
  homeEl.classList.add('loading');

  const { players, results } = await fetchData();

  homeEl.classList.remove('loading');

  renderTodayMatches();
  renderRanking(players, results);
}

async function fetchData() {
  try {
    const manifest = await fetch('./players/manifest.json').then(r => r.json()).catch(() => []);
    const players = await Promise.all(
      manifest.map(name =>
        fetch(`./players/${name}.json`).then(r => r.json()).catch(() => null)
      )
    ).then(arr => arr.filter(Boolean));

    const results = await fetch('./results/official.json')
      .then(r => r.json())
      .catch(() => ({ scores: {}, bracket: {}, bonuses: {} }));

    return { players, results };
  } catch (_) {
    return { players: [], results: { scores: {}, bracket: {}, bonuses: {} } };
  }
}

/* ================================================================
   PARTIDOS DEL DÍA
================================================================ */
const MONTH_MAP = {
  'ene':1,'feb':2,'mar':3,'abr':4,'may':5,'jun':6,
  'jul':7,'ago':8,'sep':9,'oct':10,'nov':11,'dic':12
};

function parseMatchDate(dateStr) {
  const [day, mon] = dateStr.trim().toLowerCase().split(' ');
  return { day: parseInt(day), month: MONTH_MAP[mon] || 0 };
}

function renderTodayMatches() {
  const today = new Date();
  const todayDay   = today.getDate();
  const todayMonth = today.getMonth() + 1;

  const todayMatches = [];

  Object.entries(MATCH_INFO).forEach(([group, matches]) => {
    matches.forEach((mi, matchIdx) => {
      const { day, month } = parseMatchDate(mi.date);
      if (day === todayDay && month === todayMonth) {
        const jornada = JORNADAS[Math.floor(matchIdx / 2)];
        const par = jornada.pares[matchIdx % 2];
        const teams = GROUPS[group].teams;
        todayMatches.push({
          group, matchIdx,
          t0: teams[par[0]], t1: teams[par[1]],
          time: mi.time, venue: mi.venue
        });
      }
    });
  });

  const section = document.getElementById('today-section');
  const grid    = document.getElementById('today-grid');
  const label   = document.getElementById('today-date-label');

  if (todayMatches.length === 0) {
    section.classList.add('hidden');
    return;
  }

  const opts = { weekday:'long', day:'numeric', month:'long', year:'numeric' };
  label.textContent = today.toLocaleDateString('es', opts);

  grid.innerHTML = todayMatches.map(m => `
<div class="today-card">
  <div class="today-group-badge">Grupo ${m.group}</div>
  <div class="today-teams">
    <div class="today-team">
      ${flag(m.t0)}
      <span>${m.t0.n}</span>
    </div>
    <div class="today-vs">VS</div>
    <div class="today-team">
      ${flag(m.t1)}
      <span>${m.t1.n}</span>
    </div>
  </div>
  <div class="today-info">
    <span>⏰ ${m.time} COT</span>
    <span>🏟 ${m.venue}</span>
  </div>
</div>`).join('');

  section.classList.remove('hidden');
}

/* ================================================================
   RANKING
================================================================ */
function renderRanking(players, results) {
  const podiumWrap  = document.getElementById('podium-wrap');
  const tableWrap   = document.getElementById('ranking-table-wrap');
  const emptyMsg    = document.getElementById('ranking-empty');
  const tbody       = document.getElementById('ranking-tbody');
  const updLabel    = document.getElementById('results-updated-label');

  if (results.updated) {
    updLabel.textContent = 'Resultados actualizados: ' + new Date(results.updated).toLocaleString('es');
  }

  if (players.length === 0) {
    emptyMsg.classList.remove('hidden');
    podiumWrap.classList.add('hidden');
    tableWrap.classList.add('hidden');
    return;
  }

  emptyMsg.classList.add('hidden');

  const scored = players
    .map(p => ({ ...p, score: calcScore(p, results) }))
    .sort((a, b) => b.score.total - a.score.total);

  // Podio
  podiumWrap.classList.remove('hidden');
  const MEDALS = ['🥇', '🥈', '🥉'];
  const podiumPositions = [1, 0, 2]; // orden visual: 2°, 1°, 3°
  podiumWrap.innerHTML = podiumPositions
    .filter(i => scored[i])
    .map(i => {
      const p = scored[i];
      const pos = i + 1;
      return `
<div class="podium-step pos-${pos}">
  <div class="podium-medal">${MEDALS[i]}</div>
  <div class="podium-name">${p.name}</div>
  <div class="podium-pts">${p.score.total} pts</div>
  <div class="podium-bar"></div>
</div>`;
    }).join('');

  // Tabla completa
  tableWrap.classList.remove('hidden');
  tbody.innerHTML = scored.map((p, idx) => `
<tr class="${idx === 0 ? 'rank-first' : ''}">
  <td class="rank-pos">${idx + 1}</td>
  <td class="rank-name">
    <a href="#ver/${encodeURIComponent(p.name)}">${p.name}</a>
  </td>
  <td class="rank-pts">${p.score.total}</td>
  <td>${p.score.exact}</td>
  <td>${p.score.result}</td>
  <td>${p.score.bonuses}</td>
</tr>`).join('');
}

/* ================================================================
   CÁLCULO DE PUNTOS
================================================================ */
function calcScore(player, results) {
  let exact = 0, result = 0, bonusTotal = 0;

  // Grupos
  JORNADAS.forEach((jornada, jIdx) => {
    jornada.pares.forEach((_, pIdx) => {
      const matchIdx = jIdx * 2 + pIdx;
      Object.keys(GROUPS).forEach(group => {
        const k0 = scoreKey(group, matchIdx, 0);
        const k1 = scoreKey(group, matchIdx, 1);
        if (!(k0 in results.scores) || !(k1 in results.scores)) return;
        if (!(k0 in (player.scores || {})) || !(k1 in (player.scores || {}))) return;

        const r0 = results.scores[k0], r1 = results.scores[k1];
        const p0 = player.scores[k0],  p1 = player.scores[k1];

        if (p0 === r0 && p1 === r1) {
          exact += ROUND_PTS.groups.exact;
        } else if (Math.sign(p0 - p1) === Math.sign(r0 - r1)) {
          result += ROUND_PTS.groups.result;
        }
      });
    });
  });

  // Bracket eliminatorio
  RONDAS.forEach(ronda => {
    const pts = ROUND_PTS[ROUND_KEY[ronda.id]];
    if (!pts) return;
    for (let i = 0; i < ronda.partidos; i++) {
      const ks0 = `${ronda.id}-${i}-s0`;
      const ks1 = `${ronda.id}-${i}-s1`;
      if (!(ks0 in results.bracket) || !(ks1 in results.bracket)) continue;
      if (!(ks0 in (player.bracket || {})) || !(ks1 in (player.bracket || {}))) continue;

      const r0 = Number(results.bracket[ks0]), r1 = Number(results.bracket[ks1]);
      const p0 = Number(player.bracket[ks0]),  p1 = Number(player.bracket[ks1]);

      if (p0 === r0 && p1 === r1) {
        exact += pts.exact;
      } else if (Math.sign(p0 - p1) === Math.sign(r0 - r1)) {
        result += pts.result;
      }
    }
  });

  // Tercer lugar
  const th = (k) => results.bracket?.[k] !== undefined && player.bracket?.[k] !== undefined;
  if (th('3rd-s0') && th('3rd-s1')) {
    const r0 = Number(results.bracket['3rd-s0']), r1 = Number(results.bracket['3rd-s1']);
    const p0 = Number(player.bracket['3rd-s0']),  p1 = Number(player.bracket['3rd-s1']);
    if (p0 === r0 && p1 === r1)                         exact  += ROUND_PTS.third.exact;
    else if (Math.sign(p0-p1) === Math.sign(r0-r1))    result += ROUND_PTS.third.result;
  }

  // Bonos
  const pb = player.bonuses || {};
  const rb = results.bonuses || {};
  Object.keys(BONUS_PTS).forEach(key => {
    if (rb[key] && pb[key] && rb[key].trim().toLowerCase() === pb[key].trim().toLowerCase()) {
      bonusTotal += BONUS_PTS[key];
    }
  });

  return { total: exact + result + bonusTotal, exact, result, bonuses: bonusTotal };
}

/* ================================================================
   VER PARTICIPANTE (solo lectura)
================================================================ */
async function loadPlayerView(nombre) {
  document.getElementById('ver-player-title').textContent = nombre;
  document.getElementById('btn-back-home').addEventListener('click', () => {
    location.hash = '#home';
  }, { once: true });

  let playerData = null;
  try {
    playerData = await fetch(`./players/${encodeURIComponent(nombre)}.json`).then(r => r.json());
  } catch (_) {
    document.getElementById('ver-player-title').textContent = nombre + ' — no encontrado';
    return;
  }

  const results = await fetch('./results/official.json').then(r => r.json()).catch(() => ({ scores:{}, bracket:{}, bonuses:{} }));
  const score = calcScore(playerData, results);

  document.getElementById('ver-score-badge').textContent = `${score.total} pts`;

  // Renderizar grupos readonly
  renderGroupsReadonly(playerData.scores || {}, 'groups-grid-ver');

  // Renderizar bracket readonly
  renderBracketReadonly(playerData.bracket || {}, 'bracket-render-ver', 'champion-display-ver');

  // Tercer lugar readonly
  const thirdVer = document.getElementById('third-match-ver');
  if (thirdVer) {
    const inputs = thirdVer.querySelectorAll('[data-key]');
    inputs.forEach(inp => {
      inp.value = playerData.bracket?.[inp.dataset.key] || '';
    });
  }

  // Bonos readonly
  renderBonusesReadonly(playerData.bonuses || {}, results.bonuses || {});
}

function renderGroupsReadonly(scores, containerId) {
  const grid = document.getElementById(containerId);
  if (!grid) return;
  grid.innerHTML = Object.entries(GROUPS).map(([letter, g]) =>
    buildGroupCardReadonly(letter, g.teams, scores)
  ).join('');
}

function buildGroupCardReadonly(letter, teams, scores) {
  const matches = JORNADAS.map((jornada, jIdx) => {
    return jornada.pares.map((par, pIdx) => {
      const matchIdx = jIdx * 2 + pIdx;
      const k0 = scoreKey(letter, matchIdx, 0);
      const k1 = scoreKey(letter, matchIdx, 1);
      const v0 = scores[k0] ?? '';
      const v1 = scores[k1] ?? '';
      const t0 = teams[par[0]], t1 = teams[par[1]];
      const mi = (MATCH_INFO[letter] || [])[matchIdx] || {};
      return `
<div class="match-block">
  <div class="match-meta">
    <span class="mm-date">📅 ${mi.date || ''}</span>
    <span class="mm-time">⏰ ${mi.time || ''} <small>COT</small></span>
    <span class="mm-venue">🏟 ${mi.venue || ''}</span>
  </div>
  <div class="match-row">
    <span class="m-team home"><span class="m-name">${t0.n}</span><span class="m-flag">${flag(t0)}</span></span>
    <input type="number" class="m-score${v0 !== '' ? ' filled' : ''}" value="${v0}" disabled placeholder="–">
    <span class="m-vs">-</span>
    <input type="number" class="m-score${v1 !== '' ? ' filled' : ''}" value="${v1}" disabled placeholder="–">
    <span class="m-team away"><span class="m-flag">${flag(t1)}</span><span class="m-name">${t1.n}</span></span>
  </div>
</div>`;
    }).join('');
  }).join('');

  return `
<div class="group-card" data-group="${letter}">
  <div class="group-head">
    <div class="group-letter-badge">${letter}</div>
    <div class="group-head-info">
      <div class="group-head-title">Grupo ${letter}</div>
      <div class="group-flags">${teams.map(t => `<span class="gf-flag" title="${t.n}">${flag(t)}</span>`).join('')}</div>
    </div>
  </div>
  <div class="group-body">
    <div class="group-matches">${matches}</div>
  </div>
</div>`;
}

function renderBracketReadonly(bracket, containerId, championId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = RONDAS.map(ronda => {
    const matches = Array.from({ length: ronda.partidos }, (_, i) => {
      const ph0 = ronda.placeholders[i * 2]     || `Eq. ${i * 2 + 1}`;
      const ph1 = ronda.placeholders[i * 2 + 1] || `Eq. ${i * 2 + 2}`;
      const kt0 = `${ronda.id}-${i}-t0`, kt1 = `${ronda.id}-${i}-t1`;
      const ks0 = `${ronda.id}-${i}-s0`, ks1 = `${ronda.id}-${i}-s1`;
      const isFin = ronda.id === 'fin';
      const s0 = parseFloat(bracket[ks0]), s1 = parseFloat(bracket[ks1]);
      const winner = !isNaN(s0) && !isNaN(s1) ? (s0 > s1 ? 't0' : s1 > s0 ? 't1' : null) : null;
      return `
<div class="bracket-match${isFin ? ' is-final' : ''}">
  <div class="bm-row${winner==='t0'?' winner':''}">
    <input type="text" class="bm-team" value="${bracket[kt0]||''}" placeholder="${ph0}" disabled>
    <input type="number" class="bm-score" value="${bracket[ks0]||''}" disabled placeholder="0">
  </div>
  <div class="bm-row${winner==='t1'?' winner':''}">
    <input type="text" class="bm-team" value="${bracket[kt1]||''}" placeholder="${ph1}" disabled>
    <input type="number" class="bm-score" value="${bracket[ks1]||''}" disabled placeholder="0">
  </div>
</div>`;
    }).join('');
    return `
<div class="bracket-round">
  <div class="bracket-round-title">${ronda.label}</div>
  <div class="bracket-matches-col">${matches}</div>
</div>`;
  }).join('');

  const champEl = document.getElementById(championId);
  if (champEl) champEl.textContent = bracket['champion'] || ' ';
}

function renderBonusesReadonly(playerBonuses, resultBonuses) {
  const grid = document.getElementById('bonuses-grid-ver');
  if (!grid) return;
  grid.innerHTML = Object.keys(BONUS_PTS).map(key => {
    const pVal = playerBonuses[key] || '—';
    const rVal = resultBonuses[key] || '';
    const hit  = rVal && pVal.toLowerCase().trim() === rVal.toLowerCase().trim();
    return `
<div class="bonus-readonly-row${hit ? ' bonus-hit' : ''}">
  <span class="bonus-readonly-label">${BONUS_LABELS[key]} <span class="bonus-pts">+${BONUS_PTS[key]}pts</span></span>
  <span class="bonus-readonly-val">${pVal}</span>
  ${hit ? '<span class="bonus-check">✓</span>' : ''}
</div>`;
  }).join('');
}

/* ================================================================
   QUINIELA — Render grupos
================================================================ */
function renderGroups() {
  const grid = document.getElementById('groups-grid');
  if (!grid) return;
  grid.innerHTML = Object.entries(GROUPS).map(([letter, g]) =>
    buildGroupCard(letter, g.teams)
  ).join('');

  grid.querySelectorAll('.m-score').forEach(inp => {
    inp.addEventListener('input', onScoreInput);
    inp.addEventListener('blur',  onScoreInput);
  });
}

function buildGroupCard(letter, teams) {
  return `
<div class="group-card" data-group="${letter}">
  <div class="group-head">
    <div class="group-letter-badge">${letter}</div>
    <div class="group-head-info">
      <div class="group-head-title">Grupo ${letter}</div>
      <div class="group-flags">${teams.map(t => `<span class="gf-flag" title="${t.n}">${flag(t)}</span>`).join('')}</div>
    </div>
  </div>
  <div class="group-body">
    <div class="group-matches">${buildJornadas(letter, teams)}</div>
    <div class="standings-wrap">
      <table class="standings-table" id="st-${letter}">
        <thead>
          <tr>
            <th>#</th><th>Equipo</th>
            <th title="Jugados">J</th><th title="Ganados">G</th><th title="Empatados">E</th><th title="Perdidos">P</th>
            <th title="Goles a favor">GF</th><th title="Goles en contra">GC</th><th title="Diferencia">DG</th>
            <th title="Puntos">Pts</th>
          </tr>
        </thead>
        <tbody id="st-body-${letter}">${buildDefaultRows(teams)}</tbody>
      </table>
    </div>
  </div>
</div>`;
}

function buildJornadas(letter, teams) {
  return JORNADAS.map((jornada, jIdx) => {
    const rows = jornada.pares.map((par, pIdx) => {
      const matchIdx = jIdx * 2 + pIdx;
      const k0 = scoreKey(letter, matchIdx, 0);
      const k1 = scoreKey(letter, matchIdx, 1);
      const v0 = STATE.scores[k0] ?? '';
      const v1 = STATE.scores[k1] ?? '';
      const t0 = teams[par[0]], t1 = teams[par[1]];
      const mi = (MATCH_INFO[letter] || [])[matchIdx] || {};
      return `
<div class="match-block">
  <div class="match-meta">
    <span class="mm-date">📅 ${mi.date || ''}</span>
    <span class="mm-time">⏰ ${mi.time || ''} <small>COT</small></span>
    <span class="mm-venue">🏟 ${mi.venue || ''}</span>
  </div>
  <div class="match-row">
    <span class="m-team home">
      <span class="m-name">${t0.n}</span>
      <span class="m-flag">${flag(t0)}</span>
    </span>
    <input type="number" class="m-score${v0 !== '' ? ' filled' : ''}"
      min="0" max="99"
      data-group="${letter}" data-match="${matchIdx}" data-side="0"
      value="${v0}" placeholder="–">
    <span class="m-vs">-</span>
    <input type="number" class="m-score${v1 !== '' ? ' filled' : ''}"
      min="0" max="99"
      data-group="${letter}" data-match="${matchIdx}" data-side="1"
      value="${v1}" placeholder="–">
    <span class="m-team away">
      <span class="m-flag">${flag(t1)}</span>
      <span class="m-name">${t1.n}</span>
    </span>
  </div>
</div>`;
    }).join('');
    return `<div class="matchday-header">${jornada.label}</div>${rows}`;
  }).join('');
}

function buildDefaultRows(teams) {
  return teams.map((t, i) => {
    const posClass = ['p1','p2','p3','p4'][i];
    const rowClass = i < 2 ? 'st-advances' : i === 2 ? 'st-maybe' : '';
    return `
<tr class="${rowClass}">
  <td><span class="pos-badge ${posClass}">${i+1}</span></td>
  <td class="st-team-name"><span class="st-flag">${flag(t)}</span>${t.n}</td>
  <td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td class="st-gd">0</td><td class="st-pts">0</td>
</tr>`;
  }).join('');
}

/* ================================================================
   QUINIELA — Score input handler
================================================================ */
function onScoreInput(e) {
  const { group, match, side } = e.target.dataset;
  const val = e.target.value;
  const key = scoreKey(group, match, side);
  if (val !== '' && !isNaN(parseInt(val))) {
    STATE.scores[key] = parseInt(val);
    e.target.classList.add('filled');
  } else {
    delete STATE.scores[key];
    e.target.classList.remove('filled');
  }
  recalcGroup(group);
  saveDraft();
}

/* ================================================================
   QUINIELA — Tabla de posiciones
================================================================ */
function recalcAllGroups() {
  Object.keys(GROUPS).forEach(recalcGroup);
}

function recalcGroup(letter) {
  const teams = GROUPS[letter].teams;
  const st = teams.map((t, idx) => ({
    name: t.n, flag: t.code, idx, j:0, g:0, e:0, p:0, gf:0, gc:0, pts:0
  }));

  JORNADAS.forEach((jornada, jIdx) => {
    jornada.pares.forEach((par, pIdx) => {
      const matchIdx = jIdx * 2 + pIdx;
      const k0 = scoreKey(letter, matchIdx, 0);
      const k1 = scoreKey(letter, matchIdx, 1);
      if (!(k0 in STATE.scores) || !(k1 in STATE.scores)) return;
      const s0 = STATE.scores[k0], s1 = STATE.scores[k1];
      const t0 = par[0], t1 = par[1];
      st[t0].j++; st[t1].j++;
      st[t0].gf += s0; st[t0].gc += s1;
      st[t1].gf += s1; st[t1].gc += s0;
      if (s0 > s1) {
        st[t0].g++; st[t0].pts += 3; st[t1].p++;
      } else if (s0 < s1) {
        st[t1].g++; st[t1].pts += 3; st[t0].p++;
      } else {
        st[t0].e++; st[t1].e++; st[t0].pts++; st[t1].pts++;
      }
    });
  });

  st.sort((a, b) =>
    b.pts - a.pts ||
    (b.gf - b.gc) - (a.gf - a.gc) ||
    b.gf - a.gf ||
    a.name.localeCompare(b.name)
  );

  const posClasses = ['p1','p2','p3','p4'];
  const rowClasses = ['st-advances','st-advances','st-maybe',''];

  const tbody = document.getElementById(`st-body-${letter}`);
  if (!tbody) return;
  tbody.innerHTML = st.map((s, pos) => {
    const dg = s.gf - s.gc;
    const dgClass = dg > 0 ? 'pos' : dg < 0 ? 'neg' : '';
    return `
<tr class="${rowClasses[pos]}">
  <td><span class="pos-badge ${posClasses[pos]}">${pos+1}</span></td>
  <td class="st-team-name"><span class="st-flag"><span class="fi fi-${s.flag}"></span></span>${s.name}</td>
  <td>${s.j}</td><td>${s.g}</td><td>${s.e}</td><td>${s.p}</td>
  <td>${s.gf}</td><td>${s.gc}</td>
  <td class="st-gd ${dgClass}">${dg > 0 ? '+' : ''}${dg}</td>
  <td class="st-pts">${s.pts}</td>
</tr>`;
  }).join('');
}

/* ================================================================
   QUINIELA — Bracket
================================================================ */
function renderBracket() {
  const container = document.getElementById('bracket-render');
  if (!container) return;
  container.innerHTML = RONDAS.map(ronda => buildRoundHTML(ronda)).join('');
  container.querySelectorAll('.bm-team, .bm-score').forEach(inp => {
    inp.addEventListener('input', onBracketInput);
  });
}

function buildRoundHTML(ronda) {
  const matches = Array.from({ length: ronda.partidos }, (_, i) => {
    const ph0 = ronda.placeholders[i * 2]     || `Eq. ${i * 2 + 1}`;
    const ph1 = ronda.placeholders[i * 2 + 1] || `Eq. ${i * 2 + 2}`;
    const kt0 = `${ronda.id}-${i}-t0`, kt1 = `${ronda.id}-${i}-t1`;
    const ks0 = `${ronda.id}-${i}-s0`, ks1 = `${ronda.id}-${i}-s1`;
    const isFin = ronda.id === 'fin';
    const winner = detectWinner(ronda.id, i);
    return `
<div class="bracket-match${isFin ? ' is-final' : ''}">
  <div class="bm-row${winner === 't0' ? ' winner' : ''}">
    <input type="text" class="bm-team" data-key="${kt0}"
      value="${STATE.bracket[kt0] || ''}" placeholder="${ph0}" autocomplete="off">
    <input type="number" class="bm-score" data-key="${ks0}"
      value="${STATE.bracket[ks0] || ''}" min="0" max="99" placeholder="0">
  </div>
  <div class="bm-row${winner === 't1' ? ' winner' : ''}">
    <input type="text" class="bm-team" data-key="${kt1}"
      value="${STATE.bracket[kt1] || ''}" placeholder="${ph1}" autocomplete="off">
    <input type="number" class="bm-score" data-key="${ks1}"
      value="${STATE.bracket[ks1] || ''}" min="0" max="99" placeholder="0">
  </div>
</div>`;
  }).join('');

  return `
<div class="bracket-round">
  <div class="bracket-round-title">${ronda.label}</div>
  <div class="bracket-matches-col">${matches}</div>
</div>`;
}

function onBracketInput(e) {
  const key = e.target.dataset.key;
  STATE.bracket[key] = e.target.value;
  highlightWinnerRows();
  updateChampion();
  saveDraft();
}

function highlightWinnerRows() {
  RONDAS.forEach(ronda => {
    for (let i = 0; i < ronda.partidos; i++) {
      const matchEl = document.querySelector(
        `#bracket-render .bracket-match:has([data-key="${ronda.id}-${i}-t0"])`
      );
      if (!matchEl) continue;
      const rows = matchEl.querySelectorAll('.bm-row');
      const winner = detectWinner(ronda.id, i);
      rows[0].classList.toggle('winner', winner === 't0');
      rows[1].classList.toggle('winner', winner === 't1');
    }
  });
}

function detectWinner(rondaId, idx) {
  const s0 = parseFloat(STATE.bracket[`${rondaId}-${idx}-s0`]);
  const s1 = parseFloat(STATE.bracket[`${rondaId}-${idx}-s1`]);
  if (isNaN(s0) || isNaN(s1)) return null;
  if (s0 > s1) return 't0';
  if (s1 > s0) return 't1';
  return null;
}

function updateChampion() {
  const winner = detectWinner('fin', 0);
  let name = '';
  if (winner === 't0') name = STATE.bracket['fin-0-t0'] || '';
  if (winner === 't1') name = STATE.bracket['fin-0-t1'] || '';
  STATE.bracket['champion'] = name;
  const el = document.getElementById('champion-display');
  if (el) el.textContent = name || ' ';
}

function loadSavedBracketInputs() {
  document.querySelectorAll('#view-polla [data-key]').forEach(el => {
    const key = el.dataset.key;
    if (key && STATE.bracket[key] !== undefined) {
      el.value = STATE.bracket[key];
    }
  });
  const champEl = document.getElementById('champion-display');
  if (champEl) champEl.textContent = STATE.bracket['champion'] || ' ';
  highlightWinnerRows();
}

/* ================================================================
   TERCER LUGAR
================================================================ */
function initThirdPlace() {
  document.querySelectorAll('#third-match [data-key]').forEach(inp => {
    if (STATE.bracket[inp.dataset.key] !== undefined) {
      inp.value = STATE.bracket[inp.dataset.key];
    }
    inp.removeEventListener('input', onThirdInput);
    inp.addEventListener('input', onThirdInput);
  });
}

function onThirdInput(e) {
  STATE.bracket[e.target.dataset.key] = e.target.value;
  saveDraft();
}

/* ================================================================
   BONOS — polla activa
================================================================ */
function initBonusInputs() {
  document.querySelectorAll('[data-bonus]').forEach(inp => {
    inp.addEventListener('input', e => {
      STATE.bonuses[e.target.dataset.bonus] = e.target.value;
      saveDraft();
    });
  });
}

function loadBonusInputs() {
  document.querySelectorAll('[data-bonus]').forEach(inp => {
    inp.value = STATE.bonuses[inp.dataset.bonus] || '';
  });
}

/* ================================================================
   CONTROLES DE LA QUINIELA (nombre + export + limpiar)
================================================================ */
function initPollaControls() {
  const nameInp = document.getElementById('q-player-name');
  if (nameInp) {
    nameInp.value = STATE.player || '';
    nameInp.addEventListener('input', e => {
      STATE.player = e.target.value;
      saveDraft();
    });
  }

  document.getElementById('btn-export-polla')?.addEventListener('click', exportJSON);
  document.getElementById('btn-export-pdf')?.addEventListener('click', exportGroupsPDF);

  document.getElementById('btn-clear-polla')?.addEventListener('click', () => {
    if (!confirm('¿Borrar TODOS los datos de tu polla?\nEsta acción no se puede deshacer.')) return;
    const player = STATE.player;
    STATE = { player, scores: {}, bracket: {}, bonuses: {} };
    saveDraft();
    renderGroups();
    renderBracket();
    recalcAllGroups();
    loadSavedBracketInputs();
    loadBonusInputs();
    initThirdPlace();
  });
}

/* ================================================================
   EXPORT PDF — grupos
================================================================ */
function exportGroupsPDF() {
  document.body.classList.add('printing-grupos');
  window.print();
  window.addEventListener('afterprint', () => {
    document.body.classList.remove('printing-grupos');
  }, { once: true });
}

/* ================================================================
   EXPORT JSON
================================================================ */
function exportJSON() {
  const name = STATE.player.trim();
  if (!name) {
    alert('Escribe tu nombre antes de exportar.');
    document.getElementById('q-player-name')?.focus();
    return;
  }
  const payload = {
    name,
    exported: new Date().toISOString(),
    scores:   STATE.scores,
    bracket:  STATE.bracket,
    bonuses:  STATE.bonuses
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  const slug = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
  a.href     = url;
  a.download = `${slug}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ================================================================
   PERSISTENCIA — borrador en localStorage
================================================================ */
function saveDraft() {
  try { localStorage.setItem(LS_DRAFT, JSON.stringify(STATE)); } catch (_) {}
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(LS_DRAFT);
    if (raw) STATE = JSON.parse(raw);
  } catch (_) {}
}

/* ================================================================
   UTILS
================================================================ */
function scoreKey(group, match, side) {
  return `${group}-${match}-${side}`;
}

function flag(t) {
  return `<span class="fi fi-${t.code}"></span>`;
}
