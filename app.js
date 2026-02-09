/* ═══════════════════════════════════════════
   IMIGRANT PIŠTA — Crossy Road Arcade
   ═══════════════════════════════════════════ */

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

/* ─── CONFIG ─── */
const COLS = 9;          // grid columns
const LANE_TYPES = ['safe','road','road','rail','road','safe','road','road','rail'];
const PLAYER_COL_START = 4;

/* ─── COLORS ─── */
const C = {
  grass1:'#2d5a27', grass2:'#347a2c',
  road:'#3a3a4a', roadLine:'#555570',
  rail:'#4a3828', railTrack:'#888',
  water:'#1a5276', waterLight:'#2178a6',
  sidewalk:'#5a5a6e', sidewalk2:'#4e4e62',
  building1:'#2c3e6b', building2:'#3d2c5e', building3:'#5e3a3a', building4:'#3a5e5e',
  window:'#facc15', windowOff:'#2a2a3a',
  player:'#facc15', playerOutline:'#b38600',
  cop:'#3b82f6', copLight:'#ef4444',
  coin:'#facc15', coinShine:'#fef08a',
  tree:'#1e6b1e', treeTop:'#34d399', treeTrunk:'#5c3a1e',
  car1:'#ef4444', car2:'#3b82f6', car3:'#a855f7', car4:'#f97316', car5:'#22d3ee',
  train:'#64748b', trainFront:'#facc15', trainStripe:'#ef4444',
  sky:'#1a1a2e',
};

/* ─── STATE ─── */
let W, H, TILE, ROWS_VISIBLE;
let state = 'menu'; // menu, playing, dead
let score = 0, coins = 0, best = 0, combo = 0, comboTimer = 0;
let playerRow = 0, playerCol = PLAYER_COL_START;
let playerVisualX, playerVisualY, playerTargetX, playerTargetY;
let playerBob = 0, playerAlive = true, playerDir = 0; // 0=up
let cameraY = 0, cameraTargetY = 0;
let lanes = [];
let particles = [];
let frameCount = 0;
let lastMoveTime = 0;
let idleTimer = 0;
let deathReason = '';

try { best = parseInt(localStorage.getItem('pista_best') || '0'); } catch(e){}

/* ─── LANE GENERATION ─── */

function makeLane(row) {
  const seed = Math.abs(row * 13 + 7);
  const difficulty = Math.min(1, Math.max(0, (Math.abs(row) - 10) / 100));

  // Row 0 is always safe start
  if (row === 0) return { type:'safe', subtype:'grass', row, obstacles:[], moving:[], coins:[], decoration:[] };

  const r = pseudoRandom(seed);
  let type, subtype;

  if (r < 0.35) {
    type = 'safe';
    subtype = r < 0.15 ? 'sidewalk' : 'grass';
  } else if (r < 0.75) {
    type = 'road';
    subtype = 'road';
  } else {
    type = 'rail';
    subtype = 'rail';
  }

  const lane = { type, subtype, row, obstacles:[], moving:[], coins:[], decoration:[] };

  if (type === 'safe') {
    lane.decoration = makeDecoSafe(row);
    // Coins on safe lanes
    if (Math.random() < 0.3) {
      const cc = Math.floor(Math.random() * COLS);
      if (!lane.decoration.some(d => d.col === cc)) {
        lane.coins.push({ col:cc, collected:false });
      }
    }
  }

  if (type === 'road') {
    const speed = (0.4 + Math.random() * 1.0 + difficulty * 2.0) * (Math.random() < 0.5 ? 1 : -1);
    const carCount = Math.max(1, Math.floor(1 + difficulty * 3 + Math.random()));
    for (let i = 0; i < carCount; i++) {
      const carType = Math.floor(Math.random() * 5);
      const len = carType === 4 ? 2 : 1;
      lane.moving.push({
        x: i * (COLS / Math.max(1, carCount) * 1.2) + Math.random() * 2,
        speed,
        type: carType,
        len
      });
    }
    if (Math.random() < 0.25) {
      lane.coins.push({ col: Math.floor(Math.random() * COLS), collected: false });
    }
  }

  if (type === 'rail') {
    lane.trainSpeed = (3 + difficulty * 4) * (Math.random() < 0.5 ? 1 : -1);
    lane.trainX = -15;
    lane.trainTimer = 120 + Math.random() * 180;
    lane.trainActive = false;
    lane.trainWarning = false;
    lane.trainLen = 10 + Math.floor(Math.random() * 6);
    if (Math.random() < 0.2) {
      lane.coins.push({ col: Math.floor(Math.random() * COLS), collected: false });
    }
  }

  return lane;
}

function makeDecoSafe(row) {
  const d = [];
  const count = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < count; i++) {
    // Favor edge columns for visual variety
    const col = Math.random() < 0.6
      ? (Math.random() < 0.5 ? Math.floor(Math.random() * 2) : 7 + Math.floor(Math.random() * 2))
      : Math.floor(Math.random() * COLS);
    if (!d.some(x => x.col === col)) {
      const type = Math.random() < 0.4 ? 'tree' : (Math.random() < 0.5 ? 'bush' : 'building');
      d.push({ col, type, height: 0.5 + Math.random() * 0.8, hue: Math.random() * 60 - 30 });
    }
  }
  return d;
}

function pseudoRandom(s) { s = (s * 9301 + 49297) % 233280; return s / 233280; }

function ensureLanes() {
  const minRow = playerRow - 5;
  const maxRow = playerRow + ROWS_VISIBLE + 10;
  // Remove far lanes
  lanes = lanes.filter(l => l.row >= minRow && l.row <= maxRow);
  // Add missing
  for (let r = minRow; r <= maxRow; r++) {
    if (!lanes.find(l => l.row === r)) {
      lanes.push(makeLane(r));
    }
  }
  lanes.sort((a, b) => a.row - b.row);
}

/* ─── RESIZE ─── */

function resize() {
  const dpr = window.devicePixelRatio || 1;
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  TILE = Math.floor(W / COLS);
  ROWS_VISIBLE = Math.ceil(H / TILE) + 2;
}

/* ─── GAME INIT ─── */

function startGame() {
  state = 'playing';
  score = 0;
  coins = 0;
  combo = 0;
  comboTimer = 0;
  playerRow = 0;
  playerCol = PLAYER_COL_START;
  playerAlive = true;
  playerDir = 0;
  idleTimer = 0;
  lanes = [];
  particles = [];
  frameCount = 0;
  cameraY = 0;
  cameraTargetY = 0;
  updatePlayerTarget();
  playerVisualX = playerTargetX;
  playerVisualY = playerTargetY;
  ensureLanes();
  hideOverlay();
  updateHUD();
}

function updatePlayerTarget() {
  playerTargetX = playerCol * TILE + TILE / 2;
  playerTargetY = H * 0.65; // Player stays at 65% height
  cameraTargetY = playerRow;
}

/* ─── INPUT ─── */

let touchStartX = 0, touchStartY = 0, touchStartTime = 0;

let moveFrame = 0;

function handleInput(dir) {
  if (state !== 'playing' || !playerAlive) return;
  if (frameCount - moveFrame < 5) return; // 5 frame debounce (~83ms at 60fps)
  moveFrame = frameCount;

  let newCol = playerCol, newRow = playerRow;
  if (dir === 'up') { newRow++; playerDir = 0; }
  else if (dir === 'down') { newRow--; playerDir = 2; }
  else if (dir === 'left') { newCol--; playerDir = 3; }
  else if (dir === 'right') { newCol++; playerDir = 1; }

  // Bounds
  if (newCol < 0 || newCol >= COLS) return;
  if (newRow < playerRow - 2) return; // Can't go too far back

  // Check obstacle on safe lanes - only bushes/trees at edges block
  // Actually in Crossy Road style, safe lanes never block. Just visual.
  // Blocking only happens from vehicles and trains.

  playerCol = newCol;
  playerRow = newRow;
  idleTimer = 0;

  // Score
  if (newRow > score) {
    const diff = newRow - score;
    score = newRow;
    combo += diff;
    comboTimer = 60;
  }

  updatePlayerTarget();
  // Hop particles
  spawnParticles(playerTargetX, H * 0.65, 4, '#facc15', 2);

  haptic();
}

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const t = e.touches[0];
  touchStartX = t.clientX;
  touchStartY = t.clientY;
  touchStartTime = Date.now();
}, { passive: false });

canvas.addEventListener('touchend', e => {
  e.preventDefault();
  if (state === 'dead') { showMenu(true); return; }
  if (state === 'menu') return;

  const t = e.changedTouches[0];
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;
  const dt = Date.now() - touchStartTime;

  // Tap (no significant swipe) = move forward
  if (Math.abs(dx) < 20 && Math.abs(dy) < 20 && dt < 300) {
    handleInput('up');
    return;
  }

  // Swipe
  if (Math.abs(dx) > Math.abs(dy)) {
    handleInput(dx > 0 ? 'right' : 'left');
  } else {
    handleInput(dy < 0 ? 'up' : 'down');
  }
}, { passive: false });

document.addEventListener('keydown', e => {
  if (state === 'dead') { showMenu(true); return; }
  if (state === 'menu') return;
  const map = { ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right', w:'up', s:'down', a:'left', d:'right', ' ':'up' };
  if (map[e.key]) { e.preventDefault(); handleInput(map[e.key]); }
});

document.getElementById('btn-start').addEventListener('click', () => {
  if (state === 'menu' || state === 'dead') startGame();
});

/* ─── UPDATE ─── */

function update() {
  if (state !== 'playing') return;
  frameCount++;

  // Camera smooth follow
  cameraY += (cameraTargetY - cameraY) * 0.12;

  // Player visual smooth
  playerVisualX += (playerTargetX - playerVisualX) * 0.25;
  playerVisualY += (playerTargetY - playerVisualY) * 0.25;
  playerBob = Math.sin(frameCount * 0.15) * 2;

  // Idle death timer
  idleTimer++;
  if (idleTimer > 300) { // ~5 seconds idle
    die('Stál jsi moc dlouho! Celníci tě dostali.');
    return;
  }

  // Combo timer
  if (comboTimer > 0) {
    comboTimer--;
    if (comboTimer === 0) combo = 0;
  }

  // Update lanes
  lanes.forEach(lane => {
    // Move cars
    if (lane.type === 'road') {
      lane.moving.forEach(car => {
        car.x += car.speed * 0.016 * 60;
        // Wrap
        const totalW = COLS + 4;
        if (car.speed > 0 && car.x > COLS + 2) car.x = -2 - car.len;
        if (car.speed < 0 && car.x < -2 - car.len) car.x = COLS + 2;
      });
    }
    // Trains
    if (lane.type === 'rail') {
      if (!lane.trainActive) {
        lane.trainTimer -= 1;
        if (lane.trainTimer < 60 && !lane.trainWarning) {
          lane.trainWarning = true;
        }
        if (lane.trainTimer <= 0) {
          lane.trainActive = true;
          lane.trainX = lane.trainSpeed > 0 ? -lane.trainLen - 2 : COLS + 2;
        }
      } else {
        lane.trainX += lane.trainSpeed * 0.016 * 60;
        if ((lane.trainSpeed > 0 && lane.trainX > COLS + 5) || (lane.trainSpeed < 0 && lane.trainX < -lane.trainLen - 5)) {
          lane.trainActive = false;
          lane.trainWarning = false;
          lane.trainTimer = 120 + Math.random() * 240;
          lane.trainX = -15;
        }
      }
    }

    // Collect coins
    lane.coins.forEach(c => {
      if (!c.collected && c.col === playerCol && lane.row === playerRow) {
        c.collected = true;
        coins++;
        spawnParticles(c.col * TILE + TILE/2, rowToScreen(lane.row) + TILE/2, 8, '#facc15', 3);
      }
    });
  });

  // Collision check
  checkCollision();

  // Particles
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15;
    p.life--;
  });
  particles = particles.filter(p => p.life > 0);

  updateHUD();
}

function checkCollision() {
  const lane = lanes.find(l => l.row === playerRow);
  if (!lane) return;

  if (lane.type === 'road') {
    lane.moving.forEach(car => {
      const carLeft = car.x;
      const carRight = car.x + car.len;
      const pc = playerCol + 0.5;
      if (pc > carLeft + 0.15 && pc < carRight - 0.15) {
        die('Srazilo tě auto!');
      }
    });
  }

  if (lane.type === 'rail' && lane.trainActive) {
    const tl = lane.trainX;
    const tr = lane.trainX + lane.trainLen;
    const pc = playerCol + 0.5;
    if (pc > tl + 0.15 && pc < tr - 0.15) {
      die('Srazil tě vlak!');
    }
  }
}

function die(reason) {
  if (!playerAlive) return;
  playerAlive = false;
  deathReason = reason;
  state = 'dead';

  // Save best
  if (score > best) {
    best = score;
    try { localStorage.setItem('pista_best', best); } catch(e){}
  }

  // Death particles
  spawnParticles(playerTargetX, H * 0.65, 20, '#ef4444', 4);

  // Show death screen after delay
  setTimeout(() => showDeathScreen(), 800);
}

/* ─── DRAW ─── */

function rowToScreen(row) {
  return H * 0.65 - (row - cameraY) * TILE;
}

function draw() {
  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  skyGrad.addColorStop(0, '#0f0f23');
  skyGrad.addColorStop(0.4, '#1a1a2e');
  skyGrad.addColorStop(1, '#16213e');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // Stars
  for (let i = 0; i < 30; i++) {
    const sx = (i * 137 + 50) % W;
    const sy = (i * 97 + 30) % (H * 0.4);
    const bright = 0.3 + 0.3 * Math.sin(frameCount * 0.02 + i);
    ctx.fillStyle = `rgba(255,255,255,${bright})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw lanes back to front
  const minVisible = Math.floor(cameraY) - 3;
  const maxVisible = Math.ceil(cameraY) + ROWS_VISIBLE + 3;

  for (let r = minVisible; r <= maxVisible; r++) {
    const lane = lanes.find(l => l.row === r);
    if (!lane) continue;
    const y = rowToScreen(r);
    if (y > H + TILE * 2 || y < -TILE * 3) continue;
    drawLane(lane, y);
  }

  // Draw player
  if (playerAlive || frameCount % 10 < 5) {
    drawPlayer();
  }

  // Particles
  particles.forEach(p => {
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Combo display
  if (combo >= 3 && comboTimer > 0) {
    const cd = document.getElementById('combo-display');
    cd.textContent = `${combo}x COMBO!`;
    cd.classList.add('show');
    setTimeout(() => cd.classList.remove('show'), 1000);
  }
}

function drawLane(lane, y) {
  const w = COLS * TILE;
  const xOffset = (W - w) / 2;

  if (lane.type === 'safe') {
    if (lane.subtype === 'grass') {
      ctx.fillStyle = lane.row % 2 === 0 ? C.grass1 : C.grass2;
      ctx.fillRect(0, y, W, TILE + 1);
    } else {
      ctx.fillStyle = lane.row % 2 === 0 ? C.sidewalk : C.sidewalk2;
      ctx.fillRect(0, y, W, TILE + 1);
      // Sidewalk pattern
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i < COLS; i++) {
        ctx.strokeRect(xOffset + i * TILE + 2, y + 2, TILE - 4, TILE - 4);
      }
    }

    // Decorations
    lane.decoration.forEach(d => {
      const dx = xOffset + d.col * TILE + TILE / 2;
      const dy = y + TILE;
      if (d.type === 'tree') drawTree(dx, dy);
      else if (d.type === 'building') drawBuilding(dx, dy, d);
      else if (d.type === 'bush') drawBush(dx, dy);
    });

    // Coins
    lane.coins.forEach(c => {
      if (!c.collected) drawCoin(xOffset + c.col * TILE + TILE / 2, y + TILE / 2);
    });
  }

  if (lane.type === 'road') {
    ctx.fillStyle = C.road;
    ctx.fillRect(0, y, W, TILE + 1);
    // Road lines
    ctx.strokeStyle = C.roadLine;
    ctx.lineWidth = 1;
    ctx.setLineDash([TILE * 0.4, TILE * 0.3]);
    ctx.beginPath();
    ctx.moveTo(0, y + TILE / 2);
    ctx.lineTo(W, y + TILE / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Cars
    lane.moving.forEach(car => {
      const cx = xOffset + car.x * TILE;
      drawCar(cx, y, car, TILE);
    });

    // Coins
    lane.coins.forEach(c => {
      if (!c.collected) drawCoin(xOffset + c.col * TILE + TILE / 2, y + TILE / 2);
    });
  }

  if (lane.type === 'rail') {
    ctx.fillStyle = C.rail;
    ctx.fillRect(0, y, W, TILE + 1);
    // Rails
    ctx.strokeStyle = C.railTrack;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y + TILE * 0.3); ctx.lineTo(W, y + TILE * 0.3);
    ctx.moveTo(0, y + TILE * 0.7); ctx.lineTo(W, y + TILE * 0.7);
    ctx.stroke();
    // Sleepers
    ctx.fillStyle = '#5a4030';
    for (let i = 0; i < W / TILE + 1; i++) {
      ctx.fillRect(i * TILE * 0.8, y + TILE * 0.2, TILE * 0.15, TILE * 0.6);
    }

    // Warning
    if (lane.trainWarning && !lane.trainActive) {
      ctx.fillStyle = frameCount % 20 < 10 ? 'rgba(239,68,68,0.3)' : 'transparent';
      ctx.fillRect(0, y, W, TILE);
      // Warning lights
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = frameCount % 16 < 8 ? '#ef4444' : '#666';
        ctx.beginPath();
        ctx.arc(xOffset + (i * 4 + 0.5) * TILE, y + TILE / 2, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Train
    if (lane.trainActive) {
      const tx = xOffset + lane.trainX * TILE;
      drawTrain(tx, y, lane.trainLen * TILE, TILE, lane.trainSpeed > 0);
    }

    // Coins
    lane.coins.forEach(c => {
      if (!c.collected) drawCoin(xOffset + c.col * TILE + TILE / 2, y + TILE / 2);
    });
  }
}

function drawPlayer() {
  const w = COLS * TILE;
  const xOff = (W - w) / 2;
  const px = xOff + playerVisualX - TILE / 2;
  const py = playerVisualY + playerBob - TILE * 0.3;
  const sz = TILE * 0.8;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(xOff + playerVisualX, playerVisualY + TILE * 0.4, sz * 0.4, sz * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = '#e67e22';
  roundRect(px + sz * 0.2, py + sz * 0.45, sz * 0.6, sz * 0.45, 3);

  // Head
  ctx.fillStyle = '#fdd49e';
  ctx.beginPath();
  ctx.arc(px + sz / 2, py + sz * 0.3, sz * 0.25, 0, Math.PI * 2);
  ctx.fill();

  // Hard hat
  ctx.fillStyle = C.player;
  ctx.beginPath();
  ctx.arc(px + sz / 2, py + sz * 0.22, sz * 0.28, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(px + sz * 0.15, py + sz * 0.2, sz * 0.7, sz * 0.08);

  // Eyes
  const eyeOff = playerDir === 1 ? 3 : playerDir === 3 ? -3 : 0;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(px + sz * 0.4 + eyeOff, py + sz * 0.32, 2, 0, Math.PI * 2);
  ctx.arc(px + sz * 0.6 + eyeOff, py + sz * 0.32, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawTree(x, y) {
  const s = TILE * 0.35;
  // Trunk
  ctx.fillStyle = C.treeTrunk;
  ctx.fillRect(x - 3, y - s * 1.5, 6, s * 1.5);
  // Canopy
  ctx.fillStyle = C.tree;
  ctx.beginPath();
  ctx.arc(x, y - s * 1.8, s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.treeTop;
  ctx.beginPath();
  ctx.arc(x - 2, y - s * 2, s * 0.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawBush(x, y) {
  ctx.fillStyle = '#2d7a2d';
  ctx.beginPath();
  ctx.arc(x, y - TILE * 0.2, TILE * 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#45a045';
  ctx.beginPath();
  ctx.arc(x + 3, y - TILE * 0.25, TILE * 0.15, 0, Math.PI * 2);
  ctx.fill();
}

function drawBuilding(x, y, d) {
  const bw = TILE * 0.8;
  const bh = TILE * (1.5 + d.height);
  const colors = [C.building1, C.building2, C.building3, C.building4];
  ctx.fillStyle = colors[Math.abs(d.col) % 4];
  roundRect(x - bw/2, y - bh, bw, bh, 2);
  // Windows
  const rows = Math.floor(bh / (TILE * 0.35));
  const cols = 2;
  for (let wr = 0; wr < rows; wr++) {
    for (let wc = 0; wc < cols; wc++) {
      const lit = pseudoRandom(d.col * 100 + wr * 10 + wc + frameCount * 0.001) > 0.4;
      ctx.fillStyle = lit ? C.window : C.windowOff;
      ctx.fillRect(x - bw/2 + 6 + wc * (bw * 0.4), y - bh + 8 + wr * (TILE * 0.35), bw * 0.25, TILE * 0.2);
    }
  }
}

function drawCar(x, y, car, tile) {
  const cw = tile * car.len * 0.9;
  const ch = tile * 0.65;
  const cy = y + (tile - ch) / 2;
  const colors = [C.car1, C.car2, C.car3, C.car4, C.car5];
  const col = colors[car.type];

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  roundRect(x + 3, cy + 3, cw, ch, 4);

  // Body
  ctx.fillStyle = col;
  roundRect(x, cy, cw, ch, 4);

  // Windshield
  ctx.fillStyle = 'rgba(150,200,255,0.4)';
  const wDir = car.speed > 0 ? 0.55 : 0.05;
  roundRect(x + cw * wDir, cy + 3, cw * 0.35, ch - 6, 2);

  // Headlights
  ctx.fillStyle = car.speed > 0 ? '#facc15' : '#ef4444';
  const hlx = car.speed > 0 ? x + cw - 3 : x + 1;
  ctx.beginPath();
  ctx.arc(hlx, cy + ch * 0.25, 2.5, 0, Math.PI * 2);
  ctx.arc(hlx, cy + ch * 0.75, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawTrain(x, y, tw, th, goingRight) {
  const ch = th * 0.8;
  const cy = y + (th - ch) / 2;

  // Body
  ctx.fillStyle = C.train;
  ctx.fillRect(x, cy, tw, ch);

  // Stripe
  ctx.fillStyle = C.trainStripe;
  ctx.fillRect(x, cy + ch * 0.4, tw, ch * 0.15);

  // Front
  const fx = goingRight ? x + tw - 8 : x;
  ctx.fillStyle = C.trainFront;
  ctx.fillRect(fx, cy, 8, ch);

  // Windows
  ctx.fillStyle = 'rgba(200,230,255,0.5)';
  for (let i = 0; i < tw / 25; i++) {
    ctx.fillRect(x + 15 + i * 25, cy + 3, 15, ch * 0.35);
  }
}

function drawCoin(x, y) {
  const r = TILE * 0.2;
  const pulse = 1 + Math.sin(frameCount * 0.1) * 0.15;

  ctx.fillStyle = C.coin;
  ctx.beginPath();
  ctx.arc(x, y, r * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = C.coinShine;
  ctx.beginPath();
  ctx.arc(x - r * 0.2, y - r * 0.2, r * 0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#b38600';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, r * pulse, 0, Math.PI * 2);
  ctx.stroke();

  // € sign
  ctx.fillStyle = '#b38600';
  ctx.font = `bold ${r}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('€', x + 0.5, y + 1);
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.fill();
}

/* ─── PARTICLES ─── */

function spawnParticles(x, y, n, color, spd) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * spd + 1;
    particles.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 2,
      size: 1 + Math.random() * 3,
      color,
      life: 20 + Math.random() * 20,
      maxLife: 40
    });
  }
}

/* ─── UI ─── */

function updateHUD() {
  document.getElementById('hud-score').textContent = score;
  document.getElementById('hud-coins').textContent = coins;
  document.getElementById('hud-best').textContent = best;
}

function hideOverlay() {
  document.getElementById('overlay').classList.add('hidden');
}

function showMenu(isDeath) {
  const ov = document.getElementById('overlay');
  ov.classList.remove('hidden');
  document.getElementById('ov-icon').textContent = isDeath ? '🚔' : '👷';
  document.getElementById('ov-title').textContent = isDeath ? 'CHYTILI TĚ!' : 'IMIGRANT PIŠTA';
  document.getElementById('ov-sub').textContent = isDeath ? deathReason : 'Přeběhni město, vyhni se celníkům,\nsbírej peníze a utíkej!';
  document.getElementById('btn-start').textContent = isDeath ? 'ZKUSIT ZNOVU' : 'ZAČÍT HRU';
  document.getElementById('ov-hint').textContent = isDeath ? 'Klepni kamkoli nebo stiskni tlačítko' : 'Swipe nebo tap pro pohyb · šipky na PC';
  const scores = document.getElementById('ov-scores');
  if (isDeath) {
    scores.style.display = 'flex';
    document.getElementById('ov-score-val').textContent = score;
    document.getElementById('ov-coins-val').textContent = coins;
    document.getElementById('ov-best-val').textContent = best;
  } else {
    scores.style.display = best > 0 ? 'flex' : 'none';
    document.getElementById('ov-score-val').textContent = best;
    document.getElementById('ov-coins-val').textContent = '−';
    document.getElementById('ov-best-val').textContent = best;
  }
}

function showDeathScreen() {
  showMenu(true);
}

function haptic() { try { navigator.vibrate?.(8); } catch(e){} }

/* ─── GAME LOOP ─── */

function loop() {
  ensureLanes();
  update();
  draw();
  requestAnimationFrame(loop);
}

/* ─── BOOT ─── */

resize();
window.addEventListener('resize', resize);
showMenu(false);
updateHUD();
loop();
