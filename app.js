/* IMIGRANT PIŠTA v5 — Crossy Road (Three.js isometric)
   PATCH: predictive collisions + anti-spam input + mid-hop collision check
   + player visual layers + head hop rotation + player point light
   + simple particles (splash/coin) via THREE.Points
*/

/* ─── AUDIO ─── */
const AudioCtx=window.AudioContext||window.webkitAudioContext;let audioCtx;
function initAudio(){if(!audioCtx)audioCtx=new AudioCtx();}
function tone(f,d,t='square',v=0.06){if(!audioCtx)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=t;o.frequency.value=f;g.gain.setValueAtTime(v,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+d);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+d);}
function sfxHop(){tone(480,0.07);setTimeout(()=>tone(640,0.06),40);}
function sfxCoin(){tone(880,0.08,'sine');setTimeout(()=>tone(1200,0.1,'sine'),50);}
function sfxDie(){tone(180,0.3,'sawtooth',0.1);tone(100,0.4,'sawtooth',0.07);}
function sfxPU(){tone(660,0.06,'sine');setTimeout(()=>tone(880,0.08,'sine'),70);setTimeout(()=>tone(1100,0.1,'sine'),140);}
function sfxSplash(){tone(140,0.2,'sine',0.07);}
function sfxTrain(){tone(80,0.5,'sawtooth',0.1);}

/* ─── DATA ─── */
const CHARS=[
  {id:'worker',name:'Dělník Pišta',icon:'👷',body:0xF59E0B,hat:0xF59E0B,price:0},
  {id:'lady',name:'Marta',icon:'👩',body:0xEC4899,hat:0xEC4899,price:50},
  {id:'chef',name:'Kuchař Pavel',icon:'👨‍🍳',body:0xFFFFFF,hat:0xFFFFFF,price:100},
  {id:'punk',name:'Rebel Tomáš',icon:'🧑‍🎤',body:0x8B5CF6,hat:0x8B5CF6,price:150},
  {id:'ninja',name:'Ninja Yuki',icon:'🥷',body:0x334155,hat:0x334155,price:250},
  {id:'santa',name:'Santa Miki',icon:'🎅',body:0xEF4444,hat:0xFFFFFF,price:300},
  {id:'alien',name:'Mimozemšťan',icon:'👽',body:0x22C55E,hat:0x22C55E,price:500},
  {id:'king',name:'Král Praha',icon:'🤴',body:0x7C2D12,hat:0xEAB308,price:1000},
];
let selChar='worker';

const ACHS=[
  {id:'first',name:'První kroky',desc:'Skóre 10',icon:'🐣',cond:s=>s.best>=10,rw:5},
  {id:'run50',name:'Maratonec',desc:'Skóre 50',icon:'🏃',cond:s=>s.best>=50,rw:15},
  {id:'run100',name:'Sprinter',desc:'Skóre 100',icon:'⚡',cond:s=>s.best>=100,rw:30},
  {id:'rich',name:'Boháč',desc:'Celkem 100 mincí',icon:'💎',cond:s=>s.totalCoins>=100,rw:20},
  {id:'mega',name:'Milionář',desc:'Celkem 500 mincí',icon:'👑',cond:s=>s.totalCoins>=500,rw:50},
  {id:'combo5',name:'Combo!',desc:'5x combo',icon:'🔥',cond:s=>s.maxCombo>=5,rw:10},
  {id:'combo10',name:'Combo Master',desc:'10x combo',icon:'💥',cond:s=>s.maxCombo>=10,rw:25},
  {id:'water',name:'Námořník',desc:'20 vodních řádků',icon:'🚢',cond:s=>s.waterX>=20,rw:15},
  {id:'plays10',name:'Závislák',desc:'10 her',icon:'🎮',cond:s=>s.plays>=10,rw:10},
  {id:'zone2',name:'Předměstí',desc:'Skóre 20',icon:'🏘️',cond:s=>s.best>=20,rw:10},
  {id:'zone3',name:'Průmysl',desc:'Skóre 45',icon:'🏭',cond:s=>s.best>=45,rw:20},
  {id:'zone4',name:'Přístav',desc:'Skóre 70',icon:'⚓',cond:s=>s.best>=70,rw:30},
];

const ZONES=[
  {name:'Centrum',start:0,sky:0x87CEEB,fog:0xB0D4F1,g1:0x4CAF50,g2:0x66BB6A,rd:0x616161},
  {name:'Předměstí',start:20,sky:0x81C784,fog:0xA5D6A7,g1:0x558B2F,g2:0x689F38,rd:0x757575},
  {name:'Průmyslová',start:45,sky:0x90A4AE,fog:0xB0BEC5,g1:0x78909C,g2:0x8D9FA8,rd:0x546E7A},
  {name:'Přístav',start:70,sky:0x4FC3F7,fog:0x81D4FA,g1:0x26A69A,g2:0x4DB6AC,rd:0x455A64},
];

const PU_TYPES=[
  {id:'speed',icon:'⚡',color:0xFFEB3B,dur:300},
  {id:'invis',icon:'👻',color:0xCE93D8,dur:250},
  {id:'magnet',icon:'🧲',color:0xEF5350,dur:350},
  {id:'shield',icon:'🛡️',color:0x42A5F5,dur:1},
];

/* ─── STATE ─── */
const COLS=9,TW=1,TD=1;
let scene,camera,renderer,clock;
let state='menu',score=0,coins=0,combo=0,comboT=0,fc=0;
let pRow=0,pCol=4,pAlive=true,pDir=0,pHopT=1;
let pMesh,pTX=0,pTZ=0,moveFrame=0,deathReason='';
let lanes=[],lmMap=new Map(),activePU=[],curZone=ZONES[0],lastZN='';
let playerLight=null;

// particles
let particleSys=null;
let particlePool=[]; // {type, t, life, base, vel}
let particleGeom=null;
let particleMat=null;
let particleCount=160; // small + cheap

let S={best:0,totalCoins:0,maxCombo:0,waterX:0,plays:0,coins:0,achs:[],chars:['worker']};
try{const d=localStorage.getItem('pistaV5');if(d)S=JSON.parse(d);}catch(e){}
function save(){try{localStorage.setItem('pistaV5',JSON.stringify(S));}catch(e){}}

/* ─── THREE.JS ─── */
function initThree(){
  scene=new THREE.Scene();
  scene.background=new THREE.Color(0x87CEEB);
  scene.fog=new THREE.FogExp2(0xB0D4F1,0.022);
  const a=window.innerWidth/window.innerHeight;
  camera=new THREE.OrthographicCamera(-5*a,5*a,5,-5,0.1,100);
  camera.position.set(0,10,8);
  camera.lookAt(0,0,0);
  camera.zoom=1.15;
  camera.updateProjectionMatrix();
  renderer=new THREE.WebGLRenderer({canvas:document.getElementById('game'),antialias:true});
  renderer.setSize(window.innerWidth,window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x87CEEB);

  scene.add(new THREE.AmbientLight(0xFFFFFF,0.6));
  const sun=new THREE.DirectionalLight(0xFFF5E0,0.85);
  sun.position.set(5,12,5);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.near=0.5;sun.shadow.camera.far=50;
  sun.shadow.camera.left=-15;sun.shadow.camera.right=15;
  sun.shadow.camera.top=15;sun.shadow.camera.bottom=-15;
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0x87CEEB,0x4CAF50,0.25));

  // Player-follow point light (subtle)
  playerLight=new THREE.PointLight(0xFFFFFF,0.55,12,2);
  playerLight.castShadow=true;
  playerLight.shadow.mapSize.set(1024,1024);
  playerLight.shadow.bias=-0.0006;
  scene.add(playerLight);

  clock=new THREE.Clock();
  mkPlayer();
  initParticles();
}

/* ─── HELPERS ─── */
function bx(w,h,d,c,y,shadow){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color:c}));m.position.y=y||0;if(shadow)m.castShadow=true;return m;}
function colToX(c){return(c-COLS/2+0.5)*TW;}
function rowToZ(r){return-r*TD;}
function getZone(r){return[...ZONES].reverse().find(z=>r>=z.start)||ZONES[0];}
function srand(s){return((s*9301+49297)%233280)/233280;}

/* ─── PARTICLES ─── */
function initParticles(){
  particleGeom=new THREE.BufferGeometry();
  const pos=new Float32Array(particleCount*3);
  const a=new Float32Array(particleCount);
  for(let i=0;i<particleCount;i++){
    pos[i*3+0]=9999;pos[i*3+1]=9999;pos[i*3+2]=9999;
    a[i]=0.0;
    particlePool.push({t:0,life:0,base:new THREE.Vector3(),vel:new THREE.Vector3(),active:false});
  }
  particleGeom.setAttribute('position', new THREE.BufferAttribute(pos,3));
  particleGeom.setAttribute('alpha', new THREE.BufferAttribute(a,1));

  particleMat=new THREE.PointsMaterial({
    color:0xFFFFFF,
    size:0.08,
    transparent:true,
    opacity:0.9,
    depthWrite:false
  });

  particleSys=new THREE.Points(particleGeom, particleMat);
  particleSys.frustumCulled=false;
  particleSys.renderOrder=999;
  scene.add(particleSys);
}

function spawnParticles(kind, x, y, z){
  // kind: 'splash' | 'coin'
  const n = kind==='splash' ? 22 : 16;
  for(let k=0;k<n;k++){
    const p = particlePool.find(pp=>!pp.active);
    if(!p) break;
    p.active=true;
    p.t=0;
    p.life = kind==='splash' ? (18+Math.random()*10) : (16+Math.random()*10);
    p.base.set(x,y,z);
    const ang=Math.random()*Math.PI*2;
    const sp = kind==='splash' ? (0.06+Math.random()*0.09) : (0.05+Math.random()*0.08);
    p.vel.set(Math.cos(ang)*sp, (kind==='splash'?0.06:0.08)+Math.random()*0.08, Math.sin(ang)*sp);
    // encode kind via negative life? nah — just tint material briefly (cheap) in updateParticles
    p.kind=kind;
  }
}

function updateParticles(){
  if(!particleSys) return;
  const pos = particleGeom.attributes.position.array;
  const alp = particleGeom.attributes.alpha.array;
  let any=false;

  for(let i=0;i<particleCount;i++){
    const p=particlePool[i];
    if(!p.active){
      pos[i*3+0]=9999;pos[i*3+1]=9999;pos[i*3+2]=9999;
      alp[i]=0;
      continue;
    }
    any=true;
    p.t++;
    const tt = p.t / p.life;
    // simple ballistic + damping
    p.vel.y -= 0.004;
    p.vel.multiplyScalar(0.985);
    const px = p.base.x + p.vel.x * p.t;
    const py = p.base.y + p.vel.y * p.t;
    const pz = p.base.z + p.vel.z * p.t;

    pos[i*3+0]=px;
    pos[i*3+1]=Math.max(0.02, py);
    pos[i*3+2]=pz;

    // fade
    alp[i]=Math.max(0, 1-tt);

    if(p.t>=p.life){
      p.active=false;
      alp[i]=0;
      pos[i*3+0]=9999;pos[i*3+1]=9999;pos[i*3+2]=9999;
    }
  }

  // quick tint swap (cheap) based on "any active coin" vs splash
  if(any){
    const hasCoin = particlePool.some(p=>p.active && p.kind==='coin');
    const hasSplash = particlePool.some(p=>p.active && p.kind==='splash');
    if(hasCoin && !hasSplash) particleMat.color.setHex(0xFFE082);
    else if(hasSplash && !hasCoin) particleMat.color.setHex(0x90CAF9);
    else particleMat.color.setHex(0xFFFFFF);
  }

  particleGeom.attributes.position.needsUpdate=true;
  particleGeom.attributes.alpha.needsUpdate=true;
}

/* ─── PLAYER ─── */
function mkPlayer(){
  if(pMesh)scene.remove(pMesh);
  const ch=CHARS.find(c=>c.id===selChar)||CHARS[0];
  const g=new THREE.Group();

  // Legs
  const legL=bx(0.15,0.15,0.18,0x4E342E,0.08,true);legL.position.x=-0.1;g.add(legL);
  const legR=bx(0.15,0.15,0.18,0x4E342E,0.08,true);legR.position.x=0.1;g.add(legR);

  // Body (base)
  const body=bx(0.5,0.45,0.4,ch.body,0.38,true);g.add(body);

  // Clothing layer: jacket/vest (slightly darker)
  const jacketCol=new THREE.Color(ch.body).multiplyScalar(0.78).getHex();
  const jacket=bx(0.52,0.34,0.42,jacketCol,0.42,true);jacket.position.y=0.42;g.add(jacket);

  // Belt
  const belt=bx(0.54,0.06,0.43,0x3E2723,0.28);belt.position.y=0.28;g.add(belt);

  // Arms
  const armL=bx(0.12,0.35,0.14,ch.body,0.32);armL.position.x=-0.32;g.add(armL);
  const armR=bx(0.12,0.35,0.14,ch.body,0.32);armR.position.x=0.32;g.add(armR);

  // Head (bigger)
  const head=bx(0.4,0.38,0.38,0xFFCC80,0.78,true);
  g.add(head);

  // Hat brim
  const brim=bx(0.52,0.06,0.52,ch.hat,0.99);g.add(brim);
  // Hat top
  const hatTop=bx(0.4,0.14,0.4,ch.hat,1.06);g.add(hatTop);

  // Eyes
  const eG=new THREE.BoxGeometry(0.07,0.07,0.02);
  const eM=new THREE.MeshBasicMaterial({color:0x111111});
  const eL=new THREE.Mesh(eG,eM);eL.position.set(-0.1,0.8,0.2);g.add(eL);
  const eR=new THREE.Mesh(eG,eM);eR.position.set(0.1,0.8,0.2);g.add(eR);
  // Mouth
  const mouth=bx(0.12,0.03,0.02,0xBF360C,0.7);mouth.position.z=0.2;g.add(mouth);

  // Small "tool" cylinder (extra detail)
  const tool=new THREE.Mesh(
    new THREE.CylinderGeometry(0.03,0.03,0.35,10),
    new THREE.MeshLambertMaterial({color:0x9E9E9E})
  );
  tool.position.set(0.32,0.45,0.12);
  tool.rotation.z=Math.PI*0.2;
  tool.castShadow=true;
  g.add(tool);

  // Shadow
  const sh=new THREE.Mesh(new THREE.PlaneGeometry(0.6,0.6),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:0.22}));
  sh.rotation.x=-Math.PI/2;sh.position.y=0.005;g.add(sh);

  // store refs for animation
  g.userData.head=head;

  pMesh=g;scene.add(pMesh);
}

/* ─── LANE GEN ─── */
function mkLane(row){
  const zone=getZone(row),diff=Math.min(1,Math.max(0,(row-8)/140));
  if(row===0)return{type:'safe',row,zone,cars:[],logs:[],coins:[],deco:[],pu:null,trainActive:false,trainWarn:false,trainTimer:0,trainX:-20,trainSpd:0,trainLen:0};
  const r=srand(row);
  let type=r<0.32?'safe':r<0.58?'road':r<0.72?'rail':'water';
  if(row<6&&type==='water')type='safe';
  if(row<3&&type==='rail')type='safe';
  if(zone.name==='Přístav'&&r<0.5&&type==='road')type='water';
  const L={type,row,zone,cars:[],logs:[],coins:[],deco:[],pu:null,trainActive:false,trainWarn:false,trainTimer:0,trainX:-20,trainSpd:0,trainLen:0};
  if(type==='safe'){
    for(let i=0;i<2+Math.floor(Math.random()*2);i++){
      const col=Math.floor(Math.random()*COLS);
      const dt=zone.start>=45?(Math.random()<0.5?'crate':'barrel'):(Math.random()<0.55?'tree':'rock');
      if(!L.deco.find(d=>d.c===col))L.deco.push({c:col,t:dt});
    }
    if(Math.random()<0.35)L.coins.push({c:3+Math.floor(Math.random()*3),got:false});
    if(Math.random()<0.05&&row>8)L.pu={c:3+Math.floor(Math.random()*3),type:PU_TYPES[Math.floor(Math.random()*PU_TYPES.length)],got:false};
  }
  if(type==='road'){
    const spd=(0.6+Math.random()*0.8+diff*1.0)*(Math.random()<0.5?1:-1);
    const cnt=Math.max(1,Math.floor(1+diff*1.5));
    for(let i=0;i<cnt;i++){const ct=Math.floor(Math.random()*5);L.cars.push({x:i*(COLS/cnt*1.5)-2+Math.random()*2,spd,ct,len:ct>=3?2:1.2});}
    if(Math.random()<0.3)L.coins.push({c:3+Math.floor(Math.random()*3),got:false});
  }
  if(type==='rail'){L.trainSpd=(2.5+diff*3)*(Math.random()<0.5?1:-1);L.trainTimer=200+Math.random()*250;L.trainLen=8+Math.floor(Math.random()*5);if(Math.random()<0.2)L.coins.push({c:3+Math.floor(Math.random()*3),got:false});}
  if(type==='water'){
    const lc=2+Math.floor(Math.random()*2),ls=(0.4+Math.random()*0.5+diff*0.3)*(Math.random()<0.5?1:-1);
    for(let i=0;i<lc;i++)L.logs.push({x:i*(COLS/lc)+Math.random()*1.5,spd:ls,len:2+Math.random()*1.5});
    if(Math.random()<0.3)L.coins.push({c:3+Math.floor(Math.random()*3),got:false});
  }
  return L;
}
function ensureLanes(){
  const mn=pRow-4,mx=pRow+20;
  lanes=lanes.filter(l=>l.row>=mn&&l.row<=mx);
  for(let r=mn;r<=mx;r++)if(!lanes.find(l=>l.row===r))lanes.push(mkLane(r));
  lanes.sort((a,b)=>a.row-b.row);
}

/* ─── BUILD 3D (enhanced visuals) ─── */
function buildLane(L){
  const g=new THREE.Group(),z=-L.row*TD,zn=L.zone;

  if(L.type==='safe'){
    const gc=L.row%2?zn.g1:zn.g2;
    const gr=bx(COLS+2,0.25,1.05,gc,-0.12);gr.receiveShadow=true;g.add(gr);
    const edge=bx(COLS+2,0.03,1.06,new THREE.Color(gc).multiplyScalar(1.15).getHex(),0.01);edge.position.z=z;g.add(edge);
    for(let i=0;i<4;i++){
      const fx=(Math.random()-0.5)*(COLS-1);
      const tuft=bx(0.08,0.12,0.08,0x7CB342,0.06);tuft.position.set(fx,0.06,z+(Math.random()-0.5)*0.3);g.add(tuft);
    }
    L.deco.forEach(d=>{
      const dx=d.c-COLS/2+0.5;
      if(d.t==='tree'){
        const trunk=bx(0.22,0.8,0.22,0x5D4037,0.4,true);trunk.position.set(dx,0.4,z);g.add(trunk);
        const c1=bx(0.7,0.55,0.7,0x2E7D32,0.95,true);c1.position.set(dx,0.95,z);g.add(c1);
        const c2=bx(0.55,0.45,0.55,0x388E3C,1.35);c2.position.set(dx,1.35,z);g.add(c2);
        const c3=bx(0.35,0.3,0.35,0x43A047,1.65);c3.position.set(dx,1.65,z);g.add(c3);
      } else if(d.t==='rock'){
        const r1=bx(0.45,0.28,0.4,0x9E9E9E,0.14,true);r1.position.set(dx,0.14,z);g.add(r1);
        const r2=bx(0.25,0.18,0.22,0xBDBDBD,0.28);r2.position.set(dx+0.05,0.28,z-0.05);g.add(r2);
      } else if(d.t==='crate'){
        const c=bx(0.5,0.5,0.5,0xA1887F,0.25,true);c.position.set(dx,0.25,z);g.add(c);
        const band=bx(0.52,0.06,0.52,0x795548,0.35);band.position.set(dx,0.35,z);g.add(band);
      } else {
        const b=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,0.48,8),new THREE.MeshLambertMaterial({color:0x8D6E63}));b.position.set(dx,0.24,z);b.castShadow=true;g.add(b);
        const rim=new THREE.Mesh(new THREE.CylinderGeometry(0.24,0.24,0.04,8),new THREE.MeshLambertMaterial({color:0x6D4C41}));rim.position.set(dx,0.47,z);g.add(rim);
      }
    });
  }

  if(L.type==='road'){
    const rd=bx(COLS+2,0.12,1.0,0x424242,-0.06);rd.receiveShadow=true;g.add(rd);
    const curb1=bx(COLS+2,0.16,0.08,0x9E9E9E,0.02);curb1.position.set(0,0.02,z-0.46);g.add(curb1);
    const curb2=bx(COLS+2,0.16,0.08,0x9E9E9E,0.02);curb2.position.set(0,0.02,z+0.46);g.add(curb2);
    for(let i=-5;i<=5;i+=1.0){const ln=bx(0.4,0.01,0.05,0xFFD600,0.01);ln.position.set(i,0.01,z);g.add(ln);}
    L.cars.forEach((car,idx)=>{const cm=mkCar(car);cm.name='c'+L.row+'_'+idx;g.add(cm);});
  }

  if(L.type==='rail'){
    const rd=bx(COLS+2,0.15,1.0,0x6D4C41,-0.075);rd.receiveShadow=true;g.add(rd);
    const grv=bx(COLS+2,0.02,0.9,0x795548,0.01);grv.position.z=z;g.add(grv);
    const r1=bx(COLS+2,0.07,0.06,0xE0E0E0,0.04);r1.position.z=z-0.22;g.add(r1);
    const r2=bx(COLS+2,0.07,0.06,0xE0E0E0,0.04);r2.position.z=z+0.22;g.add(r2);
    for(let i=-5;i<=5;i+=0.55){const s=bx(0.1,0.04,0.6,0x4E342E,0.02);s.position.set(i,0.02,z);g.add(s);}
    const pole=bx(0.06,0.8,0.06,0x616161,0.4);pole.position.set(-4.7,0.4,z);g.add(pole);
    const sign=bx(0.25,0.2,0.04,0xFFEB3B,0.8);sign.position.set(-4.7,0.8,z);g.add(sign);
    const cross=bx(0.04,0.18,0.05,0x212121,0.8);cross.position.set(-4.7,0.8,z);g.add(cross);
    const tr=mkTrain(L.trainLen);tr.visible=false;tr.name='t'+L.row;g.add(tr);
    const wn=new THREE.Mesh(new THREE.SphereGeometry(0.08,8,6),new THREE.MeshBasicMaterial({color:0xFF0000,transparent:true,opacity:0}));wn.position.set(-4.7,0.95,z);wn.name='w'+L.row;g.add(wn);
  }

  if(L.type==='water'){
    const w=bx(COLS+2,0.06,1.0,0x1565C0,-0.04);w.position.z=z;g.add(w);
    const sf=bx(COLS+2,0.02,1.0,0x42A5F5,0.01);sf.material.transparent=true;sf.material.opacity=0.5;sf.position.z=z;g.add(sf);
    for(let i=0;i<2;i++){
      const lx=(Math.random()-0.5)*(COLS-2);
      const lily=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.15,0.02,8),new THREE.MeshLambertMaterial({color:0x2E7D32}));
      lily.position.set(lx,0.02,z+(Math.random()-0.5)*0.3);g.add(lily);
    }
    const bank1=bx(COLS+2,0.1,0.1,0x795548,0.0);bank1.position.set(0,0,z-0.5);g.add(bank1);
    const bank2=bx(COLS+2,0.1,0.1,0x795548,0.0);bank2.position.set(0,0,z+0.5);g.add(bank2);
    L.logs.forEach((log,idx)=>{const lm=mkLogM(log.len);lm.name='l'+L.row+'_'+idx;g.add(lm);});
  }

  L.coins.forEach((c,idx)=>{const cm=mkCoinM();cm.name='cn'+L.row+'_'+idx;cm.position.set(c.c-COLS/2+0.5,0.45,z);g.add(cm);});
  if(L.pu){const pm=mkPUM(L.pu.type);pm.name='pu'+L.row;pm.position.set(L.pu.c-COLS/2+0.5,0.55,z);g.add(pm);}
  return g;
}

function mkCar(car){
  const g=new THREE.Group();
  const colors=[0xE53935,0x1E88E5,0x8E24AA,0xFB8C00,0x00ACC1];
  const col=colors[car.ct%5];
  const l=car.len*0.6;
  const shadow=bx(l+0.05,0.01,0.58,0x000000,0.01);shadow.material.transparent=true;shadow.material.opacity=0.15;g.add(shadow);
  const body=bx(l,0.32,0.58,col,0.2,true);g.add(body);
  const darkCol=new THREE.Color(col).multiplyScalar(0.7).getHex();
  const roof=bx(l*0.55,0.22,0.5,darkCol,0.48);roof.position.x=-l*0.05;g.add(roof);
  const ws=bx(0.03,0.18,0.44,0xBBDEFB,0.42);ws.material.transparent=true;ws.material.opacity=0.7;ws.position.x=l*0.24;g.add(ws);
  const rw=bx(0.03,0.14,0.4,0xBBDEFB,0.44);rw.material.transparent=true;rw.material.opacity=0.5;rw.position.x=-l*0.3;g.add(rw);
  const hlm=new THREE.MeshBasicMaterial({color:0xFFF9C4});
  [0.18,-0.18].forEach(zz=>{const h=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.08,0.08),hlm);h.position.set(l/2+0.02,0.2,zz);g.add(h);});
  const tlm=new THREE.MeshBasicMaterial({color:0xD32F2F});
  [0.18,-0.18].forEach(zz=>{const t=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.06,0.06),tlm);t.position.set(-l/2-0.01,0.2,zz);g.add(t);});
  const wheelM=new THREE.MeshLambertMaterial({color:0x212121});
  const wheelG=new THREE.BoxGeometry(0.1,0.12,0.08);
  [[-l*0.3,0.08,0.28],[-l*0.3,0.08,-0.28],[l*0.25,0.08,0.28],[l*0.25,0.08,-0.28]].forEach(p=>{
    const w=new THREE.Mesh(wheelG,wheelM);w.position.set(...p);g.add(w);
  });
  return g;
}

function mkTrain(len){
  const g=new THREE.Group(),tl=len*0.4;
  g.add(bx(tl,0.6,0.72,0x546E7A,0.35,true));
  g.add(bx(tl+0.02,0.07,0.73,0xE53935,0.35));
  const fr=bx(0.35,0.65,0.73,0xFFD600,0.35);fr.position.x=tl/2;g.add(fr);
  const hl=new THREE.Mesh(new THREE.SphereGeometry(0.06,6,4),new THREE.MeshBasicMaterial({color:0xFFFFFF}));hl.position.set(tl/2+0.18,0.4,0);g.add(hl);
  for(let i=-tl/2+0.4;i<tl/2-0.3;i+=0.55){
    const w=bx(0.3,0.2,0.02,0xBBDEFB,0.52);w.material.transparent=true;w.material.opacity=0.55;w.position.set(i,0.52,0.37);g.add(w);
    const w2=w.clone();w2.position.z=-0.37;g.add(w2);
  }
  for(let i=-tl/2+0.3;i<tl/2;i+=0.8){
    const wh=bx(0.12,0.14,0.76,0x212121,0.07);wh.position.x=i;g.add(wh);
  }
  return g;
}

function mkLogM(len){
  const g=new THREE.Group(),l=len*0.48;
  g.add(bx(l,0.2,0.38,0x6D4C41,0.12,true));
  g.add(bx(l-0.04,0.22,0.32,0x5D4037,0.12));
  g.add(bx(0.06,0.18,0.36,0x4E342E,0.12));g.children[g.children.length-1].position.x=l/2-0.03;
  g.add(bx(0.06,0.18,0.36,0x4E342E,0.12));g.children[g.children.length-1].position.x=-l/2+0.03;
  g.add(bx(l*0.8,0.02,0.2,0x8D6E63,0.22));
  return g;
}

function mkCoinM(){
  const g=new THREE.Group();
  g.add(bx(0.24,0.24,0.06,0xFFC107,0,false));
  g.add(bx(0.18,0.18,0.07,0xFFD600));
  g.add(bx(0.06,0.06,0.08,0xFFF9C4));g.children[2].position.set(-0.04,0.04,0);
  return g;
}

function mkPUM(type){
  const g=new THREE.Group();
  const inner=new THREE.Mesh(new THREE.OctahedronGeometry(0.18,0),new THREE.MeshBasicMaterial({color:type.color}));
  g.add(inner);
  const outer=new THREE.Mesh(new THREE.OctahedronGeometry(0.25,0),new THREE.MeshBasicMaterial({color:type.color,transparent:true,opacity:0.25,wireframe:true}));
  g.add(outer);
  return g;
}

/* ─── SCENE MGMT ─── */
function rebuildScene(){
  const ex=new Set();
  lanes.forEach(L=>{ex.add(L.row);if(!lmMap.has(L.row)){const m=buildLane(L);scene.add(m);lmMap.set(L.row,m);}});
  lmMap.forEach((m,r)=>{if(!ex.has(r)){scene.remove(m);lmMap.delete(r);}});
}

/* ─── GAME ─── */
function startGame(){
  initAudio();state='playing';score=0;coins=0;combo=0;comboT=0;fc=0;moveFrame=0;
  pRow=0;pCol=4;pAlive=true;pDir=0;pHopT=1;activePU=[];deathReason='';lastMilestone=0;
  lanes=[];lmMap.forEach(m=>scene.remove(m));lmMap.clear();
  mkPlayer();pTX=colToX(pCol);pTZ=rowToZ(pRow);
  pMesh.position.set(pTX,0,pTZ);
  camera.position.set(0,10,8);
  ensureLanes();rebuildScene();S.plays++;save();
  document.getElementById('hud').style.display='flex';hideOverlay();updateHUD();
}

/* ─── INPUT (with debounce + predictive hazard check) ─── */
let tSX=0,tSY=0,tST=0;const cvs=document.getElementById('game');

function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

function willCellBeSafe(nr,nc){
  // If lane doesn't exist yet, generate it deterministically
  const testL = lanes.find(l => l.row === nr) || mkLane(nr);
  const pc = nc + 0.5;

  // If invis, allow (original design)
  if(activePU.find(p=>p.id==='invis')) return true;

  if(testL.type==='water'){
    // must be on a log at target col
    const onTestLog = testL.logs.some(log => pc >= log.x - 0.2 && pc <= log.x + log.len - 0.2);
    return !!onTestLog;
  }

  if(testL.type==='road'){
    // predict car danger with a small safety margin (hop duration)
    // use same hitbox style as collision, but expanded a bit
    const margin = 0.38;
    for(const car of testL.cars){
      const left = car.x + 0.25 - margin;
      const right = car.x + car.len - 0.25 + margin;
      if(pc > left && pc < right) return false;
    }
    return true;
  }

  if(testL.type==='rail'){
    // block only if train is active right now (as requested)
    if(testL.trainActive) return false;
    return true;
  }

  // safe lane
  return true;
}

function handleInput(dir){
  if(state!=='playing'||!pAlive)return;

  // Anti-spam / debounce: raise cooldown to 5 frames (as requested)
  // old: if(fc-moveFrame<3)return; moveFrame=fc;
  if(fc - moveFrame < 5) return;
  moveFrame = fc + 1;

  let nc=pCol,nr=pRow;
  if(dir==='up'){nr++;pDir=0;}
  else if(dir==='down'){nr=Math.max(pRow-3,nr-1);pDir=2;}
  else if(dir==='left'){nc--;pDir=3;}
  else if(dir==='right'){nc++;pDir=1;}

  if(nc<0||nc>=COLS)return;

  // Predictive hazard check BEFORE committing hop (prevents "teleport death" into water/traffic/train)
  if(!willCellBeSafe(nr,nc)) return;

  // Commit move
  pCol=nc;pRow=nr;

  if(nr>score){
    score=nr;combo++;comboT=90;
    if(combo>S.maxCombo){S.maxCombo=combo;save();}
    const ms=Q_MILESTONE.find(m=>score>=m[0]&&lastMilestone<m[0]);
    if(ms){lastMilestone=ms[0];showToast('💬 '+ms[1]);}
    if(combo===5||combo===10||combo===15||combo===20)showToast('🔥 '+rndQ(Q_COMBO));
  }

  pTX=colToX(pCol);
  pTZ=rowToZ(pRow);
  pHopT=0;
  sfxHop();
  haptic();
}

cvs.addEventListener('touchstart',e=>{e.preventDefault();const t=e.touches[0];tSX=t.clientX;tSY=t.clientY;tST=Date.now();},{passive:false});
cvs.addEventListener('touchend',e=>{e.preventDefault();if(state==='dead'){showMenu(true);return;}if(state==='menu')return;const t=e.changedTouches[0],dx=t.clientX-tSX,dy=t.clientY-tSY,dt=Date.now()-tST;if(Math.abs(dx)<30&&Math.abs(dy)<30&&dt<400){handleInput('up');return;}if(Math.abs(dx)>Math.abs(dy))handleInput(dx>0?'right':'left');else handleInput(dy<0?'up':'down');},{passive:false});
cvs.addEventListener('click',e=>{if(state==='dead'){showMenu(true);return;}if(state!=='playing')return;const r=cvs.getBoundingClientRect(),cx=(e.clientX-r.left)/r.width,cy=(e.clientY-r.top)/r.height;if(cy<0.35)handleInput('up');else if(cy>0.75)handleInput('down');else if(cx<0.25)handleInput('left');else if(cx>0.75)handleInput('right');else handleInput('up');});
document.addEventListener('keydown',e=>{if(state==='dead'){showMenu(true);return;}if(state==='menu')return;const m={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right',' ':'up'};if(m[e.key]){e.preventDefault();handleInput(m[e.key]);}});
document.getElementById('btn-start').onclick=()=>startGame();
document.getElementById('btn-shop').onclick=()=>openShop();
document.getElementById('btn-ach').onclick=()=>openAch();
document.getElementById('shop-close').onclick=()=>closeShop();
document.getElementById('ach-close').onclick=()=>closeAch();

/* ─── UPDATE ─── */
function update(){
  if(state!=='playing')return;
  fc++;
  const dt=Math.min(clock.getDelta(),0.05);

  // Camera follows
  const camTX=pTX*0.5,camTZ=pTZ+3;
  camera.position.x+=(camTX-camera.position.x)*0.05;
  camera.position.z+=(camTZ+8-camera.position.z)*0.05;
  camera.lookAt(camTX,0,camTZ-2);

  // Player
  if(pMesh){
    pMesh.position.x+=(pTX-pMesh.position.x)*0.22;
    pMesh.position.z+=(pTZ-pMesh.position.z)*0.22;

    if(pHopT<1){
      pHopT=Math.min(1,pHopT+0.1);
      pMesh.position.y=Math.sin(pHopT*Math.PI)*0.45;

      // head subtle yaw during hop (requested style)
      if(pMesh.userData && pMesh.userData.head){
        pMesh.userData.head.rotation.y = Math.sin(pHopT * Math.PI) * 0.2;
      }
    } else {
      pMesh.position.y*=0.8;
      if(pMesh.userData && pMesh.userData.head){
        pMesh.userData.head.rotation.y *= 0.85;
      }
    }

    const angles=[0,Math.PI/2,Math.PI,-Math.PI/2];
    let tR=angles[pDir],d2=tR-pMesh.rotation.y;
    if(d2>Math.PI)d2-=Math.PI*2;if(d2<-Math.PI)d2+=Math.PI*2;
    pMesh.rotation.y+=d2*0.15;

    const inv=activePU.find(p=>p.id==='invis');
    pMesh.visible=inv?fc%8<5:true;

    // player light follows
    if(playerLight){
      playerLight.position.set(pMesh.position.x, 2.2, pMesh.position.z + 0.6);
    }
  }

  // Zone
  const nz=getZone(pRow);
  if(nz.name!==lastZN){
    lastZN=nz.name;curZone=nz;showZone(nz.name);
    scene.background.setHex(nz.sky);scene.fog.color.setHex(nz.fog);
    const zi=ZONES.indexOf(nz);if(zi>=0&&Q_ZONE[zi])setTimeout(()=>showToast('💬 '+Q_ZONE[zi]),1500);
  }

  if(comboT>0){comboT--;if(comboT===0)combo=0;}
  activePU.forEach(p=>{if(p.id!=='shield')p.dur--;});
  activePU=activePU.filter(p=>p.dur>0);
  updatePUUI();

  // Lane updates
  lanes.forEach(L=>{
    const mesh=lmMap.get(L.row);if(!mesh)return;const z=rowToZ(L.row);

    // Cars
    if(L.type==='road'){
      L.cars.forEach((car,i)=>{
        car.x+=car.spd*dt;
        if(car.spd>0&&car.x>COLS+3)car.x=-3-car.len;
        if(car.spd<0&&car.x<-3-car.len)car.x=COLS+3;
        const cm=mesh.getObjectByName('c'+L.row+'_'+i);
        if(cm){cm.position.set(colToX(car.x),0,z);cm.rotation.y=car.spd>0?0:Math.PI;}
      });
    }

    // Trains
    if(L.type==='rail'){
      const tm=mesh.getObjectByName('t'+L.row),wm=mesh.getObjectByName('w'+L.row);
      if(!L.trainActive){
        L.trainTimer-=1;
        if(L.trainTimer<90&&!L.trainWarn){L.trainWarn=true;if(Math.abs(pRow-L.row)<10)sfxTrain();}
        if(wm)wm.material.opacity=L.trainWarn?(Math.sin(fc*0.2)*0.5+0.5):0;
        if(L.trainTimer<=0){L.trainActive=true;L.trainX=L.trainSpd>0?-L.trainLen-3:COLS+3;}
      } else {
        L.trainX+=L.trainSpd*dt;
        if(tm){tm.visible=true;tm.position.set(colToX(L.trainX),0,z);}
        if((L.trainSpd>0&&L.trainX>COLS+8)||(L.trainSpd<0&&L.trainX<-L.trainLen-8)){
          L.trainActive=false;L.trainWarn=false;L.trainTimer=200+Math.random()*300;if(tm)tm.visible=false;
        }
      }
    }

    // Logs
    if(L.type==='water'){
      L.logs.forEach((log,i)=>{
        log.x+=log.spd*dt;
        if(log.spd>0&&log.x>COLS+3)log.x=-3-log.len;
        if(log.spd<0&&log.x<-3-log.len)log.x=COLS+3;
        const lm=mesh.getObjectByName('l'+L.row+'_'+i);
        if(lm)lm.position.set(colToX(log.x),0.05,z);
      });
    }

    // Coin anim + magnet
    L.coins.forEach((c,i)=>{
      const cm=mesh.getObjectByName('cn'+L.row+'_'+i);
      if(cm&&!c.got){
        cm.rotation.y+=0.04;
        cm.position.y=0.35+Math.sin(fc*0.06+L.row)*0.08;
        const mag=activePU.find(p=>p.id==='magnet');
        if(mag&&Math.abs(c.c-pCol)+Math.abs(L.row-pRow)<4){c.c+=(pCol-c.c)*0.08;cm.position.x=colToX(c.c);}
      }
    });

    // PU anim
    if(L.pu&&!L.pu.got){
      const pm=mesh.getObjectByName('pu'+L.row);
      if(pm){pm.rotation.y+=0.05;pm.rotation.x+=0.03;pm.position.y=0.45+Math.sin(fc*0.07)*0.15;}
    }

    // Collect coins
    L.coins.forEach((c,i)=>{
      if(!c.got&&Math.abs(c.c-pCol)<0.7&&L.row===pRow){
        c.got=true;coins++;S.totalCoins++;save();sfxCoin();
        // particles: coin sparkle
        if(pMesh) spawnParticles('coin', pMesh.position.x, 0.55, pMesh.position.z);
        const cm=mesh.getObjectByName('cn'+L.row+'_'+i);if(cm)cm.visible=false;
      }
    });

    // Collect PU
    if(L.pu&&!L.pu.got&&L.pu.c===pCol&&L.row===pRow){
      L.pu.got=true;activePU.push({...L.pu.type});sfxPU();showToast(L.pu.type.icon+' Power-up!');
      const pm=mesh.getObjectByName('pu'+L.row);if(pm)pm.visible=false;
    }
  });

  // --- Collisions (improved): check based on actual mesh position during hop
  // This prevents "skip-through" when hop lerp is between cells.
  const liveRow = pMesh ? Math.round((-pMesh.position.z)/TD) : pRow;
  const liveCol = pMesh ? clamp(Math.round((pMesh.position.x/TW)+COLS/2-0.5),0,COLS-1) : pCol;
  const pcLive = liveCol + 0.5;
  const pL = lanes.find(l=>l.row===liveRow);

  // Water
  if(pL&&pL.type==='water'){
    const onLog=pL.logs.some(log=>pcLive>log.x-0.2&&pcLive<log.x+log.len+0.2);
    if(onLog){
      const log=pL.logs.find(log=>pcLive>log.x-0.2&&pcLive<log.x+log.len+0.2);
      if(log){
        // drift along log
        pTX+=log.spd*dt;
        if(pMesh)pMesh.position.x+=log.spd*dt;
        pCol=Math.round(pTX/TW+COLS/2-0.5);pCol=clamp(pCol,0,COLS-1);
      }
      S.waterX=(S.waterX||0)+1;
    } else {
      if(!activePU.find(p=>p.id==='shield')){
        sfxSplash();
        // splash particles at current position
        if(pMesh) spawnParticles('splash', pMesh.position.x, 0.10, pMesh.position.z);
        die('Spadl jsi do vody!');
      } else {
        activePU=activePU.filter(p=>p.id!=='shield');showToast('🛡️ Štít!');
      }
    }
  }

  // Road
  if(pL&&pL.type==='road'&&!activePU.find(p=>p.id==='invis')){
    pL.cars.forEach(car=>{
      if(pcLive>car.x+0.25&&pcLive<car.x+car.len-0.25){
        if(!activePU.find(p=>p.id==='shield')) die('Srazilo tě auto!');
        else {activePU=activePU.filter(p=>p.id!=='shield');showToast('🛡️ Štít!');}
      }
    });
  }

  // Rail
  if(pL&&pL.type==='rail'&&pL.trainActive&&!activePU.find(p=>p.id==='invis')){
    if(pcLive>pL.trainX+0.3&&pcLive<pL.trainX+pL.trainLen-0.3) die('Srazil tě vlak!');
  }

  updateParticles();
  rebuildScene();updateHUD();checkAchs();
}

function die(reason){
  if(!pAlive)return;
  pAlive=false;deathReason=reason;state='dead';sfxDie();
  if(score>S.best)S.best=score;S.coins+=coins;save();
  setTimeout(()=>showMenu(true),800);
}

function checkAchs(){
  const s={...S,best:Math.max(S.best,score)};
  ACHS.forEach(a=>{if(!S.achs.includes(a.id)&&a.cond(s)){S.achs.push(a.id);S.coins+=a.rw;save();showToast('🏆 '+a.name+'! +'+a.rw+'💰');}});
}

/* ─── HLÁŠKY PIŠTY ─── */
const Q_MENU=[
  '„Máma řekla: jeď do Prahy, tam je práce." No, práce je. Ale taky tramvaje.',
  '„V Užhorodu jsem přebíhal jednu silnici. Tady jich je sto."',
  '„Kamarád říkal: Čechy jsou ráj. Zapomněl zmínit ty kamiony."',
  '„Pracovní povolení mám. Povolení přežít dopravu ne."',
  '„Na Ukrajině jsem se bál medvědů. Tady se bojím řidičů na D1."',
  '„Babiččin recept: přeběhni silnici a modli se. Funguje i v Praze."',
  '„Posílám domů peníze. A selfíčka z nemocnice."',
  '„Víš co je nejrychlejší v Česku? Ne internet — šofér co vidí zelenou."',
  '„Kolega říká: buď jako voda. Já říkám: nebuď pod autem."',
  '„Na brigádě v kebabárně bylo bezpečnějš. A to tam vybuchl gril."',
];
const Q_DEATH_CAR=[
  '„Řidič ani nezabrzdil. Asi mě považoval za přechod."',
  '„Tohle auto jelo jak můj strýc Vasyl po slivovici."',
  '„Další den, další dodávka. Aspoň měla hezkou barvu."',
  '„Mamka volala. Říkám: jsem OK. Píšu z pod auta."',
  '„Na Ukrajině nás učili: dívej se vlevo, vpravo. Tady to nestačí."',
  '„Auto mě srazilo. Řidič mi aspoň zamával. Nebo to byl prostředníček?"',
  '„Škodovka vs. Pišta: 1:0. Ale rematch bude!"',
  '„Pojištění nemám, ale optimismus ano."',
];
const Q_DEATH_TRAIN=[
  '„Ten vlak jel přesně podle jízdního řádu. Poprvé v historii."',
  '„České dráhy konečně dorazily včas — zrovna když jsem stál na kolejích."',
  '„Vlak nepočká. Ani na pracovní víza."',
  '„Na Ukrajině jezdí vlaky pomalu. Tady taky, kromě TOHODLE."',
  '„Slyšel jsem houkání. Myslel jsem že to je policie. Horší."',
];
const Q_DEATH_WATER=[
  '„Plavat umím. Ale ne v bundě a s nářadím."',
  '„V Karpatech jsou potoky. Tady jsou řeky. S proudem. A bez mostu."',
  '„Bubliny říkají: glug glug. Pišta říká: kurňa."',
  '„Kamarád říkal: skoč do toho. Nemyslel doslova."',
  '„Mokrý jak po směně na mytí aut. Ale tenkrát jsem aspoň dostal zaplaceno."',
];
const Q_ZONE=['Centrum — kde jeden kebab stojí jako oběd pro pět lidí doma.',
  'Předměstí — tady lidi venčí psy dražší než naše auto.',
  'Průmyslová — tohle mi připomíná domov. Akorát víc smogu.',
  'Přístav — kdyby tu byl trajekt domů, neváhal bych. Nebo jo?'];
const Q_MILESTONE=[
  [10,'„10 kroků! Dál než k výplatnímu okýnku."'],
  [25,'„25! Už jsem dál než můj bratranec s navigací."'],
  [50,'„50! Tohle by máma neuvěřila. Taky tomu nevěřím."'],
  [75,'„75! Snad mi teď dají trvalej pobyt."'],
  [100,'„100! Jsem legenda. Nebo aspoň statistika."'],
];
const Q_COMBO=[
  '„Pišta frčí!"',
  '„Jako blesk z Karpat!"',
  '„Ani celník by mě nechytil!"',
  '„Usain Bolt z Užhorodu!"',
  '„Táta by brečel hrdostí!"',
];
function rndQ(arr){return arr[Math.floor(Math.random()*arr.length)];}
let lastMilestone=0;
let _lsc=-1,_lcn=-1;
function updateHUD(){
  const hs=document.getElementById('h-score'),hc=document.getElementById('h-coins');
  if(score!==_lsc){hs.textContent=score;_lsc=score;const p=document.getElementById('hud-score');p.classList.remove('pop');void p.offsetWidth;p.classList.add('pop');}
  if(coins!==_lcn){hc.textContent=coins;_lcn=coins;const p=document.getElementById('hud-coins');p.classList.remove('pop');void p.offsetWidth;p.classList.add('pop');}
  document.getElementById('h-best').textContent=S.best;
  const cd=document.getElementById('combo');
  if(combo>=3&&comboT>0){cd.textContent=combo+'x!';if(!cd.classList.contains('show')){cd.classList.add('show');setTimeout(()=>cd.classList.remove('show'),800);}}
}
function updatePUUI(){document.getElementById('powerup-bar').innerHTML=activePU.map(p=>'<div class="pu-active">'+p.icon+(p.id==='shield'?'':' '+Math.ceil(p.dur/60)+'s')+'</div>').join('');}
function hideOverlay(){document.getElementById('overlay').classList.add('hidden');}
function showMenu(isDeath){
  const ov=document.getElementById('overlay');ov.classList.remove('hidden');
  document.getElementById('ov-icon').textContent=isDeath?'🚔':'👷';
  document.getElementById('ov-title').textContent=isDeath?'CHYTILI TĚ!':'IMIGRANT PIŠTA';
  let sub;
  if(isDeath){
    const base=deathReason;
    let q='';
    if(base.includes('auto'))q=rndQ(Q_DEATH_CAR);
    else if(base.includes('vlak'))q=rndQ(Q_DEATH_TRAIN);
    else if(base.includes('vod'))q=rndQ(Q_DEATH_WATER);
    sub=base+'\n\n'+q;
  } else {
    sub=rndQ(Q_MENU);
  }
  document.getElementById('ov-sub').textContent=sub;
  document.getElementById('btn-start').textContent=isDeath?'ZKUSIT ZNOVU':'HRÁT';
  document.getElementById('ov-hint').textContent=isDeath?'Pišta se nevzdává!':'Klikni / tapni / swipni pro pohyb';
  const sc=document.getElementById('ov-scores');
  if(isDeath||S.best>0){sc.style.display='flex';document.getElementById('os-score').textContent=isDeath?score:S.best;document.getElementById('os-coins').textContent=isDeath?coins:'—';document.getElementById('os-best').textContent=S.best;}
  else sc.style.display='none';
  document.getElementById('hud').style.display='none';
}
function showZone(name){const b=document.getElementById('zone-banner');b.textContent='📍 '+name;b.classList.add('show');setTimeout(()=>b.classList.remove('show'),3000);}
let toastQ=[];
function showToast(txt){
  document.querySelectorAll('.toast').forEach(t=>t.remove());
  const t=document.createElement('div');t.className='toast';t.innerHTML=txt;document.body.appendChild(t);setTimeout(()=>t.remove(),3000);
}

/* ─── SHOP ─── */
function openShop(){document.getElementById('shop-panel').classList.add('open');renderShop();}
function closeShop(){document.getElementById('shop-panel').classList.remove('open');}
function renderShop(){
  document.getElementById('shop-coins').textContent='💰 '+S.coins;
  document.getElementById('shop-grid').innerHTML=CHARS.map(c=>{
    const owned=S.chars.includes(c.id),sel=c.id===selChar,can=S.coins>=c.price;
    return '<div class="char-card '+(sel?'selected':'')+' '+(owned?'':'locked')+'" onclick="buyChar(\''+c.id+'\')"><div class="char-icon">'+c.icon+'</div><div class="char-name">'+c.name+'</div>'+(owned?(sel?'<div class="char-owned">✓ Vybráno</div>':'<div class="char-owned">Vlastníš</div>'):'<div class="char-price">'+(can?'':'🔒 ')+c.price+' 💰</div>')+'</div>';
  }).join('');
}
window.buyChar=function(id){
  const c=CHARS.find(x=>x.id===id);if(!c)return;
  if(S.chars.includes(id)){selChar=id;}
  else if(S.coins>=c.price){S.coins-=c.price;S.chars.push(id);selChar=id;save();showToast(c.icon+' '+c.name+'!');}
  renderShop();
};

/* ─── ACHIEVEMENTS ─── */
function openAch(){document.getElementById('ach-panel').classList.add('open');renderAch();}
function closeAch(){document.getElementById('ach-panel').classList.remove('open');}
function renderAch(){
  document.getElementById('ach-count').textContent=S.achs.length+'/'+ACHS.length;
  document.getElementById('ach-grid').innerHTML=ACHS.map(a=>{
    const u=S.achs.includes(a.id);
    return '<div class="ach-item '+(u?'done':'locked')+'"><div class="ach-ic">'+(u?a.icon:'🔒')+'</div><div class="ach-info"><div class="ach-name">'+a.name+'</div><div class="ach-desc">'+a.desc+'</div></div><div class="ach-reward">+'+a.rw+'💰</div></div>';
  }).join('');
}

function haptic(){try{navigator.vibrate&&navigator.vibrate(6);}catch(e){}}

/* ─── LOOP ─── */
function animate(){
  requestAnimationFrame(animate);
  ensureLanes();
  update();
  renderer.render(scene,camera);
}

/* ─── INIT ─── */
function init(){initThree();showMenu(false);updateHUD();animate();}
window.addEventListener('resize',()=>{if(!camera||!renderer)return;const a=window.innerWidth/window.innerHeight;camera.left=-5*a;camera.right=5*a;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);});
init();