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
    { date: '15 jun', time: '23:00', venue: "Levi's Stadium, San Francisco" },
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

/* ================================================================
   INIT
================================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  initLoginUI();
  initRouter();        // hashchange listener + render initial public view

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
  } else if (hash === '#reglamento') {
    showView('view-reglamento');
    setActiveTab('#reglamento');
  } else if (hash === '#admin' && CURRENT_USER?.is_admin) {
    showView('view-admin');
    setActiveTab('#admin');
    loadAdminResultsEditor();
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
  renderTodayMatches();
  renderUpcomingMatches();
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

function renderTodayMatches() {
  const today = new Date();
  const todayDay = today.getDate();
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
    return `
<div class="today-card${cardClass}">
  <div class="today-card-top">
    <span class="today-group-badge">Grupo ${m.group}</span>
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
      b.score.total   - a.score.total   ||
      b.score.exact   - a.score.exact   ||
      b.score.result  - a.score.result  ||
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
        p.score.total   === prev.score.total   &&
        p.score.exact   === prev.score.exact   &&
        p.score.result  === prev.score.result  &&
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
  // Orden visual: 4°, 2°, 1°, 3°, 5°
  const podiumPositions = [3, 1, 0, 2, 4];
  podiumWrap.innerHTML = podiumPositions
    .filter(i => scored[i])
    .map(i => {
      const p = scored[i];
      const rank = p._rank;
      const isTied = scored.filter(s => s._rank === rank).length > 1;
      const medalIcon = rank <= 3 ? MEDALS[rank - 1] : null;
      const icon = medalIcon
        ? `<div class="podium-medal">${medalIcon}${isTied ? '<span class="podium-tie-label"> =</span>' : ''}</div>`
        : `<div class="podium-pos">${rank}°${isTied ? ' =' : ''}</div>`;
      const trophy = rank === 1
        ? `<img src="./assets/trophy_only.svg" alt="Trofeo" class="podium-trophy">`
        : '';
      return `
<div class="podium-step pos-${rank}">
  ${trophy}
  ${icon}
  <div class="podium-name">${p.name}</div>
  <div class="podium-pts">${p.score.total} pts</div>
</div>`;
    }).join('');

  tableWrap.classList.remove('hidden');
  tbody.innerHTML = scored.map(p => {
    const rank = p._rank;
    const isTied = scored.filter(s => s._rank === rank).length > 1;
    return `
<tr class="${rank === 1 ? 'rank-first' : ''}">
  <td class="rank-pos">${rank}${isTied ? '<span class="tie-eq"> =</span>' : ''}</td>
  <td class="rank-name"><a href="#ver/${encodeURIComponent(p.name)}">${p.name}</a></td>
  <td class="rank-pts">${p.score.total}</td>
</tr>`;
  }).join('');
}

/* ================================================================
   PRÓXIMOS PARTIDOS
================================================================ */
function renderUpcomingMatches() {
  const grid = document.getElementById('upcoming-grid');
  if (!grid) return;

  const now = new Date();
  const todayDay = now.getDate();
  const todayMon = now.getMonth() + 1;

  const all = [];

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
    return `${dateHeader}
<div class="upcoming-card">
  <span class="upcoming-group">Grupo ${m.group}</span>
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
        const textHit = pVal != null && String(pVal).toLowerCase() === String(oficial).toLowerCase();
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
        : aciertos.map(p => `<span class="bgc-winner"><i class="fa-solid fa-medal"></i> ${p.name}</span>`).join('')
      }
  </div>
</div>`;
  }).join('');

  section.classList.remove('hidden');
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

  // Más recientes primero, máximo 10
  completedMatches.sort((a, b) => b.sortKey - a.sortKey || b.time.localeCompare(a.time));
  const recent = completedMatches.slice(0, 10);

  if (recent.length === 0) {
    grid.innerHTML = '<p class="section-placeholder">No hay partidos con resultado oficial aún.</p>';
    section.classList.remove('hidden');
    return;
  }

  grid.innerHTML = recent.map(m => `
<div class="mpc-card">
  <div class="mpc-header">
    <span class="mpc-group">Grupo ${m.group}</span>
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
      : m.earners.map(e => `<span class="mpc-earner">${e.name} <strong>+${e.pts}</strong></span>`).join('')
    }
  </div>
</div>`).join('');

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
    const textMatch = rb[key] && pb[key] && rb[key].trim().toLowerCase() === pb[key].trim().toLowerCase();
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
  document.getElementById('btn-back-home').addEventListener('click', () => {
    location.hash = '#home';
  }, { once: true });

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
      return `
<div class="bracket-match${isFin ? ' is-final' : ''}">
  ${metaHTML}
  <div class="bm-row${winner === 't0' ? ' winner' : ''}">
    <input type="text"   class="bm-team"  value="${bracket[kt0] || ''}" placeholder="${ph0}" disabled>
    <input type="number" class="bm-score" value="${bracket[ks0] || ''}" disabled placeholder="0">
  </div>
  <div class="bm-row${winner === 't1' ? ' winner' : ''}">
    <input type="text"   class="bm-team"  value="${bracket[kt1] || ''}" placeholder="${ph1}" disabled>
    <input type="number" class="bm-score" value="${bracket[ks1] || ''}" disabled placeholder="0">
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

function renderBonusesReadonly(playerBonuses, resultBonuses, manualBonusPts, participantUserId) {
  const grid = document.getElementById('bonuses-grid-ver');
  if (!grid) return;
  const isAdmin = !!CURRENT_USER?.is_admin;
  const mb = manualBonusPts || {};

  grid.innerHTML = BONUS_GROUPS.map(group => {
    const rows = group.keys.map(key => {
      const pVal = playerBonuses[key] || '—';
      const rVal = resultBonuses[key] || '';
      const textHit = rVal && pVal !== '—' && rVal.trim().toLowerCase() === pVal.trim().toLowerCase();
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
  const matches = Array.from({ length: ronda.partidos }, (_, i) => {
    const ph0 = ronda.placeholders[i * 2] || `Eq. ${i * 2 + 1}`;
    const ph1 = ronda.placeholders[i * 2 + 1] || `Eq. ${i * 2 + 2}`;
    const kt0 = `${ronda.id}-${i}-t0`, kt1 = `${ronda.id}-${i}-t1`;
    const ks0 = `${ronda.id}-${i}-s0`, ks1 = `${ronda.id}-${i}-s1`;
    const isFin = ronda.id === 'fin';
    const winner = detectWinner(ronda.id, i);
    const metaHTML = getMatchMetaHTML(ronda.id, i);

    // Check if admin has set BOTH teams for this match
    const offT0 = _officialBracket[kt0];
    const offT1 = _officialBracket[kt1];
    const matchReady = offT0 && offT1; // only enable scores when both teams are set

    // Team display: fixed label with flag when admin set, or locked placeholder when not
    const teamHTML0 = offT0
      ? `<span class="bm-team bm-team-fixed" data-key="${kt0}">${flagByName(offT0)} ${offT0}</span>`
      : `<span class="bm-team bm-team-locked" data-key="${kt0}">${ph0}</span>`;
    const teamHTML1 = offT1
      ? `<span class="bm-team bm-team-fixed" data-key="${kt1}">${flagByName(offT1)} ${offT1}</span>`
      : `<span class="bm-team bm-team-locked" data-key="${kt1}">${ph1}</span>`;

    // Sync admin teams into participant state so scoring works
    if (offT0) STATE.bracket[kt0] = offT0;
    if (offT1) STATE.bracket[kt1] = offT1;

    // Score inputs: editable only if both teams are set by admin
    const scoreVal0 = STATE.bracket[ks0] || '';
    const scoreVal1 = STATE.bracket[ks1] || '';
    const scoreHTML0 = matchReady
      ? `<input type="number" class="bm-score" data-key="${ks0}" value="${scoreVal0}" min="0" max="99" placeholder="0">`
      : `<input type="number" class="bm-score" value="" disabled placeholder="-">`;
    const scoreHTML1 = matchReady
      ? `<input type="number" class="bm-score" data-key="${ks1}" value="${scoreVal1}" min="0" max="99" placeholder="0">`
      : `<input type="number" class="bm-score" value="" disabled placeholder="-">`;

    return `
<div class="bracket-match${isFin ? ' is-final' : ''}${!matchReady ? ' bm-pending' : ''}">
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

  return `
<div class="bracket-round">
  <div class="bracket-round-title">${ronda.label}</div>
  <div class="bracket-matches-col">${matches}</div>
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

  const off3T0 = _officialBracket['3rd-t0'];
  const off3T1 = _officialBracket['3rd-t1'];
  const thirdReady = off3T0 && off3T1; // both teams must be set

  // Replace team inputs with fixed labels (with flag) or locked placeholders
  ['3rd-t0', '3rd-t1'].forEach((key, idx) => {
    const offVal = _officialBracket[key];
    const inp = thirdMatch.querySelector(`input.bm-team[data-key="${key}"]`);
    if (!inp) return;

    if (offVal) {
      STATE.bracket[key] = offVal;
      const span = document.createElement('span');
      span.className = 'bm-team bm-team-fixed';
      span.dataset.key = key;
      span.innerHTML = `${flagByName(offVal)} ${offVal}`;
      inp.replaceWith(span);
    } else {
      // No admin team → lock the input
      const span = document.createElement('span');
      span.className = 'bm-team bm-team-locked';
      span.dataset.key = key;
      span.textContent = idx === 0 ? 'Perdedor Semifinal 1' : 'Perdedor Semifinal 2';
      inp.replaceWith(span);
    }
  });

  // Score inputs: enable only if both teams set
  thirdMatch.querySelectorAll('input.bm-score[data-key]').forEach(inp => {
    if (!thirdReady) {
      inp.disabled = true;
      inp.placeholder = '-';
      inp.value = '';
    } else {
      if (STATE.bracket[inp.dataset.key] !== undefined) inp.value = STATE.bracket[inp.dataset.key];
      inp.removeEventListener('input', onThirdInput);
      inp.addEventListener('input', onThirdInput);
    }
  });
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

const INAUGURAL_TEAMS = [
  { code: 'mx', n: 'México' },
  { code: 'za', n: 'Sudáfrica' },
];

// ⚠️ Actualizar con la nómina oficial convocada al Mundial 2026
const COLOMBIA_SQUAD = [
  'Álvaro Montero', 'Camilo Vargas', 'Kevin Mier',
  'Andrés Mora', 'Carlos Cuesta', 'Daniel Muñoz', 'Dávinson Sánchez',
  'Johan Mojica', 'Jhon Lucumí', 'Nicolás Muñoz', 'Yerry Mina',
  'James Rodríguez', 'Jefferson Lerma', 'Jhon Arias', 'Kevin Castaño',
  'Mateus Uribe', 'Richard Ríos', 'Wilmar Barrios',
  'Carlos Bacca', 'Cucho Hernández', 'Falcao García', 'Jhon Córdoba',
  'John Jader Durán', 'Luis Díaz', 'Miguel Borja', 'Rafael Santos Borré',
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
  const origPlaceholder = picker.querySelector('.tp-name')?.textContent || 'Seleccionar';

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

    list.innerHTML = clearHTML + filtered.map(t =>
      `<div class="tp-option" data-name="${t.n}" data-code="${t.code}">
         <span class="fi fi-${t.code}"></span> ${t.n}
       </div>`
    ).join('');

    const clearBtn = list.querySelector('.tp-option-clear');
    if (clearBtn) clearBtn.addEventListener('click', clearPicker);

    list.querySelectorAll('.tp-option:not(.tp-option-clear)').forEach(opt =>
      opt.addEventListener('click', () => {
        _setTeamPickerValue(picker, opt.dataset.name, teams);
        picker.querySelector('.team-picker-dropdown').classList.add('hidden');
        picker.classList.remove('open');
        ADMIN_RESULTS.bonuses[bonusKey] = opt.dataset.name;
      })
    );
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
  if (val) _setTeamPickerValue(picker, val, teams);
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
  document.getElementById('btn-export-pdf')?.addEventListener('click', exportGroupsPDF);

  document.getElementById('btn-lock-polla')?.addEventListener('click', lockPolla);

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
  const slug = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  a.href = url; a.download = `${slug}.json`; a.click();
  URL.revokeObjectURL(url);
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

  const [pollaRes, resultsRes] = await Promise.all([
    sb.from('pollas').select('scores, bracket, bonuses, is_groups_locked').eq('user_id', CURRENT_USER.id).single(),
    sb.from('official_results').select('bracket').eq('id', 1).single()
  ]);

  if (pollaRes.data) {
    STATE.scores = pollaRes.data.scores || {};
    STATE.bracket = pollaRes.data.bracket || {};
    STATE.bonuses = pollaRes.data.bonuses || {};
    STATE.player = CURRENT_USER.name;
    IS_GROUPS_LOCKED = pollaRes.data.is_groups_locked || false;
    try { localStorage.setItem(LS_DRAFT, JSON.stringify(STATE)); } catch (_) { }
  }

  const resultsBracket = resultsRes.data?.bracket || {};
  _officialBracket = resultsBracket;   // store for participant pre-fill
  const hasOfficialBracketInfo = Object.keys(resultsBracket).length > 0;
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
    sb.from('pollas').select('user_id, is_groups_locked, scores, bonuses'),
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
        locked: polla?.is_groups_locked || false,
        hasPolla: !!polla,
        hasData: !!hasData,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));

  function statusTag(p) {
    if (p.locked) return ['pc-locked', '<i class="fa-solid fa-lock"></i> Enviada'];
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
<a class="participante-card" href="#ver/${encodeURIComponent(p.name)}">
  <span class="pc-name">${p.name}</span>
  <span class="pc-status ${cls}">${label}</span>
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
  }

  renderAdminGroups();
  renderAdminBracket();
  renderAdminBonuses();
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
    updated_at: new Date().toISOString(),
  });
  msgEl.textContent = error ? 'Error: ' + error.message : '<i class="fa-solid fa-circle-check"></i> Guardado';
  if (!error) msgEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> Guardado';
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
  const playerTab = document.getElementById('tab-btn-bracket');
  if (playerTab) {
    playerTab.classList.toggle('hidden', !hasOfficialBracketInfo);
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
   MÚSICA — YouTube IFrame API (segmento 0:10 – 0:42 en loop)
================================================================ */
const MUSIC_VIDEO_ID = 'fcnDmrtj6Sk';
const MUSIC_START = 11;
const MUSIC_END = 52;

let _ytPlayer = null;
let _musicOn = false;
let _ytReady = false;
let _unmutedOnce = false;

// Llamado automáticamente por la YouTube IFrame API cuando carga
window.onYouTubeIframeAPIReady = function () {
  _ytPlayer = new YT.Player('yt-player', {
    height: '1', width: '1',
    videoId: MUSIC_VIDEO_ID,
    playerVars: {
      autoplay: 1, mute: 1, controls: 0, disablekb: 1,
      fs: 0, modestbranding: 1, rel: 0,
      start: MUSIC_START, end: MUSIC_END,
    },
    events: {
      onReady: (e) => {
        _ytReady = true;
        _musicOn = true;
        e.target.mute();
        e.target.playVideo();
      },
      onStateChange: (e) => {
        // Loop: cuando termina el segmento, vuelve al segundo 10
        if (e.data === YT.PlayerState.ENDED && _musicOn) {
          _ytPlayer.seekTo(MUSIC_START, true);
          _ytPlayer.playVideo();
        }
      },
    },
  });
};

// Al primer clic en cualquier parte de la página → desmutear
function _handleFirstInteraction() {
  if (_unmutedOnce) return;
  _unmutedOnce = true;
  document.removeEventListener('click', _handleFirstInteraction);
  if (_ytReady && _musicOn) {
    _ytPlayer.unMute();
    _setMusicIcon(true);
  }
}

function _setMusicIcon(on) {
  const btn = document.getElementById('btn-music');
  if (!btn) return;
  btn.querySelector('.music-off').classList.toggle('hidden', on);
  btn.querySelector('.music-on').classList.toggle('hidden', !on);
  btn.title = on ? 'Silenciar música' : 'Activar música';
}

function initMusicBtn() {
  document.addEventListener('click', _handleFirstInteraction);

  const btn = document.getElementById('btn-music');
  btn.addEventListener('click', (e) => {
    e.stopPropagation(); // no contar este clic como "primera interacción" dos veces
    if (!_ytReady) return;

    _musicOn = !_musicOn;
    _setMusicIcon(_musicOn && _unmutedOnce);

    if (_musicOn) {
      _ytPlayer.unMute();
      _ytPlayer.seekTo(MUSIC_START, true);
      _ytPlayer.playVideo();
      _unmutedOnce = true;
      document.removeEventListener('click', _handleFirstInteraction);
    } else {
      _ytPlayer.mute();
      _ytPlayer.pauseVideo();
    }
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
