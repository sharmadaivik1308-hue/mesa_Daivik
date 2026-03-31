/**
 * Mesa Documentation Site — script.js
 * Handles: theme toggle, navbar scroll, hamburger menu,
 *          copy-to-clipboard, collapsibles, agent grid animation,
 *          smooth scroll active links, back-to-top button.
 */

/* ============================================================
   1. THEME TOGGLE
   ============================================================ */
const themeToggle = document.getElementById('themeToggle');
const themeIcon   = themeToggle?.querySelector('.theme-icon');
const html        = document.documentElement;

function applyTheme(theme) {
  html.setAttribute('data-theme', theme);
  if (themeIcon) themeIcon.textContent = theme === 'dark' ? '☀' : '☾';
  localStorage.setItem('mesa-theme', theme);
}

// Load saved theme (or default dark)
(function () {
  const saved = localStorage.getItem('mesa-theme') || 'dark';
  applyTheme(saved);
})();

themeToggle?.addEventListener('click', () => {
  const current = html.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

/* ============================================================
   2. NAVBAR — scroll shadow + active link highlighting
   ============================================================ */
const navbar   = document.getElementById('navbar');
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

function updateNavbar() {
  const scrolled = window.scrollY > 20;
  navbar?.classList.toggle('scrolled', scrolled);
}

function updateActiveLink() {
  let currentId = '';
  sections.forEach(section => {
    const top = section.offsetTop - 100;
    if (window.scrollY >= top) {
      currentId = section.id;
    }
  });

  navLinks.forEach(link => {
    const href = link.getAttribute('href')?.replace('#', '');
    link.classList.toggle('active', href === currentId);
  });
}

window.addEventListener('scroll', () => {
  updateNavbar();
  updateActiveLink();
  updateBackToTop();
}, { passive: true });

updateNavbar();

/* ============================================================
   3. HAMBURGER MENU (mobile)
   ============================================================ */
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');

hamburger?.addEventListener('click', () => {
  const isOpen = mobileNav?.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
});

// Close mobile nav on link click
document.querySelectorAll('.mobile-link').forEach(link => {
  link.addEventListener('click', () => {
    mobileNav?.classList.remove('open');
    hamburger?.setAttribute('aria-expanded', 'false');
  });
});

/* ============================================================
   4. COPY-TO-CLIPBOARD
   ============================================================ */
document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const pre  = btn.closest('.code-block')?.querySelector('pre');
    const text = pre?.textContent?.trim() || '';

    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = '✓ Copied';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = 'Copy';
        btn.classList.remove('copied');
      }, 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity  = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      btn.textContent = '✓ Copied';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = 'Copy';
        btn.classList.remove('copied');
      }, 2000);
    }
  });
});

/* ============================================================
   5. COLLAPSIBLE SECTIONS
   ============================================================ */
document.querySelectorAll('.collapsible-trigger').forEach(trigger => {
  trigger.addEventListener('click', () => {
    const item    = trigger.closest('.collapsible-item');
    const isOpen  = item?.classList.contains('open');

    // Close all siblings
    trigger.closest('.example-explanations')
           ?.querySelectorAll('.collapsible-item')
           .forEach(el => el.classList.remove('open'));

    // Toggle clicked
    if (!isOpen) item?.classList.add('open');
  });
});

/* ============================================================
   6. BACK TO TOP
   ============================================================ */
const backToTop = document.getElementById('backToTop');

function updateBackToTop() {
  backToTop?.classList.toggle('visible', window.scrollY > 400);
}

backToTop?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ============================================================
   7. AGENT GRID ANIMATION (hero)
   ============================================================ */
(function initAgentGrid() {
  const grid = document.getElementById('agentGrid');
  if (!grid) return;

  const COLS    = 12;
  const ROWS    = 10;
  const N       = COLS * ROWS;
  const dots    = [];

  // Build dots
  for (let i = 0; i < N; i++) {
    const d = document.createElement('div');
    d.className = 'agent-dot';
    grid.appendChild(d);
    dots.push(d);
  }

  // Initial wealth: all 1
  const wealth = new Array(N).fill(1);

  // Mark classes based on wealth
  function applyClasses() {
    const max = Math.max(...wealth);
    dots.forEach((d, i) => {
      d.classList.remove('active', 'rich', 'poor');
      if (wealth[i] === 0) {
        d.classList.add('poor');
      } else if (wealth[i] >= max * 0.6 && max > 1) {
        d.classList.add('rich');
      } else if (wealth[i] > 0) {
        d.classList.add('active');
      }
    });
  }

  // Simulate one step of money transfer
  function simulateStep() {
    // Pick ~15% of agents to act this tick (for performance)
    const actors = shuffle([...Array(N).keys()]).slice(0, Math.floor(N * 0.15));

    actors.forEach(i => {
      if (wealth[i] === 0) return;
      const j = Math.floor(Math.random() * N);
      if (j !== i) {
        wealth[i] -= 1;
        wealth[j] += 1;
      }
    });

    applyClasses();
  }

  applyClasses();

  // Run simulation every 350ms
  setInterval(simulateStep, 350);
})();

// Fisher-Yates shuffle (used in agent grid)
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ============================================================
   8. SCROLL-TRIGGERED FADE-IN (subtle entrance animations)
   ============================================================ */
(function initFadeIn() {
  const targets = document.querySelectorAll(
    '.concept-card, .use-case-card, .flow-step, .viz-card, ' +
    '.contribute-card, .resource-card, .install-step, ' +
    '.collapsible-item'
  );

  if (!('IntersectionObserver' in window)) return;

  // Inject keyframe styles once
  const style = document.createElement('style');
  style.textContent = `
    .fade-target {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.5s ease, transform 0.5s ease;
    }
    .fade-target.visible {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);

  // Stagger by index in parent
  targets.forEach(el => {
    el.classList.add('fade-target');
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Stagger siblings for a cascade effect
        const siblings = [...(entry.target.parentElement?.children || [])];
        const index    = siblings.indexOf(entry.target);
        entry.target.style.transitionDelay = `${index * 60}ms`;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(el => observer.observe(el));
})();

/* ============================================================
   9. SMOOTH SCROLLING (belt-and-suspenders for older browsers)
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href') || '');
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ============================================================
   10. INTERACTIVE ABM SIMULATION
   ============================================================ */
(function () {

  /* ── Constants ── */
  const GRID_N     = 10;    // grid is GRID_N × GRID_N
  const CELL_PX    = 46;    // must match .sim-grid cell size in CSS
  const NUM_AGENTS = 8;

  /* Speed presets: label → { interval ms, animation duration ms } */
  const SPEEDS = {
    slow:   { interval: 800,  anim: 520 },
    medium: { interval: 420,  anim: 280 },
    fast:   { interval: 140,  anim: 100 },
  };

  /* Agent palette — 8 distinct colours */
  const AGENT_COLORS = [
    '#3B8BD4', '#1D9E75', '#D85A30', '#D4537E',
    '#7F77DD', '#BA7517', '#E24B4A', '#639922',
  ];

  /* Moore neighbourhood (8 directions) */
  const DIRS = [
    [-1,-1],[-1,0],[-1,1],
    [ 0,-1],       [ 0,1],
    [ 1,-1],[ 1,0],[ 1,1],
  ];

  /* ── Mutable state ── */
  let cells     = [];   // 2-D array: { el, agent|null }
  let agents    = [];   // array: { el, r, c, id }
  let stepCount = 0;
  let running   = false;
  let runTimer  = null;
  let speed     = 'medium';   // current speed key

  /* ── DOM refs ── */
  const gridEl     = document.getElementById('simGrid');
  const overlayEl  = document.getElementById('simOverlay');
  const stepEl     = document.getElementById('s-step');
  const badgeEl    = document.getElementById('sim-badge');
  const runBtn     = document.getElementById('sim-run-btn');

  /* Guard: skip if simulation markup is absent */
  if (!gridEl || !overlayEl) return;

  /* ─────────────────────────────────────────────
     GRID
  ───────────────────────────────────────────── */
  function buildGrid() {
    gridEl.innerHTML = '';
    cells = [];
    for (let r = 0; r < GRID_N; r++) {
      cells[r] = [];
      for (let c = 0; c < GRID_N; c++) {
        const el = document.createElement('div');
        el.className = 'sim-cell';
        gridEl.appendChild(el);
        cells[r][c] = { el, agent: null };
      }
    }
  }

  /* ─────────────────────────────────────────────
     AGENTS
  ───────────────────────────────────────────── */
  function spawnAgents() {
    overlayEl.innerHTML = '';
    agents = [];

    /* Reset occupancy map */
    for (let r = 0; r < GRID_N; r++)
      for (let c = 0; c < GRID_N; c++)
        cells[r][c].agent = null;

    /* Pick NUM_AGENTS unique random positions */
    const taken = new Set();
    while (agents.length < NUM_AGENTS) {
      const r = Math.floor(Math.random() * GRID_N);
      const c = Math.floor(Math.random() * GRID_N);
      const key = r + ',' + c;
      if (taken.has(key)) continue;
      taken.add(key);

      const el = document.createElement('div');
      el.className = 'sim-agent';
      el.style.background = AGENT_COLORS[agents.length % AGENT_COLORS.length];
      el.textContent = agents.length + 1;

      /* Start with no transition so reset is instant */
      el.style.transition = 'none';
      const { x, y } = cellXY(r, c);
      el.style.left = x + 'px';
      el.style.top  = y + 'px';

      overlayEl.appendChild(el);

      const agent = { el, r, c, id: agents.length };
      agents.push(agent);
      cells[r][c].agent = agent;
    }

    /* Re-enable transitions after a paint so they don't fire on spawn */
    requestAnimationFrame(() => {
      applyAnimationDuration();
    });
  }

  /* Pixel top-left of agent slot inside a cell (centred) */
  function cellXY(r, c) {
    const inset = (CELL_PX - 30) / 2;   // 30px = agent diameter
    return { x: c * CELL_PX + inset, y: r * CELL_PX + inset };
  }

  /* Sync CSS transition duration on all agents to current speed */
  function applyAnimationDuration() {
    const dur = SPEEDS[speed].anim;
    agents.forEach(a => {
      a.el.style.transition =
        `left ${dur}ms cubic-bezier(0.4,0,0.2,1),` +
        `top  ${dur}ms cubic-bezier(0.4,0,0.2,1),` +
        `transform 0.15s ease, box-shadow 0.15s ease`;
    });
    /* Also write to CSS var so future spawns inherit it */
    document.documentElement.style.setProperty('--sim-anim-dur', dur + 'ms');
  }

  /* ─────────────────────────────────────────────
     MOVEMENT
  ───────────────────────────────────────────── */
  function moveAgent(agent) {
    const dirs = DIRS.slice().sort(() => Math.random() - 0.5);

    for (const [dr, dc] of dirs) {
      const nr = agent.r + dr;
      const nc = agent.c + dc;

      if (nr < 0 || nr >= GRID_N || nc < 0 || nc >= GRID_N) continue;
      if (cells[nr][nc].agent !== null) continue;

      /* Vacate old cell */
      cells[agent.r][agent.c].agent = null;

      /* Update state */
      agent.r = nr;
      agent.c = nc;
      cells[nr][nc].agent = agent;

      /* Smooth position update — CSS transition does the work */
      const { x, y } = cellXY(nr, nc);
      agent.el.style.left = x + 'px';
      agent.el.style.top  = y + 'px';

      /* Pop scale on move */
      agent.el.classList.remove('moved');
      void agent.el.offsetWidth;        // force reflow to re-trigger animation
      agent.el.classList.add('moved');

      /* Cell landing flash */
      const cell = cells[nr][nc].el;
      cell.classList.remove('flash');
      void cell.offsetWidth;
      cell.classList.add('flash');

      return; /* valid move found */
    }
    /* Agent is surrounded — stays put; perfectly valid Mesa behaviour */
  }

  /* ─────────────────────────────────────────────
     STEP
  ───────────────────────────────────────────── */
  function simStepOnce() {
    /* Random activation order — mirrors Mesa's shuffle_do() */
    agents.slice().sort(() => Math.random() - 0.5).forEach(moveAgent);

    stepCount++;
    stepEl.textContent = stepCount;
  }

  /* ─────────────────────────────────────────────
     RUN / PAUSE
  ───────────────────────────────────────────── */
  function simToggleRun() {
    running = !running;

    if (running) {
      runBtn.textContent = 'Pause ⏸';
      runBtn.classList.add('sim-running');
      badgeEl.textContent = '▶ Running';
      badgeEl.classList.add('is-running');
      runTimer = setInterval(simStepOnce, SPEEDS[speed].interval);
    } else {
      runBtn.textContent = 'Run ▶';
      runBtn.classList.remove('sim-running');
      badgeEl.textContent = '⏸ Paused';
      badgeEl.classList.remove('is-running');
      clearInterval(runTimer);
    }
  }

  /* ─────────────────────────────────────────────
     SPEED
  ───────────────────────────────────────────── */
  function simSetSpeed(key) {
    speed = key;

    /* Update button active states */
    document.querySelectorAll('.sim-speed-btn').forEach(btn => {
      btn.classList.toggle('sim-speed-active', btn.dataset.speed === key);
    });

    /* Update label */
    const nameEl = document.getElementById('sim-speed-name');
    if (nameEl) nameEl.textContent = key.charAt(0).toUpperCase() + key.slice(1);

    /* Sync CSS transition durations immediately */
    applyAnimationDuration();

    /* Restart timer at new interval if currently running */
    if (running) {
      clearInterval(runTimer);
      runTimer = setInterval(simStepOnce, SPEEDS[speed].interval);
    }
  }

  /* ─────────────────────────────────────────────
     RESET
  ───────────────────────────────────────────── */
  function simReset() {
    if (running) simToggleRun();   /* stop first */
    stepCount = 0;
    stepEl.textContent = '0';
    badgeEl.textContent = '⏸ Paused';
    badgeEl.classList.remove('is-running');
    spawnAgents();
  }

  /* Expose to global scope for HTML onclick attributes */
  window.simStepOnce  = simStepOnce;
  window.simToggleRun = simToggleRun;
  window.simSetSpeed  = simSetSpeed;
  window.simReset     = simReset;

  /* ── Init ── */
  buildGrid();
  spawnAgents();

})();
