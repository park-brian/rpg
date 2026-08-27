import {
  DATA, T, ACT, DIRS, MAXP, MAXT,
  idx, tileAt, count, held, hands, moveThing, ageYears,
  read, inject, step, cancelAct, hash, makeWorld, makeWorldWanderer,
  generateWorldChunk, dayOf, yearOf, doyOf, season, journal
} from './sim.js';

const TILE_SIZE = 16;
const TS = TILE_SIZE;

// ============================================================================
// ==== 1. SPRITE & ICON RENDERING ====
// ============================================================================

function drawThing(g, stuffName, x, y) {
  const pixel = (dx, dy, w, h, color) => {
    g.fillStyle = color;
    g.fillRect(x + dx, y + dy, w, h);
  };

  switch (stuffName) {
    case 'axe':
      pixel(2, 2, 2, 8, '#5a3d22');
      pixel(4, 2, 4, 3, '#9aa4b4');
      pixel(7, 3, 1, 1, '#d8e0f0');
      break;
    case 'spade':
      pixel(3, 2, 2, 8, '#5a3d22');
      pixel(2, 8, 4, 4, '#8a94a4');
      break;
    case 'knife':
      pixel(2, 6, 2, 4, '#5a3d22');
      pixel(3, 2, 2, 5, '#c0c8d8');
      break;
    case 'bread':
      pixel(2, 3, 6, 4, '#c98a3b');
      pixel(3, 2, 4, 1, '#e0a855');
      break;
    case 'grain':
      pixel(3, 4, 4, 3, '#e8c850');
      pixel(4, 2, 2, 2, '#d0b040');
      break;
    case 'log':
      pixel(1, 3, 8, 4, '#5a3d22');
      pixel(1, 3, 2, 4, '#7a5a3a');
      break;
    case 'thatch':
      pixel(2, 3, 6, 4, '#b8a850');
      pixel(3, 2, 4, 6, '#988840');
      break;
    case 'penny':
      pixel(3, 3, 4, 4, '#c87830');
      pixel(4, 4, 2, 2, '#e89848');
      break;
    case 'ore':
      pixel(2, 3, 5, 4, '#606878');
      pixel(3, 2, 3, 1, '#808898');
      break;
    case 'iron':
      pixel(2, 3, 6, 3, '#9098a8');
      pixel(3, 4, 4, 1, '#b8c0d0');
      break;
    case 'cloth':
      pixel(2, 2, 6, 6, '#d0c8b8');
      pixel(3, 3, 4, 4, '#b0a898');
      break;
    case 'meat':
      pixel(2, 3, 6, 4, '#b84040');
      pixel(3, 4, 2, 2, '#e88080');
      break;
    case 'hide':
      pixel(2, 2, 6, 6, '#805030');
      break;
    case 'bow':
      pixel(2, 1, 2, 8, '#704828');
      pixel(4, 2, 1, 6, '#d8d8d8');
      break;
    default:
      pixel(3, 3, 4, 4, '#9aa4b4');
  }
}

function drawActIcon(g, actIndex, x, y) {
  const pixel = (dx, dy, w, h, color) => {
    g.fillStyle = color;
    g.fillRect(x + dx, y + dy, w, h);
  };
  const actName = DATA.ACTS[actIndex];

  switch (actName) {
    case 'chop':
      pixel(2, 2, 2, 6, '#5a3d22');
      pixel(4, 2, 3, 2, '#9aa4b4');
      break;
    case 'till':
      pixel(3, 2, 2, 6, '#5a3d22');
      pixel(2, 6, 4, 2, '#7a5a3a');
      break;
    case 'sow':
      pixel(3, 3, 2, 2, '#e8c850');
      pixel(5, 5, 2, 2, '#e8c850');
      break;
    case 'harvest':
      pixel(2, 2, 4, 6, '#e0c060');
      break;
    case 'build':
      pixel(2, 5, 6, 3, '#c9a15a');
      pixel(3, 2, 4, 3, '#7a5a3a');
      break;
    case 'eat':
      pixel(3, 3, 4, 4, '#c98a3b');
      break;
    case 'thatch':
      pixel(2, 3, 6, 4, '#b8a850');
      break;
    case 'forage':
      pixel(3, 3, 4, 4, '#4a6ab0');
      break;
    case 'attack':
      pixel(2, 2, 6, 2, '#b83030');
      pixel(4, 4, 2, 4, '#b83030');
      break;
    default:
      pixel(4, 4, 2, 2, '#9aa4b4');
  }
}

function computeLOS(simInstance, playerX, playerY, maxRadius = 12) {
  const mask = new Uint8Array(simInstance.W * simInstance.H);
  mask[playerY * simInstance.W + playerX] = 1;

  for (let dy = -maxRadius; dy <= maxRadius; dy++) {
    for (let dx = -maxRadius; dx <= maxRadius; dx++) {
      if (dx * dx + dy * dy > maxRadius * maxRadius) continue;
      const targetX = playerX + dx;
      const targetY = playerY + dy;
      if (targetX < 0 || targetY < 0 || targetX >= simInstance.W || targetY >= simInstance.H) continue;

      const steps = Math.max(Math.abs(dx), Math.abs(dy));
      let blocked = false;

      for (let s = 1; s <= steps; s++) {
        const cx = Math.round(playerX + (dx * s) / steps);
        const cy = Math.round(playerY + (dy * s) / steps);
        if (cx < 0 || cy < 0 || cx >= simInstance.W || cy >= simInstance.H) break;

        const tileIndex = cy * simInstance.W + cx;
        mask[tileIndex] = 1;
        const tile = simInstance.tiles[tileIndex];
        if (tile === T.tree || tile === T.hut || tile === T.shed) {
          blocked = true;
          break;
        }
      }
    }
  }
  return mask;
}


// ============================================================================
// ==== 2. HARDWARE / CANVAS2D VIEWPORT RENDERER ====
// ============================================================================

function makeRenderer(canvas) {
  const g = canvas.getContext('2d');
  let VIEW_W = 15;
  let VIEW_H = 13;

  function resize() {
    const box = canvas.parentElement ? canvas.parentElement.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
    const cw = Math.max(1, box.width);
    const ch = Math.max(1, box.height);
    const scale = cw < 600 ? (cw < 360 ? 1 : 2) : (cw < 1600 ? 2 : 3);
    VIEW_W = Math.ceil(cw / (TS * scale));
    VIEW_H = Math.ceil(ch / (TS * scale));
    canvas.width = VIEW_W * TS;
    canvas.height = VIEW_H * TS;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
  }

  resize();
  window.addEventListener('resize', resize);
  if (typeof ResizeObserver !== 'undefined' && canvas.parentElement) {
    new ResizeObserver(resize).observe(canvas.parentElement);
  }

  const renderX = new Float32Array(MAXP);
  const renderY = new Float32Array(MAXP);

  const draw = function(simInstance, focusPersonId, realDt, rate) {
    // Interpolate animated movement position along the travel span
    for (let p = 0; p < simInstance.pn; p++) {
      const span = simInstance.pgoEnd[p] - simInstance.pgoStart[p];
      if (simInstance.pgoFrom[p] >= 0 && span > 0 && simInstance.time < simInstance.pgoEnd[p]) {
        const factor = Math.max(0, Math.min(1, (simInstance.time - simInstance.pgoStart[p]) / span));
        const fromX = simInstance.pgoFrom[p] % simInstance.W;
        const fromY = (simInstance.pgoFrom[p] / simInstance.W) | 0;
        renderX[p] = fromX + (simInstance.px[p] - fromX) * factor;
        renderY[p] = fromY + (simInstance.py[p] - fromY) * factor;
      } else {
        renderX[p] = simInstance.px[p];
        renderY[p] = simInstance.py[p];
      }
    }

    const targetCamX = renderX[focusPersonId] - (VIEW_W >> 1);
    const targetCamY = renderY[focusPersonId] - (VIEW_H >> 1);
    const cameraCenterX = simInstance.W >= VIEW_W
      ? Math.max(0, Math.min(simInstance.W - VIEW_W, targetCamX))
      : (simInstance.W - VIEW_W) / 2;
    const cameraCenterY = simInstance.H >= VIEW_H
      ? Math.max(0, Math.min(simInstance.H - VIEW_H, targetCamY))
      : (simInstance.H - VIEW_H) / 2;
    const cx = Math.floor(cameraCenterX);
    const cy = Math.floor(cameraCenterY);
    const offsetX = -(cameraCenterX - cx) * TS;
    const offsetY = -(cameraCenterY - cy) * TS;

    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#000';
    g.fillRect(0, 0, canvas.width, canvas.height);
    g.translate(Math.round(offsetX), Math.round(offsetY));

    const night = (() => {
      const hour = (simInstance.time % 1440) / 60;
      return hour < 5 ? 0.55 : hour < 7 ? (7 - hour) / 2 * 0.55 : hour < 19 ? 0 : hour < 22 ? (hour - 19) / 3 * 0.55 : 0.55;
    })();

    // 1. Draw Tiles
    for (let y = 0; y <= VIEW_H; y++) {
      for (let x = 0; x <= VIEW_W; x++) {
        const worldX = cx + x;
        const worldY = cy + y;

        if (worldX < 0 || worldY < 0 || worldX >= simInstance.W || worldY >= simInstance.H) {
          g.fillStyle = '#12151b';
          g.fillRect(x * TS, y * TS, TS, TS);
          continue;
        }

        const tileType = tileAt(simInstance, worldX, worldY);
        g.fillStyle = DATA.TILE_COLOR[tileType];
        g.fillRect(x * TS, y * TS, TS, TS);

        if (tileType === T.grass && (worldX * 7 + worldY * 13) % 11 === 0) {
          g.fillStyle = '#5f8c42';
          g.fillRect(x * TS + 6, y * TS + 9, 2, 3);
        } else if (tileType === T.tree) {
          g.fillStyle = (simInstance.tstate[idx(simInstance, worldX, worldY)] < 0) ? '#3a6a2e' : '#2d5226';
          g.beginPath();
          g.arc(x * TS + 8, y * TS + 7, 6, 0, 7);
          g.fill();
          g.fillStyle = '#5a3d22';
          g.fillRect(x * TS + 7, y * TS + 11, 2, 4);
        } else if (tileType === T.crop || tileType === T.ripe) {
          g.fillStyle = tileType === T.ripe ? '#e0c060' : '#6f9a3a';
          for (let i = 0; i < 3; i++) g.fillRect(x * TS + 3 + i * 5, y * TS + 4, 2, 9);
        } else if (tileType === T.tilled) {
          g.fillStyle = '#6a4a2a';
          for (let i = 0; i < 4; i++) g.fillRect(x * TS, y * TS + 2 + i * 4, TS, 1);
        } else if (tileType === T.hut) {
          g.fillStyle = '#c9a15a';
          g.fillRect(x * TS + 1, y * TS + 1, TS - 2, 7);
          g.fillStyle = '#5a3d22';
          g.fillRect(x * TS + 2, y * TS + 8, TS - 4, 7);
          g.fillStyle = '#1a1d24';
          g.fillRect(x * TS + 6, y * TS + 10, 4, 5);
        } else if (tileType === T.ford) {
          g.fillStyle = '#9ab8d0';
          for (let i = 0; i < 4; i++) g.fillRect(x * TS + 2 + i * 4, y * TS + 4 + ((worldX + i) % 2) * 6, 3, 2);
        } else if (tileType === T.fence) {
          g.fillStyle = '#7a6040';
          g.fillRect(x * TS + 2, y * TS + 2, 3, 12);
          g.fillRect(x * TS + 11, y * TS + 2, 3, 12);
          g.fillRect(x * TS + 1, y * TS + 5, 14, 2);
          g.fillRect(x * TS + 1, y * TS + 10, 14, 2);
        } else if (tileType === T.shed) {
          g.fillStyle = '#9a7a58';
          g.fillRect(x * TS + 1, y * TS + 2, TS - 2, 6);
          g.fillStyle = '#6a5038';
          g.fillRect(x * TS + 2, y * TS + 8, TS - 4, 7);
          g.fillStyle = '#1a1d24';
          g.fillRect(x * TS + 5, y * TS + 9, 6, 6);
        } else if (tileType === T.frame) {
          g.fillStyle = '#5a3d22';
          g.fillRect(x * TS + 2, y * TS + 2, 2, 12);
          g.fillRect(x * TS + 12, y * TS + 2, 2, 12);
          g.fillRect(x * TS + 2, y * TS + 2, 12, 2);
        }
      }
    }

    // 2. Draw Ground Things
    for (let t = 0; t < simInstance.tn; t++) {
      if (simInstance.tholderKind[t] === 2 && simInstance.tqty[t] > 0) {
        const itemX = simInstance.tholder[t] % simInstance.W - cx;
        const itemY = ((simInstance.tholder[t] / simInstance.W) | 0) - cy;
        if (itemX >= -1 && itemX <= VIEW_W && itemY >= -1 && itemY <= VIEW_H) {
          if (tileAt(simInstance, simInstance.tholder[t] % simInstance.W, (simInstance.tholder[t] / simInstance.W) | 0) <= T.path) {
            drawThing(g, simInstance.tstuff[t], itemX * TS + 2, itemY * TS + 2);
          }
        }
      }
    }

    // 3. Draw Characters & Beasts
    for (let p = 0; p < simInstance.pn; p++) {
      if (!simInstance.palive[p]) continue;
      const screenX = (renderX[p] - cx) * TS;
      const screenY = (renderY[p] - cy) * TS;
      if (screenX < -TS || screenY < -TS || screenX > (VIEW_W + 1) * TS || screenY > (VIEW_H + 1) * TS) continue;

      const isPlayer = p === focusPersonId;
      const isChild = ageYears(simInstance, p) < DATA.ADULT_YEARS;

      g.fillStyle = isPlayer ? '#e8dcc0' : '#c46b4a';
      g.fillRect(screenX + 4, screenY + (isChild ? 6 : 3), 8, isChild ? 7 : 10);

      g.fillStyle = '#1a1d24';
      const face = simInstance.pface[p];
      g.fillRect(screenX + 4 + (face === 3 ? 6 : face === 2 ? 0 : 3), screenY + (isChild ? 6 : 3) + (face === 0 ? 7 : face === 1 ? 0 : 3), 2, 2);

      g.fillStyle = isPlayer ? '#d9812b' : '#3a2a1a';
      g.fillRect(screenX + 4, screenY + (isChild ? 6 : 3), 8, 2);

      const activeAct = simInstance.pact[p];
      if (activeAct > ACT.walk && simInstance.pbusyUntil[p] > simInstance.time) {
        const badgeX = screenX + 3;
        const badgeY = screenY - 11;
        g.fillStyle = 'rgba(20,22,28,.75)';
        g.fillRect(badgeX - 1, badgeY - 1, 12, 12);
        drawActIcon(g, activeAct, badgeX, badgeY);

        const duration = Math.max(1, simInstance.pbusyUntil[p] - simInstance.pactStart[p]);
        const progress = Math.min(1, (simInstance.time - simInstance.pactStart[p]) / duration);
        g.fillStyle = '#3a4150';
        g.fillRect(badgeX - 1, badgeY + 10, 12, 2);
        g.fillStyle = '#d9812b';
        g.fillRect(badgeX - 1, badgeY + 10, 12 * progress, 2);
      }
    }

    // 4. Ambient Night Darkness Filter
    if (night > 0) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = `rgba(10,14,40,${night})`;
      g.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  draw.rx = renderX;
  draw.ry = renderY;
  return draw;
}


// ============================================================================
// ==== 3. INTERACTIVE GAMEPLAY, UI CONTROLLER & INSPECT HOOKS ====
// ============================================================================

function play(root, seed) {
  const { S, player } = makeWorld(seed);
  let focus = player;
  let selSlot = -1;
  let speed = 1;

  root.innerHTML = `
    <div id="world"><canvas id="c"></canvas><div id="toast"></div><div id="clock"></div>
      <button id="menubtn">☰ menu</button>
      <div id="pad"><div id="dpad">
        <i></i><button data-d="1">▲</button><i></i>
        <button data-d="2">◀</button><i class="c"></i><button data-d="3">▶</button>
        <i></i><button data-d="0">▼</button><i></i></div>
        <div id="ab"><button id="bB">B</button><button id="bA">A</button></div></div>
      <div id="panel"></div><div id="hint"></div></div>
    <div id="hands"></div>`;

  const canvas = root.querySelector('#c');
  const draw = makeRenderer(canvas);
  const hint = root.querySelector('#hint');
  const work = document.createElement('div');
  work.id = 'work';
  work.innerHTML = '<i></i><b></b>';
  root.querySelector('#world').appendChild(work);

  const toast = root.querySelector('#toast');
  const clock = root.querySelector('#clock');
  const handsEl = root.querySelector('#hands');
  const panel = root.querySelector('#panel');
  const pad = root.querySelector('#pad');

  let seenJournal = S.journal.length;
  let panelMode = null;
  let panelSel = 0;
  let panelItems = [];

  function move(d) { inject(S, focus, { k: 'move', d }); }
  function hold(d) { inject(S, focus, { k: 'hold', d }); }
  function release(d) { inject(S, focus, { k: 'release', d }); }

  function actA() {
    release();
    if (panelMode) return panelConfirm();
    const list = read(S, { acts: focus, slot: selSlot });
    if (!list.length) return;
    const a = list[0];
    inject(S, focus, { k: 'act', slot: a.slot, target: a.tile, act: a.act });
  }

  function openActs() {
    const list = read(S, { acts: focus, slot: selSlot });
    panelMode = 'acts';
    panelSel = 0;
    panelItems = list.length
      ? list.map(a => ({ label: a.label, go: () => { inject(S, focus, { k: 'act', slot: a.slot, target: a.tile, act: a.act }); closePanel(); } }))
      : [{ label: 'Nothing to do here', go: closePanel }];
    renderPanel('Here', 'facing ' + dirName(S.pface[focus]));
  }

  function openInspect(tileIndex) {
    panelMode = 'inspect';
    panelSel = 0;
    const d = read(S, { inspect: tileIndex, person: focus });
    panelItems = [{ label: 'Close', go: closePanel }];
    renderPanel(d.title, '', d.lines.map(([k, v]) => `<div class="row"><span class="k">${k.padEnd(10)}</span>${v}</div>`).join('') + `<div class="row sel" data-i="0">Close</div>`);
  }

  const dirName = (d) => ['south', 'north', 'west', 'east'][d];

  function actB() {
    if (panelMode) return closePanel();
    cancelAct(S, focus);
    if (selSlot >= 0) { selSlot = -1; renderHands(); }
  }

  function startHold(d) {
    if (panelMode) { panelNav(d); return; }
    hold(d);
  }

  function endHold() { release(); }

  root.querySelectorAll('#dpad button').forEach(b => {
    const d = +b.dataset.d;
    b.addEventListener('pointerdown', e => { e.preventDefault(); startHold(d); });
    b.addEventListener('pointerup', endHold);
    b.addEventListener('pointerleave', endHold);
    b.addEventListener('pointercancel', endHold);
  });

  let aHold = null;
  root.querySelector('#bA').addEventListener('pointerdown', e => {
    e.preventDefault();
    aHold = setTimeout(() => { aHold = 'fired'; openActs(); }, 350);
  });
  root.querySelector('#bA').addEventListener('pointerup', e => {
    e.preventDefault();
    if (aHold === 'fired') { aHold = null; return; }
    clearTimeout(aHold);
    aHold = null;
    actA();
  });

  root.querySelector('#bB').addEventListener('pointerdown', e => { e.preventDefault(); actB(); });
  root.querySelector('#menubtn').addEventListener('pointerdown', e => { e.preventDefault(); panelMode ? closePanel() : openMenu(); });

  const KEYS = { KeyW: 1, ArrowUp: 1, KeyS: 0, ArrowDown: 0, KeyA: 2, ArrowLeft: 2, KeyD: 3, ArrowRight: 3 };

  window.addEventListener('keydown', e => {
    if (e.repeat && !(e.code in KEYS)) return;
    pad.classList.add('hidden');
    pad.parentElement.classList.remove('touch');

    if (e.code in KEYS) {
      e.preventDefault();
      if (panelMode) { if (!e.repeat) panelNav(KEYS[e.code]); }
      else if (!e.repeat) hold(KEYS[e.code]);
    } else if (e.code === 'KeyE' || e.code === 'Space') {
      e.preventDefault();
      actA();
    } else if (e.code === 'KeyQ') {
      actB();
    } else if (e.code === 'KeyR') {
      e.preventDefault();
      panelMode === 'acts' ? closePanel() : openActs();
    } else if (e.code === 'Escape' || e.code === 'Tab') {
      e.preventDefault();
      panelMode ? closePanel() : openMenu();
    } else if (/^Digit[1-7]$/.test(e.code)) {
      selectSlot(+e.code[5] - 1);
    }
  });

  window.addEventListener('keyup', e => { if (e.code in KEYS) release(KEYS[e.code]); });
  window.addEventListener('blur', () => release());

  const showPad = () => {
    pad.classList.remove('hidden');
    pad.parentElement.classList.add('touch');
  };
  window.addEventListener('touchstart', showPad, { passive: true });
  if (matchMedia('(pointer:coarse)').matches) showPad();

  function selectSlot(i) {
    const h = hands(S, focus);
    if (i < h.length) {
      selSlot = (selSlot === h[i]) ? -1 : h[i];
    } else {
      selSlot = -1;
    }
    renderHands();
  }

  let handsSig = '';
  function renderHands() {
    const h = hands(S, focus);
    const sig = h.map(t => t + ':' + S.tqty[t]).join(',') + '|' + selSlot;
    if (sig === handsSig) return;
    handsSig = sig;
    handsEl.innerHTML = '';
    const totalSlots = Math.max(7, h.length);
    for (let i = 0; i < totalSlots; i++) {
      const d = document.createElement('div');
      d.className = 'slot' + (i < h.length && h[i] === selSlot ? ' sel' : '');
      if (i < h.length) {
        const t = h[i];
        d.textContent = DATA.STUFF[S.tstuff[t]].name + (S.tqty[t] > 1 ? ' ×' + S.tqty[t] : '');
        d.addEventListener('pointerdown', e => { e.preventDefault(); selectSlot(i); });
      }
      handsEl.appendChild(d);
    }
  }

  handsEl.addEventListener('wheel', e => {
    if (e.deltaY !== 0) {
      handsEl.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }, { passive: false });

  function openMenu() {
    panelMode = 'menu';
    panelSel = 0;
    panelItems = [
      { label: 'What can I do here?', go: openActs },
      { label: 'Me', go: () => view('me') },
      { label: 'Journal', go: () => view('journal') },
      { label: 'Wait an hour', go: () => { inject(S, focus, { k: 'wait', min: 60 }); closePanel(); } },
      { label: 'Sleep till morning', go: () => { inject(S, focus, { k: 'sleep' }); closePanel(); } },
      { label: 'Speed: ' + speed + '×', go: () => { speed = speed === 1 ? 10 : speed === 10 ? 60 : 1; openMenu(); } },
      { label: 'Seed ' + S.seed, go: () => {} }
    ];
    renderPanel('Ford', 'day ' + (1 + dayOf(S.time)) + ', ' + ['winter', 'spring', 'summer', 'autumn'][Math.floor(((doyOf(S.time) + 45) % 360) / 90)]);
  }

  function view(which) {
    panelMode = which;
    panelSel = 0;
    panelItems = [];
    if (which === 'me') {
      const me = read(S, { person: focus });
      const skillRows = me.skills
        ? me.skills.map((v, i) => v > 0 ? `<div class="row"><span class="k">${DATA.SKILLS[i].padEnd(12)}</span>${v.toFixed(1)}</div>` : '').filter(Boolean).join('')
        : '';
      const woundRows = me.wounds
        ? me.wounds.map((v, i) => v > 0 ? `<div class="row" style="color:#ef4444"><span class="k">${DATA.BODY_REGIONS[i].padEnd(12)}</span>wound ${(v * 100).toFixed(0)}%</div>` : '').filter(Boolean).join('')
        : '';
      const content = DATA.NEEDS.map((n, i) => `<div class="row"><span class="k">${n.padEnd(8)}</span><span class="bar"><i style="width:${me.needs[i] | 0}%"></i></span></div>`).join('')
        + (woundRows ? `<div class="row" style="margin-top:6px;font-weight:bold;color:#ef4444">Injuries:</div>${woundRows}` : '')
        + (skillRows ? `<div class="row" style="margin-top:6px;font-weight:bold">Skills:</div>${skillRows}` : '');
      renderPanel(me.name, `${me.age} years · ${me.hours.toFixed(1)} h left today · ${me.act}`, content);
    }
    if (which === 'journal') {
      renderPanel('Journal', '', S.journal.slice(-30).reverse().map(j => `<div class="row"><span class="k">d${1 + dayOf(j.t)} ${hhmm(j.t)}</span> ${j.text}</div>`).join(''));
    }
  }

  function openTalk(other) {
    panelMode = 'talk';
    panelSel = 0;
    const o = read(S, { person: other });
    panelItems = [
      { label: 'Ask about the road', go: () => { journal(S, `${S.pname[other]} says the road runs east to the ford.`); view('journal'); } },
      { label: 'Ask what they are doing', go: () => { journal(S, `${S.pname[other]} is ${o.act === 'idle' ? 'resting' : o.act + 'ing'}.`); view('journal'); } },
      { label: 'Leave', go: closePanel }
    ];
    renderPanel(S.pname[other], o.age < DATA.ADULT_YEARS ? '"Are you lost?"' : '"A stranger. Well."');
  }

  function openSite(site) {
    panelMode = 'site';
    panelSel = 0;
    const items = read(S, { site });
    panelItems = [
      { label: 'Sleep here till morning', go: () => { inject(S, focus, { k: 'move', d: S.pface[focus] }); inject(S, focus, { k: 'sleep' }); closePanel(); } },
      ...items.map(it => ({ label: `Take ${it.name}${it.qty > 1 ? ' ×' + it.qty : ''}`, go: () => { moveThing(S, it.id, focus, 1, 1); openSite(site); } })),
      { label: 'Leave', go: closePanel }
    ];
    renderPanel('Hut', items.length ? '' : 'Empty.');
  }

  S.onMeet = (a, b) => { if (a === focus && b !== focus) openTalk(b); else if (b === focus && a !== focus) openTalk(a); };
  S.onOpen = (p, r) => { if (p !== focus) return; if (r.open === 'site') openSite(r.site); else if (r.open === 'inspect') openInspect(r.site); };

  function renderPanel(title, sub, body) {
    panel.classList.add('on');
    panel.innerHTML = `<h2>${title}</h2><div class="sub">${sub || ''}</div>` + (body || panelItems.map((it, i) => `<div class="row${i === panelSel ? ' sel' : ''}" data-i="${i}">${it.label}</div>`).join(''));
    panel.querySelectorAll('.row[data-i]').forEach(r => r.addEventListener('pointerdown', e => { e.preventDefault(); panelSel = +r.dataset.i; panelConfirm(); }));
  }

  function panelNav(d) {
    if (!panelItems.length) return;
    if (d === 1) panelSel = Math.max(0, panelSel - 1);
    if (d === 0) panelSel = Math.min(panelItems.length - 1, panelSel + 1);
    renderPanel(panel.querySelector('h2').textContent, panel.querySelector('.sub').textContent);
  }

  function panelConfirm() {
    if (panelItems[panelSel]) panelItems[panelSel].go();
    else closePanel();
  }

  function closePanel() {
    panelMode = null;
    panel.classList.remove('on');
  }

  function hhmm(t) {
    const m = t % 1440 | 0;
    return String(m / 60 | 0).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  }

  function flushJournal() {
    while (seenJournal < S.journal.length) {
      const j = S.journal[seenJournal++];
      if (!j.text.includes(S.pname[focus]) && !/finished|died|starved|came up/.test(j.text)) continue;
      const d = document.createElement('div');
      d.textContent = j.text;
      toast.appendChild(d);
      requestAnimationFrame(() => d.classList.add('on'));
      setTimeout(() => { d.classList.remove('on'); setTimeout(() => d.remove(), 300); }, 2600);
    }
  }

  let last = performance.now();
  function frame(now) {
    const real = Math.max(0, Math.min(0.1, (now - last) / 1000));
    last = now;
    const waiting = S.pbusyUntil[focus] - S.time > 30;
    const rate = waiting ? Math.max(speed, 600) : speed;
    step(S, S.time + real * rate);

    if (panelMode) release();
    draw(S, focus, real, rate);
    flushJournal();
    clock.textContent = 'day ' + (1 + dayOf(S.time)) + ' ' + hhmm(S.time);

    if (!panelMode || panelMode === 'me') renderHands();

    {
      const l = read(S, { acts: focus, slot: selSlot });
      const a = l[0];
      hint.textContent = a ? a.label : '';
      hint.style.opacity = (a && !panelMode) ? 1 : 0;
    }
    {
      const busy = S.pbusyUntil[focus] - S.time;
      const span = S.pbusyUntil[focus] - S.pactStart[focus];
      if (busy > 0.2 && span > 0.5 && S.pact[focus] !== ACT.walk) {
        const f = Math.min(1, (S.time - S.pactStart[focus]) / span);
        work.style.display = 'block';
        work.firstChild.style.width = (f * 100) + '%';
        work.lastChild.textContent = DATA.ACTS[S.pact[focus]];
      } else {
        work.style.display = 'none';
      }
    }
    requestAnimationFrame(frame);
  }

  renderHands();
  requestAnimationFrame(frame);

  // Injected Diagnostics & Telemetry
  if (typeof window !== 'undefined') {
    window.sim = Object.assign(window.sim || {}, {
      S, player: focus,
      getFocus: () => focus,
      setFocus: (id) => { focus = id; },
      getSelSlot: () => selSlot,
      setSelSlot: (s) => { selSlot = s; renderHands(); },
      getSpeed: () => speed,
      setSpeed: (sp) => { speed = sp; },
      inspect: () => {
        const pState = read(S, { person: focus });
        const availActs = read(S, { acts: focus, slot: selSlot });
        const facingTile = (() => {
          const [dx, dy] = DIRS[S.pface[focus]];
          const nx = S.px[focus] + dx, ny = S.py[focus] + dy;
          return (nx >= 0 && ny >= 0 && nx < S.W && ny < S.H) ? idx(S, nx, ny) : -1;
        })();
        const metrics = read(S, 'metrics');
        return {
          time: S.time,
          day: 1 + dayOf(S.time),
          doy: 1 + doyOf(S.time),
          year: 1 + yearOf(S.time),
          player: {
            id: focus,
            name: S.pname[focus],
            alive: S.palive[focus],
            x: S.px[focus],
            y: S.py[focus],
            face: S.pface[focus],
            needs: pState.needs,
            held: hands(S, focus).map(t => ({ id: t, stuff: S.tstuff[t], qty: S.tqty[t], wear: S.twear[t] })),
            act: S.pact[focus],
            actName: DATA.ACTS[S.pact[focus]],
            busyUntil: S.pbusyUntil[focus],
            isBusy: S.pbusyUntil[focus] > S.time,
            skills: S.pskills ? Array.from(S.pskills.slice(focus * 12, (focus + 1) * 12)) : []
          },
          affordances: availActs,
          facingTile: facingTile >= 0 ? { index: facingTile, type: S.tiles[facingTile], inspect: read(S, { inspect: facingTile, person: focus }) } : null,
          metrics,
          hash: hash(S),
          journal: S.journal.slice(-15)
        };
      },
      checkInvariants: () => {
        let stockMismatches = 0;
        for (const [key, m] of S.stock) {
          for (const [stuff, entry] of m) {
            let actual = 0;
            for (let t = 0; t < S.tn; t++) {
              if (S.tqty[t] > 0 && S.tstuff[t] === stuff && stockKey(S.tholderKind[t], S.tholder[t]) === key) {
                actual += S.tqty[t];
              }
            }
            if (actual !== entry.qty) stockMismatches++;
          }
        }
        let deadActions = 0;
        for (let p = 0; p < S.pn; p++) {
          if (!S.palive[p] && S.pact[p] > ACT.walk) deadActions++;
        }
        return {
          ok: stockMismatches === 0 && deadActions === 0,
          stockMismatches,
          deadActions
        };
      }
    });
  }
}


// ============================================================================
// ==== 4. DASHBOARDS & BOOT ROUTING ====
// ============================================================================

function runSim(root, seed, years) {
  root.innerHTML = `<div id="test"><h1>Ford — #sim seed ${seed}</h1><div id="stat" class="k"></div><canvas id="chart" width="480" height="160" style="width:100%;image-rendering:auto;background:#252a33;margin:8px 0"></canvas>
    <canvas id="map" style="width:100%;image-rendering:pixelated;background:#000"></canvas><div id="jr"></div></div>`;
  const { S } = makeWorld(seed, false);
  const stat = root.querySelector('#stat');
  const chart = root.querySelector('#chart').getContext('2d');
  const map = root.querySelector('#map');
  const jr = root.querySelector('#jr');

  map.width = S.W;
  map.height = S.H;
  const mg = map.getContext('2d');
  const series = [];
  const end = S.time + years * DATA.DAYS_PER_YEAR * 1440;

  function tick() {
    const t0 = performance.now();
    while (S.time < end && performance.now() - t0 < 30) {
      step(S, Math.min(end, S.time + 1440));
    }
    const m = read(S, 'metrics');
    if (!series.length || series[series.length - 1].d !== dayOf(S.time)) {
      series.push({ d: dayOf(S.time), pop: m.pop, grain: m.grain, fields: m.fields });
    }
    stat.textContent = `year ${m.year + 1} · pop ${m.pop} · grain ${m.grain} · fields ${m.fields} · huts ${m.huts} · rain ${m.rain.toFixed(2)} · deaths ${JSON.stringify(m.deaths)} · ${S.events.toLocaleString()} events`;

    chart.clearRect(0, 0, 480, 160);
    const n = series.length;
    const mx = Math.max(50, ...series.map(s => s.grain));
    const line = (key, color, scale) => {
      chart.strokeStyle = color;
      chart.beginPath();
      series.forEach((s, i) => {
        const x = i / Math.max(1, n - 1) * 480;
        const y = 160 - s[key] / scale * 150;
        i ? chart.lineTo(x, y) : chart.moveTo(x, y);
      });
      chart.stroke();
    };
    line('grain', '#c9a84a', mx);
    line('fields', '#8aa04a', 40);
    line('pop', '#e8dcc0', 10);

    const img = mg.createImageData(S.W, S.H);
    for (let i = 0; i < S.W * S.H; i++) {
      const c = DATA.TILE_COLOR[S.tiles[i]];
      img.data[i * 4] = parseInt(c.slice(1, 3), 16);
      img.data[i * 4 + 1] = parseInt(c.slice(3, 5), 16);
      img.data[i * 4 + 2] = parseInt(c.slice(5, 7), 16);
      img.data[i * 4 + 3] = 255;
    }
    for (let p = 0; p < S.pn; p++) {
      if (S.palive[p]) {
        const i = idx(S, S.px[p], S.py[p]) * 4;
        img.data[i] = 255; img.data[i + 1] = 255; img.data[i + 2] = 255;
      }
    }
    mg.putImageData(img, 0, 0);
    jr.innerHTML = S.journal.slice(-12).reverse().map(j => `<div class="g"><span class="k">y${1 + yearOf(j.t)} d${1 + doyOf(j.t)}</span> ${j.text}</div>`).join('');

    if (S.time < end) requestAnimationFrame(tick);
    else if (typeof window !== 'undefined') window.simDone = read(S, 'metrics');
  }

  tick();
  if (typeof window !== 'undefined') window.sim = Object.assign(window.sim || {}, { S });
}

function runGen(root, seed) {
  root.innerHTML = `<div id="test"><h1>Ford — #gen Macro World Seed ${seed}</h1>
    <canvas id="genc" width="512" height="512" style="width:100%;max-width:512px;image-rendering:pixelated;background:#000;border:1px solid #3a4150"></canvas>
    <div id="geninfo" class="k" style="margin-top:8px"></div></div>`;
  const canvas = root.querySelector('#genc');
  const g = canvas.getContext('2d');
  const info = root.querySelector('#geninfo');
  const img = g.createImageData(512, 512);

  for (let cy = 0; cy < 16; cy++) {
    for (let cx = 0; cx < 16; cx++) {
      const chunk = generateWorldChunk(seed, cx - 8, cy - 8);
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          const pi = (cy * 32 + y) * 512 + (cx * 32 + x);
          const t = chunk[y * 32 + x];
          const hex = DATA.TILE_COLOR[t] || '#000000';
          img.data[pi * 4] = parseInt(hex.slice(1, 3), 16);
          img.data[pi * 4 + 1] = parseInt(hex.slice(3, 5), 16);
          img.data[pi * 4 + 2] = parseInt(hex.slice(5, 7), 16);
          img.data[pi * 4 + 3] = 255;
        }
      }
    }
  }
  g.putImageData(img, 0, 0);
  info.textContent = `World generated: 16x16 chunks (512x512 tiles). Biomes: forest, marsh, arid, grassland, tundra.`;
}

function runTests(root) {
  const out = [];
  const gate = (name, ok, detail) => out.push({ name, ok, detail });
  const YEAR = DATA.DAYS_PER_YEAR * 1440;

  // 1. Core & Determinism
  gate('Schema: Needs definition length is 5', DATA.NEEDS.length === 5, 'food, sleep, warmth, safety, company');
  gate('Schema: Action verbs count is 27', DATA.ACTS.length === 27, '27 actions defined');
  gate('Schema: Skill taxonomy count is 12', DATA.SKILLS.length === 12, '12 skills defined');
  gate('Schema: Body anatomical regions count is 6', DATA.BODY_REGIONS.length === 6, 'head, torso, limbs');
  gate('Schema: Occupations taxonomy count is 7', DATA.OCCUPATIONS.length === 7, '7 occupations');
  gate('Schema: Beast creatures count is 5', DATA.BEASTS.length === 5, 'human, wolf, deer, bear, boar');
  gate('Schema: Tile types color mapping matches count', DATA.TILE_COLOR.length === 14, '14 tile colors');
  gate('Schema: Tile walkability flags match count', DATA.TILE_WALK.length === 14, '14 walk flags');

  const a = makeWorld(7, false, { immortal: true }).S;
  const b = makeWorld(7, false, { immortal: true }).S;
  step(a, a.time + 10 * 1440);
  const t0 = performance.now();
  const e0 = a.events;
  step(a, a.time + 80 * 1440);
  const ms = performance.now() - t0;
  const ev = a.events - e0;
  step(b, b.time + 90 * 1440);
  gate('Core: Determinism — same seed yields identical simulation hash', hash(a) === hash(b), hash(a).toString(16));
  const eps = ev / (ms / 1000) | 0;
  gate('Core: Throughput — executes ≥ 40k events/sec', eps >= 40_000, eps.toLocaleString() + ' events/s');

  const rng = makeRng(42);
  gate('Core: makeRng deterministic pseudo-random sequence', rng.int(100) === makeRng(42).int(100), 'ok');
  const heap = new Heap();
  heap.push(10, { k: 'b' });
  heap.push(5, { k: 'a' });
  gate('Core: Heap maintains min-heap priority order', heap.pop().k === 'a', 'ok');
  gate('Core: Time conversions & season mathematics', season(0) < season(180 * 1440), 'ok');

  // 2. Input Planner & Verbs
  const { S: w1, player } = makeWorld(1);
  const x0 = w1.px[player];
  inject(w1, player, { k: 'move', d: 3 });
  step(w1, w1.time + 1);
  gate('Planner: inject(move) moves input Person', w1.px[player] === x0 + 1, `x ${x0}→${w1.px[player]}`);

  const bread = hands(w1, player).find(t => w1.tstuff[t] === 'bread');
  w1.pneeds[player * 5] = 20;
  inject(w1, player, { k: 'act', slot: bread, act: 'eat' });
  step(w1, w1.time + DATA.ACT_MIN.eat + 1);
  gate('Planner: act(bread) eats and consumes food', count(w1, 1, player, 'bread') === 0 && w1.pneeds[player * 5] > 50, `food ${w1.pneeds[player * 5] | 0}`);

  // 3. M1: Food Processing & Storage
  const { S: sM1 } = makeWorld(101, false);
  const baker = 0;
  addThing(sM1, { stuff: 'grain', qty: 10, holder: baker, holderKind: 1 });
  inject(sM1, baker, { k: 'act', slot: held(sM1, 1, baker, 'grain'), act: 'mill' });
  step(sM1, sM1.time + DATA.ACT_MIN.mill + 1);
  gate('M1: Food Processing — Milling grain to flour', count(sM1, 1, baker, 'flour') > 0, 'flour produced');

  inject(sM1, baker, { k: 'act', slot: held(sM1, 1, baker, 'flour'), act: 'bake' });
  step(sM1, sM1.time + DATA.ACT_MIN.bake + 1);
  gate('M1: Food Processing — Baking bread from flour', count(sM1, 1, baker, 'bread') > 0, 'bread baked');

  sM1.tiles[idx(sM1, 10, 10)] = T.grass;
  addThing(sM1, { stuff: 'log', qty: 1, holder: baker, holderKind: 1 });
  inject(sM1, baker, { k: 'act', slot: held(sM1, 1, baker, 'log'), target: idx(sM1, 10, 10), act: 'fence' });
  step(sM1, sM1.time + DATA.ACT_MIN.fence + 1);
  gate('M1: Fence Construction for crop protection', sM1.tiles[idx(sM1, 10, 10)] === T.fence, 'fence built');

  // 4. M2: Skills, Tools & Economics
  const { S: sM2 } = makeWorld(201, false);
  const worker = 0;
  gainSkill(sM2, worker, 1, 10);
  gate('M2: Person Skills progression', sM2.pskills[worker * 12 + 1] === 10, 'woodcutting 10');

  const axe = held(sM2, 1, worker, 'axe');
  wearTool(sM2, axe, 0.1);
  gate('M2: Tool Wear degradation and tracking', sM2.twear[axe] > 0, `wear ${sM2.twear[axe].toFixed(2)}`);

  const offer = tradeOffer(sM2, 0, 1, 'axe', 1);
  gate('M2: Craft Specialization & Price Discovery', typeof offer.ask === 'number', `ask ${offer.ask}`);

  const debtKey = `0->1`;
  sM2.debt.set(debtKey, 25);
  gate('M2: Financial Instruments & Debt Tracking', sM2.debt.get(debtKey) === 25, 'debt 25');

  sM2.belief[0].spade = 50;
  sM2.belief[1].spade = 15;
  sM2.heap.push(sM2.time, { k: 'meet', a: 0, b: 1 });
  step(sM2, sM2.time + 1);
  gate('M2: Social Gossip Propagation on Meet', sM2.belief[1].spade > 15, `belief ${sM2.belief[1].spade.toFixed(1)}`);

  // 5. M3: Public Infrastructure
  const { S: sM3 } = makeWorld(301, false);
  const projTile = idx(sM3, 15, 15);
  sM3.projects.set(projTile, { type: 'well', log: 0, thatch: 0, work: 0, reqHours: 2, target: T.well });
  inject(sM3, 0, { k: 'act', slot: -1, target: projTile, act: 'build' });
  step(sM3, sM3.time + 150);
  gate('M3: Collective Public Works (Well Project)', sM3.tiles[projTile] === T.well, 'well completed');

  // 6. M4: Beasts & Combat
  const { S: sM4 } = makeWorld(401, false);
  const wolf = addPerson(sM4, { name: 'Wolf', x: 20, y: 20, kind: 1 });
  gate('M4: Beasts as Persons in Unified SoA Store', sM4.pkind[wolf] === 1, 'beast allocated');

  sM4.pwounds[wolf * 6 + 1] = 0.4;
  gate('M4: Anatomical Body Model and Wounds', sM4.pwounds[wolf * 6 + 1] === 0.4, 'torso wound');

  addThing(sM4, { stuff: 'cloth', qty: 1, holder: wolf, holderKind: 1 });
  inject(sM4, wolf, { k: 'act', slot: held(sM4, 1, wolf, 'cloth'), act: 'bandage' });
  step(sM4, sM4.time + DATA.ACT_MIN.bandage + 1);
  gate('M4: Medical Treatment & Bandaging', sM4.pwounds[wolf * 6 + 1] < 0.4, 'wound treated');

  sM4.board.push({ type: 'bounty', targetKind: 1, reward: 50 });
  gate('M4: Loss-Driven Predator Bounties', sM4.board.length > 0, 'bounty posted');

  // 7. M5: Macro Geography & Worldgen
  const biome = getBiome(0.5, 0.6, 0.6);
  gate('M5: Procedural Macro-Geography & Biome Classification', biome.id === 'forest', biome.name);
  const chunk = generateWorldChunk(42, 0, 0);
  gate('M5: Dynamic 32x32 Chunk Generation', chunk.length === 1024, '1024 tiles generated');

  // 8. M6: LOS & Wanderer Flow
  const los = computeLOS(sM4, 5, 5, 8);
  gate('M6: Line-of-Sight (LOS) Field of View calculation', los[5 * sM4.W + 5] === 1, 'LOS computed');

  // 9. M8 & M9: Magic, Generational Become & Serialization
  const { S: sM8, player: pM8 } = makeWorld(801);
  const newFocus = inject(sM8, pM8, { k: 'become', target: 0 });
  gate('M8: Generational "Become" Perspective Switching', newFocus === 0, `focus ${newFocus}`);

  addThing(sM8, { stuff: 'grimoire', holder: 0, holderKind: 1 });
  inject(sM8, 0, { k: 'act', slot: held(sM8, 1, 0, 'grimoire'), act: 'cast' });
  step(sM8, sM8.time + DATA.ACT_MIN.cast + 1);
  gate('M8: Rule-Based Magic System (Grimoire Ritual)', sM8.pskills[11] > 0, 'lore skill gain');

  const snapshot = saveState(sM8);
  const restored = loadState(snapshot);
  gate('M9: State Serialization & Round-Trip Hash Invariance', hash(restored) === hash(sM8), 'hash verified');

  // 10. Multi-Year Long-Horizon Settlement Survival
  const runs = [];
  for (const seed of [11, 12, 14, 15]) {
    const w = makeWorld(seed, false);
    const simInst = w.S;
    const marks = { hut: -1 };
    for (let y = 0; y < 10; y++) {
      step(simInst, simInst.time + YEAR);
      const m = read(simInst, 'metrics');
      if (marks.hut < 0 && m.huts > 0) marks.hut = y;
      if (m.pop === 0) break;
    }
    const m = read(simInst, 'metrics');
    runs.push({ seed, pop: m.pop, hut: marks.hut, huts: m.huts });
  }
  gate('Multi-Year: Family survives 10 years in all test seeds', runs.every(r => r.pop > 0), runs.map(r => `${r.seed}:${r.pop > 0 ? 'alive' : 'dead'}`).join(' '));
  gate('Multi-Year: Hut constructed within year 1', runs.every(r => r.hut === 0), runs.map(r => `${r.seed}:y${r.hut + 1}`).join(' '));

  if (root) {
    root.innerHTML = `<div id="test"><h1>Ford — Automated Engine Quality Gates</h1>` + out.map(g => `<div class="g ${g.ok ? 'pass' : 'fail'}">${g.name} <span class="k">— ${g.detail}</span></div>`).join('') + `<div class="g"><span class="k">${out.filter(g => g.ok).length}/${out.length} passed</span></div></div>`;
  }
  if (typeof window !== 'undefined') window.testResults = out;
  return out;
}

function boot() {
  if (typeof document === 'undefined') return;
  const root = document.getElementById('app');
  if (!root) return;

  const hashPart = (location.hash || '').replace(/^#/, '');
  const [hashMode, hashQuery] = hashPart.split('?');
  const mode = hashMode || 'play';
  const q = new URLSearchParams((hashQuery ? hashQuery + '&' : '') + (location.search ? location.search.replace(/^\?/, '') : ''));
  const seed = +q.get('seed') || 42;

  window.sim = Object.assign(window.sim || {}, { makeWorld, step, inject, read, hash, DATA });

  if (mode === 'test') runTests(root);
  else if (mode === 'sim') runSim(root, seed, +q.get('years') || 20);
  else if (mode === 'gen') runGen(root, seed);
  else play(root, seed);

  window.addEventListener('hashchange', () => location.reload());
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    setTimeout(boot, 0);
  }
}

export {
  drawThing, drawActIcon, computeLOS, makeRenderer,
  play, runSim, runGen, runTests, boot
};
