/* ================================================================
   POLLA MUNDIALISTA FIFA 2026
   app.js — Multi-participante con autenticación Supabase
================================================================ */

/* ---- SUPABASE ---- */
const SUPABASE_URL = 'https://txwvhlearumjshvadedd.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4d3ZobGVhcnVtanNodmFkZWRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NTQ0ODUsImV4cCI6MjA5NjIzMDQ4NX0.9BhmsyMrWwoWIgA11xIoobT-BaanOZEoVUlnuVu_ILo';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

let CURRENT_USER = null; // { id, email, name, is_admin }
let IS_GROUPS_LOCKED = false;
let IMPORT_ENABLED = true;
let BRACKET_ROUNDS_OPEN = {};   // admin controla qué rondas están abiertas {r32:true, r16:false…}
let BRACKET_ROUNDS_LOCKED = {}; // usuario bloquea sus predicciones por ronda {r32:true…}
let _bracketRoundsMigrated = false; // true cuando las columnas nuevas existen en Supabase
let _appReady = false;

/* ----------------------------------------------------------------
   DATOS: 12 Grupos (Sorteo diciembre 2024)
---------------------------------------------------------------- */
const GROUPS = {
  A: {
    teams: [
      { code: 'mx', n: 'México' }, { code: 'za', n: 'Sudáfrica' },
      { code: 'kr', n: 'Corea del Sur' }, { code: 'cz', n: 'Rep. Checa' }
    ]
  },
  B: {
    teams: [
      { code: 'ca', n: 'Canadá' }, { code: 'ba', n: 'Bosnia-Herz.' },
      { code: 'qa', n: 'Catar' }, { code: 'ch', n: 'Suiza' }
    ]
  },
  C: {
    teams: [
      { code: 'br', n: 'Brasil' }, { code: 'ma', n: 'Marruecos' },
      { code: 'ht', n: 'Haití' }, { code: 'gb-sct', n: 'Escocia' }
    ]
  },
  D: {
    teams: [
      { code: 'us', n: 'EE.UU.' }, { code: 'py', n: 'Paraguay' },
      { code: 'au', n: 'Australia' }, { code: 'tr', n: 'Turquía' }
    ]
  },
  E: {
    teams: [
      { code: 'de', n: 'Alemania' }, { code: 'cw', n: 'Curazao' },
      { code: 'ci', n: 'Costa de Marfil' }, { code: 'ec', n: 'Ecuador' }
    ]
  },
  F: {
    teams: [
      { code: 'nl', n: 'Países Bajos' }, { code: 'jp', n: 'Japón' },
      { code: 'se', n: 'Suecia' }, { code: 'tn', n: 'Túnez' }
    ]
  },
  G: {
    teams: [
      { code: 'be', n: 'Bélgica' }, { code: 'eg', n: 'Egipto' },
      { code: 'ir', n: 'Irán' }, { code: 'nz', n: 'Nueva Zelanda' }
    ]
  },
  H: {
    teams: [
      { code: 'es', n: 'España' }, { code: 'cv', n: 'Cabo Verde' },
      { code: 'sa', n: 'Arabia Saudita' }, { code: 'uy', n: 'Uruguay' }
    ]
  },
  I: {
    teams: [
      { code: 'fr', n: 'Francia' }, { code: 'sn', n: 'Senegal' },
      { code: 'iq', n: 'Iraq' }, { code: 'no', n: 'Noruega' }
    ]
  },
  J: {
    teams: [
      { code: 'ar', n: 'Argentina' }, { code: 'dz', n: 'Argelia' },
      { code: 'at', n: 'Austria' }, { code: 'jo', n: 'Jordania' }
    ]
  },
  K: {
    teams: [
      { code: 'pt', n: 'Portugal' }, { code: 'cd', n: 'RD Congo' },
      { code: 'uz', n: 'Uzbekistán' }, { code: 'co', n: 'Colombia' }
    ]
  },
  L: {
    teams: [
      { code: 'gb-eng', n: 'Inglaterra' }, { code: 'hr', n: 'Croacia' },
      { code: 'gh', n: 'Ghana' }, { code: 'pa', n: 'Panamá' }
    ]
  }
};

const MATCH_INFO = {
  A: [
    { date: '11 jun', time: '14:00', venue: 'Est. Azteca, Cd. de México' },
    { date: '11 jun', time: '21:00', venue: 'Est. Akron, Guadalajara' },
    { date: '18 jun', time: '11:00', venue: 'Mercedes-Benz Stadium, Atlanta' },
    { date: '18 jun', time: '20:00', venue: 'Est. Akron, Guadalajara' },
    { date: '24 jun', time: '20:00', venue: 'Est. Azteca, Cd. de México' },
    { date: '24 jun', time: '20:00', venue: 'Est. BBVA, Monterrey' },
  ],
  B: [
    { date: '12 jun', time: '14:00', venue: 'BMO Field, Toronto' },
    { date: '13 jun', time: '14:00', venue: "Levi's Stadium, San Francisco" },
    { date: '18 jun', time: '14:00', venue: 'SoFi Stadium, Los Ángeles' },
    { date: '18 jun', time: '17:00', venue: 'BC Place, Vancouver' },
    { date: '24 jun', time: '14:00', venue: 'BC Place, Vancouver' },
    { date: '24 jun', time: '14:00', venue: 'Lumen Field, Seattle' },
  ],
  C: [
    { date: '13 jun', time: '17:00', venue: 'MetLife Stadium, Nueva York' },
    { date: '13 jun', time: '20:00', venue: 'Gillette Stadium, Boston' },
    { date: '19 jun', time: '17:00', venue: 'Gillette Stadium, Boston' },
    { date: '19 jun', time: '20:00', venue: 'Lincoln Financial Field, Filadelfia' },
    { date: '24 jun', time: '17:00', venue: 'Hard Rock Stadium, Miami' },
    { date: '24 jun', time: '17:00', venue: 'Mercedes-Benz Stadium, Atlanta' },
  ],
  D: [
    { date: '12 jun', time: '20:00', venue: 'SoFi Stadium, Los Ángeles' },
    { date: '13 jun', time: '23:00', venue: 'BC Place, Vancouver' },
    { date: '19 jun', time: '14:00', venue: 'Lumen Field, Seattle' },
    { date: '19 jun', time: '23:00', venue: "Levi's Stadium, san Francisco" },
    { date: '25 jun', time: '21:00', venue: 'SoFi Stadium, Los Ángeles' },
    { date: '25 jun', time: '21:00', venue: "Levi's Stadium, San Francisco" },
  ],
  E: [
    { date: '14 jun', time: '12:00', venue: 'NRG Stadium, Houston' },
    { date: '14 jun', time: '18:00', venue: 'Lincoln Financial Field, Filadelfia' },
    { date: '20 jun', time: '15:00', venue: 'BMO Field, Toronto' },
    { date: '20 jun', time: '19:00', venue: 'Arrowhead Stadium, Kansas City' },
    { date: '25 jun', time: '15:00', venue: 'MetLife Stadium, Nueva York' },
    { date: '25 jun', time: '15:00', venue: 'Lincoln Financial Field, Filadelfia' },
  ],
  F: [
    { date: '14 jun', time: '15:00', venue: 'AT&T Stadium, Dallas' },
    { date: '14 jun', time: '21:00', venue: 'Est. BBVA, Monterrey' },
    { date: '20 jun', time: '12:00', venue: 'NRG Stadium, Houston' },
    { date: '19 jun', time: '23:00', venue: 'Est. BBVA, Monterrey' },
    { date: '25 jun', time: '18:00', venue: 'Arrowhead Stadium, Kansas City' },
    { date: '25 jun', time: '18:00', venue: 'AT&T Stadium, Dallas' },
  ],
  G: [
    { date: '15 jun', time: '14:00', venue: 'Lumen Field, Seattle' },
    { date: '15 jun', time: '20:00', venue: 'SoFi Stadium, Los Ángeles' },
    { date: '21 jun', time: '14:00', venue: 'SoFi Stadium, Los Ángeles' },
    { date: '21 jun', time: '20:00', venue: 'BC Place, Vancouver' },
    { date: '26 jun', time: '22:00', venue: 'BC Place, Vancouver' },
    { date: '26 jun', time: '22:00', venue: 'Lumen Field, Seattle' },
  ],
  H: [
    { date: '15 jun', time: '11:00', venue: 'Mercedes-Benz Stadium, Atlanta' },
    { date: '15 jun', time: '17:00', venue: 'Hard Rock Stadium, Miami' },
    { date: '21 jun', time: '11:00', venue: 'Mercedes-Benz Stadium, Atlanta' },
    { date: '21 jun', time: '17:00', venue: 'Hard Rock Stadium, Miami' },
    { date: '26 jun', time: '19:00', venue: 'Est. Akron, Guadalajara' },
    { date: '26 jun', time: '19:00', venue: 'NRG Stadium, Houston' },
  ],
  I: [
    { date: '16 jun', time: '14:00', venue: 'MetLife Stadium, Nueva York' },
    { date: '16 jun', time: '17:00', venue: 'Gillette Stadium, Boston' },
    { date: '22 jun', time: '16:00', venue: 'Lincoln Financial Field, Filadelfia' },
    { date: '22 jun', time: '19:00', venue: 'MetLife Stadium, Nueva York' },
    { date: '26 jun', time: '14:00', venue: 'Gillette Stadium, Boston' },
    { date: '26 jun', time: '14:00', venue: 'BMO Field, Toronto' },
  ],
  J: [
    { date: '16 jun', time: '20:00', venue: 'Arrowhead Stadium, Kansas City' },
    { date: '16 jun', time: '23:00', venue: "Levi's Stadium, San Francisco" },
    { date: '22 jun', time: '12:00', venue: 'AT&T Stadium, Dallas' },
    { date: '22 jun', time: '22:00', venue: "Levi's Stadium, San Francisco" },
    { date: '27 jun', time: '21:00', venue: 'AT&T Stadium, Dallas' },
    { date: '27 jun', time: '21:00', venue: 'Arrowhead Stadium, Kansas City' },
  ],
  K: [
    { date: '17 jun', time: '12:00', venue: 'NRG Stadium, Houston' },
    { date: '17 jun', time: '21:00', venue: 'Est. Azteca, Cd. de México' },
    { date: '23 jun', time: '12:00', venue: 'NRG Stadium, Houston' },
    { date: '23 jun', time: '21:00', venue: 'Est. Akron, Guadalajara' },
    { date: '27 jun', time: '18:30', venue: 'Hard Rock Stadium, Miami' },
    { date: '27 jun', time: '18:30', venue: 'Mercedes-Benz Stadium, Atlanta' },
  ],
  L: [
    { date: '17 jun', time: '15:00', venue: 'AT&T Stadium, Dallas' },
    { date: '17 jun', time: '18:00', venue: 'BMO Field, Toronto' },
    { date: '23 jun', time: '15:00', venue: 'Gillette Stadium, Boston' },
    { date: '23 jun', time: '18:00', venue: 'BMO Field, Toronto' },
    { date: '27 jun', time: '16:00', venue: 'MetLife Stadium, Nueva York' },
    { date: '27 jun', time: '16:00', venue: 'Lincoln Financial Field, Filadelfia' },
  ],
};

const ELIM_MATCH_INFO = {
  r32: [
    { num: 73, date: '28 jun', time: '17:00', venue: 'Los Ángeles' },
    { num: 74, date: '29 jun', time: '17:00', venue: 'Boston' },
    { num: 75, date: '29 jun', time: '20:00', venue: 'Monterrey' },
    { num: 76, date: '29 jun', time: '21:00', venue: 'Houston' },
    { num: 77, date: '30 jun', time: '18:00', venue: 'Nueva York / Nueva Jersey' },
    { num: 78, date: '30 jun', time: '20:00', venue: 'Dallas' },
    { num: 79, date: '30 jun', time: '21:00', venue: 'Ciudad de México' },
    { num: 80, date: '1 jul', time: '18:00', venue: 'Atlanta' },
    { num: 81, date: '1 jul', time: '19:00', venue: 'San Francisco Bay Area' },
    { num: 82, date: '1 jul', time: '21:00', venue: 'Seattle' },
    { num: 83, date: '2 jul', time: '18:00', venue: 'Toronto' },
    { num: 84, date: '2 jul', time: '19:00', venue: 'Los Ángeles' },
    { num: 85, date: '2 jul', time: '21:00', venue: 'Vancouver' },
    { num: 86, date: '3 jul', time: '18:00', venue: 'Miami' },
    { num: 87, date: '3 jul', time: '20:00', venue: 'Kansas City' },
    { num: 88, date: '3 jul', time: '21:00', venue: 'Dallas' }
  ],
  r16: [
    { num: 89, date: '4 jul', time: '16:00', venue: 'Filadelfia' },
    { num: 90, date: '4 jul', time: '20:00', venue: 'Houston' },
    { num: 91, date: '5 jul', time: '15:00', venue: 'Nueva York / Nueva Jersey' },
    { num: 92, date: '5 jul', time: '19:00', venue: 'Ciudad de México' },
    { num: 93, date: '6 jul', time: '16:00', venue: 'Dallas' },
    { num: 94, date: '6 jul', time: '20:00', venue: 'Atlanta' },
    { num: 95, date: '7 jul', time: '15:00', venue: 'Monterrey' },
    { num: 96, date: '7 jul', time: '19:00', venue: 'Boston' }
  ],
  qf: [
    { num: 97, date: '9 jul', time: '15:00', venue: 'Boston' },
    { num: 98, date: '10 jul', time: '18:00', venue: 'Los Ángeles' },
    { num: 99, date: '11 jul', time: '15:00', venue: 'Kansas City' },
    { num: 100, date: '11 jul', time: '19:00', venue: 'Miami' }
  ],
  sf: [
    { num: 101, date: '14 jul', time: '19:00', venue: 'Dallas' },
    { num: 102, date: '15 jul', time: '19:00', venue: 'Atlanta' }
  ],
  fin: [
    { num: 104, date: '19 jul', time: '14:00', venue: 'MetLife Stadium (NY/NJ)' }
  ],
  '3rd': [
    { num: 103, date: '18 jul', time: '14:00', venue: 'Hard Rock Stadium, Miami' }
  ]
};

function getMatchMetaHTML(rondaId, idx) {
  const info = ELIM_MATCH_INFO[rondaId]?.[idx];
  if (!info) return '';
  return `
<div class="bracket-match-meta">
  <div class="bm-meta-row">
    <span class="bm-meta-num">#${info.num}</span>
    <span class="bm-meta-date">${info.date} · ${info.time} COT</span>
  </div>
  <div class="bm-meta-venue">${info.venue}</div>
</div>`;
}

const JORNADAS = [
  { label: 'Jornada 1', pares: [[0, 1], [2, 3]] },
  { label: 'Jornada 2', pares: [[0, 2], [3, 1]] },
  { label: 'Jornada 3', pares: [[3, 0], [1, 2]] }
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
  { id: 'r16', label: 'Octavos de Final', partidos: 8, placeholders: [] },
  { id: 'qf', label: 'Cuartos de Final', partidos: 4, placeholders: [] },
  { id: 'sf', label: 'Semifinales', partidos: 2, placeholders: [] },
  { id: 'fin', label: 'FINAL 🏆', partidos: 1, placeholders: [] }
];

const ELIM_PHASES = [
  ...RONDAS,
  { id: '3rd', label: 'Tercer Puesto', partidos: 1, placeholders: ['Perdedor Semifinal 1', 'Perdedor Semifinal 2'] }
];

function getElimKeys(rondaId, matchIdx) {
  if (rondaId === '3rd') {
    return {
      t0: '3rd-t0',
      t1: '3rd-t1',
      s0: '3rd-s0',
      s1: '3rd-s1'
    };
  }
  return {
    t0: `${rondaId}-${matchIdx}-t0`,
    t1: `${rondaId}-${matchIdx}-t1`,
    s0: `${rondaId}-${matchIdx}-s0`,
    s1: `${rondaId}-${matchIdx}-s1`
  };
}

function getMatchPair(letter, matchIdx) {
  const mi = (MATCH_INFO[letter] || [])[matchIdx];
  if (mi?.pair) return mi.pair;
  const jIdx = Math.floor(matchIdx / 2);
  const pIdx = matchIdx % 2;
  return JORNADAS[jIdx]?.pares[pIdx] || [0, 1];
}

/* ----------------------------------------------------------------
   PUNTUACIÓN
---------------------------------------------------------------- */
const ROUND_PTS = {
  groups: { exact: 3, result: 1 },
  r32: { exact: 4, result: 2 },
  r16: { exact: 5, result: 3 },
  qf: { exact: 6, result: 4 },
  sf: { exact: 7, result: 5 },
  third: { exact: 8, result: 6 },
  fin: { exact: 9, result: 7 }
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

const BONUS_GROUPS = [
  { label: '🏅 Posiciones finales', keys: ['campeon', 'subcampeon', 'tercero', 'cuarto'] },
  { label: '⭐ Premios individuales', keys: ['goleador', 'mejorJugador', 'mejorArquero'] },
  { label: '📊 Primera ronda', keys: ['vallaMin', 'vallaMax', 'masPuntosGrupos', 'menosPuntosGrupos'] },
  { label: '🇨🇴 Colombia Especiales', keys: ['primerGolInaugural', 'colPrimerGolUzb', 'colPrimerAmarillaUzb'] }
];
const MANUAL_BONUS_KEYS = new Set(['goleador', 'mejorJugador', 'mejorArquero']);

const ROUND_KEY = { r32: 'r32', r16: 'r16', qf: 'qf', sf: 'sf', fin: 'fin', third: 'third' };

/* ----------------------------------------------------------------
   ESTADO
---------------------------------------------------------------- */
let STATE = { player: '', scores: {}, bracket: {}, bonuses: {} };
const LS_DRAFT = 'mundial2026_draft';

let _officialBracket = {};   // admin-set bracket (teams + scores) for participant pre-fill
let _verPlayerData = null;
let _verResults = null;
let _rankingPlayers = [];    // cache para modal de detalle en ranking
let _rankingResults = null;
let _rankingGroups = [];     // grupos de empate del podio (modal de nombres)

/* ================================================================
   INIT
================================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  initLoginUI();
  initRouter();        // hashchange listener + render initial public view
  initPlayerDetailModal();

  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    await loadCurrentUser(session.user.id);
    showApp();
    await initApp();
    route();           // re-render current view with auth data
  }
  updateHeaderState(); // set header/tabs to guest or logged-in

  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      await loadCurrentUser(session.user.id);
      showApp();
      await initApp();
      updateHeaderState();
      location.hash = CURRENT_USER?.is_admin ? '#admin' : '#polla';
      route();
    } else if (event === 'SIGNED_OUT') {
      CURRENT_USER = null;
      _appReady = false;
      STATE = { player: '', scores: {}, bracket: {}, bonuses: {} };
      try { localStorage.removeItem(LS_DRAFT); } catch (_) { }
      updateHeaderState();
      location.hash = '#home';
    }
  });
});

async function initApp() {
  if (_appReady) { await loadDraft(); return; }
  _appReady = true;

  await loadDraft();
  initInnerTabs();
  initInnerTabsVer();
  initPollaControls();
  initThirdPlace();
  initTeamPickers();   // reemplaza inputs de equipo con pickers antes de initBonusInputs
  initBonusInputs();
  initAdminPanel();
}

/* ================================================================
   AUTH
================================================================ */
function showLogin() {
  document.getElementById('view-login').classList.remove('hidden');
  document.getElementById('login-email')?.focus();
}

function showApp() {
  document.getElementById('view-login').classList.add('hidden');
}

function updateHeaderState() {
  const isLogged = !!CURRENT_USER;
  document.getElementById('header-user-name').classList.toggle('hidden', !isLogged);
  document.getElementById('btn-show-login').classList.toggle('hidden', isLogged);
  document.getElementById('nav-logout-wrap')?.classList.toggle('hidden', !isLogged);
  const pollaTab = document.querySelector('.tab-btn[data-hash="#polla"]');
  if (pollaTab) {
    pollaTab.classList.toggle('hidden', !isLogged);
    pollaTab.innerHTML = CURRENT_USER?.is_admin
      ? '<i class="fa-solid fa-users"></i> Participantes'
      : '<i class="fa-solid fa-futbol"></i> Mi Polla';
  }
  const adminTab = document.querySelector('.tab-btn[data-hash="#admin"]');
  if (adminTab) adminTab.classList.toggle('hidden', !isLogged || !CURRENT_USER?.is_admin);
  const reportesTab = document.querySelector('.tab-btn[data-hash="#reportes"]');
  if (reportesTab) reportesTab.classList.toggle('hidden', !isLogged || !CURRENT_USER?.is_admin);
  if (isLogged) {
    const el = document.getElementById('header-user-name');
    if (el) el.textContent = CURRENT_USER.name;
  }
}

async function loadCurrentUser(userId) {
  const { data } = await sb.from('profiles').select('*').eq('id', userId).single();
  CURRENT_USER = data;
}

function initLoginUI() {
  const pwInput = document.getElementById('login-password');
  const eyeBtn = document.getElementById('btn-toggle-password');
  const eyeIcon = document.getElementById('eye-icon');
  if (pwInput && eyeBtn) {
    eyeBtn.addEventListener('click', () => {
      const show = pwInput.type === 'password';
      pwInput.type = show ? 'text' : 'password';
      eyeIcon.className = show ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
      eyeBtn.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
    });
  }

  document.getElementById('login-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    const err = document.getElementById('login-error');
    btn.disabled = true;
    btn.textContent = 'Ingresando…';
    err.textContent = '';

    const { error } = await sb.auth.signInWithPassword({
      email: document.getElementById('login-email').value.trim(),
      password: document.getElementById('login-password').value,
    });

    btn.disabled = false;
    btn.textContent = 'Ingresar';

    if (error) {
      err.textContent = 'Email o contraseña incorrectos.';
    }
  });

  const doLogout = async () => { await sb.auth.signOut(); };
  document.getElementById('btn-logout-nav')?.addEventListener('click', doLogout);

  document.getElementById('btn-close-login')?.addEventListener('click', () => {
    document.getElementById('view-login').classList.add('hidden');
  });

  document.getElementById('btn-show-login')?.addEventListener('click', showLogin);
}

/* ================================================================
   ROUTING — hash-based
================================================================ */
function initRouter() {
  window.addEventListener('hashchange', route);
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => { location.hash = btn.dataset.hash; });
  });
  route(); // render initial public view
}

function route() {
  const hash = location.hash || '#home';
  hideAllViews();

  if (hash === '#home') {
    showView('view-home');
    setActiveTab('#home');
    loadAndRenderHome();
  } else if (hash === '#polla') {
    if (!CURRENT_USER) { showLogin(); location.hash = '#home'; return; }
    if (CURRENT_USER.is_admin) {
      showView('view-participantes');
      setActiveTab('#polla');
      loadParticipantsView();
    } else {
      showView('view-polla');
      setActiveTab('#polla');
      renderGroups();
      renderBracket();
      recalcAllGroups();
      loadSavedBracketInputs();
      loadBonusInputs();
      initThirdPlace();
      applyLockedState();
    }
  } else if (hash === '#marcadores') {
    showView('view-marcadores');
    setActiveTab('#marcadores');
  } else if (hash === '#reglamento') {
    showView('view-reglamento');
    setActiveTab('#reglamento');
  } else if (hash === '#juego') {
    showView('view-juego');
    setActiveTab('#juego');
  } else if (hash === '#admin' && CURRENT_USER?.is_admin) {
    showView('view-admin');
    setActiveTab('#admin');
    loadAdminResultsEditor();
  } else if (hash === '#reportes' && CURRENT_USER?.is_admin) {
    showView('view-reportes');
    setActiveTab('#reportes');
    loadReportesView();
  } else if (hash.startsWith('#ver/')) {
    const nombre = decodeURIComponent(hash.slice(5));
    showView('view-ver');
    setActiveTab(null);
    loadPlayerView(nombre);
  } else {
    location.hash = '#home';
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
   HOME
================================================================ */
async function loadAndRenderHome() {
  const homeEl = document.getElementById('view-home');
  homeEl.classList.add('loading');
  const { players, results } = await fetchData();
  homeEl.classList.remove('loading');
  renderTodayMatches(results);
  renderUpcomingMatches(results);
  renderRanking(players, results);
  renderBonosGanados(players, results);
  renderMatchPoints(players, results);
}

async function fetchData() {
  try {
    const [pollasRes, resultsRes] = await Promise.all([
      sb.from('pollas').select('scores, bracket, bonuses, manual_bonus_pts, profiles(name, is_admin)'),
      sb.from('official_results').select('*').eq('id', 1).single()
    ]);

    const players = (pollasRes.data || [])
      .filter(p => !p.profiles?.is_admin)
      .map(p => ({
        name: p.profiles?.name || 'Sin nombre',
        scores: p.scores || {},
        bracket: p.bracket || {},
        bonuses: p.bonuses || {},
        manual_bonus_pts: p.manual_bonus_pts || {},
      }));

    const r = resultsRes.data;
    const results = r
      ? { scores: r.scores || {}, bracket: r.bracket || {}, bonuses: r.bonuses || {}, updated: r.updated_at }
      : { scores: {}, bracket: {}, bonuses: {} };

    return { players, results };
  } catch (_) {
    return { players: [], results: { scores: {}, bracket: {}, bonuses: {} } };
  }
}

/* ================================================================
   PARTIDOS DEL DÍA
================================================================ */
const MONTH_MAP = {
  'ene': 1, 'feb': 2, 'mar': 3, 'abr': 4, 'may': 5, 'jun': 6,
  'jul': 7, 'ago': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dic': 12
};

function parseMatchDate(dateStr) {
  const [day, mon] = dateStr.trim().toLowerCase().split(' ');
  return { day: parseInt(day), month: MONTH_MAP[mon] || 0 };
}

function isMatchLive(dateStr, timeStr) {
  try {
    const { day, month } = parseMatchDate(dateStr);
    const [h, m] = timeStr.split(':').map(Number);
    const nowCOT = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
    const start = new Date(2026, month - 1, day, h, m, 0);
    const end = new Date(start.getTime() + 110 * 60 * 1000);
    return nowCOT >= start && nowCOT <= end;
  } catch (_) { return false; }
}

function isMatchFinished(dateStr, timeStr) {
  try {
    const { day, month } = parseMatchDate(dateStr);
    const [h, m] = timeStr.split(':').map(Number);
    const nowCOT = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
    const end = new Date(new Date(2026, month - 1, day, h, m, 0).getTime() + 110 * 60 * 1000);
    return nowCOT > end;
  } catch (_) { return false; }
}

function renderTodayMatches(results) {
  const today = new Date();
  const todayDay = today.getDate();
  const todayMonth = today.getMonth() + 1;
  const todayMatches = [];

  // 1. Fase de Grupos
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
          time: mi.time, venue: mi.venue,
          live: isMatchLive(mi.date, mi.time),
          finished: isMatchFinished(mi.date, mi.time)
        });
      }
    });
  });

  // 2. Fases de Eliminatorias
  ELIM_PHASES.forEach(ronda => {
    const matches = ELIM_MATCH_INFO[ronda.id] || [];
    matches.forEach((mi, matchIdx) => {
      const { day, month } = parseMatchDate(mi.date);
      if (day === todayDay && month === todayMonth) {
        const keys = getElimKeys(ronda.id, matchIdx);
        const t0Name = results?.bracket?.[keys.t0] || ronda.placeholders[matchIdx * 2] || `Eq. ${matchIdx * 2 + 1}`;
        const t1Name = results?.bracket?.[keys.t1] || ronda.placeholders[matchIdx * 2 + 1] || `Eq. ${matchIdx * 2 + 2}`;
        const t0 = { n: t0Name, code: _teamCodeMap[t0Name] || '' };
        const t1 = { n: t1Name, code: _teamCodeMap[t1Name] || '' };
        todayMatches.push({
          group: ronda.label, matchIdx,
          t0, t1,
          time: mi.time, venue: mi.venue,
          live: isMatchLive(mi.date, mi.time),
          finished: isMatchFinished(mi.date, mi.time)
        });
      }
    });
  });

  const section = document.getElementById('today-section');
  const grid = document.getElementById('today-grid');
  const label = document.getElementById('today-date-label');

  if (todayMatches.length === 0) {
    label.textContent = today.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    grid.innerHTML = '<p class="section-placeholder">No hay partidos programados para hoy.</p>';
    section.classList.remove('hidden');
    return;
  }

  label.textContent = today.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const anyLive = todayMatches.some(m => m.live);
  document.getElementById('today-section').querySelector('h2').innerHTML =
    anyLive ? '<i class="fa-solid fa-circle" style="color:#ff3b3b"></i> Partidos en Vivo' : '<i class="fa-solid fa-futbol"></i> Partidos de Hoy';

  grid.innerHTML = todayMatches.map(m => {
    const cardClass = m.live ? ' today-live' : m.finished ? ' today-finished' : '';
    const badge = m.live
      ? '<span class="live-badge"><i class="fa-solid fa-circle"></i> EN VIVO</span>'
      : m.finished
        ? '<span class="finished-badge"><i class="fa-solid fa-flag-checkered"></i> Finalizado</span>'
        : `<span class="today-time"><i class="fa-regular fa-clock"></i> ${m.time} COT</span>`;
    const vs = m.live ? '●' : m.finished ? '-' : 'VS';
    const groupLabel = m.group.length === 1 ? `Grupo ${m.group}` : m.group;
    return `
<div class="today-card${cardClass}">
  <div class="today-card-top">
    <span class="today-group-badge">${groupLabel}</span>
    ${badge}
  </div>
  <div class="today-teams">
    <div class="today-team">${flag(m.t0)}<span>${m.t0.n}</span></div>
    <div class="today-vs">${vs}</div>
    <div class="today-team">${flag(m.t1)}<span>${m.t1.n}</span></div>
  </div>
  <div class="today-info">
    <span><i class="fa-solid fa-location-dot"></i> ${m.venue}</span>
  </div>
</div>`;
  }).join('');
  section.classList.remove('hidden');
}

/* ================================================================
   RANKING
================================================================ */
function renderRanking(players, results) {
  const podiumWrap = document.getElementById('podium-wrap');
  const tableWrap = document.getElementById('ranking-table-wrap');
  const emptyMsg = document.getElementById('ranking-empty');
  const tbody = document.getElementById('ranking-tbody');
  const updLabel = document.getElementById('results-updated-label');

  if (results.updated) {
    updLabel.textContent = 'Resultados actualizados: ' + new Date(results.updated).toLocaleString('es');
  }

  if (players.length === 0) {
    if (!CURRENT_USER) {
      emptyMsg.innerHTML =
        '<p>Inicia sesión para ver el ranking de participantes</p>' +
        '<button class="btn btn-gold" id="btn-ranking-login">Ingresar →</button>';
      document.getElementById('btn-ranking-login')
        ?.addEventListener('click', showLogin);
    } else {
      emptyMsg.textContent = 'Aún no hay participantes con polla guardada.';
    }
    emptyMsg.classList.remove('hidden');
    podiumWrap.classList.add('hidden');
    tableWrap.classList.add('hidden');
    return;
  }

  emptyMsg.classList.add('hidden');

  const scored = players
    .map(p => ({ ...p, score: calcScore(p, results) }))
    .sort((a, b) =>
      b.score.total - a.score.total ||
      b.score.exact - a.score.exact ||
      b.score.result - a.score.result ||
      b.score.bonuses - a.score.bonuses ||
      a.name.localeCompare(b.name)
    );

  // Rango estilo competencia: 1,1,3 (no 1,2,2)
  // Empate genuino = iguales en TODOS los criterios de desempate
  let currentRank = 1;
  scored.forEach((p, idx) => {
    if (idx > 0) {
      const prev = scored[idx - 1];
      const trueTie =
        p.score.total === prev.score.total &&
        p.score.exact === prev.score.exact &&
        p.score.result === prev.score.result &&
        p.score.bonuses === prev.score.bonuses;
      if (!trueTie) currentRank = idx + 1;
    }
    p._rank = currentRank;
  });

  podiumWrap.classList.remove('hidden');
  const MEDALS = [
    '<i class="fa-solid fa-medal" style="color:#FFD700"></i>',
    '<i class="fa-solid fa-medal" style="color:#C0C0C0"></i>',
    '<i class="fa-solid fa-medal" style="color:#CD7F32"></i>'
  ];

  // Agrupar empatados en una sola barra por posición
  const rankGroups = [];
  scored.forEach(p => {
    const last = rankGroups[rankGroups.length - 1];
    if (last && last.rank === p._rank) {
      last.players.push(p);
    } else {
      rankGroups.push({ rank: p._rank, players: [p], pts: p.score.total });
    }
  });

  // Altura de la BARRA proporcional a los puntos (la info va aparte, así los
  // nombres largos en móvil no inflan la barra y el alto siempre refleja puntos)
  const shownPts = rankGroups.slice(0, 5).map(g => g.pts);
  const maxPts = Math.max(...shownPts), minPts = Math.min(...shownPts);
  // mínimo suficiente para medalla/posición + puntos dentro de la barra
  const H_MAX = 200, H_MIN = 78;
  const heightFor = pts => maxPts === minPts
    ? H_MAX
    : Math.round(H_MIN + (pts - minPts) / (maxPts - minPts) * (H_MAX - H_MIN));

  // Orden visual: 4°, 2°, 1°, 3°, 5° (por índice de grupo)
  const podiumPositions = [3, 1, 0, 2, 4];
  podiumWrap.innerHTML = podiumPositions
    .filter(i => rankGroups[i])
    .map(i => {
      const g = rankGroups[i];
      const { rank, players, pts } = g;
      const medalIcon = rank <= 3 ? MEDALS[rank - 1] : null;
      const icon = medalIcon
        ? `<div class="podium-medal">${medalIcon}</div>`
        : `<div class="podium-pos">${rank}°</div>`;
      // 1er puesto siempre muestra nombres; los demás, si hay empate, ojo de detalle
      const namesHTML = (rank === 1 || players.length === 1)
        ? players.map(p => `<div class="podium-name">${p.name}</div>`).join('')
        : `<div class="podium-name podium-name-grouped">${players.length} participantes</div>
           <button class="btn-eye-detail podium-eye" data-rank="${rank}" title="Ver nombres"><i class="fa-regular fa-eye"></i></button>`;
      // La clase visual va por orden del grupo (i+1), no por el rango real,
      // para que con empates (rangos 1,3,7…) siempre haya estilo definido
      // 1er puesto: copa encima de la barra y nombres DENTRO de ella
      // (min-height: es siempre la barra más alta, puede crecer si hay muchos empatados)
      if (rank === 1) {
        return `
<div class="podium-col">
  <div class="podium-step pos-1" style="min-height:${heightFor(pts)}px">
    <img src="./assets/trophy_only.svg" alt="Trofeo" class="podium-trophy">
    ${icon}
    ${namesHTML}
    <div class="podium-pts">${pts} pts</div>
  </div>
</div>`;
      }
      return `
<div class="podium-col">
  <div class="podium-info">
    ${namesHTML}
  </div>
  <div class="podium-step pos-${i + 1}" style="height:${heightFor(pts)}px">
    ${icon}
    <div class="podium-pts">${pts} pts</div>
  </div>
</div>`;
    }).join('');

  _rankingPlayers = scored;
  _rankingResults = results;
  _rankingGroups = rankGroups;

  podiumWrap.querySelectorAll('.podium-eye').forEach(btn => {
    btn.addEventListener('click', () => openPodiumNamesModal(parseInt(btn.dataset.rank, 10)));
  });

  // Contador total de participantes en el encabezado
  const totalEl = document.getElementById('ranking-total');
  if (totalEl) {
    totalEl.textContent = `${scored.length} participantes`;
    totalEl.classList.remove('hidden');
  }

  tableWrap.classList.remove('hidden');
  const RANK_PREVIEW = 10;
  tbody.innerHTML = scored.map((p, idx) => {
    const rank = p._rank;
    const isTied = scored.filter(s => s._rank === rank).length > 1;
    const extra = idx >= RANK_PREVIEW ? ' rank-row-extra' : '';
    return `
<tr class="${rank === 1 ? 'rank-first' : ''}${extra}">
  <td class="rank-pos">${rank}${isTied ? '<span class="tie-eq"> =</span>' : ''}</td>
  <td class="rank-name"><a href="#ver/${encodeURIComponent(p.name)}">${p.name}</a></td>
  <td class="rank-pts">${p.score.total}</td>
  <td class="rank-eye"><button class="btn-eye-detail" data-player="${p.name}" title="Ver detalle"><i class="fa-regular fa-eye"></i></button></td>
</tr>`;
  }).join('');

  tbody.querySelectorAll('.btn-eye-detail').forEach(btn => {
    btn.addEventListener('click', () => openPlayerDetailModal(btn.dataset.player));
  });

  // Acordeón: top 10 visible, botón para desplegar/plegar el resto
  const moreBtn = document.getElementById('btn-ranking-more');
  const moreLabel = document.getElementById('ranking-more-label');
  if (moreBtn && moreLabel) {
    const hiddenCount = scored.length - RANK_PREVIEW;
    if (hiddenCount > 0) {
      tableWrap.classList.add('rank-collapsed');
      moreBtn.classList.remove('hidden', 'expanded');
      moreLabel.textContent = `Ver los ${scored.length} participantes`;
      moreBtn.onclick = () => {
        const collapsed = tableWrap.classList.toggle('rank-collapsed');
        moreBtn.classList.toggle('expanded', !collapsed);
        moreLabel.textContent = collapsed ? `Ver los ${scored.length} participantes` : 'Ver menos';
        if (collapsed) tableWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
    } else {
      tableWrap.classList.remove('rank-collapsed');
      moreBtn.classList.add('hidden');
    }
  }
}

/* ================================================================
   MODAL DETALLE PARTICIPANTE (ranking)
================================================================ */
function initPlayerDetailModal() {
  document.getElementById('btn-pdm-close')?.addEventListener('click', closePlayerDetailModal);
  document.getElementById('player-detail-modal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closePlayerDetailModal();
  });

  document.getElementById('btn-pnm-close')?.addEventListener('click', closePodiumNamesModal);
  document.getElementById('podium-names-modal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closePodiumNamesModal();
  });
}

/* ================================================================
   MODAL NOMBRES EMPATADOS (podio)
================================================================ */
function closePodiumNamesModal() {
  document.getElementById('podium-names-modal')?.classList.add('hidden');
}

function openPodiumNamesModal(rank) {
  const group = _rankingGroups.find(g => g.rank === rank);
  if (!group) return;

  const modal = document.getElementById('podium-names-modal');
  document.getElementById('pnm-title').textContent = `${rank}° puesto — ${group.pts} pts`;
  document.getElementById('pnm-sub').textContent = `${group.players.length} participantes empatados`;

  const list = document.getElementById('pnm-list');
  list.innerHTML = group.players
    .map(p => `<button class="pnm-item" data-player="${p.name}">
      <span>${p.name}</span><i class="fa-regular fa-eye"></i>
    </button>`).join('');

  list.querySelectorAll('.pnm-item').forEach(btn => {
    btn.addEventListener('click', () => {
      closePodiumNamesModal();
      openPlayerDetailModal(btn.dataset.player);
    });
  });

  modal.classList.remove('hidden');
}

function closePlayerDetailModal() {
  document.getElementById('player-detail-modal')?.classList.add('hidden');
}

function openPlayerDetailModal(playerName) {
  const player = _rankingPlayers.find(p => p.name === playerName);
  if (!player || !_rankingResults) return;

  const results = _rankingResults;
  const score = calcScore(player, results);

  document.getElementById('pdm-player-name').textContent = playerName;
  document.getElementById('pdm-summary').innerHTML = `
<div class="pdm-total-pts">${score.total} pts</div>
<div class="pdm-breakdown">
  <span class="pdm-tag pdm-tag-exact"><i class="fa-solid fa-bullseye"></i> ${score.exact} pts exactos</span>
  <span class="pdm-tag pdm-tag-result"><i class="fa-solid fa-check"></i> ${score.result} pts resultado</span>
  <span class="pdm-tag pdm-tag-bonus"><i class="fa-solid fa-star"></i> ${score.bonuses} pts bonos</span>
</div>`;

  // Recoger todos los partidos con resultado oficial
  const matchRows = [];

  // 1. Fase de Grupos
  JORNADAS.forEach((jornada, jIdx) => {
    jornada.pares.forEach((_, pIdx) => {
      const matchIdx = jIdx * 2 + pIdx;
      Object.keys(GROUPS).forEach(group => {
        const k0 = scoreKey(group, matchIdx, 0);
        const k1 = scoreKey(group, matchIdx, 1);
        if (!(k0 in results.scores) || !(k1 in results.scores)) return;
        const r0 = results.scores[k0], r1 = results.scores[k1];
        const hasPlayer = k0 in (player.scores || {}) && k1 in (player.scores || {});
        const p0 = hasPlayer ? player.scores[k0] : null;
        const p1 = hasPlayer ? player.scores[k1] : null;
        const par = getMatchPair(group, matchIdx);
        const teams = GROUPS[group].teams;
        const mi = (MATCH_INFO[group] || [])[matchIdx] || {};
        let pts = 0, tipo = 'miss';
        if (hasPlayer) {
          if (p0 === r0 && p1 === r1) { pts = ROUND_PTS.groups.exact; tipo = 'exact'; }
          else if (Math.sign(p0 - p1) === Math.sign(r0 - r1)) { pts = ROUND_PTS.groups.result; tipo = 'result'; }
        }
        matchRows.push({ group, t0: teams[par[0]], t1: teams[par[1]], r0, r1, p0, p1, pts, tipo, hasPlayer, date: mi.date, time: mi.time });
      });
    });
  });

  // 2. Fases de Eliminatorias
  ELIM_PHASES.forEach(ronda => {
    const matches = ELIM_MATCH_INFO[ronda.id] || [];
    matches.forEach((mi, matchIdx) => {
      const keys = getElimKeys(ronda.id, matchIdx);
      if (!(keys.s0 in (results.bracket || {})) || !(keys.s1 in (results.bracket || {}))) return;

      const r0 = Number(results.bracket[keys.s0]);
      const r1 = Number(results.bracket[keys.s1]);
      const hasPlayer = keys.s0 in (player.bracket || {}) && keys.s1 in (player.bracket || {});
      const p0 = hasPlayer ? Number(player.bracket[keys.s0]) : null;
      const p1 = hasPlayer ? Number(player.bracket[keys.s1]) : null;

      const t0Name = results.bracket[keys.t0] || ronda.placeholders[matchIdx * 2] || `Eq. ${matchIdx * 2 + 1}`;
      const t1Name = results.bracket[keys.t1] || ronda.placeholders[matchIdx * 2 + 1] || `Eq. ${matchIdx * 2 + 2}`;
      const t0 = { n: t0Name, code: _teamCodeMap[t0Name] || '' };
      const t1 = { n: t1Name, code: _teamCodeMap[t1Name] || '' };

      const ptsRonda = ROUND_PTS[ROUND_KEY[ronda.id]];
      let pts = 0, tipo = 'miss';
      if (hasPlayer && ptsRonda) {
        if (p0 === r0 && p1 === r1) { pts = ptsRonda.exact; tipo = 'exact'; }
        else if (Math.sign(p0 - p1) === Math.sign(r0 - r1)) { pts = ptsRonda.result; tipo = 'result'; }
      }

      matchRows.push({
        group: ronda.label,
        t0, t1, r0, r1, p0, p1, pts, tipo, hasPlayer,
        date: mi.date || '', time: mi.time || ''
      });
    });
  });

  matchRows.sort((a, b) => {
    const dA = parseMatchDate(a.date || '1 ene');
    const dB = parseMatchDate(b.date || '1 ene');
    return dA.month - dB.month || dA.day - dB.day || (a.time || '').localeCompare(b.time || '');
  });

  const TIPO_ICON = { exact: '⭐', result: '✓', miss: '✗' };
  const TIPO_LABEL = { exact: 'Exacto', result: 'Resultado', miss: 'Fallido' };

  const matchesHTML = matchRows.length === 0
    ? '<p class="pdm-empty">Aún no hay resultados oficiales.</p>'
    : matchRows.map(m => {
      const pred = m.hasPlayer ? `${m.p0} — ${m.p1}` : '—';
      const groupLabel = m.group.length === 1 ? `Grupo ${m.group}` : m.group;
      const badgeHTML = `<span class="pdm-match-badge">${groupLabel}</span>`;
      return `
<div class="pdm-match pdm-match-${m.tipo}">
  <div class="pdm-match-teams">
    ${badgeHTML}
    ${flag(m.t0)} ${m.t0.n} <span class="pdm-vs">vs</span> ${m.t1.n} ${flag(m.t1)}
  </div>
  <div class="pdm-match-scores">
    <span class="pdm-pred" title="Predicción del usuario"><i class="fa-regular fa-user"></i> ${pred}</span>
    <span class="pdm-arrow">→</span>
    <span class="pdm-real" title="Resultado real"><i class="fa-solid fa-flag-checkered"></i> ${m.r0} — ${m.r1}</span>
  </div>
  <div class="pdm-match-result-col pdm-result-${m.tipo}">
    ${TIPO_ICON[m.tipo]} ${TIPO_LABEL[m.tipo]}${m.pts > 0 ? ` <strong>+${m.pts} pts</strong>` : ''}
  </div>
</div>`;
    }).join('');

  document.getElementById('pdm-content').innerHTML = `
<div class="pdm-section-title"><i class="fa-solid fa-futbol"></i> Partidos con Resultado Oficial</div>
${matchesHTML}`;

  document.getElementById('player-detail-modal').classList.remove('hidden');
}

/* ================================================================
   PRÓXIMOS PARTIDOS
================================================================ */
function renderUpcomingMatches(results) {
  const grid = document.getElementById('upcoming-grid');
  if (!grid) return;

  const now = new Date();
  const todayDay = now.getDate();
  const todayMon = now.getMonth() + 1;

  const all = [];

  // 1. Fase de Grupos
  Object.entries(MATCH_INFO).forEach(([group, matches]) => {
    matches.forEach((mi, matchIdx) => {
      const { day, month } = parseMatchDate(mi.date);
      const isToday = day === todayDay && month === todayMon;
      const isPast = month < todayMon || (month === todayMon && day < todayDay);
      if (isPast || isToday) return;

      const jIdx = Math.floor(matchIdx / 2);
      const pIdx = matchIdx % 2;
      const jornada = JORNADAS[jIdx];
      const par = jornada.pares[pIdx];
      const teams = GROUPS[group].teams;

      all.push({ group, t0: teams[par[0]], t1: teams[par[1]], date: mi.date, time: mi.time, venue: mi.venue, month, day });
    });
  });

  // 2. Fases de Eliminatorias
  ELIM_PHASES.forEach(ronda => {
    const matches = ELIM_MATCH_INFO[ronda.id] || [];
    matches.forEach((mi, matchIdx) => {
      const { day, month } = parseMatchDate(mi.date);
      const isToday = day === todayDay && month === todayMon;
      const isPast = month < todayMon || (month === todayMon && day < todayDay);
      if (isPast || isToday) return;

      const keys = getElimKeys(ronda.id, matchIdx);
      const t0Name = results?.bracket?.[keys.t0] || ronda.placeholders[matchIdx * 2] || `Eq. ${matchIdx * 2 + 1}`;
      const t1Name = results?.bracket?.[keys.t1] || ronda.placeholders[matchIdx * 2 + 1] || `Eq. ${matchIdx * 2 + 2}`;
      const t0 = { n: t0Name, code: _teamCodeMap[t0Name] || '' };
      const t1 = { n: t1Name, code: _teamCodeMap[t1Name] || '' };

      all.push({
        group: ronda.label,
        t0, t1,
        date: mi.date, time: mi.time, venue: mi.venue,
        month, day
      });
    });
  });

  all.sort((a, b) => a.month - b.month || a.day - b.day);

  // Tomar solo los 2 primeros días del calendario que tengan partidos
  const dates = [...new Set(all.map(m => `${m.month}-${m.day}`))].slice(0, 2);
  const upcoming = all.filter(m => dates.includes(`${m.month}-${m.day}`));

  if (upcoming.length === 0) {
    grid.innerHTML = '<p class="section-placeholder">No hay próximos partidos programados.</p>';
    return;
  }

  let lastDate = null;
  grid.innerHTML = upcoming.map(m => {
    let dateHeader = '';
    const dateKey = `${m.day}-${m.month}`;
    if (dateKey !== lastDate) {
      lastDate = dateKey;
      const d = new Date(2026, m.month - 1, m.day);
      const label = d.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
      dateHeader = `<div class="upcoming-date-header">${label}</div>`;
    }
    const groupLabel = m.group.length === 1 ? `Grupo ${m.group}` : m.group;
    return `${dateHeader}
<div class="upcoming-card">
  <span class="upcoming-group">${groupLabel}</span>
  <div class="upcoming-teams">
    <div class="upcoming-team">${flag(m.t0)}<span>${m.t0.n}</span></div>
    <div class="upcoming-vs">VS</div>
    <div class="upcoming-team">${flag(m.t1)}<span>${m.t1.n}</span></div>
  </div>
  <div class="upcoming-meta">
    <span><i class="fa-regular fa-clock"></i> ${m.time} COT</span>
    <span><i class="fa-solid fa-location-dot"></i> ${m.venue}</span>
  </div>
</div>`;
  }).join('');
}

/* ================================================================
   BONOS OTORGADOS
================================================================ */
function renderBonosGanados(players, results) {
  const section = document.getElementById('bonos-ganados-section');
  const grid = document.getElementById('bonos-ganados-grid');
  if (!section || !grid) return;

  const scored = players.map(p => ({ ...p, score: calcScore(p, results) }));

  // Bonos con respuesta oficial en texto
  const bonosTexto = new Set(
    Object.keys(BONUS_PTS).filter(k => results.bonuses?.[k] != null && results.bonuses[k] !== '')
  );
  // Bonos otorgados manualmente a al menos un jugador
  const bonosManuales = new Set(
    Object.keys(BONUS_PTS).filter(k =>
      players.some(p => (p.manual_bonus_pts || {})[k] === true)
    )
  );
  const bonosConRespuesta = [...new Set([...bonosTexto, ...bonosManuales])];

  if (bonosConRespuesta.length === 0) {
    grid.innerHTML = '<p class="section-placeholder">Los bonos se revelarán cuando el torneo avance y haya respuestas oficiales.</p>';
    section.classList.remove('hidden');
    return;
  }

  grid.innerHTML = bonosConRespuesta.map(key => {
    const label = BONUS_LABELS[key] || key;
    const oficial = results.bonuses?.[key] || null;
    const esManual = !oficial && bonosManuales.has(key);

    const aciertos = scored.filter(p => {
      const manualOverride = (p.manual_bonus_pts || {})[key] === true;
      if (oficial) {
        const pVal = (p.bonuses || {})[key];
        const textHit = pVal != null && checkBonusMatch(pVal, oficial);
        return textHit || manualOverride;
      }
      return manualOverride;
    });

    return `
<div class="bgc-card">
  <div class="bgc-label">${label}</div>
  <div class="bgc-answer">${esManual ? '<i class="fa-solid fa-hand-holding-heart"></i> Otorgado manualmente' : `<i class="fa-solid fa-circle-check"></i> ${oficial}`}</div>
  <div class="bgc-players">
    ${aciertos.length === 0
        ? '<span class="bgc-none">Nadie acertó</span>'
        : inlineShowMoreHTML(aciertos.map(p => `<span class="bgc-winner"><i class="fa-solid fa-medal"></i> ${p.name}</span>`), 6)
      }
  </div>
</div>`;
  }).join('');

  wireInlineShowMore(grid);
  applyShowMore(grid, 10, `Ver los ${bonosConRespuesta.length} bonos`);
  section.classList.remove('hidden');
}

/* ================================================================
   VER MÁS — acordeón genérico para grids de tarjetas
================================================================ */
// Versión inline para listas de nombres dentro de una tarjeta:
// muestra `preview` items y esconde el resto tras un botón "+N más"
function inlineShowMoreHTML(itemsHTML, preview) {
  if (itemsHTML.length <= preview) return itemsHTML.join('');
  const n = itemsHTML.length - preview;
  return itemsHTML.slice(0, preview).join('') +
    `<span class="smx-extra smx-off">${itemsHTML.slice(preview).join('')}</span>` +
    `<button class="smx-btn" data-more="+${n} más">+${n} más</button>`;
}

function wireInlineShowMore(scope) {
  scope.querySelectorAll('.smx-btn').forEach(btn => {
    btn.onclick = () => {
      const extra = btn.previousElementSibling;
      const off = extra.classList.toggle('smx-off');
      btn.textContent = off ? btn.dataset.more : 'ver menos';
    };
  });
}

function applyShowMore(grid, previewCount, allLabel) {
  grid.parentElement.querySelector('.btn-show-more')?.remove();

  const items = Array.from(grid.children);
  items.forEach((el, idx) => el.classList.toggle('sm-extra', idx >= previewCount));

  if (items.length <= previewCount) {
    grid.classList.remove('sm-collapsed');
    return;
  }

  grid.classList.add('sm-collapsed');
  const btn = document.createElement('button');
  btn.className = 'btn-ranking-more btn-show-more';
  btn.innerHTML = `<span>${allLabel}</span> <i class="fa-solid fa-chevron-down"></i>`;
  btn.onclick = () => {
    const collapsed = grid.classList.toggle('sm-collapsed');
    btn.classList.toggle('expanded', !collapsed);
    btn.querySelector('span').textContent = collapsed ? allLabel : 'Ver menos';
    if (collapsed) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  grid.after(btn);
}

/* ================================================================
   PUNTOS POR PARTIDO
================================================================ */
function renderMatchPoints(players, results) {
  const section = document.getElementById('match-points-section');
  const grid = document.getElementById('match-points-grid');
  if (!section || !grid) return;

  const scored = players.map(p => ({ ...p, score: calcScore(p, results) }));

  const completedMatches = [];

  // 1. Fase de Grupos
  JORNADAS.forEach((jornada, jIdx) => {
    jornada.pares.forEach((_, pIdx) => {
      const matchIdx = jIdx * 2 + pIdx;
      Object.keys(GROUPS).forEach(group => {
        const k0 = scoreKey(group, matchIdx, 0);
        const k1 = scoreKey(group, matchIdx, 1);
        if (!(k0 in results.scores) || !(k1 in results.scores)) return;
        const mi = (MATCH_INFO[group] || [])[matchIdx];
        if (!mi) return;
        const { day, month } = parseMatchDate(mi.date);
        const r0 = results.scores[k0];
        const r1 = results.scores[k1];
        const teams = GROUPS[group].teams;
        const par = jornada.pares[pIdx];

        const earners = [];
        scored.forEach(p => {
          if (!(k0 in (p.scores || {})) || !(k1 in (p.scores || {}))) return;
          const p0 = p.scores[k0], p1 = p.scores[k1];
          let pts = 0;
          if (p0 === r0 && p1 === r1) pts = ROUND_PTS.groups.exact;
          else if (Math.sign(p0 - p1) === Math.sign(r0 - r1)) pts = ROUND_PTS.groups.result;
          if (pts > 0) earners.push({ name: p.name, pts });
        });

        completedMatches.push({
          group, matchIdx,
          t0: teams[par[0]], t1: teams[par[1]],
          r0, r1, earners,
          date: mi.date, time: mi.time,
          sortKey: month * 100 + day
        });
      });
    });
  });

  // 2. Fases de Eliminatorias
  ELIM_PHASES.forEach(ronda => {
    const matches = ELIM_MATCH_INFO[ronda.id] || [];
    matches.forEach((mi, matchIdx) => {
      const keys = getElimKeys(ronda.id, matchIdx);
      if (!(keys.s0 in (results.bracket || {})) || !(keys.s1 in (results.bracket || {}))) return;

      const r0 = Number(results.bracket[keys.s0]);
      const r1 = Number(results.bracket[keys.s1]);
      const t0Name = results.bracket[keys.t0] || ronda.placeholders[matchIdx * 2] || `Eq. ${matchIdx * 2 + 1}`;
      const t1Name = results.bracket[keys.t1] || ronda.placeholders[matchIdx * 2 + 1] || `Eq. ${matchIdx * 2 + 2}`;
      const t0 = { n: t0Name, code: _teamCodeMap[t0Name] || '' };
      const t1 = { n: t1Name, code: _teamCodeMap[t1Name] || '' };

      const ptsRonda = ROUND_PTS[ROUND_KEY[ronda.id]];
      if (!ptsRonda) return;

      const { day, month } = parseMatchDate(mi.date || '1 ene');

      const earners = [];
      scored.forEach(p => {
        if (!(keys.s0 in (p.bracket || {})) || !(keys.s1 in (p.bracket || {}))) return;
        const p0 = Number(p.bracket[keys.s0]);
        const p1 = Number(p.bracket[keys.s1]);
        let pts = 0;
        if (p0 === r0 && p1 === r1) pts = ptsRonda.exact;
        else if (Math.sign(p0 - p1) === Math.sign(r0 - r1)) pts = ptsRonda.result;
        if (pts > 0) earners.push({ name: p.name, pts });
      });

      completedMatches.push({
        group: ronda.label, matchIdx,
        t0, t1, r0, r1, earners,
        date: mi.date, time: mi.time,
        sortKey: month * 100 + day
      });
    });
  });

  // Más recientes primero; se muestran 10 y el resto queda tras "Ver más"
  completedMatches.sort((a, b) => b.sortKey - a.sortKey || b.time.localeCompare(a.time));

  if (completedMatches.length === 0) {
    grid.innerHTML = '<p class="section-placeholder">No hay partidos con resultado oficial aún.</p>';
    section.classList.remove('hidden');
    return;
  }

  grid.innerHTML = completedMatches.map(m => {
    const groupLabel = m.group.length === 1 ? `Grupo ${m.group}` : m.group;
    return `
<div class="mpc-card">
  <div class="mpc-header">
    <span class="mpc-group">${groupLabel}</span>
    <span class="mpc-date">${m.date} ${m.time}</span>
  </div>
  <div class="mpc-score-row">
    <div class="mpc-team">${flag(m.t0)} ${m.t0.n}</div>
    <div class="mpc-result">${m.r0} - ${m.r1}</div>
    <div class="mpc-team">${m.t1.n} ${flag(m.t1)}</div>
  </div>
  <div class="mpc-earners">
    ${m.earners.length === 0
      ? '<span class="mpc-none">Sin acertadores</span>'
      : inlineShowMoreHTML(m.earners.map(e => `<span class="mpc-earner">${e.name} <strong>+${e.pts}</strong></span>`), 6)
    }
  </div>
</div>`;
  }).join('');

  wireInlineShowMore(grid);
  applyShowMore(grid, 10, `Ver los ${completedMatches.length} partidos`);
  section.classList.remove('hidden');
}

/* ================================================================
   CÁLCULO DE PUNTOS
================================================================ */
function calcScore(player, results) {
  let exact = 0, result = 0, bonusTotal = 0;

  JORNADAS.forEach((jornada, jIdx) => {
    jornada.pares.forEach((_, pIdx) => {
      const matchIdx = jIdx * 2 + pIdx;
      Object.keys(GROUPS).forEach(group => {
        const k0 = scoreKey(group, matchIdx, 0);
        const k1 = scoreKey(group, matchIdx, 1);
        if (!(k0 in results.scores) || !(k1 in results.scores)) return;
        if (!(k0 in (player.scores || {})) || !(k1 in (player.scores || {}))) return;
        const r0 = results.scores[k0], r1 = results.scores[k1];
        const p0 = player.scores[k0], p1 = player.scores[k1];
        if (p0 === r0 && p1 === r1) exact += ROUND_PTS.groups.exact;
        else if (Math.sign(p0 - p1) === Math.sign(r0 - r1)) result += ROUND_PTS.groups.result;
      });
    });
  });

  RONDAS.forEach(ronda => {
    const pts = ROUND_PTS[ROUND_KEY[ronda.id]];
    if (!pts) return;
    for (let i = 0; i < ronda.partidos; i++) {
      const ks0 = `${ronda.id}-${i}-s0`, ks1 = `${ronda.id}-${i}-s1`;
      if (!(ks0 in results.bracket) || !(ks1 in results.bracket)) continue;
      if (!(ks0 in (player.bracket || {})) || !(ks1 in (player.bracket || {}))) continue;
      const r0 = Number(results.bracket[ks0]), r1 = Number(results.bracket[ks1]);
      const p0 = Number(player.bracket[ks0]), p1 = Number(player.bracket[ks1]);
      if (p0 === r0 && p1 === r1) exact += pts.exact;
      else if (Math.sign(p0 - p1) === Math.sign(r0 - r1)) result += pts.result;
    }
  });

  const th = k => results.bracket?.[k] !== undefined && player.bracket?.[k] !== undefined;
  if (th('3rd-s0') && th('3rd-s1')) {
    const r0 = Number(results.bracket['3rd-s0']), r1 = Number(results.bracket['3rd-s1']);
    const p0 = Number(player.bracket['3rd-s0']), p1 = Number(player.bracket['3rd-s1']);
    if (p0 === r0 && p1 === r1) exact += ROUND_PTS.third.exact;
    else if (Math.sign(p0 - p1) === Math.sign(r0 - r1)) result += ROUND_PTS.third.result;
  }

  const pb = player.bonuses || {}, rb = results.bonuses || {}, mb = player.manual_bonus_pts || {};
  Object.keys(BONUS_PTS).forEach(key => {
    const textMatch = checkBonusMatch(pb[key], rb[key]);
    const manualOverride = mb[key] === true;
    if (textMatch || manualOverride) bonusTotal += BONUS_PTS[key];
  });

  return { total: exact + result + bonusTotal, exact, result, bonuses: bonusTotal };
}

/* ================================================================
   VER PARTICIPANTE
================================================================ */
async function loadPlayerView(nombre) {
  document.getElementById('ver-player-title').textContent = nombre;
  const backBtn = document.getElementById('btn-back-home');
  backBtn.textContent = CURRENT_USER?.is_admin ? '← Volver a participantes' : '← Volver al ranking';
  backBtn.addEventListener('click', () => {
    location.hash = CURRENT_USER?.is_admin ? '#polla' : '#home';
  }, { once: true });

  // Resetear a pestaña Grupos y ocultar tab Perfil (se mostrará si es admin)
  document.querySelectorAll('.inner-tab[data-inner-ver]').forEach(b => b.classList.remove('active'));
  document.querySelector('.inner-tab[data-inner-ver="grupos-ver"]')?.classList.add('active');
  document.querySelectorAll('#view-ver .inner-section').forEach(s => s.classList.add('hidden'));
  document.getElementById('inner-grupos-ver')?.classList.remove('hidden');
  document.getElementById('tab-btn-perfil-ver')?.classList.add('hidden');
  // Limpiar formulario de perfil
  ['ver-perfil-name', 'ver-perfil-email', 'ver-perfil-password'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const hintEl = document.getElementById('ver-perfil-email-current');
  if (hintEl) hintEl.textContent = '';
  const msgEl = document.getElementById('ver-perfil-msg');
  if (msgEl) { msgEl.textContent = ''; msgEl.className = 'admin-msg'; }

  const { data: profile } = await sb
    .from('profiles').select('id').ilike('name', nombre).single();

  if (!profile) {
    document.getElementById('ver-player-title').textContent = nombre + ' — no encontrado';
    return;
  }

  const [pollaRes, resultsRes] = await Promise.all([
    sb.from('pollas').select('scores, bracket, bonuses, manual_bonus_pts').eq('user_id', profile.id).single(),
    sb.from('official_results').select('*').eq('id', 1).single()
  ]);

  _verPlayerData = {
    ...(pollaRes.data || { scores: {}, bracket: {}, bonuses: {}, manual_bonus_pts: {} }),
    userId: profile.id,
  };
  _verResults = resultsRes.data || { scores: {}, bracket: {}, bonuses: {} };

  const resultsBracket = _verResults.bracket || {};
  const hasOfficialBracketInfo = Object.keys(resultsBracket).length > 0;
  updateBracketTabsVisibility(hasOfficialBracketInfo);

  const score = calcScore(_verPlayerData, _verResults);
  document.getElementById('ver-score-badge').textContent = `${score.total} pts`;

  renderGroupsReadonly(_verPlayerData.scores || {}, 'groups-grid-ver');
  renderBracketReadonly(_verPlayerData.bracket || {}, 'bracket-render-ver', 'champion-display-ver');

  const thirdVer = document.getElementById('third-match-ver');
  if (thirdVer) {
    thirdVer.querySelectorAll('[data-key]').forEach(inp => {
      inp.value = _verPlayerData.bracket?.[inp.dataset.key] || '';
    });
  }

  renderBonusesReadonly(
    _verPlayerData.bonuses || {},
    _verResults.bonuses || {},
    _verPlayerData.manual_bonus_pts || {},
    profile.id
  );

  // Barra de edición para admin
  const editBar = document.getElementById('ver-admin-edit-bar');
  if (editBar) editBar.classList.toggle('hidden', !CURRENT_USER?.is_admin);
  if (CURRENT_USER?.is_admin) {
    _verEditUserId = profile.id;
    _verEditMode = false;
    _syncVerEditUI();
    document.getElementById('btn-ver-edit-enable').onclick = _enableVerEditMode;
    document.getElementById('btn-ver-edit-cancel').onclick = _cancelVerEditMode;
    document.getElementById('btn-ver-edit-save').onclick = _saveVerEdits;
    const btnVerPdf = document.getElementById('btn-ver-export-pdf');
    if (btnVerPdf) {
      btnVerPdf.onclick = () => {
        const pName = profile.name || nombre || 'Participante';
        exportParticipantPDF(pName);
      };
    }

    // Tab Perfil
    document.getElementById('tab-btn-perfil-ver')?.classList.remove('hidden');
    document.getElementById('ver-perfil-name').value = nombre;
    document.getElementById('btn-ver-perfil-save').onclick = () => _saveUserProfile(profile.id);
    _loadUserEmail(profile.id);

    renderAdminBracketRoundReset(profile.id);
  }
}

/* ================================================================
   VER — PERFIL DE PARTICIPANTE (solo admin)
================================================================ */
async function _loadUserEmail(userId) {
  const session = (await sb.auth.getSession()).data?.session;
  if (!session) return;
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/update-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': SUPABASE_ANON,
      },
      body: JSON.stringify({ userId, action: 'get' }),
    });
    const data = await res.json();
    if (data.ok && data.email) {
      const hint = document.getElementById('ver-perfil-email-current');
      if (hint) hint.textContent = `Actual: ${data.email}`;
    }
  } catch { /* ignore — el campo placeholder ya indica que vacío = sin cambio */ }
}

async function _saveUserProfile(userId) {
  const msgEl = document.getElementById('ver-perfil-msg');
  const saveBtn = document.getElementById('btn-ver-perfil-save');
  const name = document.getElementById('ver-perfil-name')?.value.trim();
  const email = document.getElementById('ver-perfil-email')?.value.trim();
  const password = document.getElementById('ver-perfil-password')?.value;

  if (!name) {
    msgEl.textContent = 'El nombre no puede estar vacío.';
    msgEl.className = 'admin-msg error';
    return;
  }

  msgEl.textContent = 'Guardando…';
  msgEl.className = 'admin-msg';
  saveBtn.disabled = true;

  const session = (await sb.auth.getSession()).data?.session;
  if (!session) {
    msgEl.textContent = 'Sesión expirada. Vuelve a iniciar sesión.';
    msgEl.className = 'admin-msg error';
    saveBtn.disabled = false;
    return;
  }

  try {
    const body = { userId, action: 'update', name };
    if (email) body.email = email;
    if (password) body.password = password;

    const res = await fetch(`${SUPABASE_URL}/functions/v1/update-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': SUPABASE_ANON,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || 'Error desconocido');

    msgEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> Datos guardados correctamente';
    msgEl.className = 'admin-msg success';
    document.getElementById('ver-player-title').textContent = name;
    document.getElementById('ver-perfil-password').value = '';
    if (email) {
      const hint = document.getElementById('ver-perfil-email-current');
      if (hint) hint.textContent = `Actual: ${email}`;
      document.getElementById('ver-perfil-email').value = '';
    }
  } catch (err) {
    msgEl.textContent = 'Error: ' + err.message;
    msgEl.className = 'admin-msg error';
  }

  saveBtn.disabled = false;
}

/* ================================================================
   VER — MODO EDICIÓN (solo admin)
================================================================ */
let _verEditMode = false;
let _verEditUserId = null;

function _syncVerEditUI() {
  const actionBar = document.getElementById('ver-admin-action-bar');
  const enableBtn = document.getElementById('btn-ver-edit-enable');
  if (!actionBar || !enableBtn) return;
  enableBtn.classList.toggle('hidden', _verEditMode);
  actionBar.classList.toggle('hidden', !_verEditMode);
  if (_verEditMode) {
    document.getElementById('ver-edit-msg').textContent = '';
  }
}

function _enableVerEditMode() {
  _verEditMode = true;
  // Habilitar inputs de grupos
  document.querySelectorAll('#groups-grid-ver .m-score[data-ver-key]').forEach(inp => {
    inp.disabled = false;
  });
  // Habilitar inputs de bracket
  document.querySelectorAll('#bracket-render-ver [data-ver-key]').forEach(inp => {
    inp.disabled = false;
  });
  document.querySelectorAll('#third-match-ver [data-key]').forEach(inp => {
    inp.disabled = false;
  });
  // Re-renderizar bonos con inputs editables
  if (_verPlayerData) {
    _renderBonusesEditable(_verPlayerData.bonuses || {});
  }
  _syncVerEditUI();
}

function _cancelVerEditMode() {
  _verEditMode = false;
  // Deshabilitar inputs de grupos
  document.querySelectorAll('#groups-grid-ver .m-score[data-ver-key]').forEach(inp => {
    inp.disabled = true;
  });
  // Deshabilitar inputs de bracket
  document.querySelectorAll('#bracket-render-ver [data-ver-key]').forEach(inp => {
    inp.disabled = true;
  });
  document.querySelectorAll('#third-match-ver [data-key]').forEach(inp => {
    inp.disabled = true;
  });
  // Volver a bonos readonly
  if (_verPlayerData && _verResults) {
    renderBonusesReadonly(
      _verPlayerData.bonuses || {},
      _verResults.bonuses || {},
      _verPlayerData.manual_bonus_pts || {},
      _verEditUserId
    );
  }
  _syncVerEditUI();
}

function _renderBonusesEditable(bonuses) {
  const grid = document.getElementById('bonuses-grid-ver');
  if (!grid) return;
  grid.innerHTML = BONUS_GROUPS.map(group => {
    const rows = group.keys.map(key => {
      const val = bonuses[key] || '';
      return `
<div class="bonus-readonly-row">
  <span class="bonus-readonly-label">${BONUS_LABELS[key]} <span class="bonus-pts">+${BONUS_PTS[key]}pts</span></span>
  <input type="text" class="bonus-edit-input" data-bonus-key="${key}"
    value="${val}" placeholder="Sin completar" autocomplete="off">
</div>`;
    }).join('');
    return `<div class="bonus-group"><h3 class="bonus-group-title">${group.label}</h3>${rows}</div>`;
  }).join('');
}

async function _saveVerEdits() {
  if (!_verEditUserId) return;
  const msgEl = document.getElementById('ver-edit-msg');
  const saveBtn = document.getElementById('btn-ver-edit-save');
  msgEl.textContent = 'Guardando…';
  msgEl.className = 'admin-msg';
  saveBtn.disabled = true;

  // Recolectar scores de grupos
  const scores = {};
  document.querySelectorAll('#groups-grid-ver .m-score[data-ver-key]').forEach(inp => {
    const val = inp.value;
    if (val !== '') scores[inp.dataset.verKey] = parseInt(val, 10);
  });

  // Recolectar bracket
  const bracket = { ...(_verPlayerData?.bracket || {}) };
  document.querySelectorAll('#bracket-render-ver [data-ver-key]').forEach(inp => {
    const val = inp.value;
    if (val !== '') {
      bracket[inp.dataset.verKey] = inp.type === 'number' ? parseFloat(val) : val;
    }
  });
  document.querySelectorAll('#third-match-ver [data-key]').forEach(inp => {
    const val = inp.value;
    if (val !== '') {
      bracket[inp.dataset.key] = inp.type === 'number' ? parseFloat(val) : val;
    }
  });

  // Recolectar bonuses
  const bonuses = {};
  document.querySelectorAll('#bonuses-grid-ver .bonus-edit-input[data-bonus-key]').forEach(inp => {
    const val = inp.value.trim();
    if (val) bonuses[inp.dataset.bonusKey] = val;
  });

  const { error } = await sb.from('pollas').update({
    scores,
    bracket,
    bonuses,
    updated_at: new Date().toISOString(),
  }).eq('user_id', _verEditUserId);

  saveBtn.disabled = false;

  if (error) {
    msgEl.textContent = 'Error: ' + error.message;
    msgEl.className = 'admin-msg error';
    return;
  }

  // Actualizar datos en memoria y recalcular puntos
  if (_verPlayerData) {
    _verPlayerData.scores = scores;
    _verPlayerData.bracket = bracket;
    _verPlayerData.bonuses = bonuses;
    const newScore = calcScore(_verPlayerData, _verResults);
    const badge = document.getElementById('ver-score-badge');
    if (badge) badge.textContent = `${newScore.total} pts`;
  }

  msgEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> Guardado';
  msgEl.className = 'admin-msg success';
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
    const slots = jornada.pares
      .map((_, pIdx) => { const matchIdx = jIdx * 2 + pIdx; return { par: getMatchPair(letter, matchIdx), matchIdx }; })
      .sort((a, b) => {
        const miA = (MATCH_INFO[letter] || [])[a.matchIdx] || {};
        const miB = (MATCH_INFO[letter] || [])[b.matchIdx] || {};
        const dA = parseMatchDate(miA.date || '1 ene');
        const dB = parseMatchDate(miB.date || '1 ene');
        if (dA.month !== dB.month) return dA.month - dB.month;
        if (dA.day !== dB.day) return dA.day - dB.day;
        return (miA.time || '').localeCompare(miB.time || '');
      });
    return slots.map(({ par, matchIdx }) => {
      const k0 = scoreKey(letter, matchIdx, 0);
      const k1 = scoreKey(letter, matchIdx, 1);
      const v0 = scores[k0] ?? '', v1 = scores[k1] ?? '';
      const t0 = teams[par[0]], t1 = teams[par[1]];
      const mi = (MATCH_INFO[letter] || [])[matchIdx] || {};
      return `
<div class="match-block">
  <div class="match-meta">
    <span class="mm-date"><i class="fa-solid fa-calendar-days"></i> ${mi.date || ''}</span>
    <span class="mm-time"><i class="fa-regular fa-clock"></i> ${mi.time || ''} <small>COT</small></span>
    <span class="mm-venue"><i class="fa-solid fa-location-dot"></i> ${mi.venue || ''}</span>
  </div>
  <div class="match-row">
    <span class="m-team home"><span class="m-name">${t0.n}</span><span class="m-flag">${flag(t0)}</span></span>
    <input type="number" class="m-score${v0 !== '' ? ' filled' : ''}" data-ver-key="${k0}" value="${v0}" disabled placeholder="–">
    <span class="m-vs">-</span>
    <input type="number" class="m-score${v1 !== '' ? ' filled' : ''}" data-ver-key="${k1}" value="${v1}" disabled placeholder="–">
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
  <div class="group-body"><div class="group-matches">${matches}</div></div>
</div>`;
}

function renderBracketReadonly(bracket, containerId, championId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = RONDAS.map(ronda => {
    const matches = Array.from({ length: ronda.partidos }, (_, i) => {
      const ph0 = ronda.placeholders[i * 2] || `Eq. ${i * 2 + 1}`;
      const ph1 = ronda.placeholders[i * 2 + 1] || `Eq. ${i * 2 + 2}`;
      const kt0 = `${ronda.id}-${i}-t0`, kt1 = `${ronda.id}-${i}-t1`;
      const ks0 = `${ronda.id}-${i}-s0`, ks1 = `${ronda.id}-${i}-s1`;
      const isFin = ronda.id === 'fin';
      const s0 = parseFloat(bracket[ks0]), s1 = parseFloat(bracket[ks1]);
      const winner = !isNaN(s0) && !isNaN(s1) ? (s0 > s1 ? 't0' : s1 > s0 ? 't1' : null) : null;
      const metaHTML = getMatchMetaHTML(ronda.id, i);
      const t0 = bracket[kt0] || '';
      const t1 = bracket[kt1] || '';
      const teamHTML0 = t0
        ? `<span class="bm-team bm-team-fixed">${flagByName(t0)} ${t0}</span>`
        : `<span class="bm-team bm-team-locked">${ph0}</span>`;
      const teamHTML1 = t1
        ? `<span class="bm-team bm-team-fixed">${flagByName(t1)} ${t1}</span>`
        : `<span class="bm-team bm-team-locked">${ph1}</span>`;
      return `
<div class="bracket-match${isFin ? ' is-final' : ''}">
  ${metaHTML}
  <div class="bm-row${winner === 't0' ? ' winner' : ''}">
    ${teamHTML0}
    <input type="number" class="bm-score" data-ver-key="${ks0}" value="${bracket[ks0] || ''}" disabled placeholder="-">
  </div>
  <div class="bm-row${winner === 't1' ? ' winner' : ''}">
    ${teamHTML1}
    <input type="number" class="bm-score" data-ver-key="${ks1}" value="${bracket[ks1] || ''}" disabled placeholder="-">
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

function renderBonusesReadonly(playerBonuses, resultBonuses, manualBonusPts, participantUserId, containerId) {
  const grid = document.getElementById(containerId || 'bonuses-grid-ver');
  if (!grid) return;
  const isAdmin = !!CURRENT_USER?.is_admin;
  const mb = manualBonusPts || {};

  grid.innerHTML = BONUS_GROUPS.map(group => {
    const rows = group.keys.map(key => {
      const pVal = playerBonuses[key] || '—';
      const rVal = resultBonuses[key] || '';
      const textHit = rVal && pVal !== '—' && checkBonusMatch(pVal, rVal);
      const manualOverride = mb[key] === true;
      const hit = textHit || manualOverride;
      const canToggle = isAdmin && MANUAL_BONUS_KEYS.has(key) && !textHit;

      return `
<div class="bonus-readonly-row${hit ? ' bonus-hit' : ''}">
  <span class="bonus-readonly-label">${BONUS_LABELS[key]} <span class="bonus-pts">+${BONUS_PTS[key]}pts</span></span>
  <span class="bonus-readonly-val">${pVal}</span>
  ${textHit ? '<span class="bonus-check">✓</span>' : ''}
  ${canToggle ? `<button class="bonus-toggle-btn${manualOverride ? ' active' : ''}" data-key="${key}" data-active="${manualOverride}" data-user-id="${participantUserId}">${manualOverride ? '✓ Otorgado' : 'Otorgar'}</button>` : ''}
</div>`;
    }).join('');

    return `<div class="bonus-group"><h3 class="bonus-group-title">${group.label}</h3>${rows}</div>`;
  }).join('');

  if (!isAdmin) return;

  grid.querySelectorAll('.bonus-toggle-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const key = btn.dataset.key;
      const userId = btn.dataset.userId;
      const newActive = btn.dataset.active !== 'true';

      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

      try {
        await toggleManualBonus(userId, key, newActive);

        if (_verPlayerData) {
          _verPlayerData.manual_bonus_pts = { ...(_verPlayerData.manual_bonus_pts || {}), [key]: newActive };
        }

        btn.dataset.active = String(newActive);
        btn.classList.toggle('active', newActive);
        btn.textContent = newActive ? '✓ Otorgado' : 'Otorgar';
        btn.closest('.bonus-readonly-row')?.classList.toggle('bonus-hit', newActive);

        if (_verPlayerData && _verResults) {
          const newScore = calcScore(_verPlayerData, _verResults);
          const badge = document.getElementById('ver-score-badge');
          if (badge) badge.textContent = `${newScore.total} pts`;
        }
      } catch (err) {
        showErrorModal(err.message, 'Error al otorgar bono');
        btn.textContent = newActive ? 'Otorgar' : '✓ Otorgado';
      }

      btn.disabled = false;
    });
  });
}

async function toggleManualBonus(userId, key, value) {
  const { data, error: selErr } = await sb.from('pollas').select('manual_bonus_pts').eq('user_id', userId).single();
  if (selErr) throw new Error('No se pudo leer la polla: ' + selErr.message);
  const updated = { ...(data?.manual_bonus_pts || {}), [key]: value };
  const { error: updErr, count } = await sb.from('pollas')
    .update({ manual_bonus_pts: updated }, { count: 'exact' })
    .eq('user_id', userId);
  if (updErr) throw new Error('No se pudo guardar: ' + updErr.message);
  if (count === 0) throw new Error('RLS bloqueó el update. Ve a Supabase → Authentication → Policies → pollas y agrega la política de admin (ver consola).');
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
    inp.addEventListener('blur', onScoreInput);
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
    const slots = jornada.pares
      .map((_, pIdx) => { const matchIdx = jIdx * 2 + pIdx; return { par: getMatchPair(letter, matchIdx), matchIdx }; })
      .sort((a, b) => {
        const miA = (MATCH_INFO[letter] || [])[a.matchIdx] || {};
        const miB = (MATCH_INFO[letter] || [])[b.matchIdx] || {};
        const dA = parseMatchDate(miA.date || '1 ene');
        const dB = parseMatchDate(miB.date || '1 ene');
        if (dA.month !== dB.month) return dA.month - dB.month;
        if (dA.day !== dB.day) return dA.day - dB.day;
        return (miA.time || '').localeCompare(miB.time || '');
      });

    const rows = slots.map(({ par, matchIdx }) => {
      const k0 = scoreKey(letter, matchIdx, 0);
      const k1 = scoreKey(letter, matchIdx, 1);
      const v0 = STATE.scores[k0] ?? '', v1 = STATE.scores[k1] ?? '';
      const t0 = teams[par[0]], t1 = teams[par[1]];
      const mi = (MATCH_INFO[letter] || [])[matchIdx] || {};
      return `
<div class="match-block">
  <div class="match-meta">
    <span class="mm-date"><i class="fa-solid fa-calendar-days"></i> ${mi.date || ''}</span>
    <span class="mm-time"><i class="fa-regular fa-clock"></i> ${mi.time || ''} <small>COT</small></span>
    <span class="mm-venue"><i class="fa-solid fa-location-dot"></i> ${mi.venue || ''}</span>
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
    const posClass = ['p1', 'p2', 'p3', 'p4'][i];
    const rowClass = i < 2 ? 'st-advances' : i === 2 ? 'st-maybe' : '';
    return `
<tr class="${rowClass}">
  <td><span class="pos-badge ${posClass}">${i + 1}</span></td>
  <td class="st-team-name"><span class="st-flag">${flag(t)}</span>${t.n}</td>
  <td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td class="st-gd">0</td><td class="st-pts">0</td>
</tr>`;
  }).join('');
}

/* ================================================================
   QUINIELA — Score input
================================================================ */
function onScoreInput(e) {
  if (IS_GROUPS_LOCKED) return; // triple capa: DB + syncToSupabase + aquí
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
function recalcAllGroups() { Object.keys(GROUPS).forEach(recalcGroup); }

function recalcGroup(letter) {
  const teams = GROUPS[letter].teams;
  const st = teams.map((t, idx) => ({ name: t.n, flag: t.code, idx, j: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0 }));

  JORNADAS.forEach((jornada, jIdx) => {
    jornada.pares.forEach((_, pIdx) => {
      const matchIdx = jIdx * 2 + pIdx;
      const [t0, t1] = getMatchPair(letter, matchIdx);
      const k0 = scoreKey(letter, matchIdx, 0), k1 = scoreKey(letter, matchIdx, 1);
      if (!(k0 in STATE.scores) || !(k1 in STATE.scores)) return;
      const s0 = STATE.scores[k0], s1 = STATE.scores[k1];
      st[t0].j++; st[t1].j++;
      st[t0].gf += s0; st[t0].gc += s1;
      st[t1].gf += s1; st[t1].gc += s0;
      if (s0 > s1) { st[t0].g++; st[t0].pts += 3; st[t1].p++; }
      else if (s0 < s1) { st[t1].g++; st[t1].pts += 3; st[t0].p++; }
      else { st[t0].e++; st[t1].e++; st[t0].pts++; st[t1].pts++; }
    });
  });

  st.sort((a, b) =>
    b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf || a.name.localeCompare(b.name)
  );

  const posClasses = ['p1', 'p2', 'p3', 'p4'];
  const rowClasses = ['st-advances', 'st-advances', 'st-maybe', ''];
  const tbody = document.getElementById(`st-body-${letter}`);
  if (!tbody) return;
  tbody.innerHTML = st.map((s, pos) => {
    const dg = s.gf - s.gc;
    const dgClass = dg > 0 ? 'pos' : dg < 0 ? 'neg' : '';
    return `
<tr class="${rowClasses[pos]}">
  <td><span class="pos-badge ${posClasses[pos]}">${pos + 1}</span></td>
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
  // Only bind input events on editable elements (inputs), not fixed spans
  container.querySelectorAll('input.bm-team, input.bm-score').forEach(inp => {
    inp.addEventListener('input', onBracketInput);
  });
}

function buildRoundHTML(ronda) {
  const roundOpen = BRACKET_ROUNDS_OPEN[ronda.id] || false;
  const roundLocked = BRACKET_ROUNDS_LOCKED[ronda.id] || false;

  const matches = Array.from({ length: ronda.partidos }, (_, i) => {
    const ph0 = ronda.placeholders[i * 2] || `Eq. ${i * 2 + 1}`;
    const ph1 = ronda.placeholders[i * 2 + 1] || `Eq. ${i * 2 + 2}`;
    const kt0 = `${ronda.id}-${i}-t0`, kt1 = `${ronda.id}-${i}-t1`;
    const ks0 = `${ronda.id}-${i}-s0`, ks1 = `${ronda.id}-${i}-s1`;
    const isFin = ronda.id === 'fin';
    const winner = detectWinner(ronda.id, i);
    const metaHTML = getMatchMetaHTML(ronda.id, i);

    const offT0 = _officialBracket[kt0];
    const offT1 = _officialBracket[kt1];
    const matchReady = offT0 && offT1;

    const teamHTML0 = offT0
      ? `<span class="bm-team bm-team-fixed" data-key="${kt0}">${flagByName(offT0)} ${offT0}</span>`
      : `<span class="bm-team bm-team-locked" data-key="${kt0}">${ph0}</span>`;
    const teamHTML1 = offT1
      ? `<span class="bm-team bm-team-fixed" data-key="${kt1}">${flagByName(offT1)} ${offT1}</span>`
      : `<span class="bm-team bm-team-locked" data-key="${kt1}">${ph1}</span>`;

    if (offT0) STATE.bracket[kt0] = offT0;
    if (offT1) STATE.bracket[kt1] = offT1;

    const scoreVal0 = STATE.bracket[ks0] ?? '';
    const scoreVal1 = STATE.bracket[ks1] ?? '';
    // Editable si la ronda está abierta y el usuario no la bloqueó (no requiere equipos definidos)
    const canEdit = roundOpen && !roundLocked;

    const scoreHTML0 = canEdit
      ? `<input type="number" class="bm-score" data-key="${ks0}" value="${scoreVal0}" min="0" max="99" placeholder="0">`
      : `<input type="number" class="bm-score" value="${scoreVal0}" disabled placeholder="-">`;
    const scoreHTML1 = canEdit
      ? `<input type="number" class="bm-score" data-key="${ks1}" value="${scoreVal1}" min="0" max="99" placeholder="0">`
      : `<input type="number" class="bm-score" value="${scoreVal1}" disabled placeholder="-">`;

    // bm-pending solo cuando la ronda está cerrada y no hay equipos — nunca cuando está abierta
    const isPending = !matchReady && !roundOpen;
    return `
<div class="bracket-match${isFin ? ' is-final' : ''}${isPending ? ' bm-pending' : ''}">
  ${metaHTML}
  <div class="bm-row${winner === 't0' ? ' winner' : ''}">
    ${teamHTML0}
    ${scoreHTML0}
  </div>
  <div class="bm-row${winner === 't1' ? ' winner' : ''}">
    ${teamHTML1}
    ${scoreHTML1}
  </div>
</div>`;
  }).join('');

  let lockBarHTML;
  if (!roundOpen) {
    lockBarHTML = `<div class="brl-bar brl-pending"><i class="fa-solid fa-lock"></i> El administrador abrirá esta ronda cuando corresponda</div>`;
  } else if (roundLocked) {
    lockBarHTML = `<div class="brl-bar brl-done"><i class="fa-solid fa-circle-check"></i> ${ronda.label} enviada — tus predicciones están guardadas</div>`;
  } else {
    lockBarHTML = `
<div class="brl-bar brl-open">
  <p class="brl-hint">Llena tus predicciones y envía esta ronda. No podrás modificarlas después.</p>
  <p class="brl-error hidden" id="brl-error-${ronda.id}"></p>
  <button class="btn btn-gold btn-sm" onclick="lockBracketRound('${ronda.id}')">
    <i class="fa-solid fa-lock"></i> Enviar ${ronda.label}
  </button>
</div>`;
  }

  return `
<div class="bracket-round" data-round-id="${ronda.id}">
  <div class="bracket-round-title">${ronda.label}</div>
  <div class="bracket-matches-col">${matches}</div>
  ${lockBarHTML}
</div>`;
}

function onBracketInput(e) {
  STATE.bracket[e.target.dataset.key] = e.target.value;
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
  document.querySelectorAll('#view-polla input[data-key]').forEach(el => {
    const key = el.dataset.key;
    if (key && STATE.bracket[key] !== undefined) el.value = STATE.bracket[key];
  });
  const champEl = document.getElementById('champion-display');
  if (champEl) champEl.textContent = STATE.bracket['champion'] || ' ';
  highlightWinnerRows();
}

/* ================================================================
   TERCER LUGAR
================================================================ */
function initThirdPlace() {
  const thirdMatch = document.getElementById('third-match');
  if (!thirdMatch) return;

  const roundOpen = BRACKET_ROUNDS_OPEN['third'] || false;
  const roundLocked = BRACKET_ROUNDS_LOCKED['third'] || false;

  const canEdit = roundOpen && !roundLocked;

  // Replace team inputs with fixed labels (with flag) or locked placeholders
  ['3rd-t0', '3rd-t1'].forEach((key, idx) => {
    const offVal = _officialBracket[key];
    // Puede ser input o span si ya fue reemplazado en llamada anterior
    const existing = thirdMatch.querySelector(`[data-key="${key}"]`);
    if (!existing) return;

    if (offVal) {
      STATE.bracket[key] = offVal;
      if (existing.tagName === 'INPUT') {
        const span = document.createElement('span');
        span.className = 'bm-team bm-team-fixed';
        span.dataset.key = key;
        span.innerHTML = `${flagByName(offVal)} ${offVal}`;
        existing.replaceWith(span);
      } else {
        existing.className = 'bm-team bm-team-fixed';
        existing.innerHTML = `${flagByName(offVal)} ${offVal}`;
      }
    } else {
      if (existing.tagName === 'INPUT') {
        const span = document.createElement('span');
        span.className = 'bm-team bm-team-locked';
        span.dataset.key = key;
        span.textContent = idx === 0 ? 'Perdedor Semifinal 1' : 'Perdedor Semifinal 2';
        existing.replaceWith(span);
      }
    }
  });

  // Score inputs
  thirdMatch.querySelectorAll('input.bm-score[data-key]').forEach(inp => {
    const savedVal = STATE.bracket[inp.dataset.key] ?? '';
    if (canEdit) {
      inp.disabled = false;
      inp.placeholder = '0';
      if (savedVal !== '') inp.value = savedVal;
      inp.removeEventListener('input', onThirdInput);
      inp.addEventListener('input', onThirdInput);
    } else {
      inp.disabled = true;
      inp.placeholder = '-';
      inp.value = savedVal;
    }
  });

  // Barra de estado de la ronda (insertar o actualizar después del bracket-match)
  let lockBar = document.getElementById('third-lock-bar');
  if (!lockBar) {
    lockBar = document.createElement('div');
    lockBar.id = 'third-lock-bar';
    thirdMatch.insertAdjacentElement('afterend', lockBar);
  }
  if (!roundOpen) {
    lockBar.className = 'brl-bar brl-pending';
    lockBar.innerHTML = '<i class="fa-solid fa-lock"></i> El administrador abrirá esta ronda cuando corresponda';
  } else if (roundLocked) {
    lockBar.className = 'brl-bar brl-done';
    lockBar.innerHTML = '<i class="fa-solid fa-circle-check"></i> Tercer y Cuarto Lugar enviado — tus predicciones están guardadas';
  } else {
    lockBar.className = 'brl-bar brl-open';
    lockBar.innerHTML = `
<p class="brl-hint">Llena tus predicciones y envía esta ronda. No podrás modificarlas después.</p>
<p class="brl-error hidden" id="brl-error-third"></p>
<button class="btn btn-gold btn-sm" onclick="lockBracketRound('third')">
  <i class="fa-solid fa-lock"></i> Enviar Tercer y Cuarto Lugar
</button>`;
  }
}

function onThirdInput(e) {
  STATE.bracket[e.target.dataset.key] = e.target.value;
  saveDraft();
}

/* ================================================================
   TEAM PICKER — bonos con selección de país + bandera
================================================================ */
// Bonos que usan selector de equipo (todos los países)
const TEAM_PICKER_KEYS = new Set(['campeon', 'subcampeon', 'tercero', 'cuarto', 'vallaMin', 'vallaMax', 'masPuntosGrupos', 'menosPuntosGrupos']);
// Bonos con solo México o Sudáfrica
const INAUG_PICKER_KEYS = new Set(['primerGolInaugural']);
// Bonos que usan selector de jugador colombiano
const PLAYER_PICKER_KEYS = new Set(['colPrimerGolUzb', 'colPrimerAmarillaUzb']);

// Bonos de primera ronda que admiten múltiples respuestas en caso de empate
const MULTI_BONUS_KEYS = new Set(['vallaMin', 'vallaMax', 'masPuntosGrupos', 'menosPuntosGrupos']);

function checkBonusMatch(userAnswer, officialAnswer) {
  if (!userAnswer || !officialAnswer) return false;
  const u = userAnswer.trim().toLowerCase();
  const correctOnes = officialAnswer.split(/[,/;]|\s+o\s+/).map(v => v.trim().toLowerCase());
  return correctOnes.includes(u);
}

const INAUGURAL_TEAMS = [
  { code: 'mx', n: 'México' },
  { code: 'za', n: 'Sudáfrica' },
];

// Nómina Colombia Mundial 2026
const COLOMBIA_SQUAD = [
  'Álvaro Montero', 'Camilo Vargas', 'David Ospina', 'Kevin Mier',
  'Andrés Mora', 'Carlos Cuesta', 'Daniel Muñoz', 'Dávinson Sánchez',
  'Déiver Machado', 'Johan Mojica', 'Jhon Lucumí', 'Nicolás Muñoz',
  'Santiago Arias', 'Willer Ditta', 'Yerry Mina',
  'Gustavo Puerta', 'James Rodríguez', 'Jaminton Campaz', 'Jefferson Lerma',
  'Jhon Arias', 'Jorge Carrascal', 'Juan Fernando Quintero', 'Juan Portilla',
  'Kevin Castaño', 'Mateus Uribe', 'Richard Ríos', 'Wilmar Barrios',
  'Carlos Bacca', 'Carlos Gómez', 'Cucho Hernández', 'Falcao García',
  'Jhon Córdoba', 'John Jader Durán', 'Luis Díaz', 'Luis Suárez',
  'Miguel Borja', 'Rafael Santos Borré',
].sort((a, b) => a.localeCompare(b, 'es'));

function _allTeamsSorted() {
  return Object.values(GROUPS).flatMap(g => g.teams)
    .sort((a, b) => a.n.localeCompare(b.n, 'es'));
}

function _setTeamPickerValue(picker, name, teams) {
  const team = teams.find(t => t.n === name);
  if (!team) return;
  const nameEl = picker.querySelector('.tp-name');
  const flagEl = picker.querySelector('.tp-flag');
  if (nameEl) { nameEl.textContent = name; nameEl.classList.remove('tp-placeholder'); }
  if (flagEl) flagEl.innerHTML = `<span class="fi fi-${team.code}"></span>`;
}

function _setMultiTeamPickerValue(picker, namesArray, teams) {
  const nameEl = picker.querySelector('.tp-name');
  const flagEl = picker.querySelector('.tp-flag');
  if (namesArray.length === 0) {
    if (nameEl) {
      nameEl.textContent = picker.dataset.bonus ? BONUS_LABELS[picker.dataset.bonus] || 'Seleccionar…' : 'Seleccionar…';
      nameEl.classList.add('tp-placeholder');
    }
    if (flagEl) flagEl.innerHTML = '';
    return;
  }
  if (nameEl) {
    nameEl.textContent = namesArray.join(' / ');
    nameEl.classList.remove('tp-placeholder');
  }
  if (flagEl) {
    flagEl.innerHTML = namesArray.map(name => {
      const team = teams.find(t => t.n === name);
      return team ? `<span class="fi fi-${team.code}" style="margin-right:2px"></span>` : '';
    }).join('');
  }
}

function _setPlayerPickerValue(picker, name) {
  const nameEl = picker.querySelector('.tp-name');
  if (nameEl) { nameEl.textContent = name; nameEl.classList.remove('tp-placeholder'); }
}

function initTeamPickers() {
  const allTeams = _allTeamsSorted();
  TEAM_PICKER_KEYS.forEach(key => _buildTeamPicker(key, allTeams));
  INAUG_PICKER_KEYS.forEach(key => _buildTeamPicker(key, INAUGURAL_TEAMS));
  PLAYER_PICKER_KEYS.forEach(key => _buildPlayerPicker(key));
}

function _buildTeamPicker(key, teams) {
  const scope = document.getElementById('view-polla');
  const inp = scope ? scope.querySelector(`input[data-bonus="${key}"]`) : document.querySelector(`input[data-bonus="${key}"]`);
  if (!inp) return;
  const picker = document.createElement('div');
  picker.className = 'team-picker';
  picker.dataset.bonus = key;
  picker.innerHTML = `
    <div class="team-picker-trigger">
      <span class="tp-flag"></span>
      <span class="tp-name tp-placeholder">${inp.placeholder}</span>
      <span class="tp-arrow">▾</span>
    </div>
    <div class="team-picker-dropdown hidden">
      <input class="tp-search" type="text" placeholder="Buscar equipo…" autocomplete="off">
      <div class="tp-list"></div>
    </div>`;
  inp.replaceWith(picker);
  const val = STATE.bonuses[key];
  if (val) _setTeamPickerValue(picker, val, teams);
  _wireTeamPicker(picker, teams, key);
}

function _buildPlayerPicker(key) {
  const scope = document.getElementById('view-polla');
  const inp = scope ? scope.querySelector(`input[data-bonus="${key}"]`) : document.querySelector(`input[data-bonus="${key}"]`);
  if (!inp) return;
  const picker = document.createElement('div');
  picker.className = 'team-picker';
  picker.dataset.bonus = key;
  picker.innerHTML = `
    <div class="team-picker-trigger">
      <span class="tp-name tp-placeholder">${inp.placeholder}</span>
      <span class="tp-arrow">▾</span>
    </div>
    <div class="team-picker-dropdown hidden">
      <input class="tp-search" type="text" placeholder="Buscar jugador…" autocomplete="off">
      <div class="tp-list"></div>
    </div>`;
  inp.replaceWith(picker);
  const val = STATE.bonuses[key];
  if (val) _setPlayerPickerValue(picker, val);
  _wirePlayerPicker(picker, COLOMBIA_SQUAD, key);
}

function _wirePicker(picker, renderFn) {
  const trigger = picker.querySelector('.team-picker-trigger');
  const dropdown = picker.querySelector('.team-picker-dropdown');
  const search = picker.querySelector('.tp-search');

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    if (IS_GROUPS_LOCKED) return;
    const isOpen = !dropdown.classList.contains('hidden');
    document.querySelectorAll('.team-picker-dropdown').forEach(d => d.classList.add('hidden'));
    document.querySelectorAll('.team-picker').forEach(p => p.classList.remove('open'));
    if (!isOpen) {
      dropdown.classList.remove('hidden');
      picker.classList.add('open');
      search.value = '';
      renderFn('');
      search.focus();
    }
  });
  search.addEventListener('input', () => renderFn(search.value));
  search.addEventListener('click', e => e.stopPropagation());
  document.addEventListener('click', () => {
    dropdown.classList.add('hidden');
    picker.classList.remove('open');
  });
}

function _wireTeamPicker(picker, teams, bonusKey) {
  const list = picker.querySelector('.tp-list');
  const origPlaceholder = picker.querySelector('.tp-name')?.textContent || 'Seleccionar';

  const clearPicker = () => {
    const nameEl = picker.querySelector('.tp-name');
    const flagEl = picker.querySelector('.tp-flag');
    if (nameEl) { nameEl.textContent = origPlaceholder; nameEl.classList.add('tp-placeholder'); }
    if (flagEl) flagEl.innerHTML = '';
    delete STATE.bonuses[bonusKey];
    saveDraft();
    picker.querySelector('.team-picker-dropdown').classList.add('hidden');
    picker.classList.remove('open');
  };

  const renderList = (filter = '') => {
    const filtered = filter
      ? teams.filter(t => t.n.toLowerCase().includes(filter.toLowerCase()))
      : teams;

    const clearHTML = STATE.bonuses[bonusKey]
      ? `<div class="tp-option tp-option-clear">✕ Quitar selección</div>`
      : '';

    list.innerHTML = clearHTML + filtered.map(t =>
      `<div class="tp-option" data-name="${t.n}" data-code="${t.code}">
         <span class="fi fi-${t.code}"></span> ${t.n}
       </div>`
    ).join('');

    const clearBtn = list.querySelector('.tp-option-clear');
    if (clearBtn) clearBtn.addEventListener('click', clearPicker);

    list.querySelectorAll('.tp-option:not(.tp-option-clear)').forEach(opt =>
      opt.addEventListener('click', () => {
        if (IS_GROUPS_LOCKED) return;
        _setTeamPickerValue(picker, opt.dataset.name, teams);
        picker.querySelector('.team-picker-dropdown').classList.add('hidden');
        picker.classList.remove('open');
        STATE.bonuses[bonusKey] = opt.dataset.name;
        saveDraft();
      })
    );
  };
  _wirePicker(picker, renderList);
  renderList();
}

function _wirePlayerPicker(picker, players, bonusKey) {
  const list = picker.querySelector('.tp-list');
  const origPlaceholder = picker.querySelector('.tp-name')?.textContent || 'Seleccionar';

  const clearPicker = () => {
    const nameEl = picker.querySelector('.tp-name');
    if (nameEl) { nameEl.textContent = origPlaceholder; nameEl.classList.add('tp-placeholder'); }
    delete STATE.bonuses[bonusKey];
    saveDraft();
    picker.querySelector('.team-picker-dropdown').classList.add('hidden');
    picker.classList.remove('open');
  };

  const renderList = (filter = '') => {
    const filtered = filter
      ? players.filter(p => p.toLowerCase().includes(filter.toLowerCase()))
      : players;

    const clearHTML = STATE.bonuses[bonusKey]
      ? `<div class="tp-option tp-option-clear">✕ Quitar selección</div>`
      : '';

    list.innerHTML = clearHTML + filtered.map(p =>
      `<div class="tp-option" data-name="${p}">🇨🇴 ${p}</div>`
    ).join('');

    const clearBtn = list.querySelector('.tp-option-clear');
    if (clearBtn) clearBtn.addEventListener('click', clearPicker);

    list.querySelectorAll('.tp-option:not(.tp-option-clear)').forEach(opt =>
      opt.addEventListener('click', () => {
        if (IS_GROUPS_LOCKED) return;
        _setPlayerPickerValue(picker, opt.dataset.name);
        picker.querySelector('.team-picker-dropdown').classList.add('hidden');
        picker.classList.remove('open');
        STATE.bonuses[bonusKey] = opt.dataset.name;
        saveDraft();
      })
    );
  };
  _wirePicker(picker, renderList);
  renderList();
}

/* --------- Admin bonus pickers — write to ADMIN_RESULTS, no IS_GROUPS_LOCKED --------- */

function _wirePicker_admin(picker, renderFn) {
  const trigger = picker.querySelector('.team-picker-trigger');
  const dropdown = picker.querySelector('.team-picker-dropdown');
  const search = picker.querySelector('.tp-search');

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = !dropdown.classList.contains('hidden');
    document.querySelectorAll('.team-picker-dropdown').forEach(d => d.classList.add('hidden'));
    document.querySelectorAll('.team-picker').forEach(p => p.classList.remove('open'));
    if (!isOpen) {
      dropdown.classList.remove('hidden');
      picker.classList.add('open');
      search.value = '';
      renderFn('');
      search.focus();
    }
  });
  search.addEventListener('input', () => renderFn(search.value));
  search.addEventListener('click', e => e.stopPropagation());
  document.addEventListener('click', () => {
    dropdown.classList.add('hidden');
    picker.classList.remove('open');
  });
}

function _wireAdminTeamPicker(picker, teams, bonusKey) {
  const list = picker.querySelector('.tp-list');
  const searchInput = picker.querySelector('.tp-search');
  const origPlaceholder = picker.querySelector('.tp-name')?.textContent || 'Seleccionar';
  const isMulti = MULTI_BONUS_KEYS.has(bonusKey);

  const clearPicker = () => {
    const nameEl = picker.querySelector('.tp-name');
    const flagEl = picker.querySelector('.tp-flag');
    if (nameEl) { nameEl.textContent = origPlaceholder; nameEl.classList.add('tp-placeholder'); }
    if (flagEl) flagEl.innerHTML = '';
    delete ADMIN_RESULTS.bonuses[bonusKey];
    picker.querySelector('.team-picker-dropdown').classList.add('hidden');
    picker.classList.remove('open');
  };

  const renderList = (filter = '') => {
    const filtered = filter
      ? teams.filter(t => t.n.toLowerCase().includes(filter.toLowerCase()))
      : teams;

    const clearHTML = ADMIN_RESULTS.bonuses[bonusKey]
      ? `<div class="tp-option tp-option-clear">✕ Limpiar selección</div>`
      : '';

    const currentSelection = isMulti
      ? (ADMIN_RESULTS.bonuses[bonusKey] ? ADMIN_RESULTS.bonuses[bonusKey].split(' / ') : [])
      : [];

    list.innerHTML = clearHTML + filtered.map(t => {
      const active = isMulti && currentSelection.includes(t.n);
      return `<div class="tp-option ${active ? 'tp-option-active' : ''}" data-name="${t.n}" data-code="${t.code}">
         <span class="fi fi-${t.code}"></span> ${t.n}${active ? ' ✓' : ''}
       </div>`;
    }).join('');

    const clearBtn = list.querySelector('.tp-option-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        if (isMulti) e.stopPropagation();
        clearPicker();
      });
    }

    list.querySelectorAll('.tp-option:not(.tp-option-clear)').forEach(opt => {
      opt.addEventListener('click', (e) => {
        const teamName = opt.dataset.name;
        if (isMulti) {
          e.stopPropagation();
          let current = ADMIN_RESULTS.bonuses[bonusKey] ? ADMIN_RESULTS.bonuses[bonusKey].split(' / ') : [];
          const idx = current.indexOf(teamName);
          if (idx >= 0) {
            current.splice(idx, 1);
          } else {
            current.push(teamName);
          }
          if (current.length === 0) {
            delete ADMIN_RESULTS.bonuses[bonusKey];
          } else {
            ADMIN_RESULTS.bonuses[bonusKey] = current.join(' / ');
          }
          _setMultiTeamPickerValue(picker, current, teams);
          renderList(searchInput?.value || '');
        } else {
          _setTeamPickerValue(picker, teamName, teams);
          picker.querySelector('.team-picker-dropdown').classList.add('hidden');
          picker.classList.remove('open');
          ADMIN_RESULTS.bonuses[bonusKey] = teamName;
        }
      });
    });
  };

  _wirePicker_admin(picker, renderList);
  renderList();
}

function _buildAdminTeamPicker(key, teams) {
  const inp = document.querySelector(`#admin-bonuses-grid input[data-bonus="${key}"]`);
  if (!inp) return;
  const picker = document.createElement('div');
  picker.className = 'team-picker';
  picker.dataset.bonus = key;
  picker.innerHTML = `
    <div class="team-picker-trigger">
      <span class="tp-flag"></span>
      <span class="tp-name tp-placeholder">${inp.placeholder}</span>
      <span class="tp-arrow">▾</span>
    </div>
    <div class="team-picker-dropdown hidden">
      <input class="tp-search" type="text" placeholder="Buscar equipo…" autocomplete="off">
      <div class="tp-list"></div>
    </div>`;
  inp.replaceWith(picker);
  const val = ADMIN_RESULTS.bonuses[key];
  if (val) {
    if (MULTI_BONUS_KEYS.has(key)) {
      _setMultiTeamPickerValue(picker, val.split(' / '), teams);
    } else {
      _setTeamPickerValue(picker, val, teams);
    }
  }
  _wireAdminTeamPicker(picker, teams, key);
}

function _wireAdminPlayerPicker(picker, players, bonusKey) {
  const list = picker.querySelector('.tp-list');
  const origPlaceholder = picker.querySelector('.tp-name')?.textContent || 'Seleccionar';

  const clearPicker = () => {
    const nameEl = picker.querySelector('.tp-name');
    if (nameEl) { nameEl.textContent = origPlaceholder; nameEl.classList.add('tp-placeholder'); }
    delete ADMIN_RESULTS.bonuses[bonusKey];
    picker.querySelector('.team-picker-dropdown').classList.add('hidden');
    picker.classList.remove('open');
  };

  const renderList = (filter = '') => {
    const filtered = filter
      ? players.filter(p => p.toLowerCase().includes(filter.toLowerCase()))
      : players;

    const clearHTML = ADMIN_RESULTS.bonuses[bonusKey]
      ? `<div class="tp-option tp-option-clear">✕ Limpiar selección</div>`
      : '';

    list.innerHTML = clearHTML + filtered.map(p =>
      `<div class="tp-option" data-name="${p}">🇨🇴 ${p}</div>`
    ).join('');

    const clearBtn = list.querySelector('.tp-option-clear');
    if (clearBtn) clearBtn.addEventListener('click', clearPicker);

    list.querySelectorAll('.tp-option:not(.tp-option-clear)').forEach(opt =>
      opt.addEventListener('click', () => {
        _setPlayerPickerValue(picker, opt.dataset.name);
        picker.querySelector('.team-picker-dropdown').classList.add('hidden');
        picker.classList.remove('open');
        ADMIN_RESULTS.bonuses[bonusKey] = opt.dataset.name;
      })
    );
  };
  _wirePicker_admin(picker, renderList);
  renderList();
}

function _buildAdminPlayerPicker(key) {
  const inp = document.querySelector(`#admin-bonuses-grid input[data-bonus="${key}"]`);
  if (!inp) return;
  const picker = document.createElement('div');
  picker.className = 'team-picker';
  picker.dataset.bonus = key;
  picker.innerHTML = `
    <div class="team-picker-trigger">
      <span class="tp-name tp-placeholder">${inp.placeholder}</span>
      <span class="tp-arrow">▾</span>
    </div>
    <div class="team-picker-dropdown hidden">
      <input class="tp-search" type="text" placeholder="Buscar jugador…" autocomplete="off">
      <div class="tp-list"></div>
    </div>`;
  inp.replaceWith(picker);
  const val = ADMIN_RESULTS.bonuses[key];
  if (val) _setPlayerPickerValue(picker, val);
  _wireAdminPlayerPicker(picker, COLOMBIA_SQUAD, key);
}

function initAdminBonusPickers() {
  const allTeams = _allTeamsSorted();
  TEAM_PICKER_KEYS.forEach(key => _buildAdminTeamPicker(key, allTeams));
  INAUG_PICKER_KEYS.forEach(key => _buildAdminTeamPicker(key, INAUGURAL_TEAMS));
  PLAYER_PICKER_KEYS.forEach(key => _buildAdminPlayerPicker(key));
}

/* ================================================================
   BONOS
================================================================ */
function initBonusInputs() {
  const scope = document.getElementById('view-polla');
  if (!scope) return;
  scope.querySelectorAll('input[data-bonus]').forEach(inp => {
    inp.addEventListener('input', e => {
      if (IS_GROUPS_LOCKED) return;
      STATE.bonuses[e.target.dataset.bonus] = e.target.value;
      saveDraft();
    });
  });
}

function loadBonusInputs() {
  const scope = document.getElementById('view-polla');
  if (!scope) return;
  scope.querySelectorAll('input[data-bonus]').forEach(inp => {
    inp.value = STATE.bonuses[inp.dataset.bonus] || '';
  });
  const allTeams = Object.values(GROUPS).flatMap(g => g.teams).concat(INAUGURAL_TEAMS);
  scope.querySelectorAll('.team-picker[data-bonus]').forEach(picker => {
    const key = picker.dataset.bonus;
    const val = STATE.bonuses[key];
    if (!val) return;
    if (PLAYER_PICKER_KEYS.has(key)) {
      _setPlayerPickerValue(picker, val);
    } else {
      const teams = INAUG_PICKER_KEYS.has(key) ? INAUGURAL_TEAMS : allTeams;
      _setTeamPickerValue(picker, val, teams);
    }
  });
}

/* ================================================================
   CONTROLES DE LA QUINIELA
================================================================ */
function initPollaControls() {
  const nameInp = document.getElementById('q-player-name');
  if (nameInp) {
    nameInp.value = CURRENT_USER?.name || STATE.player || '';
    STATE.player = CURRENT_USER?.name || STATE.player || '';
  }

  if (CURRENT_USER?.is_admin) {
    document.getElementById('btn-export-polla')?.classList.remove('hidden');
  }
  document.getElementById('btn-export-polla')?.addEventListener('click', exportJSON);
  document.getElementById('btn-export-pdf-full')?.addEventListener('click', exportFullPDF);

  const importBtn = document.getElementById('btn-import-polla');
  const importFile = document.getElementById('import-polla-file');
  if (importBtn && importFile) {
    importBtn.addEventListener('click', () => {
      if (IS_GROUPS_LOCKED) {
        showErrorModal('Tu polla ya está cerrada — no se puede importar.', 'Polla bloqueada');
        return;
      }
      importFile.value = '';
      importFile.click();
    });
    importFile.addEventListener('change', () => {
      const file = importFile.files?.[0];
      if (file) importPollaJSON(file);
    });
  }

  document.getElementById('btn-lock-polla')?.addEventListener('click', lockPolla);
  applyImportVisibility();
}

function applyImportVisibility() {
  document.getElementById('btn-import-polla')?.classList.toggle('hidden', !IMPORT_ENABLED);
}

/* ================================================================
   CIERRE DE POLLA — Grupos + Bonos
================================================================ */
function validateForLock() {
  const groupErrors = [];
  Object.keys(GROUPS).forEach(group => {
    JORNADAS.forEach((jornada, jIdx) => {
      jornada.pares.forEach((_, pIdx) => {
        const matchIdx = jIdx * 2 + pIdx;
        const k0 = `${group}-${matchIdx}-0`;
        const k1 = `${group}-${matchIdx}-1`;
        if (!(k0 in STATE.scores) || !(k1 in STATE.scores)) {
          groupErrors.push(`Grupo ${group} — ${jornada.label}, partido ${pIdx + 1}`);
        }
      });
    });
  });

  const bonusErrors = [];
  Object.keys(BONUS_LABELS).forEach(key => {
    const val = STATE.bonuses[key];
    if (!val || !val.trim()) bonusErrors.push(BONUS_LABELS[key]);
  });

  return { groupErrors, bonusErrors };
}

function showConfirmModal() {
  return new Promise(resolve => {
    const modal = document.getElementById('lock-confirm-modal');
    modal.classList.remove('hidden');

    const onConfirm = () => { cleanup(); resolve(true); };
    const onCancel = () => { cleanup(); resolve(false); };

    function cleanup() {
      modal.classList.add('hidden');
      document.getElementById('btn-lock-confirm').removeEventListener('click', onConfirm);
      document.getElementById('btn-lock-cancel').removeEventListener('click', onCancel);
    }

    document.getElementById('btn-lock-confirm').addEventListener('click', onConfirm);
    document.getElementById('btn-lock-cancel').addEventListener('click', onCancel);
  });
}

async function lockPolla() {
  const { groupErrors, bonusErrors } = validateForLock();
  const errEl = document.getElementById('polla-lock-errors');

  if (groupErrors.length > 0 || bonusErrors.length > 0) {
    let html = '';
    if (groupErrors.length > 0) {
      html += `<strong>Partidos incompletos (${groupErrors.length}):</strong><ul>` +
        groupErrors.map(e => `<li>${e}</li>`).join('') + '</ul>';
    }
    if (bonusErrors.length > 0) {
      html += `<strong>Bonos sin llenar:</strong><ul>` +
        bonusErrors.map(e => `<li>${e}</li>`).join('') + '</ul>';
    }
    errEl.innerHTML = html;
    errEl.classList.remove('hidden');
    errEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }
  errEl.classList.add('hidden');

  const confirmed = await showConfirmModal();
  if (!confirmed) return;

  const btn = document.getElementById('btn-lock-polla');
  btn.disabled = true;
  btn.textContent = 'Enviando…';

  const { error } = await sb.from('pollas').upsert({
    user_id: CURRENT_USER.id,
    scores: STATE.scores,
    bonuses: STATE.bonuses,
    bracket: STATE.bracket,
    is_groups_locked: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  if (error) {
    btn.disabled = false;
    btn.textContent = '🔒 Enviar y cerrar polla';
    errEl.innerHTML = `<strong>Error al guardar:</strong> ${error.message}`;
    errEl.classList.remove('hidden');
    return;
  }

  IS_GROUPS_LOCKED = true;
  applyLockedState();
}

/* ================================================================
   CIERRE DE RONDAS ELIMINATORIAS — por ronda individual
================================================================ */
const BRACKET_ROUND_LABELS = {
  r32: 'Ronda de 32', r16: 'Octavos de Final', qf: 'Cuartos de Final',
  sf: 'Semifinales', fin: 'Final', third: 'Tercer y Cuarto Lugar'
};

function showBracketLockModal(roundId) {
  return new Promise(resolve => {
    const modal = document.getElementById('bracket-lock-modal');
    const label = BRACKET_ROUND_LABELS[roundId] || roundId;
    document.getElementById('blm-title').textContent = `¿Enviar ${label}?`;
    document.getElementById('blm-msg').innerHTML =
      `Tus predicciones para <strong>${label}</strong> quedarán bloqueadas. No podrás modificarlas.`;
    modal.classList.remove('hidden');

    const onConfirm = () => { cleanup(); resolve(true); };
    const onCancel  = () => { cleanup(); resolve(false); };
    function cleanup() {
      modal.classList.add('hidden');
      document.getElementById('btn-blm-confirm').removeEventListener('click', onConfirm);
      document.getElementById('btn-blm-cancel').removeEventListener('click', onCancel);
    }
    document.getElementById('btn-blm-confirm').addEventListener('click', onConfirm);
    document.getElementById('btn-blm-cancel').addEventListener('click', onCancel);
  });
}

function validateBracketRoundComplete(roundId) {
  const isThird = roundId === 'third';
  const keys = isThird
    ? ['3rd-s0', '3rd-s1']
    : (() => {
        const ronda = RONDAS.find(r => r.id === roundId);
        if (!ronda) return [];
        const ks = [];
        for (let i = 0; i < ronda.partidos; i++) ks.push(`${roundId}-${i}-s0`, `${roundId}-${i}-s1`);
        return ks;
      })();

  const missing = keys.filter(k => {
    const v = STATE.bracket[k];
    return v === '' || v === undefined || v === null;
  });
  return missing.length;
}

async function lockBracketRound(roundId) {
  const errId = `brl-error-${roundId}`;
  const errEl = document.getElementById(errId);

  const missingCount = validateBracketRoundComplete(roundId);
  if (missingCount > 0) {
    const partidos = missingCount / 2;
    const txt = partidos === 1
      ? 'Falta 1 partido sin completar. Ingresa el marcador de todos los partidos antes de enviar.'
      : `Faltan ${partidos} partidos sin completar. Ingresa el marcador de todos los partidos antes de enviar.`;
    if (errEl) { errEl.textContent = txt; errEl.classList.remove('hidden'); }
    return;
  }
  if (errEl) errEl.classList.add('hidden');

  const confirmed = await showBracketLockModal(roundId);
  if (!confirmed) return;

  BRACKET_ROUNDS_LOCKED[roundId] = true;

  const lockPayload = {
    user_id: CURRENT_USER.id,
    bracket: STATE.bracket,
    updated_at: new Date().toISOString(),
  };
  if (_bracketRoundsMigrated) lockPayload.bracket_rounds_locked = BRACKET_ROUNDS_LOCKED;
  const { error } = await sb.from('pollas').upsert(lockPayload, { onConflict: 'user_id' });

  if (error) {
    BRACKET_ROUNDS_LOCKED[roundId] = false;
    showErrorModal('Error al guardar: ' + error.message);
    return;
  }

  // Re-renderizar para mostrar estado bloqueado
  renderBracket();
  initThirdPlace();
}

function applyLockedState() {
  const banner = document.getElementById('polla-locked-banner');
  const actions = document.getElementById('polla-lock-actions');
  if (IS_GROUPS_LOCKED) {
    banner?.classList.remove('hidden');
    actions?.classList.add('hidden');

    document.querySelectorAll('#inner-grupos .m-score').forEach(inp => {
      inp.disabled = true;
    });
    document.querySelectorAll('input[data-bonus]').forEach(inp => {
      inp.disabled = true;
    });
    document.querySelectorAll('.team-picker .team-picker-trigger').forEach(t => {
      t.style.opacity = '0.55';
      t.style.cursor = 'not-allowed';
      t.style.pointerEvents = 'none';
    });
  } else {
    banner?.classList.add('hidden');
    actions?.classList.remove('hidden');
    clearBtn?.classList.remove('hidden');

    document.querySelectorAll('.team-picker .team-picker-trigger').forEach(t => {
      t.style.opacity = '';
      t.style.cursor = '';
      t.style.pointerEvents = '';
    });
  }
}

/* ================================================================
   EXPORT PDF
================================================================ */
function exportFullPDF() {
  const name = STATE.player.trim() || 'mi-polla';
  const originalTitle = document.title;
  const cleanName = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  document.title = `polla-mundialista-2026-${cleanName}`;

  document.body.classList.add('printing-full');
  window.print();
  window.addEventListener('afterprint', () => {
    document.body.classList.remove('printing-full');
    document.title = originalTitle;
  }, { once: true });
}

function exportParticipantPDF(name) {
  const originalTitle = document.title;
  const cleanName = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  document.title = `polla-mundialista-2026-${cleanName}`;

  document.body.classList.add('printing-full', 'printing-ver');
  window.print();
  window.addEventListener('afterprint', () => {
    document.body.classList.remove('printing-full', 'printing-ver');
    document.title = originalTitle;
  }, { once: true });
}

/* ================================================================
   EXPORT JSON
================================================================ */
function exportJSON() {
  const name = STATE.player.trim();
  if (!name) { alert('No se pudo obtener tu nombre.'); return; }
  const payload = {
    name,
    exported: new Date().toISOString(),
    scores: STATE.scores,
    bracket: STATE.bracket,
    bonuses: STATE.bonuses
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  a.href = url; a.download = `${slug}.json`; a.click();
  URL.revokeObjectURL(url);
}

/* ================================================================
   IMPORT JSON — inverso de exportJSON
================================================================ */
const _SCORE_KEY_RE = /^[A-L]-[0-5]-[01]$/;

function _validateImportedPolla(data) {
  if (!data || typeof data !== 'object') return 'El archivo no es un JSON válido.';
  if (!data.scores || typeof data.scores !== 'object') return 'El JSON no tiene la sección "scores".';

  const badKey = Object.keys(data.scores).find(k => !_SCORE_KEY_RE.test(k));
  if (badKey) return `Clave de marcador inválida: "${badKey}" (formato esperado "A-0-0").`;

  const badVal = Object.entries(data.scores).find(([, v]) =>
    typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > 99);
  if (badVal) return `Marcador inválido en "${badVal[0]}": ${badVal[1]}.`;

  if (data.bonuses && typeof data.bonuses === 'object') {
    const badBonus = Object.keys(data.bonuses).find(k => !(k in BONUS_PTS));
    if (badBonus) return `Bono desconocido: "${badBonus}".`;
  }
  return null;
}

function importPollaJSON(file) {
  if (IS_GROUPS_LOCKED) {
    showErrorModal('Tu polla ya está cerrada — no se puede importar.', 'Polla bloqueada');
    return;
  }
  const reader = new FileReader();
  reader.onerror = () => showErrorModal('No se pudo leer el archivo.', 'Error al importar');
  reader.onload = () => {
    let data;
    try {
      data = JSON.parse(reader.result);
    } catch (_) {
      showErrorModal('El archivo no es un JSON válido.', 'Error al importar');
      return;
    }

    const err = _validateImportedPolla(data);
    if (err) { showErrorModal(err, 'Error al importar'); return; }

    const nScores = Object.keys(data.scores).length;
    const nBonuses = Object.keys(data.bonuses || {}).length;
    const ok = window.confirm(
      `Se importarán ${Math.floor(nScores / 2)} partidos y ${nBonuses} bonos` +
      (data.name ? ` de "${data.name}"` : '') +
      '.\n\nEsto REEMPLAZA tus predicciones actuales de grupos y bonos. ¿Continuar?'
    );
    if (!ok) return;

    STATE.scores = { ...data.scores };
    if (data.bonuses && typeof data.bonuses === 'object') STATE.bonuses = { ...data.bonuses };
    if (data.bracket && typeof data.bracket === 'object' && Object.keys(data.bracket).length) {
      STATE.bracket = { ...STATE.bracket, ...data.bracket };
    }

    saveDraft();
    if (location.hash === '#polla') route(); // re-render grupos, tablas, bonos y pickers

    const errEl = document.getElementById('polla-lock-errors');
    if (errEl) {
      errEl.innerHTML = `<strong>✓ Importado:</strong> ${Math.floor(nScores / 2)} partidos y ${nBonuses} bonos` +
        (data.name ? ` de <em>${String(data.name).replace(/</g, '&lt;')}</em>` : '') +
        '. Revisa y luego envía tu polla.';
      errEl.classList.remove('hidden');
    }
  };
  reader.readAsText(file);
}

/* ================================================================
   PERSISTENCIA — localStorage + Supabase (debounced)
================================================================ */
let _saveTimer = null;

function saveDraft() {
  try {
    const toSave = { ...STATE, userId: CURRENT_USER?.id || null };
    localStorage.setItem(LS_DRAFT, JSON.stringify(toSave));
  } catch (_) { }
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(syncToSupabase, 1500);
}

async function syncToSupabase() {
  if (!CURRENT_USER) return;
  const payload = {
    user_id: CURRENT_USER.id,
    bracket: STATE.bracket,
    updated_at: new Date().toISOString(),
  };
  // Si grupos+bonos están bloqueados, NO los mandamos — la DB los rechazaría igualmente
  if (!IS_GROUPS_LOCKED) {
    payload.scores = STATE.scores;
    payload.bonuses = STATE.bonuses;
  }
  // Incluir bracket_rounds_locked solo si la migración ya fue ejecutada (columna existe)
  if (_bracketRoundsMigrated) payload.bracket_rounds_locked = BRACKET_ROUNDS_LOCKED;
  await sb.from('pollas').upsert(payload, { onConflict: 'user_id' });
}

async function loadDraft() {
  try {
    const raw = localStorage.getItem(LS_DRAFT);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Solo usar localStorage si pertenece al usuario actual
      if (!parsed.userId || !CURRENT_USER || parsed.userId === CURRENT_USER.id) {
        STATE = { ...STATE, ...parsed };
      } else {
        localStorage.removeItem(LS_DRAFT);
      }
    }
  } catch (_) { }

  if (!CURRENT_USER) return;

  // Query principal — columnas que siempre existieron (no rompe si falta migración nueva)
  const [pollaRes, resultsRes] = await Promise.all([
    sb.from('pollas').select('scores, bracket, bonuses, is_groups_locked').eq('user_id', CURRENT_USER.id).single(),
    sb.from('official_results').select('bracket').eq('id', 1).single()
  ]);

  const dbData = pollaRes.data;
  STATE.scores = dbData?.scores || {};
  STATE.bracket = dbData?.bracket || {};
  STATE.bonuses = dbData?.bonuses || {};
  IS_GROUPS_LOCKED = dbData?.is_groups_locked || false;
  STATE.player = CURRENT_USER.name;
  try { localStorage.setItem(LS_DRAFT, JSON.stringify({ ...STATE, userId: CURRENT_USER.id })); } catch (_) { }

  const resultsBracket = resultsRes.data?.bracket || {};
  _officialBracket = resultsBracket;
  const hasOfficialBracketInfo = Object.keys(resultsBracket).length > 0;

  // Columnas nuevas — requieren migración ALTER TABLE; si no existen se ignoran silenciosamente
  const [lockRes, openRes, cfgRes] = await Promise.all([
    sb.from('pollas').select('bracket_rounds_locked').eq('user_id', CURRENT_USER.id).single(),
    sb.from('official_results').select('bracket_rounds_open').eq('id', 1).single(),
    sb.from('official_results').select('import_enabled').eq('id', 1).single()
  ]);
  if (!lockRes.error) { BRACKET_ROUNDS_LOCKED = lockRes.data?.bracket_rounds_locked || {}; _bracketRoundsMigrated = true; }
  if (!openRes.error) BRACKET_ROUNDS_OPEN = openRes.data?.bracket_rounds_open || {};
  if (!cfgRes.error && cfgRes.data) IMPORT_ENABLED = cfgRes.data.import_enabled ?? true;

  updateBracketTabsVisibility(hasOfficialBracketInfo);
}

/* ================================================================
   PARTICIPANTES (vista admin)
================================================================ */
async function loadParticipantsView() {
  const listEl = document.getElementById('participantes-list');
  const searchEl = document.getElementById('participantes-search');
  if (!listEl || !searchEl) return;

  listEl.innerHTML = '<p class="loading-msg">Cargando participantes…</p>';
  searchEl.value = '';
  searchEl.oninput = null;

  const [{ data: profilesData }, { data: pollasData }] = await Promise.all([
    sb.from('profiles').select('id, name, is_admin'),
    sb.from('pollas').select('user_id, is_groups_locked, bracket_rounds_locked, scores, bonuses'),
  ]);

  const pollasMap = {};
  (pollasData || []).forEach(p => { pollasMap[p.user_id] = p; });

  const participants = (profilesData || [])
    .filter(p => !p.is_admin)
    .map(p => {
      const polla = pollasMap[p.id];
      const hasData = polla && (
        Object.keys(polla.scores || {}).length > 0 ||
        Object.keys(polla.bonuses || {}).length > 0
      );
      return {
        name: p.name || 'Sin nombre',
        userId: p.id,
        locked: polla?.is_groups_locked || false,
        roundsLocked: polla?.bracket_rounds_locked || {},
        hasPolla: !!polla,
        hasData: !!hasData,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));

  const ROUND_BADGES = [
    { id: 'grupos',  label: 'Grupos' },
    { id: 'r32',     label: 'R32'   },
    { id: 'r16',     label: 'Oct'   },
    { id: 'qf',      label: 'QF'    },
    { id: 'sf',      label: 'Semi'  },
    { id: 'fin',     label: 'Final' },
    { id: 'third',   label: '3er'   },
  ];

  function roundsBadgesHTML(p) {
    return ROUND_BADGES.map(r => {
      const sent = r.id === 'grupos' ? p.locked : !!p.roundsLocked[r.id];
      return `<span class="pc-round-badge ${sent ? 'pc-round-sent' : 'pc-round-pending'}">${r.label}</span>`;
    }).join('');
  }

  function statusTag(p) {
    if (p.locked) return ['pc-locked', '<i class="fa-solid fa-lock"></i> Grupos enviados'];
    if (p.hasData) return ['pc-open', '<i class="fa-solid fa-pen"></i> En progreso'];
    if (p.hasPolla) return ['pc-nodata', '<i class="fa-solid fa-circle-minus"></i> Sin datos'];
    return ['pc-nopolla', '<i class="fa-solid fa-circle-xmark"></i> Sin polla'];
  }

  function render(filter) {
    const filtered = filter
      ? participants.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()))
      : participants;

    if (filtered.length === 0) {
      listEl.innerHTML = '<p class="empty-msg">No se encontraron participantes.</p>';
      return;
    }

    listEl.innerHTML = filtered.map(p => {
      const [cls, label] = statusTag(p);
      return `
<a class="participante-card participante-card--admin" href="#ver/${encodeURIComponent(p.name)}">
  <div class="pc-info">
    <span class="pc-name">${p.name}</span>
    <div class="pc-rounds">${roundsBadgesHTML(p)}</div>
  </div>
  <span class="pc-arrow"><i class="fa-solid fa-chevron-right"></i></span>
</a>`;
    }).join('');
  }

  render('');
  searchEl.oninput = () => render(searchEl.value.trim());
}

/* ================================================================
   ADMIN
================================================================ */
function initAdminPanel() {
  if (!CURRENT_USER?.is_admin) return;

  document.getElementById('create-user-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('new-user-name').value.trim();
    const email = document.getElementById('new-user-email').value.trim();
    const password = document.getElementById('new-user-password').value;
    const msg = document.getElementById('create-user-msg');
    const btn = document.getElementById('btn-create-user');

    btn.disabled = true;
    msg.textContent = 'Creando usuario…';
    msg.className = 'admin-msg';

    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON,
        },
        body: JSON.stringify({ email, password, data: { name } })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error_description || json.msg || json.message || 'Error desconocido');

      msg.textContent = `Usuario "${name}" creado. Ya puede iniciar sesión.`;
      msg.className = 'admin-msg success';
      e.target.reset();
    } catch (err) {
      msg.textContent = 'Error: ' + err.message;
      msg.className = 'admin-msg error';
    }

    btn.disabled = false;
  });

  renderAdminImportToggle();

  document.getElementById('btn-save-results')?.addEventListener('click', async () => {
    const ta = document.getElementById('official-results-json');
    const msg = document.getElementById('save-results-msg');
    try {
      const parsed = JSON.parse(ta.value);
      const { error } = await sb.from('official_results').upsert({
        id: 1,
        scores: parsed.scores || {},
        bracket: parsed.bracket || {},
        bonuses: parsed.bonuses || {},
        updated_at: new Date().toISOString(),
      });
      msg.textContent = error ? 'Error: ' + error.message : 'Resultados guardados correctamente.';
      msg.className = 'admin-msg ' + (error ? 'error' : 'success');
    } catch (_) {
      msg.textContent = 'JSON inválido. Revisa el formato.';
      msg.className = 'admin-msg error';
    }
  });
}

/* ================================================================
   ADMIN — EDITOR VISUAL DE RESULTADOS OFICIALES
================================================================ */
const ADMIN_RESULTS = { scores: {}, bracket: {}, bonuses: {} };

async function loadAdminResultsEditor() {
  const grid = document.getElementById('admin-groups-grid');
  if (!grid) return;

  const { data } = await sb.from('official_results').select('*').eq('id', 1).single();
  if (data) {
    ADMIN_RESULTS.scores = data.scores || {};
    ADMIN_RESULTS.bracket = data.bracket || {};
    ADMIN_RESULTS.bonuses = data.bonuses || {};
    BRACKET_ROUNDS_OPEN = data.bracket_rounds_open || {};
  }

  renderAdminGroups();
  renderAdminBracket();
  renderAdminBonuses();
  renderAdminRoundToggles();
  initAdminResultsTabs();
  initAdminSaveBtns();
}

/* ---------- GRUPOS ---------- */
function renderAdminGroups() {
  const grid = document.getElementById('admin-groups-grid');
  if (!grid) return;
  grid.innerHTML = Object.entries(GROUPS)
    .map(([letter, g]) => buildAdminGroupCard(letter, g.teams))
    .join('');
  grid.querySelectorAll('.m-score[data-admin-group]').forEach(inp => {
    inp.addEventListener('input', onAdminScoreInput);
  });
  Object.keys(GROUPS).forEach(recalcAdminGroup);
}

function buildAdminGroupCard(letter, teams) {
  return `
<div class="group-card group-card-admin" data-group="${letter}">
  <div class="group-head">
    <div class="group-letter-badge">${letter}</div>
    <div class="group-head-info">
      <div class="group-head-title">Grupo ${letter}</div>
      <div class="group-flags">${teams.map(t => `<span class="gf-flag" title="${t.n}">${flag(t)}</span>`).join('')}</div>
    </div>
  </div>
  <div class="group-body">
    <div class="group-matches">${buildAdminJornadas(letter, teams)}</div>
    <div class="standings-wrap">
      <table class="standings-table" id="st-admin-${letter}">
        <thead>
          <tr>
            <th>#</th><th>Equipo</th>
            <th title="Jugados">J</th><th title="Ganados">G</th><th title="Empatados">E</th><th title="Perdidos">P</th>
            <th title="Goles a favor">GF</th><th title="Goles en contra">GC</th><th title="Diferencia">DG</th>
            <th title="Puntos">Pts</th>
          </tr>
        </thead>
        <tbody id="st-admin-body-${letter}">${buildDefaultRows(teams)}</tbody>
      </table>
    </div>
  </div>
</div>`;
}

function buildAdminJornadas(letter, teams) {
  return JORNADAS.map((jornada, jIdx) => {
    const slots = jornada.pares
      .map((_, pIdx) => { const matchIdx = jIdx * 2 + pIdx; return { par: getMatchPair(letter, matchIdx), matchIdx }; })
      .sort((a, b) => {
        const miA = (MATCH_INFO[letter] || [])[a.matchIdx] || {};
        const miB = (MATCH_INFO[letter] || [])[b.matchIdx] || {};
        const dA = parseMatchDate(miA.date || '1 ene');
        const dB = parseMatchDate(miB.date || '1 ene');
        if (dA.month !== dB.month) return dA.month - dB.month;
        if (dA.day !== dB.day) return dA.day - dB.day;
        return (miA.time || '').localeCompare(miB.time || '');
      });
    const rows = slots.map(({ par, matchIdx }) => {
      const k0 = scoreKey(letter, matchIdx, 0);
      const k1 = scoreKey(letter, matchIdx, 1);
      const v0 = ADMIN_RESULTS.scores[k0] ?? '';
      const v1 = ADMIN_RESULTS.scores[k1] ?? '';
      const t0 = teams[par[0]], t1 = teams[par[1]];
      const mi = (MATCH_INFO[letter] || [])[matchIdx] || {};
      return `
<div class="match-block">
  <div class="match-meta">
    <span class="mm-date"><i class="fa-solid fa-calendar-days"></i> ${mi.date || ''}</span>
    <span class="mm-time"><i class="fa-regular fa-clock"></i> ${mi.time || ''} <small>COT</small></span>
    <span class="mm-venue"><i class="fa-solid fa-location-dot"></i> ${mi.venue || ''}</span>
  </div>
  <div class="match-row">
    <span class="m-team home">
      <span class="m-name">${t0.n}</span>
      <span class="m-flag">${flag(t0)}</span>
    </span>
    <input type="number" class="m-score${v0 !== '' ? ' filled' : ''}"
      min="0" max="99"
      data-admin-group="${letter}" data-admin-match="${matchIdx}" data-admin-side="0"
      value="${v0}" placeholder="–">
    <span class="m-vs">-</span>
    <input type="number" class="m-score${v1 !== '' ? ' filled' : ''}"
      min="0" max="99"
      data-admin-group="${letter}" data-admin-match="${matchIdx}" data-admin-side="1"
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

function onAdminScoreInput(e) {
  const { adminGroup: group, adminMatch: match, adminSide: side } = e.target.dataset;
  const val = e.target.value;
  const key = scoreKey(group, match, side);
  if (val !== '' && !isNaN(parseInt(val))) {
    ADMIN_RESULTS.scores[key] = parseInt(val);
    e.target.classList.add('filled');
  } else {
    delete ADMIN_RESULTS.scores[key];
    e.target.classList.remove('filled');
  }
  recalcAdminGroup(group);
}

function recalcAdminGroup(letter) {
  const teams = GROUPS[letter].teams;
  const st = teams.map((t, idx) => ({ name: t.n, flag: t.code, idx, j: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0 }));

  JORNADAS.forEach((jornada, jIdx) => {
    jornada.pares.forEach((_, pIdx) => {
      const matchIdx = jIdx * 2 + pIdx;
      const [t0, t1] = getMatchPair(letter, matchIdx);
      const k0 = scoreKey(letter, matchIdx, 0), k1 = scoreKey(letter, matchIdx, 1);
      if (!(k0 in ADMIN_RESULTS.scores) || !(k1 in ADMIN_RESULTS.scores)) return;
      const s0 = ADMIN_RESULTS.scores[k0], s1 = ADMIN_RESULTS.scores[k1];
      st[t0].j++; st[t1].j++;
      st[t0].gf += s0; st[t0].gc += s1;
      st[t1].gf += s1; st[t1].gc += s0;
      if (s0 > s1) { st[t0].g++; st[t0].pts += 3; st[t1].p++; }
      else if (s0 < s1) { st[t1].g++; st[t1].pts += 3; st[t0].p++; }
      else { st[t0].e++; st[t1].e++; st[t0].pts++; st[t1].pts++; }
    });
  });

  st.sort((a, b) =>
    b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf || a.name.localeCompare(b.name)
  );

  const posClasses = ['p1', 'p2', 'p3', 'p4'];
  const rowClasses = ['st-advances', 'st-advances', 'st-maybe', ''];
  const tbody = document.getElementById(`st-admin-body-${letter}`);
  if (!tbody) return;
  tbody.innerHTML = st.map((s, pos) => {
    const dg = s.gf - s.gc;
    const dgClass = dg > 0 ? 'pos' : dg < 0 ? 'neg' : '';
    return `
<tr class="${rowClasses[pos]}">
  <td><span class="pos-badge ${posClasses[pos]}">${pos + 1}</span></td>
  <td class="st-team-name"><span class="st-flag"><span class="fi fi-${s.flag}"></span></span>${s.name}</td>
  <td>${s.j}</td><td>${s.g}</td><td>${s.e}</td><td>${s.p}</td>
  <td>${s.gf}</td><td>${s.gc}</td>
  <td class="st-gd ${dgClass}">${dg > 0 ? '+' : ''}${dg}</td>
  <td class="st-pts">${s.pts}</td>
</tr>`;
  }).join('');
}

/* ---------- ELIMINATORIAS ---------- */
function _wireAdminBracketPicker(picker, teams, key) {
  const trigger = picker.querySelector('.team-picker-trigger');
  const dropdown = picker.querySelector('.team-picker-dropdown');
  const search = picker.querySelector('.tp-search');
  const list = picker.querySelector('.tp-list');
  // Save original placeholder text for reset
  const origPlaceholder = picker.querySelector('.tp-name')?.textContent || 'Seleccionar equipo';

  const clearPicker = () => {
    const nameEl = picker.querySelector('.tp-name');
    const flagEl = picker.querySelector('.tp-flag');
    if (nameEl) { nameEl.textContent = origPlaceholder; nameEl.classList.add('tp-placeholder'); }
    if (flagEl) flagEl.innerHTML = '';
    delete ADMIN_RESULTS.bracket[key];
    dropdown.classList.add('hidden');
    picker.classList.remove('open');
    highlightAdminWinnerRows();
    updateAdminChampion();
  };

  const renderList = (filter = '') => {
    const filtered = filter
      ? teams.filter(t => t.n.toLowerCase().includes(filter.toLowerCase()))
      : teams;

    // Add clear option at the top if a value is currently selected
    const clearHTML = ADMIN_RESULTS.bracket[key]
      ? `<div class="tp-option tp-option-clear">✕ Limpiar selección</div>`
      : '';

    list.innerHTML = clearHTML + filtered.map(t =>
      `<div class="tp-option" data-name="${t.n}" data-code="${t.code}">
         <span class="fi fi-${t.code}"></span> ${t.n}
       </div>`
    ).join('');

    // Wire clear button
    const clearBtn = list.querySelector('.tp-option-clear');
    if (clearBtn) clearBtn.addEventListener('click', clearPicker);

    list.querySelectorAll('.tp-option:not(.tp-option-clear)').forEach(opt =>
      opt.addEventListener('click', () => {
        _setTeamPickerValue(picker, opt.dataset.name, teams);
        dropdown.classList.add('hidden');
        picker.classList.remove('open');

        // Guardar el valor en el estado temporal
        ADMIN_RESULTS.bracket[key] = opt.dataset.name;
        highlightAdminWinnerRows();
        updateAdminChampion();
      })
    );
  };

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = !dropdown.classList.contains('hidden');
    document.querySelectorAll('.team-picker-dropdown').forEach(d => d.classList.add('hidden'));
    document.querySelectorAll('.team-picker').forEach(p => p.classList.remove('open'));
    if (!isOpen) {
      dropdown.classList.remove('hidden');
      picker.classList.add('open');
      search.value = '';
      renderList('');
      search.focus();
    }
  });

  search.addEventListener('input', () => renderList(search.value));
  search.addEventListener('click', e => e.stopPropagation());
  document.addEventListener('click', () => {
    dropdown.classList.add('hidden');
    picker.classList.remove('open');
  });
}

function renderAdminBracket() {
  const container = document.getElementById('admin-bracket-render');
  if (!container) return;
  container.innerHTML = RONDAS.map(ronda => buildAdminRoundHTML(ronda)).join('');

  const allTeams = _allTeamsSorted();

  // Wire all admin bracket pickers (including rounds and third place)
  document.querySelectorAll('.admin-bracket-picker').forEach(picker => {
    const key = picker.dataset.adminKey;
    const val = ADMIN_RESULTS.bracket[key] || '';
    if (val) _setTeamPickerValue(picker, val, allTeams);
    _wireAdminBracketPicker(picker, allTeams, key);
  });

  // Wire score inputs inside container
  container.querySelectorAll('.bm-score').forEach(inp => {
    inp.addEventListener('input', onAdminBracketInput);
  });

  // Wire score inputs for third place
  const thirdMatch = document.getElementById('admin-third-match');
  if (thirdMatch) {
    thirdMatch.querySelectorAll('input[type="number"][data-admin-key]').forEach(inp => {
      const key = inp.dataset.adminKey;
      inp.value = ADMIN_RESULTS.bracket[key] !== undefined ? ADMIN_RESULTS.bracket[key] : '';
      inp.addEventListener('input', onAdminBracketInput);
    });
  }

  updateAdminChampion();
}

function buildAdminRoundHTML(ronda) {
  const matches = Array.from({ length: ronda.partidos }, (_, i) => {
    const ph0 = ronda.placeholders[i * 2] || `Equipo ${i * 2 + 1}`;
    const ph1 = ronda.placeholders[i * 2 + 1] || `Equipo ${i * 2 + 2}`;
    const kt0 = `${ronda.id}-${i}-t0`, kt1 = `${ronda.id}-${i}-t1`;
    const ks0 = `${ronda.id}-${i}-s0`, ks1 = `${ronda.id}-${i}-s1`;
    const isFin = ronda.id === 'fin';
    const s0 = parseFloat(ADMIN_RESULTS.bracket[ks0]);
    const s1 = parseFloat(ADMIN_RESULTS.bracket[ks1]);
    const winner = (!isNaN(s0) && !isNaN(s1)) ? (s0 > s1 ? 't0' : s1 > s0 ? 't1' : null) : null;
    const metaHTML = getMatchMetaHTML(ronda.id, i);

    const picker0 = `
<div class="team-picker admin-bracket-picker" data-admin-key="${kt0}">
  <div class="team-picker-trigger">
    <span class="tp-flag"></span>
    <span class="tp-name tp-placeholder">${ph0}</span>
    <span class="tp-arrow">▾</span>
  </div>
  <div class="team-picker-dropdown hidden">
    <input class="tp-search" type="text" placeholder="Buscar equipo…" autocomplete="off">
    <div class="tp-list"></div>
  </div>
</div>`;

    const picker1 = `
<div class="team-picker admin-bracket-picker" data-admin-key="${kt1}">
  <div class="team-picker-trigger">
    <span class="tp-flag"></span>
    <span class="tp-name tp-placeholder">${ph1}</span>
    <span class="tp-arrow">▾</span>
  </div>
  <div class="team-picker-dropdown hidden">
    <input class="tp-search" type="text" placeholder="Buscar equipo…" autocomplete="off">
    <div class="tp-list"></div>
  </div>
</div>`;

    return `
<div class="bracket-match${isFin ? ' is-final' : ''}">
  ${metaHTML}
  <div class="bm-row${winner === 't0' ? ' winner' : ''}">
    ${picker0}
    <input type="number" class="bm-score" data-admin-key="${ks0}" value="${ADMIN_RESULTS.bracket[ks0] !== undefined ? ADMIN_RESULTS.bracket[ks0] : ''}" min="0" max="99" placeholder="0">
  </div>
  <div class="bm-row${winner === 't1' ? ' winner' : ''}">
    ${picker1}
    <input type="number" class="bm-score" data-admin-key="${ks1}" value="${ADMIN_RESULTS.bracket[ks1] !== undefined ? ADMIN_RESULTS.bracket[ks1] : ''}" min="0" max="99" placeholder="0">
  </div>
</div>`;
  }).join('');

  return `
<div class="bracket-round">
  <div class="bracket-round-title">${ronda.label}</div>
  <div class="bracket-matches-col">${matches}</div>
</div>`;
}

function onAdminBracketInput(e) {
  const key = e.target.dataset.adminKey;
  if (!key) return;
  const val = e.target.value;
  if (val !== '') {
    ADMIN_RESULTS.bracket[key] = isNaN(Number(val)) ? val : Number(val);
  } else {
    delete ADMIN_RESULTS.bracket[key];
  }
  highlightAdminWinnerRows();
  updateAdminChampion();
}

function highlightAdminWinnerRows() {
  RONDAS.forEach(ronda => {
    for (let i = 0; i < ronda.partidos; i++) {
      const matchEl = document.querySelector(
        `#admin-bracket-render .bracket-match:has([data-admin-key="${ronda.id}-${i}-t0"])`
      );
      if (!matchEl) continue;
      const rows = matchEl.querySelectorAll('.bm-row');
      const s0 = parseFloat(ADMIN_RESULTS.bracket[`${ronda.id}-${i}-s0`]);
      const s1 = parseFloat(ADMIN_RESULTS.bracket[`${ronda.id}-${i}-s1`]);
      const winner = (!isNaN(s0) && !isNaN(s1)) ? (s0 > s1 ? 't0' : s1 > s0 ? 't1' : null) : null;
      rows[0]?.classList.toggle('winner', winner === 't0');
      rows[1]?.classList.toggle('winner', winner === 't1');
    }
  });
}

function updateAdminChampion() {
  const nameEl = document.getElementById('admin-champion-display');
  const flagEl = document.getElementById('admin-champion-flag');
  if (!nameEl) return;
  const t0 = ADMIN_RESULTS.bracket['fin-0-t0'] || '';
  const t1 = ADMIN_RESULTS.bracket['fin-0-t1'] || '';
  const s0 = parseFloat(ADMIN_RESULTS.bracket['fin-0-s0']);
  const s1 = parseFloat(ADMIN_RESULTS.bracket['fin-0-s1']);
  if (!isNaN(s0) && !isNaN(s1) && (t0 || t1)) {
    const champ = s0 > s1 ? t0 : s1 > s0 ? t1 : '';
    nameEl.textContent = champ || '—';
    if (flagEl) {
      const team = Object.values(GROUPS).flatMap(g => g.teams).find(t => t.n === champ);
      flagEl.innerHTML = team ? flag(team) : '';
    }
  } else {
    nameEl.innerHTML = '&nbsp;';
    if (flagEl) flagEl.innerHTML = '';
  }
}

/* ---------- BONOS ---------- */
function renderAdminBonuses() {
  const grid = document.getElementById('admin-bonuses-grid');
  if (!grid) return;
  grid.innerHTML = BONUS_GROUPS.map(group => {
    const rows = group.keys.map(key => {
      const val = ADMIN_RESULTS.bonuses[key] || '';
      if (MANUAL_BONUS_KEYS.has(key)) {
        return `
<div class="bonus-field">
  <label>${BONUS_LABELS[key]} <span class="bonus-pts">+${BONUS_PTS[key]}pts</span></label>
  <input type="text" class="admin-bonus-input" data-bonus-key="${key}"
    value="${val}" placeholder="Respuesta oficial…" autocomplete="off">
</div>`;
      }
      const ph = PLAYER_PICKER_KEYS.has(key) ? 'Seleccionar jugador…' : 'Seleccionar equipo…';
      return `
<div class="bonus-field">
  <label>${BONUS_LABELS[key]} <span class="bonus-pts">+${BONUS_PTS[key]}pts</span></label>
  <input type="text" data-bonus="${key}" value="${val}" placeholder="${ph}" autocomplete="off">
</div>`;
    }).join('');
    return `<div class="bonus-group"><h3 class="bonus-group-title">${group.label}</h3>${rows}</div>`;
  }).join('');

  grid.querySelectorAll('.admin-bonus-input').forEach(inp => {
    inp.addEventListener('input', e => {
      const key = e.target.dataset.bonusKey;
      const val = e.target.value.trim();
      if (val) ADMIN_RESULTS.bonuses[key] = val;
      else delete ADMIN_RESULTS.bonuses[key];
    });
  });

  initAdminBonusPickers();
}

/* ---------- GUARDAR ---------- */
async function saveAdminSection(msgId) {
  const msgEl = document.getElementById(msgId);
  msgEl.textContent = 'Guardando…';
  const { error } = await sb.from('official_results').upsert({
    id: 1,
    scores: ADMIN_RESULTS.scores,
    bracket: ADMIN_RESULTS.bracket,
    bonuses: ADMIN_RESULTS.bonuses,
    bracket_rounds_open: BRACKET_ROUNDS_OPEN,
    updated_at: new Date().toISOString(),
  });
  msgEl.textContent = error ? 'Error: ' + error.message : '<i class="fa-solid fa-circle-check"></i> Guardado';
  if (!error) msgEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> Guardado';
}

/* ---------- RESET RONDA BRACKET (admin desde vista ver) ---------- */
function renderAdminBracketRoundReset(userId) {
  const container = document.getElementById('admin-bracket-round-reset');
  if (!container) return;
  container.classList.remove('hidden');
  container.innerHTML = `
<div class="art-header">
  <div class="art-header-row">
    <h3 class="art-title"><i class="fa-solid fa-rotate-left"></i> Borrar predicciones por ronda</h3>
    <button class="art-collapse-btn" id="btn-round-reset-toggle" onclick="toggleRoundResetPanel()">
      <span class="chev">▾</span> <span class="chev-label">Mostrar</span>
    </button>
  </div>
  <p class="art-sub">Borra los datos de una ronda para que el participante pueda volver a ingresarlos. Asegúrate de que la ronda esté abierta.</p>
</div>
<div class="art-rows collapsed" id="round-reset-rows">
  ${_ALL_ROUNDS.map(({ id, label }) => `
<div class="art-row">
  <span class="art-label">${label}</span>
  <button class="btn btn-sm btn-outline" onclick="clearUserBracketRound('${id}', '${userId}', this)">
    <i class="fa-solid fa-trash"></i> Borrar
  </button>
</div>`).join('')}
</div>`;
}

function toggleRoundResetPanel() {
  const rows = document.getElementById('round-reset-rows');
  const btn  = document.getElementById('btn-round-reset-toggle');
  if (!rows || !btn) return;
  const isCollapsed = rows.classList.toggle('collapsed');
  btn.classList.toggle('open', !isCollapsed);
  btn.querySelector('.chev-label').textContent = isCollapsed ? 'Mostrar' : 'Ocultar';
}

async function clearUserBracketRound(roundId, userId, btn) {
  const label = _ALL_ROUNDS.find(r => r.id === roundId)?.label || roundId;
  const confirmed = await showDeleteConfirmModal(
    `¿Borrar ${label}?`,
    `Se eliminarán las predicciones de "${label}" de este participante. Podrá volver a ingresarlas siempre que la ronda esté abierta.`
  );
  if (!confirmed) return;

  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

  const [pollaRes, lockRes] = await Promise.all([
    sb.from('pollas').select('bracket').eq('user_id', userId).single(),
    _bracketRoundsMigrated
      ? sb.from('pollas').select('bracket_rounds_locked').eq('user_id', userId).single()
      : Promise.resolve({ data: null, error: null })
  ]);

  if (pollaRes.error) {
    showErrorModal('Error al cargar datos: ' + pollaRes.error.message);
    btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-trash"></i> Borrar';
    return;
  }

  const bracket = { ...(pollaRes.data?.bracket || {}) };
  const roundsLocked = { ...(lockRes.data?.bracket_rounds_locked || {}) };

  if (roundId === 'third') {
    ['3rd-t0', '3rd-t1', '3rd-s0', '3rd-s1'].forEach(k => delete bracket[k]);
  } else {
    const ronda = RONDAS.find(r => r.id === roundId);
    if (ronda) {
      for (let i = 0; i < ronda.partidos; i++) {
        delete bracket[`${roundId}-${i}-t0`];
        delete bracket[`${roundId}-${i}-t1`];
        delete bracket[`${roundId}-${i}-s0`];
        delete bracket[`${roundId}-${i}-s1`];
      }
    }
  }
  roundsLocked[roundId] = false;

  const payload = { bracket, updated_at: new Date().toISOString() };
  if (_bracketRoundsMigrated) payload.bracket_rounds_locked = roundsLocked;

  const { error } = await sb.from('pollas').update(payload).eq('user_id', userId);
  if (error) {
    showErrorModal('Error al borrar: ' + error.message);
    btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-trash"></i> Borrar';
    return;
  }

  if (_verPlayerData) {
    _verPlayerData.bracket = bracket;
    renderBracketReadonly(bracket, 'bracket-render-ver', 'champion-display-ver');
    if (roundId === 'third') {
      document.getElementById('third-match-ver')
        ?.querySelectorAll('[data-key]').forEach(inp => { inp.value = ''; });
    }
  }

  btn.disabled = false;
  btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Borrado';
  setTimeout(() => { btn.innerHTML = '<i class="fa-solid fa-trash"></i> Borrar'; }, 2500);
}

/* ---------- CONTROL IMPORTAR JSON (admin) ---------- */
function renderAdminImportToggle() {
  const container = document.getElementById('admin-import-toggle');
  if (!container) return;
  container.innerHTML = `
<div class="art-header">
  <h3 class="art-title"><i class="fa-solid fa-sliders"></i> Controles de participantes</h3>
</div>
<div class="art-rows">
  <div class="art-row">
    <span class="art-label">Importar JSON</span>
    <span class="art-status ${IMPORT_ENABLED ? 'art-open' : 'art-closed'}">
      ${IMPORT_ENABLED
        ? '<i class="fa-solid fa-check"></i> Habilitado'
        : '<i class="fa-solid fa-ban"></i> Deshabilitado'}
    </span>
    <button class="btn btn-sm ${IMPORT_ENABLED ? 'btn-outline' : 'btn-gold'}" onclick="toggleImportEnabled()">
      ${IMPORT_ENABLED ? 'Deshabilitar' : 'Habilitar'}
    </button>
  </div>
</div>`;
}

async function toggleImportEnabled() {
  const prev = IMPORT_ENABLED;
  IMPORT_ENABLED = !prev;
  const { error } = await sb.from('official_results').upsert({
    id: 1,
    import_enabled: IMPORT_ENABLED,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    IMPORT_ENABLED = prev;
    showErrorModal('Error al guardar: ' + error.message);
    return;
  }
  renderAdminImportToggle();
  applyImportVisibility();
}

/* ---------- CONTROL DE RONDAS (admin) ---------- */
const _ALL_ROUNDS = [
  { id: 'r32',   label: 'Ronda de 32' },
  { id: 'r16',   label: 'Octavos de Final' },
  { id: 'qf',    label: 'Cuartos de Final' },
  { id: 'sf',    label: 'Semifinales' },
  { id: 'fin',   label: 'Final' },
  { id: 'third', label: 'Tercer y Cuarto Lugar' },
];

function renderAdminRoundToggles() {
  const container = document.getElementById('admin-round-toggles');
  if (!container) return;
  container.innerHTML = `
<div class="art-header">
  <h3 class="art-title"><i class="fa-solid fa-sliders"></i> Apertura de rondas para participantes</h3>
  <p class="art-sub">Cuando abres una ronda, los participantes pueden ingresar sus predicciones y luego bloquearlas.</p>
</div>
<div class="art-rows">
  ${_ALL_ROUNDS.map(({ id, label }) => {
    const isOpen = BRACKET_ROUNDS_OPEN[id] || false;
    return `
<div class="art-row">
  <span class="art-label">${label}</span>
  <span class="art-status ${isOpen ? 'art-open' : 'art-closed'}">
    ${isOpen
      ? '<i class="fa-solid fa-lock-open"></i> Abierta'
      : '<i class="fa-solid fa-lock"></i> Cerrada'}
  </span>
  <button class="btn btn-sm ${isOpen ? 'btn-outline' : 'btn-gold'}" onclick="toggleBracketRound('${id}')">
    ${isOpen ? 'Cerrar ronda' : 'Abrir ronda'}
  </button>
</div>`;
  }).join('')}
</div>`;
}

async function toggleBracketRound(roundId) {
  const wasOpen = BRACKET_ROUNDS_OPEN[roundId] || false;
  BRACKET_ROUNDS_OPEN[roundId] = !wasOpen;

  const { error } = await sb.from('official_results').upsert({
    id: 1,
    scores: ADMIN_RESULTS.scores,
    bracket: ADMIN_RESULTS.bracket,
    bonuses: ADMIN_RESULTS.bonuses,
    bracket_rounds_open: BRACKET_ROUNDS_OPEN,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    BRACKET_ROUNDS_OPEN[roundId] = wasOpen; // revertir
    showErrorModal('Error al guardar: ' + error.message);
    return;
  }

  renderAdminRoundToggles();
}

/* ---------- TABS & INIT ---------- */
function initAdminResultsTabs() {
  const tabsNav = document.getElementById('admin-results-tabs');
  if (!tabsNav) return;
  tabsNav.querySelectorAll('.inner-tab[data-admin-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      tabsNav.querySelectorAll('.inner-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      ['grupos-admin', 'bracket-admin', 'bonos-admin'].forEach(id => {
        document.getElementById(`inner-${id}`)?.classList.add('hidden');
      });
      document.getElementById(`inner-${btn.dataset.adminTab}`)?.classList.remove('hidden');
    });
  });
}

function initAdminSaveBtns() {
  document.getElementById('btn-save-grupos')
    ?.addEventListener('click', () => saveAdminSection('save-grupos-msg'));
  document.getElementById('btn-save-bracket')
    ?.addEventListener('click', () => saveAdminSection('save-bracket-msg'));
  document.getElementById('btn-save-bonos')
    ?.addEventListener('click', () => saveAdminSection('save-bonos-msg'));
}

/* legacy — ya no se usa pero evita errores si algo lo referencia */
async function loadOfficialResultsEditor() { await loadAdminResultsEditor(); }

function updateBracketTabsVisibility(hasOfficialBracketInfo) {
  const hasAnyRoundOpen = Object.values(BRACKET_ROUNDS_OPEN).some(Boolean);
  const showPlayerBracket = hasOfficialBracketInfo || hasAnyRoundOpen;
  const playerTab = document.getElementById('tab-btn-bracket');
  if (playerTab) {
    playerTab.classList.toggle('hidden', !showPlayerBracket);
    if (!hasOfficialBracketInfo && playerTab.classList.contains('active')) {
      const gruposTab = document.querySelector('.inner-tab[data-inner="grupos"]');
      if (gruposTab) gruposTab.click();
    }
  }
  const verTab = document.getElementById('tab-btn-bracket-ver');
  if (verTab) {
    verTab.classList.toggle('hidden', !hasOfficialBracketInfo);
    if (!hasOfficialBracketInfo && verTab.classList.contains('active')) {
      const gruposVerTab = document.querySelector('.inner-tab[data-inner-ver="grupos-ver"]');
      if (gruposVerTab) gruposVerTab.click();
    }
  }
}

/* ================================================================
   TABS INTERNOS
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
   MÚSICA — Audio local (mundial2026.MP3)
================================================================ */
const MUSIC_START = 11;

let _musicOn = false;
let _unmutedOnce = false;

function _getAudio() { return document.getElementById('bg-audio'); }

function _setMusicIcon(on) {
  const btn = document.getElementById('btn-music');
  if (!btn) return;
  btn.querySelector('.music-off').classList.toggle('hidden', on);
  btn.querySelector('.music-on').classList.toggle('hidden', !on);
  btn.title = on ? 'Silenciar música' : 'Activar música';
}

function _handleFirstInteraction() {
  if (_unmutedOnce) return;
  _unmutedOnce = true;
  document.removeEventListener('click', _handleFirstInteraction);
  if (_musicOn) {
    const audio = _getAudio();
    audio.currentTime = MUSIC_START;
    audio.volume = 0.5;
    audio.play().catch(() => {});
    _setMusicIcon(true);
  }
}

function initMusicBtn() {
  document.addEventListener('click', _handleFirstInteraction);

  const btn = document.getElementById('btn-music');
  if (!btn) return;
  _musicOn = true;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const audio = _getAudio();
    _musicOn = !_musicOn;

    if (_musicOn) {
      _unmutedOnce = true;
      document.removeEventListener('click', _handleFirstInteraction);
      audio.currentTime = MUSIC_START;
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
    _setMusicIcon(_musicOn);
  });
}

/* ================================================================
   LAYOUT FIJO — offsets dinámicos
================================================================ */
function updateLayoutOffsets() {
  const header = document.querySelector('header');
  const footer = document.querySelector('footer');
  const shell = document.getElementById('app-shell');
  if (!header || !footer || !shell) return;
  shell.style.paddingTop = header.offsetHeight + 'px';
  shell.style.paddingBottom = footer.offsetHeight + 'px';
}

function initHamburger() {
  const btn = document.getElementById('btn-hamburger');
  const nav = document.getElementById('main-nav');
  const overlay = document.getElementById('nav-overlay');
  if (!btn || !nav) return;

  function openNav() {
    nav.classList.add('nav-open');
    if (overlay) overlay.classList.add('active');
    btn.setAttribute('aria-expanded', 'true');
    btn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
  }
  function closeNav() {
    nav.classList.remove('nav-open');
    if (overlay) overlay.classList.remove('active');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<i class="fa-solid fa-bars"></i>';
  }

  btn.addEventListener('click', e => {
    e.stopPropagation();
    nav.classList.contains('nav-open') ? closeNav() : openNav();
  });

  // Delegación en el nav: captura clic en botón ✕ y en cualquier tab
  nav.addEventListener('click', e => {
    if (e.target.closest('#btn-nav-close')) { closeNav(); return; }
    if (e.target.closest('.tab-btn')) { closeNav(); }
  });

  if (overlay) overlay.addEventListener('click', closeNav);
}

document.addEventListener('DOMContentLoaded', () => {
  updateLayoutOffsets();
  initHamburger();
  initErrorModal();
  window.addEventListener('resize', updateLayoutOffsets);
});

document.addEventListener('DOMContentLoaded', initMusicBtn);

/* ================================================================
   REPORTES — generación de XLSX
================================================================ */
function loadReportesView() {
  const btnExcel = document.getElementById('btn-generar-xlsx');
  if (btnExcel && !btnExcel._wired) {
    btnExcel._wired = true;
    btnExcel.addEventListener('click', generateReportXLSX);
  }
  const btnZip = document.getElementById('btn-generar-zip');
  if (btnZip && !btnZip._wired) {
    btnZip._wired = true;
    btnZip.addEventListener('click', generateAllPDFsZip);
  }
}

function loadSheetJS() {
  return new Promise((resolve, reject) => {
    if (window.XLSX) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = resolve;
    s.onerror = () => reject(new Error('No se pudo cargar la librería de Excel. Verifica tu conexión.'));
    document.head.appendChild(s);
  });
}

function _xlsxSafeSheetName(name, used) {
  let n = name.replace(/[:\\/\[\]*?]/g, '').substring(0, 28).trim() || 'Hoja';
  let final = n, idx = 2;
  while (used.has(final)) { final = `${n} ${idx++}`; }
  used.add(final);
  return final;
}

function _matchEstado(p0, p1, r0, r1, ptsExact, ptsResult) {
  if (p0 === r0 && p1 === r1) return { estado: '✓ Exacto', pts: ptsExact };
  if (Math.sign(p0 - p1) === Math.sign(r0 - r1)) return { estado: '✓ Resultado', pts: ptsResult };
  return { estado: '✗ Fallo', pts: 0 };
}

async function generateReportXLSX() {
  const msgEl = document.getElementById('reportes-msg');
  const btn = document.getElementById('btn-generar-xlsx');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando…';
  msgEl.textContent = 'Cargando librería y datos…';
  msgEl.className = 'admin-msg';

  try {
    await loadSheetJS();

    const [pollaRes, profilesRes, resultsRes] = await Promise.all([
      sb.from('pollas').select('user_id, scores, bracket, bonuses, manual_bonus_pts'),
      sb.from('profiles').select('id, name'),
      sb.from('official_results').select('scores, bracket, bonuses').eq('id', 1).single()
    ]);

    const profiles  = profilesRes.data || [];
    const results   = resultsRes.data || { scores: {}, bracket: {}, bonuses: {} };
    const players   = (pollaRes.data || [])
      .map(p => ({ ...p, name: profiles.find(pr => pr.id === p.user_id)?.name || null }))
      .filter(p => p.name)
      .map(p => ({ ...p, score: calcScore(p, results) }))
      .sort((a, b) => b.score.total - a.score.total || b.score.exact - a.score.exact || a.name.localeCompare(b.name));

    const wb = XLSX.utils.book_new();
    const usedNames = new Set();

    /* ── HOJA 1: Ranking ── */
    const rankRows = [['Pos', 'Nombre', 'Total pts', 'Exactos', 'Solo resultado', 'Bonos']];
    let rank = 1;
    players.forEach((p, i) => {
      if (i > 0 && (p.score.total !== players[i-1].score.total || p.score.exact !== players[i-1].score.exact)) rank = i + 1;
      rankRows.push([rank, p.name, p.score.total, p.score.exact, p.score.result, p.score.bonuses]);
    });
    _appendSheet(wb, rankRows, _xlsxSafeSheetName('Ranking', usedNames));

    /* ── HOJA 2: Grupos (matriz: un partido por fila, columnas por participante) ── */
    const pHeaders = players.flatMap(p => [`${p.name} L`, `${p.name} V`, `${p.name} Pts`]);
    const gruposRows = [['Grupo', 'Fecha', 'Hora', 'Jornada', 'Local', 'Visitante', 'Res L', 'Res V', ...pHeaders]];
    Object.keys(GROUPS).sort().forEach(group => {
      for (let matchIdx = 0; matchIdx < 6; matchIdx++) {
        const jIdx = Math.floor(matchIdx / 2);
        const jornada = JORNADAS[jIdx];
        const pair   = getMatchPair(group, matchIdx);
        const teamA  = GROUPS[group].teams[pair[0]].n;
        const teamB  = GROUPS[group].teams[pair[1]].n;
        const mi     = MATCH_INFO[group]?.[matchIdx];
        const k0 = `${group}-${matchIdx}-0`, k1 = `${group}-${matchIdx}-1`;
        const hasRes = k0 in results.scores && k1 in results.scores;
        const r0 = results.scores[k0] ?? '', r1 = results.scores[k1] ?? '';
        const pCols = players.flatMap(p => {
          const hasPred = k0 in (p.scores || {}) && k1 in (p.scores || {});
          if (!hasPred) return ['', '', ''];
          const p0 = p.scores[k0], p1 = p.scores[k1];
          if (!hasRes) return [p0, p1, ''];
          const { pts } = _matchEstado(p0, p1, results.scores[k0], results.scores[k1], ROUND_PTS.groups.exact, ROUND_PTS.groups.result);
          return [p0, p1, pts];
        });
        gruposRows.push([group, mi?.date || '', mi?.time || '', jornada.label, teamA, teamB, r0, r1, ...pCols]);
      }
    });
    _appendSheet(wb, gruposRows, _xlsxSafeSheetName('Grupos', usedNames));

    /* ── HOJA 3: Eliminatorias (misma estructura matricial) ── */
    const elimHeaders = players.flatMap(p => [`${p.name} L`, `${p.name} V`, `${p.name} Pts`]);
    const elimRows = [['Ronda', 'Partido #', 'Fecha', 'Sede', 'Local', 'Visitante', 'Res L', 'Res V', ...elimHeaders]];

    const addElimRow = (rondaLabel, num, fecha, sede, kt0, kt1, ks0, ks1, ptsExact, ptsResult) => {
      const hasRes = ks0 in results.bracket && ks1 in results.bracket;
      const r0 = hasRes ? Number(results.bracket[ks0]) : '';
      const r1 = hasRes ? Number(results.bracket[ks1]) : '';
      const teamA = results.bracket[kt0] || '';
      const teamB = results.bracket[kt1] || '';
      const pCols = players.flatMap(p => {
        const hasPred = ks0 in (p.bracket || {}) && ks1 in (p.bracket || {});
        if (!hasPred) return ['', '', ''];
        const p0 = Number(p.bracket[ks0]), p1 = Number(p.bracket[ks1]);
        if (!hasRes) return [p0, p1, ''];
        const { pts } = _matchEstado(p0, p1, Number(results.bracket[ks0]), Number(results.bracket[ks1]), ptsExact, ptsResult);
        return [p0, p1, pts];
      });
      elimRows.push([rondaLabel, num, fecha, sede, teamA, teamB, r0, r1, ...pCols]);
    };

    RONDAS.forEach(ronda => {
      const def = ROUND_PTS[ROUND_KEY[ronda.id]];
      for (let i = 0; i < ronda.partidos; i++) {
        const mi = ELIM_MATCH_INFO[ronda.id]?.[i];
        addElimRow(ronda.label, mi?.num || '', mi?.date || '', mi?.venue || '',
          `${ronda.id}-${i}-t0`, `${ronda.id}-${i}-t1`,
          `${ronda.id}-${i}-s0`, `${ronda.id}-${i}-s1`,
          def.exact, def.result);
      }
    });
    addElimRow('3er y 4to Lugar', 103, '18 jul', 'Miami',
      '3rd-t0', '3rd-t1', '3rd-s0', '3rd-s1',
      ROUND_PTS.third.exact, ROUND_PTS.third.result);
    _appendSheet(wb, elimRows, _xlsxSafeSheetName('Eliminatorias', usedNames));

    /* ── HOJA 4: Bonos ── */
    const bonosH = ['Bono', 'Pts', 'Resultado oficial'];
    players.forEach(p => bonosH.push(p.name, '✓', 'Pts'));
    const bonosRows = [bonosH];
    Object.keys(BONUS_PTS).forEach(key => {
      const resVal = results.bonuses?.[key] || '';
      const row = [BONUS_LABELS[key], BONUS_PTS[key], resVal];
      players.forEach(p => {
        const pred = p.bonuses?.[key] || '';
        const mb   = p.manual_bonus_pts?.[key] === true;
        const hit  = mb || checkBonusMatch(pred, resVal);
        row.push(pred, hit ? '✓' : (resVal ? '✗' : '—'), hit ? BONUS_PTS[key] : 0);
      });
      bonosRows.push(row);
    });
    _appendSheet(wb, bonosRows, _xlsxSafeSheetName('Bonos', usedNames));

    /* ── HOJAS POR PARTICIPANTE ── */
    players.forEach(p => {
      const data = [];
      data.push([`${p.name} — Polla Mundialista 2026`]);
      data.push([`Total: ${p.score.total} pts`, `Exactos: ${p.score.exact}`, `Resultado: ${p.score.result}`, `Bonos: ${p.score.bonuses}`]);
      data.push([]);

      // Grupos
      data.push(['FASE DE GRUPOS']);
      data.push(['Grupo', 'Fecha', 'Hora', 'Jornada', 'Local', 'Pred L', 'Pred V', 'Visitante', 'Res L', 'Res V', 'Estado', 'Pts']);
      Object.keys(GROUPS).sort().forEach(group => {
        for (let matchIdx = 0; matchIdx < 6; matchIdx++) {
          const jIdx = Math.floor(matchIdx / 2);
          const jornadaLabel = JORNADAS[jIdx].label;
          const pair  = getMatchPair(group, matchIdx);
          const teamA = GROUPS[group].teams[pair[0]].n;
          const teamB = GROUPS[group].teams[pair[1]].n;
          const mi    = MATCH_INFO[group]?.[matchIdx];
          const k0 = `${group}-${matchIdx}-0`, k1 = `${group}-${matchIdx}-1`;
          const hasRes  = k0 in results.scores && k1 in results.scores;
          const hasPred = k0 in (p.scores || {}) && k1 in (p.scores || {});
          const p0 = hasPred ? p.scores[k0] : '';
          const p1 = hasPred ? p.scores[k1] : '';
          const r0 = hasRes  ? results.scores[k0] : '';
          const r1 = hasRes  ? results.scores[k1] : '';
          let estado = 'Sin predicción', pts = 0;
          if (hasPred && hasRes) ({ estado, pts } = _matchEstado(p.scores[k0], p.scores[k1], results.scores[k0], results.scores[k1], ROUND_PTS.groups.exact, ROUND_PTS.groups.result));
          else if (hasPred) estado = 'Pendiente';
          data.push([group, mi?.date || '', mi?.time || '', jornadaLabel, teamA, p0, p1, teamB, r0, r1, estado, pts]);
        }
      });

      // Eliminatorias
      data.push([]);
      data.push(['ELIMINATORIAS']);
      data.push(['Ronda', 'Partido #', 'Fecha', 'Sede', 'Local', 'Pred L', 'Pred V', 'Visitante', 'Res L', 'Res V', 'Estado', 'Pts']);
      RONDAS.forEach(ronda => {
        const def = ROUND_PTS[ROUND_KEY[ronda.id]];
        for (let i = 0; i < ronda.partidos; i++) {
          const mi   = ELIM_MATCH_INFO[ronda.id]?.[i];
          const kt0  = `${ronda.id}-${i}-t0`, kt1 = `${ronda.id}-${i}-t1`;
          const ks0  = `${ronda.id}-${i}-s0`, ks1 = `${ronda.id}-${i}-s1`;
          const teamA = results.bracket?.[kt0] || p.bracket?.[kt0] || '';
          const teamB = results.bracket?.[kt1] || p.bracket?.[kt1] || '';
          const hasRes  = ks0 in results.bracket && ks1 in results.bracket;
          const hasPred = ks0 in (p.bracket || {}) && ks1 in (p.bracket || {});
          const p0 = hasPred ? Number(p.bracket[ks0]) : '';
          const p1 = hasPred ? Number(p.bracket[ks1]) : '';
          const r0 = hasRes  ? Number(results.bracket[ks0]) : '';
          const r1 = hasRes  ? Number(results.bracket[ks1]) : '';
          let estado = 'Sin predicción', pts = 0;
          if (hasPred && hasRes) ({ estado, pts } = _matchEstado(Number(p.bracket[ks0]), Number(p.bracket[ks1]), Number(results.bracket[ks0]), Number(results.bracket[ks1]), def.exact, def.result));
          else if (hasPred) estado = 'Pendiente';
          data.push([ronda.label, mi?.num || '', mi?.date || '', mi?.venue || '', teamA, p0, p1, teamB, r0, r1, estado, pts]);
        }
      });
      // Tercer lugar
      const thHasPred = '3rd-s0' in (p.bracket || {}) && '3rd-s1' in (p.bracket || {});
      const thHasRes  = '3rd-s0' in results.bracket && '3rd-s1' in results.bracket;
      const t3A = results.bracket?.['3rd-t0'] || p.bracket?.['3rd-t0'] || '';
      const t3B = results.bracket?.['3rd-t1'] || p.bracket?.['3rd-t1'] || '';
      const tp0 = thHasPred ? Number(p.bracket['3rd-s0']) : '';
      const tp1 = thHasPred ? Number(p.bracket['3rd-s1']) : '';
      const tr0 = thHasRes  ? Number(results.bracket['3rd-s0']) : '';
      const tr1 = thHasRes  ? Number(results.bracket['3rd-s1']) : '';
      let thEstado = 'Sin predicción', thPts = 0;
      if (thHasPred && thHasRes) ({ estado: thEstado, pts: thPts } = _matchEstado(tp0, tp1, tr0, tr1, ROUND_PTS.third.exact, ROUND_PTS.third.result));
      else if (thHasPred) thEstado = 'Pendiente';
      data.push(['3er y 4to Lugar', 103, '18 jul', 'Miami', t3A, tp0, tp1, t3B, tr0, tr1, thEstado, thPts]);

      // Bonos
      data.push([]);
      data.push(['BONOS']);
      data.push(['Bono', 'Pts disponibles', 'Tu predicción', 'Resultado oficial', 'Estado', 'Pts obtenidos']);
      Object.keys(BONUS_PTS).forEach(key => {
        const pred   = p.bonuses?.[key] || '—';
        const resVal = results.bonuses?.[key] || '—';
        const mb     = p.manual_bonus_pts?.[key] === true;
        const hit    = mb || (resVal !== '—' && pred !== '—' && checkBonusMatch(pred, resVal));
        const estado = resVal === '—' ? 'Pendiente' : (hit ? '✓ Acertó' : '✗ Falló');
        data.push([BONUS_LABELS[key], BONUS_PTS[key], pred, resVal, estado, hit ? BONUS_PTS[key] : 0]);
      });

      _appendSheet(wb, data, _xlsxSafeSheetName(p.name, usedNames));
    });

    const fecha = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `polla-mundialista-2026-${fecha}.xlsx`);

    msgEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> Archivo generado correctamente';
    msgEl.className = 'admin-msg success';
  } catch (err) {
    msgEl.textContent = 'Error: ' + err.message;
    msgEl.className = 'admin-msg error';
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-file-excel"></i> Generar Excel';
  }
}

function _appendSheet(wb, data, name) {
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), name);
}

function showDeleteConfirmModal(title, msg) {
  return new Promise(resolve => {
    const modal = document.getElementById('delete-confirm-modal');
    document.getElementById('dcm-title').textContent = title;
    document.getElementById('dcm-msg').textContent = msg;
    modal.classList.remove('hidden');

    const onConfirm = () => { cleanup(); resolve(true); };
    const onCancel  = () => { cleanup(); resolve(false); };

    function cleanup() {
      modal.classList.add('hidden');
      document.getElementById('btn-dcm-confirm').removeEventListener('click', onConfirm);
      document.getElementById('btn-dcm-cancel').removeEventListener('click', onCancel);
      modal.removeEventListener('click', onOverlay);
    }
    function onOverlay(e) { if (e.target === modal) onCancel(); }

    document.getElementById('btn-dcm-confirm').addEventListener('click', onConfirm);
    document.getElementById('btn-dcm-cancel').addEventListener('click', onCancel);
    modal.addEventListener('click', onOverlay);
  });
}

function showErrorModal(msg, title = 'Error') {
  const modal = document.getElementById('error-modal');
  document.getElementById('error-modal-title').textContent = title;
  document.getElementById('error-modal-msg').textContent = msg;
  modal.classList.remove('hidden');
}

function initErrorModal() {
  document.getElementById('btn-error-modal-close')?.addEventListener('click', () => {
    document.getElementById('error-modal').classList.add('hidden');
  });
  document.getElementById('error-modal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
  });
}

/* ================================================================
   UTILS
================================================================ */
function scoreKey(group, match, side) { return `${group}-${match}-${side}`; }
function flag(t) { return `<span class="fi fi-${t.code}"></span>`; }

/* Map team display name → country code for flag lookup */
const _teamCodeMap = (() => {
  const m = {};
  Object.values(GROUPS).forEach(g => g.teams.forEach(t => { m[t.n] = t.code; }));
  return m;
})();
function flagByName(name) {
  const code = _teamCodeMap[name];
  return code ? `<span class="fi fi-${code}"></span>` : '';
}

/* ================================================================
   BATCH PDF GENERATION AND COMPRESSION (ZIP)
================================================================ */
function loadPdfZipLibraries() {
  return new Promise((resolve, reject) => {
    if (window.JSZip && window.html2pdf) { resolve(); return; }
    let count = 0;
    const checkDone = () => {
      count++;
      if (count === 2) resolve();
    };
    
    if (!window.JSZip) {
      const s1 = document.createElement('script');
      s1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      s1.onload = checkDone;
      s1.onerror = () => reject(new Error('No se pudo cargar JSZip.'));
      document.head.appendChild(s1);
    } else {
      checkDone();
    }
    
    if (!window.html2pdf) {
      const s2 = document.createElement('script');
      s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      s2.onload = checkDone;
      s2.onerror = () => reject(new Error('No se pudo cargar html2pdf.'));
      document.head.appendChild(s2);
    } else {
      checkDone();
    }
  });
}

async function generateAllPDFsZip() {
  const btn = document.getElementById('btn-generar-zip');
  const msgEl = document.getElementById('reportes-zip-msg');
  const modal = document.getElementById('pdf-progress-modal');
  const pText = document.getElementById('pdf-progress-text');
  const pBar = document.getElementById('pdf-progress-bar');
  
  if (!btn || !msgEl || !modal || !pText || !pBar) return;
  
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando ZIP...';
  msgEl.textContent = '';
  msgEl.className = 'admin-msg';
  
  // Mostrar modal de progreso
  modal.classList.remove('hidden');
  pText.textContent = 'Cargando librerías necesarias...';
  pBar.style.width = '0%';
  
  let originalFlag, originalFlagByName;
  
  try {
    // 1. Cargar librerías
    await loadPdfZipLibraries();
    
    // Redefinir dinámicamente para usar FlagCDN (CORS abierto y compatible con html2canvas)
    originalFlag = flag;
    originalFlagByName = flagByName;
    
    flag = function(t) {
      return `<img src="https://flagcdn.com/w40/${t.code}.png" style="width: 20px; height: 15px; vertical-align: middle; margin-right: 6px; border-radius: 2px; display: inline-block;">`;
    };
    flagByName = function(name) {
      const code = _teamCodeMap[name];
      return code ? `<img src="https://flagcdn.com/w40/${code}.png" style="width: 20px; height: 15px; vertical-align: middle; margin-right: 6px; border-radius: 2px; display: inline-block;">` : '';
    };
    
    pText.textContent = 'Consultando base de datos de participantes...';
    pBar.style.width = '5%';
    
    // 2. Obtener resultados oficiales para comparar bonos
    const offRes = await sb.from('official_results').select('*').eq('id', 1).single();
    if (offRes.error) throw offRes.error;
    const results = offRes.data || {};
    
    // 3. Obtener perfiles de usuarios
    const profilesRes = await sb.from('profiles').select('id, name').order('name', { ascending: true });
    if (profilesRes.error) throw profilesRes.error;
    const users = profilesRes.data || [];
    
    // 4. Obtener todas las pollas
    const pollasRes = await sb.from('pollas').select('*');
    if (pollasRes.error) throw pollasRes.error;
    const pollas = pollasRes.data || [];
    
    if (users.length === 0) {
      throw new Error('No hay participantes registrados.');
    }
    
    const zip = new JSZip();
    const tempContainer = document.getElementById('pdf-temp-container');
    if (!tempContainer) throw new Error('No se encontró el contenedor de plantilla PDF.');
    
    // Hacer visible temporalmente para que html2pdf y el DOM computen la geometría y alturas
    tempContainer.style.display = 'block';
    
    // 5. Generar PDF para cada participante
    // TEMPORAL: Limitado a 2 participantes para realizar pruebas rápidas
    for (let i = 0; i < 2; i++) {
      const u = users[i];
      const p = pollas.find(x => x.user_id === u.id) || {};
      const nombre = u.name || u.player || 'Participante sin nombre';
      
      const pct = Math.floor(5 + (i / users.length) * 90);
      pText.textContent = `Procesando polla ${i + 1} de ${users.length}: ${nombre}`;
      pBar.style.width = `${pct}%`;
      
      // Limpiar contenedor e inyectar datos del participante
      document.getElementById('pdf-temp-subtitle').textContent = nombre;
      
      // Mostrar resumen de puntos si los tiene
      const ptsRes = calcScore(p, results);
      document.getElementById('pdf-temp-scores-summary').textContent = `Puntos Totales: ${ptsRes.total}`;
      
      // Renderizar secciones
      renderGroupsReadonly(p.scores || {}, 'pdf-temp-grupos');
      renderBracketReadonly(p.bracket || {}, 'pdf-temp-bracket', 'pdf-temp-champion');
      renderBonusesReadonly(p.bonuses || {}, results.bonuses || {}, p.manual_bonus_pts || {}, u.id, 'pdf-temp-bonos');
      
      // Esperar 100ms para asegurar que el navegador actualice los nodos del DOM
      await new Promise(r => setTimeout(r, 100));

      // Generar PDF en memoria
      const opt = {
        margin:       [6, 6],
        filename:     `${nombre}.pdf`,
        image:        { type: 'jpeg', quality: 0.95 },
        html2canvas:  { 
          scale: 1.5, 
          useCORS: true, 
          backgroundColor: '#0D1B2A',
          width: 1024
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { 
          mode: ['avoid-all', 'css'], 
          avoid: ['.group-card', '.bonus-group', '.round-header', '.champion-box']
        }
      };
      
      const pdfBuffer = await html2pdf().from(tempContainer).set(opt).outputPdf('arraybuffer');

      // Sanitizar el nombre del archivo
      const cleanName = nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      zip.file(`polla-mundialista-2026-${cleanName}.pdf`, pdfBuffer);
      
      // Espera corta para no congelar el UI del navegador
      await new Promise(r => setTimeout(r, 60));
    }
    
    pText.textContent = 'Comprimiendo todos los PDFs en archivo ZIP...';
    pBar.style.width = '96%';
    await new Promise(r => setTimeout(r, 200));
    
    // 6. Generar ZIP y descargar
    const content = await zip.generateAsync({ type: 'blob' });
    const fecha = new Date().toISOString().slice(0, 10);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `pollas-completas-mundial2026-${fecha}.zip`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    pBar.style.width = '100%';
    pText.textContent = '¡ZIP completado!';
    
    msgEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> Archivo ZIP descargado correctamente';
    msgEl.className = 'admin-msg success';
    
    setTimeout(() => { modal.classList.add('hidden'); }, 1500);
    
  } catch (err) {
    console.error(err);
    msgEl.textContent = 'Error: ' + err.message;
    msgEl.className = 'admin-msg error';
    modal.classList.add('hidden');
  } finally {
    // Restaurar funciones de banderas originales
    if (typeof originalFlag !== 'undefined') flag = originalFlag;
    if (typeof originalFlagByName !== 'undefined') flagByName = originalFlagByName;

    // Ocultar de nuevo la plantilla temporal
    const tempContainer = document.getElementById('pdf-temp-container');
    if (tempContainer) tempContainer.style.display = 'none';

    // Vaciar contenedores temporales y habilitar botón
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-file-zipper"></i> Generar ZIP de PDFs';
  }
}
