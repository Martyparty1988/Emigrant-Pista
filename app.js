/* ═══════════════════════════════════════════════════
   IMIGRANT PIŠTA v5 — 3D Crossy Road (Three.js)
   Zones, Water, Power-ups, Characters, Achievements
   ═══════════════════════════════════════════════════ */

/* ─── AUDIO ENGINE (Web Audio API) ─── */
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;
function initAudio(){ if(!audioCtx) audioCtx = new AudioCtx(); }
function playTone(freq, dur, type='square', vol=0.08){
  if(!audioCtx) return;
  const o=audioCtx.createOscillator(), g=audioCtx.createGain();
  o.type=type; o.frequency.value=freq;
  g.gain.setValueAtTime(vol, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime+dur);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime+dur);
}
function sfxHop(){ playTone(520,0.08,'square',0.06); playTone(680,0.08,'square',0.04); }
function sfxCoin(){ playTone(880,0.1,'sine',0.07); setTimeout(()=>playTone(1100,0.12,'sine',0.06),60); }
function sfxDie(){ playTone(200,0.3,'sawtooth',0.1); playTone(120,0.4,'sawtooth',0.08); }
function sfxPowerup(){ playTone(660,0.08,'sine',0.06); setTimeout(()=>playTone(880,0.1,'sine',0.06),80); setTimeout(()=>playTone(1100,0.12,'sine',0.06),160); }
function sfxSplash(){ playTone(150,0.2,'sine',0.08); playTone(100,0.3,'sine',0.06); }
function sfxTrain(){ playTone(90,0.6,'sawtooth',0.12); }

/* ─── CHARACTERS ─── */
const CHARACTERS = [
  {id:'worker',  name:'Dělník Pišta',   icon:'👷', color:0xf59e0b, hat:0xf59e0b, price:0,   owned:true},
  {id:'lady',    name:'Marta',          icon:'👩', color:0xec4899, hat:0xec4899, price:50,  owned:false},
  {id:'chef',    name:'Kuchař Pavel',   icon:'👨‍🍳', color:0xffffff, hat:0xffffff, price:100, owned:false},
  {id:'punk',    name:'Rebel Tomáš',    icon:'🧑‍🎤', color:0x8b5cf6, hat:0x8b5cf6, price:150, owned:false},
  {id:'ninja',   name:'Ninja Yuki',     icon:'🥷', color:0x1e293b, hat:0x1e293b, price:250, owned:false},
  {id:'santa',   name:'Mikuláš',        icon:'🎅', color:0xef4444, hat:0xef4444, price:300, owned:false},
  {id:'alien',   name:'Mimozemšťan',    icon:'👽', color:0x22c55e, hat:0x22c55e, price:500, owned:false},
  {id:'king',    name:'Král Praha',     icon:'🤴', color:0xeab308, hat:0xeab308, price:1000,owned:false},
];
let selectedChar = 'worker';

/* ─── ACHIEVEMENTS ─── */
const ACHIEVEMENTS = [
  {id:'first',  name:'První kroky',     desc:'Dosáhni skóre 10',         icon:'🐣', cond:s=>s.best>=10, reward:5},
  {id:'run50',  name:'Maratonec',       desc:'Dosáhni skóre 50',         icon:'🏃', cond:s=>s.best>=50, reward:15},
  {id:'run100', name:'Sprinter',        desc:'Dosáhni skóre 100',        icon:'⚡', cond:s=>s.best>=100, reward:30},
  {id:'rich',   name:'Boháč',           desc:'Nasbírej celkem 100 mincí',icon:'💎', cond:s=>s.totalCoins>=100, reward:20},
  {id:'mega',   name:'Milionář',        desc:'Nasbírej celkem 500 mincí',icon:'👑', cond:s=>s.totalCoins>=500, reward:50},
  {id:'combo5', name:'Combo!',          desc:'Dosáhni 5x combo',         icon:'🔥', cond:s=>s.maxCombo>=5, reward:10},
  {id:'combo10',name:'Combo Master',    desc:'Dosáhni 10x combo',        icon:'💥', cond:s=>s.maxCombo>=10, reward:25},
  {id:'water',  name:'Námořník',        desc:'Přejeď 20 vodních řádků',  icon:'🚢', cond:s=>s.waterCrossed>=20, reward:15},
  {id:'suburb', name:'Předměstí',       desc:'Dostaň se do předměstí',   icon:'🏘️', cond:s=>s.best>=20, reward:10},
  {id:'industry',name:'Průmysl',        desc:'Dostaň se do průmyslové',  icon:'🏭', cond:s=>s.best>=45, reward:20},
  {id:'harbor', name:'Přístav',         desc:'Dostaň se do přístavu',    icon:'⚓', cond:s=>s.best>=70, reward:30},
  {id:'plays10',name:'Závislák',        desc:'Odehraj 10 her',           icon:'🎮', cond:s=>s.plays>=10, reward:10},
];

/* ─── ZONES ─── */
const ZONES = [
  {name:'Centrum',     start:0,  sky1:0x0f172a, sky2:0x1e293b, ground:0x3f3f5a, accent:0xfacc15, trees:true,  buildings:true },
  {name:'Předměstí',   start:20, sky1:0x134e4a, sky2:0x1a3a2e, ground:0x4a6b3a, accent:0x4ade80, trees:true,  buildings:false},
  {name:'Průmyslová',  start:45, sky1:0x1e1e2e, sky2:0x2a1a1a, ground:0x4a4a4a, accent:0xfb923c, trees:false, buildings:true },
  {name:'Přístav',     start:70, sky1:0x0c1929, sky2:0x1a3a5e, ground:0x3a5070, accent:0x38bdf8, trees:false, buildings:false},
];

/* ─── POWER-UPS ─── */
const POWERUP_TYPES = [
  {id:'speed',  name:'Rychlost',  icon:'⚡', color:0xfacc15, dur:300, desc:'Dvojnásobná rychlost pohybu'},
  {id:'invis',  name:'Neviditelnost', icon:'👻', color:0xc084fc, dur:250, desc:'Auta tě nevidí'},
  {id:'magnet', name:'Magnet',    icon:'🧲', color:0xef4444, dur:350, desc:'Přitahuje mince'},
  {id:'shield', name:'Štít',      icon:'🛡️', color:0x38bdf8, dur:1,   desc:'Přežiješ 1 zásah'},
];

/* ─── GLOBALS ─── */
const COLS = 9, TILE = 1, PLAYER_START_COL = 4;
let scene, camera, renderer, clock;
let state = 'menu'; // menu | playing | dead
let score=0, coins=0, combo=0, comboTimer=0, frameCount=0;
let playerRow=0, playerCol=PLAYER_START_COL;
let playerMesh, playerTargetX, playerTargetZ;
let playerBob=0, playerDir=0, playerAlive=true;
let cameraTargetZ=0, moveFrame=0;
let lanes=[], laneMeshes=new Map(), pooledMeshes=[];
let activePowerups=[], deathReason='';
let currentZone=ZONES[0], lastZoneName='';

// Persistent stats
let stats = {best:0, totalCoins:0, maxCombo:0, waterCrossed:0, plays:0, coins:0, achievements:[], characters:['worker']};
try{ const s=localStorage.getItem('pista5'); if(s) stats=JSON.parse(s); } catch(e){}
function saveStats(){ try{localStorage.setItem('pista5',JSON.stringify(stats))}catch(e){} }

// Sync character ownership
CHARACTERS.forEach(c=>{ c.owned = stats.characters.includes(c.id); });

/* ─── THREE.JS SETUP ─── */
function initThree(){
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0f172a, 8, 22);

  camera = new THREE.PerspectiveCamera(55, window.innerWidth/window.innerHeight, 0.1, 50);
  camera.position.set(0, 8, 6);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({canvas:document.getElementById('game'), antialias:true, alpha:false});
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x0f172a);

  // Lights
  const amb = new THREE.AmbientLight(0x8899bb, 0.5);
  scene.add(amb);
  const dir = new THREE.DirectionalLight(0xffeedd, 0.7);
  dir.position.set(5, 10, 5);
  dir.castShadow = true;
  dir.shadow.mapSize.set(1024,1024);
  dir.shadow.camera.near=0.5; dir.shadow.camera.far=30;
  dir.shadow.camera.left=-12; dir.shadow.camera.right=12;
  dir.shadow.camera.top=12; dir.shadow.camera.bottom=-12;
  scene.add(dir);

  const hemi = new THREE.HemisphereLight(0x6688cc, 0x445533, 0.3);
  scene.add(hemi);

  clock = new THREE.Clock();

  createPlayer();
}

/* ─── PLAYER (character-colored) ─── */
function createPlayer(){
  if(playerMesh) scene.remove(playerMesh);
  const ch = CHARACTERS.find(c=>c.id===selectedChar) || CHARACTERS[0];
  const group = new THREE.Group();

  // Body
  const bodyGeo = new THREE.BoxGeometry(0.5, 0.55, 0.35);
  const bodyMat = new THREE.MeshLambertMaterial({color: ch.color});
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.35;
  body.castShadow = true;
  group.add(body);

  // Head
  const headGeo = new THREE.SphereGeometry(0.2, 12, 8);
  const headMat = new THREE.MeshLambertMaterial({color: 0xfdd49e});
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 0.78;
  head.castShadow = true;
  group.add(head);

  // Hat
  const hatGeo = new THREE.CylinderGeometry(0.25, 0.28, 0.12, 12);
  const hatMat = new THREE.MeshLambertMaterial({color: ch.hat});
  const hat = new THREE.Mesh(hatGeo, hatMat);
  hat.position.y = 0.92;
  group.add(hat);

  // Eyes
  const eyeGeo = new THREE.SphereGeometry(0.04, 6, 4);
  const eyeMat = new THREE.MeshBasicMaterial({color:0x111111});
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.07, 0.8, 0.18);
  group.add(eyeL);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(0.07, 0.8, 0.18);
  group.add(eyeR);

  // Shadow disc
  const shadowGeo = new THREE.CircleGeometry(0.3, 12);
  const shadowMat = new THREE.MeshBasicMaterial({color:0x000000, transparent:true, opacity:0.25});
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI/2;
  shadow.position.y = 0.01;
  group.add(shadow);

  playerMesh = group;
  scene.add(playerMesh);
}

/* ─── LANE GENERATION ─── */
function getZone(row){ return [...ZONES].reverse().find(z=>row>=z.start) || ZONES[0]; }

function makeLane(row){
  const zone = getZone(row);
  const diff = Math.min(1, Math.max(0, (row-5)/120));

  if(row===0) return {type:'safe', sub:'grass', row, zone, moving:[], coins:[], powerup:null, deco:[], logs:[]};

  const r = seededRand(row);
  let type;
  if(r < 0.3) type='safe';
  else if(r < 0.55) type='road';
  else if(r < 0.7) type='rail';
  else type='water';

  // Don't start with water in first 5 rows
  if(row < 5 && type==='water') type='safe';
  // More water near harbor
  if(zone.name==='Přístav' && r < 0.55) type='water';

  const lane = {type, sub:type, row, zone, moving:[], coins:[], powerup:null, deco:[], logs:[]};

  if(type==='safe'){
    // Decorations (visual only, no collision)
    const n = 1 + Math.floor(Math.random()*2);
    for(let i=0;i<n;i++){
      const col = Math.random()<0.5 ? Math.floor(Math.random()*2) : 7+Math.floor(Math.random()*2);
      const dtype = zone.trees ? (Math.random()<0.6?'tree':'bush') : (zone.buildings?'building':'crate');
      if(!lane.deco.find(d=>d.col===col)) lane.deco.push({col, type:dtype});
    }
    // Coins
    if(Math.random()<0.3){
      const cc=3+Math.floor(Math.random()*3);
      lane.coins.push({col:cc, collected:false});
    }
    // Power-up (rare)
    if(Math.random()<0.04 && row>5){
      const puType = POWERUP_TYPES[Math.floor(Math.random()*POWERUP_TYPES.length)];
      lane.powerup = {col:3+Math.floor(Math.random()*3), type:puType, collected:false};
    }
  }

  if(type==='road'){
    const speed = (0.3 + Math.random()*0.6 + diff*1.2) * (Math.random()<0.5?1:-1);
    const count = Math.max(1, Math.floor(1 + diff*2 + Math.random()*0.5));
    for(let i=0;i<count;i++){
      const carType = Math.floor(Math.random()*5);
      lane.moving.push({
        x: i*(COLS/Math.max(1,count)*1.3) + Math.random()*1.5,
        speed, type:carType, len: carType>=3 ? 1.8 : 1
      });
    }
    if(Math.random()<0.25) lane.coins.push({col:3+Math.floor(Math.random()*3), collected:false});
  }

  if(type==='rail'){
    lane.trainSpeed = (2 + diff*3) * (Math.random()<0.5?1:-1);
    lane.trainX = -20;
    lane.trainTimer = 180 + Math.random()*200;
    lane.trainActive = false;
    lane.trainWarning = false;
    lane.trainLen = 10 + Math.floor(Math.random()*5);
    if(Math.random()<0.2) lane.coins.push({col:3+Math.floor(Math.random()*3), collected:false});
  }

  if(type==='water'){
    const logCount = 2 + Math.floor(Math.random()*2);
    const logSpeed = (0.3 + Math.random()*0.4 + diff*0.3) * (Math.random()<0.5?1:-1);
    for(let i=0;i<logCount;i++){
      lane.logs.push({
        x: i * (COLS/logCount) + Math.random()*2,
        speed: logSpeed,
        len: 1.5 + Math.random()*1.5
      });
    }
    if(Math.random()<0.3) lane.coins.push({col:3+Math.floor(Math.random()*3), collected:false});
  }

  return lane;
}

function seededRand(s){ s=((s*9301+49297)%233280); return s/233280; }

function ensureLanes(){
  const min = playerRow-5, max = playerRow+25;
  lanes = lanes.filter(l=>l.row>=min && l.row<=max);
  for(let r=min;r<=max;r++){
    if(!lanes.find(l=>l.row===r)) lanes.push(makeLane(r));
  }
  lanes.sort((a,b)=>a.row-b.row);
}

/* ─── 3D LANE BUILDING ─── */
function buildLaneMesh(lane){
  const group = new THREE.Group();
  const z = -lane.row * TILE;
  const zone = lane.zone;
  const w = COLS;

  if(lane.type==='safe'){
    const color = lane.row%2===0 ? 0x2d6b27 : 0x347a2c;
    const adjustedColor = zone.name==='Průmyslová' ? 0x4a4a4a : (zone.name==='Přístav' ? 0x3a5060 : color);
    const ground = makeBox(w+2, 0.15, 1, adjustedColor);
    ground.position.set(0, -0.075, z);
    ground.receiveShadow = true;
    group.add(ground);

    lane.deco.forEach(d=>{
      const dx = (d.col - COLS/2 + 0.5);
      if(d.type==='tree'){
        const trunk = makeBox(0.15, 0.6, 0.15, 0x5c3a1e);
        trunk.position.set(dx, 0.3, z);
        group.add(trunk);
        const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.35,8,6), new THREE.MeshLambertMaterial({color:0x22a855}));
        canopy.position.set(dx, 0.8, z);
        canopy.castShadow = true;
        group.add(canopy);
      } else if(d.type==='bush'){
        const bush = new THREE.Mesh(new THREE.SphereGeometry(0.2,6,4), new THREE.MeshLambertMaterial({color:0x2d8a3d}));
        bush.position.set(dx, 0.15, z);
        group.add(bush);
      } else if(d.type==='building'){
        const h = 1.2 + Math.random()*1.5;
        const bld = makeBox(0.7, h, 0.7, [0x2c3e6b,0x3d2c5e,0x5e3a3a][Math.floor(Math.random()*3)]);
        bld.position.set(dx, h/2, z);
        bld.castShadow = true;
        group.add(bld);
        // Windows
        for(let wy=0.3;wy<h-0.2;wy+=0.35){
          for(let wx=-0.15;wx<=0.15;wx+=0.3){
            const win = makeBox(0.12, 0.15, 0.01, Math.random()>0.3 ? 0xfacc15 : 0x222233);
            win.position.set(dx+wx, wy, z+0.36);
            group.add(win);
          }
        }
      } else if(d.type==='crate'){
        const cr = makeBox(0.5, 0.4, 0.5, 0x8B6914);
        cr.position.set(dx, 0.2, z);
        cr.castShadow = true;
        group.add(cr);
      }
    });
  }

  if(lane.type==='road'){
    const road = makeBox(w+2, 0.12, 1, 0x3a3a4a);
    road.position.set(0, -0.06, z);
    road.receiveShadow = true;
    group.add(road);
    // Lane lines
    for(let i=-4;i<=4;i+=1.2){
      const line = makeBox(0.4, 0.01, 0.06, 0x555570);
      line.position.set(i, 0.01, z);
      group.add(line);
    }
    // Cars (these will be updated in animate)
    lane.moving.forEach((car,idx)=>{
      const carMesh = makeCar(car);
      carMesh.name = `car_${lane.row}_${idx}`;
      group.add(carMesh);
    });
  }

  if(lane.type==='rail'){
    const rail = makeBox(w+2, 0.12, 1, 0x4a3828);
    rail.position.set(0, -0.06, z);
    rail.receiveShadow = true;
    group.add(rail);
    // Tracks
    const track1 = makeBox(w+2, 0.03, 0.06, 0x999999);
    track1.position.set(0, 0.015, z-0.2);
    group.add(track1);
    const track2 = makeBox(w+2, 0.03, 0.06, 0x999999);
    track2.position.set(0, 0.015, z+0.2);
    group.add(track2);
    // Train mesh (hidden initially)
    const train = makeTrain(lane.trainLen);
    train.visible = false;
    train.name = `train_${lane.row}`;
    group.add(train);
    // Warning light
    const warnLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.1,6,4),
      new THREE.MeshBasicMaterial({color:0xef4444, transparent:true, opacity:0})
    );
    warnLight.position.set(-4, 0.5, z);
    warnLight.name = `warn_${lane.row}`;
    group.add(warnLight);
  }

  if(lane.type==='water'){
    const water = makeBox(w+2, 0.08, 1, 0x1a5276);
    water.position.set(0, -0.05, z);
    group.add(water);
    // Shiny surface
    const surface = makeBox(w+2, 0.01, 1, 0x2178a6);
    surface.material.transparent = true;
    surface.material.opacity = 0.3;
    surface.position.set(0, 0.01, z);
    group.add(surface);
    // Logs
    lane.logs.forEach((log,idx)=>{
      const logMesh = makeLog(log.len);
      logMesh.name = `log_${lane.row}_${idx}`;
      group.add(logMesh);
    });
  }

  // Coins
  lane.coins.forEach((c,idx)=>{
    const coinMesh = makeCoin();
    coinMesh.name = `coin_${lane.row}_${idx}`;
    coinMesh.position.set((c.col - COLS/2 + 0.5), 0.4, z);
    group.add(coinMesh);
  });

  // Power-up
  if(lane.powerup){
    const pu = makePowerupMesh(lane.powerup.type);
    pu.name = `pu_${lane.row}`;
    pu.position.set((lane.powerup.col - COLS/2 + 0.5), 0.5, z);
    group.add(pu);
  }

  return group;
}

function makeBox(w,h,d,color){
  return new THREE.Mesh(
    new THREE.BoxGeometry(w,h,d),
    new THREE.MeshLambertMaterial({color})
  );
}

function makeCar(car){
  const g = new THREE.Group();
  const colors = [0xef4444, 0x3b82f6, 0xa855f7, 0xf97316, 0x22d3ee];
  const col = colors[car.type % colors.length];
  const l = car.len * 0.45;
  // Body
  const body = makeBox(l, 0.35, 0.55, col);
  body.position.y = 0.22;
  body.castShadow = true;
  g.add(body);
  // Roof
  const roof = makeBox(l*0.6, 0.2, 0.45, new THREE.Color(col).multiplyScalar(0.7).getHex());
  roof.position.y = 0.47;
  g.add(roof);
  // Headlights
  const hlMat = new THREE.MeshBasicMaterial({color:0xfff4b0});
  const hl1 = new THREE.Mesh(new THREE.SphereGeometry(0.04,4,3), hlMat);
  hl1.position.set(l/2, 0.15, 0.2);
  g.add(hl1);
  const hl2 = hl1.clone();
  hl2.position.z = -0.2;
  g.add(hl2);
  return g;
}

function makeTrain(len){
  const g = new THREE.Group();
  const tl = len * 0.4;
  const body = makeBox(tl, 0.6, 0.7, 0x64748b);
  body.position.y = 0.35;
  g.add(body);
  const stripe = makeBox(tl, 0.08, 0.72, 0xef4444);
  stripe.position.y = 0.35;
  g.add(stripe);
  const front = makeBox(0.3, 0.65, 0.72, 0xfacc15);
  front.position.set(tl/2, 0.35, 0);
  g.add(front);
  // Windows
  for(let i=-tl/2+0.5; i<tl/2-0.3; i+=0.6){
    const win = makeBox(0.3, 0.2, 0.01, 0xbbddff);
    win.material.transparent=true; win.material.opacity=0.5;
    win.position.set(i, 0.55, 0.36);
    g.add(win);
  }
  return g;
}

function makeLog(len){
  const geo = new THREE.CylinderGeometry(0.18, 0.18, len*0.45, 8);
  geo.rotateZ(Math.PI/2);
  const mat = new THREE.MeshLambertMaterial({color:0x6b3a1e});
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.position.y = 0.1;
  return m;
}

function makeCoin(){
  const geo = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 12);
  geo.rotateZ(Math.PI/2);
  const mat = new THREE.MeshBasicMaterial({color:0xfacc15});
  return new THREE.Mesh(geo, mat);
}

function makePowerupMesh(type){
  const geo = new THREE.OctahedronGeometry(0.2, 0);
  const mat = new THREE.MeshBasicMaterial({color:type.color});
  return new THREE.Mesh(geo, mat);
}

/* ─── SCENE MANAGEMENT ─── */
function rebuildScene(){
  // Remove old lane meshes
  laneMeshes.forEach(m=>scene.remove(m));
  laneMeshes.clear();
  // Build visible lanes
  lanes.forEach(lane=>{
    if(!laneMeshes.has(lane.row)){
      const mesh = buildLaneMesh(lane);
      scene.add(mesh);
      laneMeshes.set(lane.row, mesh);
    }
  });
  // Remove meshes for lanes that no longer exist
  laneMeshes.forEach((mesh, row)=>{
    if(!lanes.find(l=>l.row===row)){
      scene.remove(mesh);
      laneMeshes.delete(row);
    }
  });
}

/* ─── GAME CONTROL ─── */
function startGame(){
  initAudio();
  state='playing';
  score=0; coins=0; combo=0; comboTimer=0; frameCount=0; moveFrame=0;
  playerRow=0; playerCol=PLAYER_START_COL;
  playerAlive=true; playerDir=0;
  activePowerups=[]; deathReason='';
  lanes=[]; laneMeshes.forEach(m=>scene.remove(m)); laneMeshes.clear();
  createPlayer();
  updatePlayerTarget();
  playerMesh.position.set(playerTargetX, 0, playerTargetZ);
  cameraTargetZ = -playerRow;
  camera.position.z = cameraTargetZ + 6;
  ensureLanes();
  rebuildScene();
  stats.plays++;
  saveStats();
  document.getElementById('hud').style.display='flex';
  hideOverlay();
  updateHUD();
}

function updatePlayerTarget(){
  playerTargetX = (playerCol - COLS/2 + 0.5) * TILE;
  playerTargetZ = -playerRow * TILE;
}

/* ─── INPUT ─── */
let touchSX=0, touchSY=0, touchST=0;
const canvas = document.getElementById('game');

function handleInput(dir){
  if(state!=='playing'||!playerAlive) return;
  if(frameCount-moveFrame < 4) return;
  moveFrame = frameCount;

  let nc=playerCol, nr=playerRow;
  if(dir==='up') { nr++; playerDir=0; }
  else if(dir==='down') { nr = Math.max(playerRow-2, nr-1); playerDir=2; }
  else if(dir==='left') { nc--; playerDir=3; }
  else if(dir==='right') { nc++; playerDir=1; }

  if(nc<0||nc>=COLS) return;

  playerCol=nc; playerRow=nr;

  if(nr > score){
    const diff = nr-score;
    score=nr; combo+=diff; comboTimer=80;
    if(combo>stats.maxCombo){ stats.maxCombo=combo; saveStats(); }
  }

  updatePlayerTarget();
  sfxHop();
  haptic();

  // Hop animation
  if(playerMesh){
    playerMesh.__hopT = 0;
  }
}

canvas.addEventListener('touchstart', e=>{
  e.preventDefault();
  const t=e.touches[0];
  touchSX=t.clientX; touchSY=t.clientY; touchST=Date.now();
},{passive:false});

canvas.addEventListener('touchend', e=>{
  e.preventDefault();
  if(state==='dead'){showMenu(true);return;}
  if(state==='menu') return;
  const t=e.changedTouches[0];
  const dx=t.clientX-touchSX, dy=t.clientY-touchSY, dt=Date.now()-touchST;
  // Tap = forward
  if(Math.abs(dx)<25 && Math.abs(dy)<25 && dt<350){ handleInput('up'); return; }
  // Swipe
  if(Math.abs(dx)>Math.abs(dy)) handleInput(dx>0?'right':'left');
  else handleInput(dy<0?'up':'down');
},{passive:false});

// Click also moves forward (for desktop + iOS accessibility)
canvas.addEventListener('click', e=>{
  if(state==='dead'){showMenu(true);return;}
  if(state!=='playing') return;
  // Determine direction from click position
  const rect = canvas.getBoundingClientRect();
  const cx = (e.clientX - rect.left) / rect.width;
  const cy = (e.clientY - rect.top) / rect.height;
  if(cy < 0.4) handleInput('up');
  else if(cy > 0.7) handleInput('down');
  else if(cx < 0.3) handleInput('left');
  else if(cx > 0.7) handleInput('right');
  else handleInput('up'); // center tap = forward
});

document.addEventListener('keydown', e=>{
  if(state==='dead'){showMenu(true);return;}
  if(state==='menu') return;
  const map={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right',' ':'up'};
  if(map[e.key]){e.preventDefault();handleInput(map[e.key]);}
});

document.getElementById('btn-start').onclick=()=>{startGame();};
document.getElementById('btn-shop').onclick=()=>openShop();
document.getElementById('btn-ach').onclick=()=>openAch();
document.getElementById('shop-close').onclick=()=>closeShop();
document.getElementById('ach-close').onclick=()=>closeAch();

/* ─── UPDATE ─── */
function update(){
  if(state!=='playing') return;
  frameCount++;
  const dt = clock.getDelta();

  // Camera follow
  cameraTargetZ = -playerRow + 3;
  camera.position.z += (cameraTargetZ + 6 - camera.position.z)*0.08;
  camera.position.x += (playerTargetX*0.3 - camera.position.x)*0.05;
  const lookZ = camera.position.z - 6;
  camera.lookAt(camera.position.x*0.5, 0, lookZ);

  // Player smooth movement
  if(playerMesh){
    playerMesh.position.x += (playerTargetX - playerMesh.position.x)*0.2;
    playerMesh.position.z += (playerTargetZ - playerMesh.position.z)*0.2;
    // Hop
    if(playerMesh.__hopT !== undefined && playerMesh.__hopT < 1){
      playerMesh.__hopT += 0.08;
      playerMesh.position.y = Math.sin(playerMesh.__hopT * Math.PI) * 0.4;
    } else {
      playerMesh.position.y *= 0.85;
    }
    // Direction
    const angles = [0, Math.PI/2, Math.PI, -Math.PI/2];
    const targetRot = angles[playerDir];
    playerMesh.rotation.y += (targetRot - playerMesh.rotation.y)*0.15;

    // Invisibility visual
    const invis = activePowerups.find(p=>p.id==='invis');
    playerMesh.children.forEach(c=>{ if(c.material) c.material.transparent=!!invis; if(c.material) c.material.opacity=invis?0.35:1; });
  }

  // Zone check
  const newZone = getZone(playerRow);
  if(newZone.name !== lastZoneName){
    lastZoneName = newZone.name;
    currentZone = newZone;
    showZoneBanner(newZone.name);
    scene.fog.color.setHex(newZone.sky1);
    renderer.setClearColor(newZone.sky1);
  }

  // Combo
  if(comboTimer>0){ comboTimer--; if(comboTimer===0) combo=0; }

  // Power-up timers
  activePowerups.forEach(p=>p.dur--);
  activePowerups = activePowerups.filter(p=>p.dur>0);
  updatePowerupUI();

  // Update lane objects
  lanes.forEach(lane=>{
    const mesh = laneMeshes.get(lane.row);
    if(!mesh) return;
    const z = -lane.row * TILE;

    // Cars
    if(lane.type==='road'){
      lane.moving.forEach((car,idx)=>{
        car.x += car.speed * dt;
        if(car.speed>0 && car.x > COLS+3) car.x = -3-car.len;
        if(car.speed<0 && car.x < -3-car.len) car.x = COLS+3;
        const cm = mesh.getObjectByName(`car_${lane.row}_${idx}`);
        if(cm){
          cm.position.set((car.x - COLS/2 + 0.5), 0, z);
          cm.rotation.y = car.speed > 0 ? 0 : Math.PI;
        }
      });
    }

    // Trains
    if(lane.type==='rail'){
      const trainMesh = mesh.getObjectByName(`train_${lane.row}`);
      const warnMesh = mesh.getObjectByName(`warn_${lane.row}`);
      if(!lane.trainActive){
        lane.trainTimer -= 1;
        if(lane.trainTimer<80 && !lane.trainWarning){
          lane.trainWarning=true;
          if(Math.abs(playerRow-lane.row)<8) sfxTrain();
        }
        if(warnMesh) warnMesh.material.opacity = lane.trainWarning ? (Math.sin(frameCount*0.15)*0.5+0.5) : 0;
        if(lane.trainTimer<=0){
          lane.trainActive=true;
          lane.trainX = lane.trainSpeed>0 ? -lane.trainLen-3 : COLS+3;
        }
      } else {
        lane.trainX += lane.trainSpeed * dt;
        if(trainMesh){
          trainMesh.visible = true;
          trainMesh.position.set((lane.trainX - COLS/2), 0, z);
        }
        if((lane.trainSpeed>0 && lane.trainX>COLS+8)||(lane.trainSpeed<0 && lane.trainX<-lane.trainLen-8)){
          lane.trainActive=false; lane.trainWarning=false;
          lane.trainTimer=180+Math.random()*240;
          if(trainMesh) trainMesh.visible=false;
        }
      }
    }

    // Logs
    if(lane.type==='water'){
      lane.logs.forEach((log,idx)=>{
        log.x += log.speed * dt;
        if(log.speed>0 && log.x>COLS+3) log.x=-3-log.len;
        if(log.speed<0 && log.x<-3-log.len) log.x=COLS+3;
        const lm = mesh.getObjectByName(`log_${lane.row}_${idx}`);
        if(lm) lm.position.set((log.x - COLS/2 + 0.5), 0.1, z);
      });
    }

    // Coin rotation
    lane.coins.forEach((c,idx)=>{
      const cm = mesh.getObjectByName(`coin_${lane.row}_${idx}`);
      if(cm && !c.collected){
        cm.rotation.x += 0.05;
        cm.position.y = 0.4 + Math.sin(frameCount*0.05+lane.row)*0.1;
        // Magnet effect
        const mag = activePowerups.find(p=>p.id==='magnet');
        if(mag){
          const dist = Math.abs(c.col-playerCol) + Math.abs(lane.row-playerRow);
          if(dist<3){ c.col += (playerCol-c.col)*0.1; cm.position.x = (c.col-COLS/2+0.5); }
        }
      }
    });

    // Power-up rotation
    if(lane.powerup && !lane.powerup.collected){
      const pm = mesh.getObjectByName(`pu_${lane.row}`);
      if(pm){
        pm.rotation.y += 0.04;
        pm.rotation.x += 0.02;
        pm.position.y = 0.5 + Math.sin(frameCount*0.06)*0.15;
      }
    }

    // Collect coins
    lane.coins.forEach((c,idx)=>{
      if(!c.collected && Math.abs(c.col-playerCol)<0.8 && lane.row===playerRow){
        c.collected=true; coins++; stats.totalCoins++; saveStats();
        sfxCoin();
        const cm = mesh.getObjectByName(`coin_${lane.row}_${idx}`);
        if(cm) cm.visible=false;
      }
    });

    // Collect power-up
    if(lane.powerup && !lane.powerup.collected && lane.powerup.col===playerCol && lane.row===playerRow){
      lane.powerup.collected=true;
      activePowerups.push({...lane.powerup.type});
      sfxPowerup();
      showToast(`${lane.powerup.type.icon} ${lane.powerup.type.name}!`);
      const pm = mesh.getObjectByName(`pu_${lane.row}`);
      if(pm) pm.visible=false;
    }
  });

  // Water check — player on water lane
  const playerLane = lanes.find(l=>l.row===playerRow);
  if(playerLane && playerLane.type==='water'){
    const onLog = playerLane.logs.some(log=>{
      const pc = playerCol + 0.5;
      return pc > log.x-0.3 && pc < log.x+log.len+0.3;
    });
    if(onLog){
      // Move with log
      const log = playerLane.logs.find(log=>{
        const pc = playerCol + 0.5;
        return pc > log.x-0.3 && pc < log.x+log.len+0.3;
      });
      if(log){
        playerTargetX += log.speed * dt;
        if(playerMesh) playerMesh.position.x += log.speed * dt;
        // Update playerCol from position
        playerCol = Math.round(playerTargetX / TILE + COLS/2 - 0.5);
        playerCol = Math.max(0, Math.min(COLS-1, playerCol));
      }
      stats.waterCrossed++;
    } else {
      if(!activePowerups.find(p=>p.id==='shield')){
        sfxSplash();
        die('Spadl jsi do vody!');
      } else {
        activePowerups = activePowerups.filter(p=>p.id!=='shield');
        showToast('🛡️ Štít tě zachránil!');
      }
    }
  }

  // Collision with cars
  if(playerLane && playerLane.type==='road' && !activePowerups.find(p=>p.id==='invis')){
    playerLane.moving.forEach(car=>{
      const pc = playerCol + 0.5;
      if(pc > car.x+0.2 && pc < car.x+car.len-0.2){
        if(!activePowerups.find(p=>p.id==='shield')){
          die('Srazilo tě auto!');
        } else {
          activePowerups = activePowerups.filter(p=>p.id!=='shield');
          showToast('🛡️ Štít tě zachránil!');
        }
      }
    });
  }

  // Train collision
  if(playerLane && playerLane.type==='rail' && playerLane.trainActive && !activePowerups.find(p=>p.id==='invis')){
    const pc = playerCol+0.5;
    if(pc > playerLane.trainX+0.2 && pc < playerLane.trainX+playerLane.trainLen-0.2){
      die('Srazil tě vlak!');
    }
  }

  // Rebuild scene for new lanes
  rebuildScene();
  updateHUD();
  checkAchievements();
}

function die(reason){
  if(!playerAlive) return;
  playerAlive=false; deathReason=reason; state='dead';
  sfxDie();
  if(score>stats.best){ stats.best=score; }
  stats.coins += coins;
  saveStats();
  setTimeout(()=>showMenu(true), 800);
}

/* ─── ACHIEVEMENTS ─── */
function checkAchievements(){
  const s = {...stats, best:Math.max(stats.best, score)};
  ACHIEVEMENTS.forEach(a=>{
    if(!stats.achievements.includes(a.id) && a.cond(s)){
      stats.achievements.push(a.id);
      stats.coins += a.reward;
      saveStats();
      showToast(`🏆 ${a.name}! +${a.reward}💰`);
    }
  });
}

/* ─── UI ─── */
function updateHUD(){
  document.getElementById('h-score').textContent=score;
  document.getElementById('h-coins').textContent=coins;
  document.getElementById('h-best').textContent=stats.best;
  // Combo
  const cd = document.getElementById('combo');
  if(combo>=3 && comboTimer>0){
    cd.textContent=`${combo}x COMBO!`;
    if(!cd.classList.contains('show')){cd.classList.add('show'); setTimeout(()=>cd.classList.remove('show'),800);}
  }
}

function updatePowerupUI(){
  const bar = document.getElementById('powerup-bar');
  bar.innerHTML = activePowerups.map(p=>`<div class="pu-active">${p.icon} ${Math.ceil(p.dur/60)}s</div>`).join('');
}

function hideOverlay(){ document.getElementById('overlay').classList.add('hidden'); }

function showMenu(isDeath){
  const ov=document.getElementById('overlay');
  ov.classList.remove('hidden');
  document.getElementById('ov-icon').textContent=isDeath?'🚔':'👷';
  document.getElementById('ov-title').textContent=isDeath?'CHYTILI TĚ!':'IMIGRANT PIŠTA';
  document.getElementById('ov-sub').textContent=isDeath?deathReason:'Přeběhni město, přeskoč řeku,\nsbírej mince a utíkej!';
  document.getElementById('btn-start').textContent=isDeath?'ZKUSIT ZNOVU':'HRÁT';
  document.getElementById('ov-hint').textContent='Klikni kamkoli nebo swipni · šipky na PC';
  const sc=document.getElementById('ov-scores');
  if(isDeath||stats.best>0){
    sc.style.display='flex';
    document.getElementById('os-score').textContent=isDeath?score:stats.best;
    document.getElementById('os-coins').textContent=isDeath?coins:'—';
    document.getElementById('os-best').textContent=stats.best;
  } else sc.style.display='none';
  document.getElementById('hud').style.display='none';
}

function showZoneBanner(name){
  const b=document.getElementById('zone-banner');
  b.textContent='📍 '+name;
  b.classList.add('show');
  setTimeout(()=>b.classList.remove('show'),3000);
}

function showToast(text){
  const t=document.createElement('div');
  t.className='toast';
  t.innerHTML=text;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),3000);
}

/* ─── SHOP ─── */
function openShop(){
  document.getElementById('shop-panel').classList.add('open');
  renderShop();
}
function closeShop(){ document.getElementById('shop-panel').classList.remove('open'); }

function renderShop(){
  document.getElementById('shop-coins').textContent='💰 '+stats.coins;
  const grid=document.getElementById('shop-grid');
  grid.innerHTML=CHARACTERS.map(c=>{
    const owned=stats.characters.includes(c.id);
    const sel=c.id===selectedChar;
    const canBuy=stats.coins>=c.price;
    return `<div class="char-card ${sel?'selected':''} ${!owned?'locked':''}" onclick="buyOrSelect('${c.id}')">
      <div class="char-icon">${c.icon}</div>
      <div class="char-name">${c.name}</div>
      ${owned ? (sel ? '<div class="char-owned">✓ Vybráno</div>' : '<div class="char-owned">Vlastníš</div>') :
        `<div class="char-price">${canBuy?'':'🔒 '}${c.price} 💰</div>`}
    </div>`;
  }).join('');
}

window.buyOrSelect = function(id){
  const c=CHARACTERS.find(x=>x.id===id);
  if(!c) return;
  if(stats.characters.includes(id)){
    selectedChar=id;
  } else if(stats.coins>=c.price){
    stats.coins-=c.price;
    stats.characters.push(id);
    c.owned=true;
    selectedChar=id;
    saveStats();
    showToast(`${c.icon} ${c.name} odemčen!`);
  }
  renderShop();
};

/* ─── ACHIEVEMENTS UI ─── */
function openAch(){
  document.getElementById('ach-panel').classList.add('open');
  renderAch();
}
function closeAch(){ document.getElementById('ach-panel').classList.remove('open'); }

function renderAch(){
  const done=stats.achievements.length;
  document.getElementById('ach-count').textContent=`${done}/${ACHIEVEMENTS.length}`;
  const grid=document.getElementById('ach-grid');
  grid.innerHTML=ACHIEVEMENTS.map(a=>{
    const unlocked=stats.achievements.includes(a.id);
    return `<div class="ach-item ${unlocked?'done':'locked'}">
      <div class="ach-ic">${unlocked?a.icon:'🔒'}</div>
      <div class="ach-info"><div class="ach-name">${a.name}</div><div class="ach-desc">${a.desc}</div></div>
      <div class="ach-reward">+${a.reward}💰</div>
    </div>`;
  }).join('');
}

function haptic(){ try{navigator.vibrate?.(6);}catch(e){} }

/* ─── RENDER LOOP ─── */
function animate(){
  requestAnimationFrame(animate);
  ensureLanes();
  update();
  renderer.render(scene, camera);
}

/* ─── INIT ─── */
function init(){
  initThree();
  showMenu(false);
  animate();
}

window.addEventListener('resize',()=>{
  if(!camera||!renderer) return;
  camera.aspect=window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
});

init();
