/* ═══════════════════════════════════════════════════
   IMIGRANT PIŠTA v2.0 — Complete Game Engine
   Shop, Upgrades, Achievements, Skills, Story, Map
   ═══════════════════════════════════════════════════ */

const $ = id => document.getElementById(id);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

/* ─── DATA ─── */

const TASKS = [
  { name:'Instalace solárních panelů', desc:'Instaluj panely na střechu haly. Práce venku — větší riziko.', reward:120, effort:3, riskMod:15, icon:'☀️', type:'Stavba', xp:15 },
  { name:'Kopání základů', desc:'Vykopej základy. Těžká práce, ale daleko od cest.', reward:80, effort:2, riskMod:8, icon:'⛏️', type:'Manuální', xp:10 },
  { name:'Elektroinstalace', desc:'Propoj kabeláž v domě. Práce uvnitř — menší riziko.', reward:150, effort:4, riskMod:10, icon:'⚡', type:'Odborná', xp:20 },
  { name:'Malování fasády', desc:'Natři fasádu domu. Viditelné z ulice.', reward:90, effort:2, riskMod:20, icon:'🎨', type:'Stavba', xp:10 },
  { name:'Noční úklid skladu', desc:'Ukliď sklad přes noc. Nízké riziko.', reward:60, effort:2, riskMod:5, icon:'🧹', type:'Noční', xp:8 },
  { name:'Montáž lešení', desc:'Postav lešení. Nebezpečná výšková práce.', reward:130, effort:3, riskMod:12, icon:'🏗️', type:'Stavba', xp:15 },
  { name:'Rozvoz materiálu', desc:'Rozváž materiál po městě. Pozor na polici.', reward:100, effort:2, riskMod:18, icon:'🚛', type:'Transport', xp:12 },
  { name:'Pokládka dlažby', desc:'Polož dlažbu v centru. Bezpečná práce uvnitř.', reward:110, effort:3, riskMod:7, icon:'🧱', type:'Manuální', xp:12 },
  { name:'Svařování konstrukce', desc:'Svařuj ocelovou konstrukci. Dobře placená.', reward:170, effort:4, riskMod:12, icon:'🔥', type:'Odborná', xp:22 },
  { name:'Sběr úrody', desc:'Pomoz na farmě za městem. Daleko od kontrol.', reward:70, effort:2, riskMod:3, icon:'🌾', type:'Zemědělství', xp:8 },
  { name:'Oprava střechy', desc:'Oprav střechu starého domu. Výšková práce.', reward:140, effort:3, riskMod:14, icon:'🏠', type:'Stavba', xp:16 },
  { name:'Betonování', desc:'Zalévej základy. Časový tlak.', reward:100, effort:3, riskMod:9, icon:'🪨', type:'Manuální', xp:14 },
  { name:'Noční hlídání', desc:'Hlídej staveniště přes noc.', reward:50, effort:1, riskMod:2, icon:'🌙', type:'Noční', xp:5 },
  { name:'Instalace oken', desc:'Vsaď okna do novostavby. Práce vyžaduje přesnost.', reward:125, effort:3, riskMod:8, icon:'🪟', type:'Odborná', xp:15 },
  { name:'Bourací práce', desc:'Zboř starou příčku. Prašná a hlučná práce.', reward:95, effort:2, riskMod:11, icon:'🔨', type:'Manuální', xp:11 }
];

const EVENTS = {
  patrol: [
    { title:'Imigrační kontrola!', text:'Policejní hlídka prohledává oblast!', icon:'🚨' },
    { title:'AI dron!', text:'Kamera s rozpoznáváním obličejů skenuje okolí.', icon:'🤖' },
    { title:'Kontrola dokladů!', text:'Kontrolní stanoviště na křižovatce.', icon:'🛂' },
    { title:'Tajná policie!', text:'Civilní agenti v oblasti.', icon:'🕵️' },
    { title:'K9 jednotka!', text:'Policejní psi prohledávají staveniště.', icon:'🐕' },
    { title:'Helikoptéra!', text:'Policejní vrtulník kroužící nad oblastí.', icon:'🚁' }
  ],
  positive: [
    { title:'Tip od kamaráda', text:'Kolega varoval před kontrolou.', icon:'💬', effect:{suspicion:-10} },
    { title:'Nalezená peněženka', text:'Našel jsi zapomenutou peněženku.', icon:'💰', effect:{money:30} },
    { title:'Bonus od šéfa', text:'Šéf je spokojený. Dostal jsi bonus.', icon:'⭐', effect:{money:50} },
    { title:'Energy drink', text:'Někdo nechal energy drink.', icon:'🥤', effect:{energy:25} },
    { title:'Nový kontakt', text:'Poznal jsi spolehlivého kolegu.', icon:'🤝', effect:{stealth:8} },
    { title:'Levné jídlo', text:'Stánek s levným jídlem.', icon:'🥙', effect:{energy:15,stamina:10} },
    { title:'Dobrý spánek', text:'Poprvé za dlouho jsi spal dobře.', icon:'😊', effect:{energy:20,stamina:15} },
    { title:'Lepší doklady', text:'Kamarád sehnal lepší falešné doklady.', icon:'📄', effect:{suspicion:-15,stealth:5} }
  ],
  negative: [
    { title:'Zranění', text:'Pořezal ses. Bolí to.', icon:'🩹', effect:{energy:-20,stamina:-15} },
    { title:'Podezřelý soused', text:'Soused možná zavolá policii.', icon:'👀', effect:{suspicion:12} },
    { title:'Špatné počasí', text:'Déšť zpomalil práci.', icon:'🌧️', effect:{energy:-15,stamina:-10} },
    { title:'Okradení', text:'Někdo ukradl část výplaty.', icon:'😤', effect:{money:-40} },
    { title:'Nemoc', text:'Něco špatného jsi snědl.', icon:'🤒', effect:{energy:-25,stamina:-20} },
    { title:'Šéf zuří', text:'Šéf naštvaný kvůli chybě.', icon:'😡', effect:{money:-20} },
    { title:'Rozbitý telefon', text:'Spadl ti telefon. Ztratil jsi kontakty.', icon:'📱', effect:{stealth:-8} },
    { title:'Falešný tip', text:'Někdo tě navedl špatně.', icon:'🤥', effect:{energy:-10} }
  ]
};

const WEATHER = [
  { name:'Jasno', emoji:'☀️', energyMod:0, riskMod:5 },
  { name:'Oblačno', emoji:'⛅', energyMod:0, riskMod:0 },
  { name:'Déšť', emoji:'🌧️', energyMod:-10, riskMod:-5 },
  { name:'Mlha', emoji:'🌫️', energyMod:-5, riskMod:-15 },
  { name:'Sníh', emoji:'❄️', energyMod:-15, riskMod:-10 },
  { name:'Bouřka', emoji:'⛈️', energyMod:-20, riskMod:-20 },
  { name:'Horko', emoji:'🔥', energyMod:-12, riskMod:3 }
];

const SHOP_ITEMS = [
  { id:'hardhat', name:'Helma', desc:'−5 energie při práci', price:80, icon:'⛑️', owned:false, effect:{workEnergySave:5} },
  { id:'boots', name:'Pracovní boty', desc:'+10 stamina při odpočinku', price:60, icon:'👢', owned:false, effect:{restStaminaBonus:10} },
  { id:'fakeid', name:'Falešný průkaz', desc:'−5% podezření/den navíc', price:200, icon:'🪪', owned:false, effect:{dailySuspicionReduction:5} },
  { id:'phone', name:'Burner telefon', desc:'+10% šance na útěk', price:120, icon:'📱', owned:false, effect:{escapeBonus:10} },
  { id:'jacket', name:'Neviditelná bunda', desc:'+8 stealth trvale', price:150, icon:'🧥', owned:false, effect:{stealthBonus:8} },
  { id:'toolbox', name:'Profi nářadí', desc:'Úkoly −1 effort (min 1)', price:250, icon:'🧰', owned:false, effect:{effortReduction:1} },
  { id:'map', name:'Mapa patroly', desc:'Vidíš patroly na mapě', price:180, icon:'🗺️', owned:false, effect:{showPatrolMap:true} },
  { id:'firstaid', name:'Lékárnička', desc:'1×/den obnov 30 energie', price:100, icon:'🩹', owned:false, uses:1, maxUses:1, effect:{healAmount:30} },
  { id:'coffee', name:'Zásoby kávy', desc:'+15 energie každé ráno', price:90, icon:'☕', owned:false, effect:{morningEnergy:15} },
  { id:'contacts', name:'Síť kontaktů', desc:'Úplatky −20% cena', price:160, icon:'📇', owned:false, effect:{bribeDiscount:0.2} }
];

const SKILLS = [
  { id:'quick_hands', name:'Rychlé ruce', desc:'+1 akce/den', cost:3, icon:'✋', level:0, maxLevel:2, effect:'maxActions' },
  { id:'shadow', name:'Stín', desc:'+4 efektivita schovávání', cost:2, icon:'👤', level:0, maxLevel:3, effect:'hideBonus' },
  { id:'tough', name:'Otrlost', desc:'−5 ztráta energie při práci', cost:2, icon:'💎', level:0, maxLevel:3, effect:'toughness' },
  { id:'negotiator', name:'Vyjednavač', desc:'+10% úspěšnost úplatku', cost:3, icon:'🗣️', level:0, maxLevel:2, effect:'bribeSuccess' },
  { id:'scout', name:'Průzkumník', desc:'Ranní event vždy pozitivní', cost:5, icon:'🔭', level:0, maxLevel:1, effect:'scoutMorning' },
  { id:'endurance', name:'Výdrž', desc:'Lepší noční regenerace', cost:2, icon:'🏃', level:0, maxLevel:3, effect:'nightStamina' },
  { id:'streetwise', name:'Znalost ulic', desc:'Patroly −5% šance tě najít', cost:4, icon:'🏙️', level:0, maxLevel:2, effect:'patrolAvoid' },
  { id:'hustler', name:'Hustler', desc:'+15% bonus na odměnu', cost:4, icon:'💵', level:0, maxLevel:2, effect:'rewardBonus' }
];

const ACHIEVEMENTS = [
  { id:'first_day', name:'První den', desc:'Přežij první den', icon:'🌅', cond:s=>s.day>=2 },
  { id:'week', name:'Týden', desc:'Přežij 7 dní', icon:'📅', cond:s=>s.day>=7 },
  { id:'month', name:'Měsíc', desc:'Přežij 30 dní', icon:'🗓️', cond:s=>s.day>=30 },
  { id:'rich', name:'Boháč', desc:'Měj 500€ najednou', icon:'💎', cond:s=>s.money>=500 },
  { id:'millionaire', name:'Milionář', desc:'Celkem vydělej 2000€', icon:'🏆', cond:s=>s.totalEarned>=2000 },
  { id:'ghost', name:'Duch', desc:'Sniž podezření z 40%+ na 0%', icon:'👻', cond:s=>s.suspicion===0&&s.peakSuspicion>=40 },
  { id:'survivor', name:'Přeživší', desc:'Přežij s energií pod 10%', icon:'💀', cond:s=>s.energy<=10&&s.energy>0 },
  { id:'shopper', name:'Nakupovač', desc:'Kup 5 věcí', icon:'🛒', cond:s=>s.itemsBought>=5 },
  { id:'skilled', name:'Odborník', desc:'Odemkni 3 dovednosti', icon:'🎯', cond:s=>s.skillsUnlocked>=3 },
  { id:'escape_artist', name:'Escape Artist', desc:'Unikni 5× patrole', icon:'🏃', cond:s=>s.patrolsEscaped>=5 },
  { id:'bribe_master', name:'Korupčník', desc:'10× úspěšný úplatek', icon:'💸', cond:s=>s.bribesSuccessful>=10 },
  { id:'hard_worker', name:'Dříč', desc:'Splň 20 úkolů', icon:'🔨', cond:s=>s.tasksCompleted>=20 }
];

const BLACK_MARKET = [
  { name:'Falešný pas', desc:'−40% podezření', price:300, icon:'📕', effect:{suspicion:-40}, rare:true },
  { name:'Informátor', desc:'3 dny bez patrolí', price:250, icon:'🕶️', effect:{patrolImmunity:3}, rare:true },
  { name:'Únikový vůz', desc:'Auto-únik z příští patroly', price:200, icon:'🚗', effect:{autoEscape:1}, rare:false },
  { name:'Lékařská péče', desc:'Plná obnova energie a staminy', price:150, icon:'🏥', effect:{fullHeal:true}, rare:false },
  { name:'VIP kontakt', desc:'+30 stealth, −20 podezření', price:350, icon:'🎩', effect:{stealth:30,suspicion:-20}, rare:true },
  { name:'Schengen doklady', desc:'5 dní poloviční podezření', price:400, icon:'🇪🇺', effect:{halfSuspicion:5}, rare:true }
];

const STORY = [
  { day:1, title:'Příjezd', text:'Dorazil jsi do cizí země. 50€ v kapse, falešné jméno, jeden kontakt. Musíš přežít.', icon:'✈️' },
  { day:3, title:'Realita', text:'Třetí den. Práce je tvrdá, ale peníze tečou. Dávej si pozor na kontroly.', icon:'💡' },
  { day:7, title:'Týden', text:'Znáš okolí a lidi. Ale AI patroly jsou chytřejší.', icon:'📅' },
  { day:14, title:'Etablování', text:'Dva týdny. Šéf ti důvěřuje. Riziko roste. Investuj do vybavení.', icon:'🏗️' },
  { day:21, title:'Razie', text:'Tři týdny. Zvěsti o velké razii. Nové technologie. Buď opatrný.', icon:'⚠️' },
  { day:30, title:'Veterán', text:'Měsíc! Jsi legenda. Ale čím déle zůstáváš, tím víc tě hledají.', icon:'🏆' },
  { day:50, title:'Legenda', text:'50 dní. Systém tě nezlomil. Jeden špatný den a je konec.', icon:'👑' }
];

/* ─── STATE ─── */

let S = {};
let weather = WEATHER[0];
let blackMarket = null;
let shop = [];
let sk = [];
let achUnlocked = new Set();
let patrols = [];
let pistaPos = {x:4,y:4};

function freshState() {
  return {
    day:1, money:50, energy:100, suspicion:0, stamina:80, stealth:50,
    actionsLeft:3, maxActions:3, task:null, taskProgress:0,
    highScore:0, totalEarned:0, bestDay:0, eventLog:[],
    patrolActive:false, gameOver:false,
    xp:0, skillPoints:0, level:1,
    tasksCompleted:0, patrolsEscaped:0, patrolsCaught:0,
    bribesSuccessful:0, bribesTotal:0, itemsBought:0, skillsUnlocked:0,
    peakSuspicion:0, peakMoney:50,
    patrolImmunity:0, autoEscape:0, halfSuspicion:0, firstAidUsed:false,
    storySeen:[], tab:'game'
  };
}

/* ─── INIT ─── */

function init() {
  try {
    S.highScore = parseInt(localStorage.getItem('ph')||'0');
    S.bestDay = parseInt(localStorage.getItem('pd')||'0');
    const sa = localStorage.getItem('pa');
    if(sa) JSON.parse(sa).forEach(id => achUnlocked.add(id));
  } catch(e){}
  showScreen('title-screen');
  updateTitle();
}

function updateTitle() {
  const h=$('title-highscore'), d=$('title-bestday'), a=$('title-achievements');
  if(h) h.textContent=(S.highScore||0)+'€';
  if(d) d.textContent=S.bestDay||0;
  if(a) a.textContent=achUnlocked.size+'/'+ACHIEVEMENTS.length;
}

function saveProgress() {
  try {
    if(S.money>S.highScore){S.highScore=S.money;localStorage.setItem('ph',S.money);}
    if(S.day>S.bestDay){S.bestDay=S.day;localStorage.setItem('pd',S.day);}
    localStorage.setItem('pa',JSON.stringify([...achUnlocked]));
  } catch(e){}
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  $(id)?.classList.add('active');
}

/* ─── GAME START ─── */

function startGame() {
  S = freshState();
  S.highScore=parseInt(localStorage.getItem('ph')||'0');
  S.bestDay=parseInt(localStorage.getItem('pd')||'0');
  shop = SHOP_ITEMS.map(i=>({...i}));
  sk = SKILLS.map(s=>({...s}));
  newDay();
  showScreen('game-screen');
  setTimeout(()=>triggerStory(),500);
}

/* ─── NEW DAY ─── */

function newDay() {
  S.actionsLeft = S.maxActions + skVal('maxActions');
  S.taskProgress = 0;
  S.patrolActive = false;
  S.firstAidUsed = false;

  // Refresh first aid
  const fa=shop.find(i=>i.id==='firstaid'&&i.owned);
  if(fa) fa.uses=fa.maxUses;

  // Pick task
  let t; do{t=pick(TASKS);}while(t===S.task&&TASKS.length>1);
  S.task={...t};
  const tb=shop.find(i=>i.id==='toolbox'&&i.owned);
  if(tb) S.task.effort=Math.max(1,S.task.effort-1);

  weather=pick(WEATHER);

  // Recovery
  S.energy=clamp(S.energy+20+skVal('nightStamina')*3,0,100);
  S.stamina=clamp(S.stamina+15+skVal('nightStamina')*5,0,100);
  let sr=5; if(shop.find(i=>i.id==='fakeid'&&i.owned)) sr+=5;
  S.suspicion=Math.max(0,S.suspicion-sr);
  if(shop.find(i=>i.id==='coffee'&&i.owned)) S.energy=clamp(S.energy+15,0,100);

  if(S.patrolImmunity>0) S.patrolImmunity--;
  if(S.halfSuspicion>0) S.halfSuspicion--;

  genPatrols();
  addLog('🌅',`Den ${S.day} — ${weather.emoji} ${weather.name}`);

  if(S.day>1&&Math.random()<0.3){
    skVal('scoutMorning')>0 ? triggerEvt(pick(EVENTS.positive)) : triggerRandEvt();
  }
  triggerStory();
  blackMarket=(S.day>=4&&S.day%3===1)?pick(BLACK_MARKET.filter(i=>Math.random()<(i.rare?0.4:0.7)))||pick(BLACK_MARKET.filter(i=>!i.rare)):null;

  checkAch();
  renderGame();
}

/* ─── SKILL HELPER ─── */
function skVal(eff){ const s=sk.find(x=>x.effect===eff); return s?s.level:0; }

/* ─── ACTIONS ─── */

function doWork() {
  if(S.actionsLeft<=0||S.energy<=0||S.taskProgress>=S.task.effort) return;
  S.actionsLeft--;
  S.taskProgress++;
  let ec=20+Math.abs(weather.energyMod);
  if(shop.find(i=>i.id==='hardhat'&&i.owned)) ec-=5;
  ec-=skVal('toughness')*5;
  S.energy-=Math.max(5,ec);
  S.stamina-=10;
  let ri=Math.floor(S.task.riskMod/S.task.effort)+Math.max(0,Math.floor(weather.riskMod/2));
  if(S.halfSuspicion>0) ri=Math.floor(ri/2);
  S.suspicion+=Math.max(1,ri);
  S.peakSuspicion=Math.max(S.peakSuspicion,S.suspicion);
  pistaPos={x:rand(1,7),y:rand(1,7)};
  movePatrols();
  addLog('🔨',`Pracuješ… ${S.taskProgress}/${S.task.effort}`);

  if(S.patrolImmunity<=0&&Math.random()<(S.suspicion/180)-skVal('patrolAvoid')*0.05){
    triggerPatrol(); return;
  }
  if(S.taskProgress>=S.task.effort){
    let rw=S.task.reward+Math.floor(S.task.reward*skVal('rewardBonus')*0.15);
    S.money+=rw; S.totalEarned+=rw; S.peakMoney=Math.max(S.peakMoney,S.money);
    S.tasksCompleted++; gainXP(S.task.xp);
    addLog('✅',`Hotovo! +${rw}€`);
    if(Math.random()<0.35) triggerRandEvt();
  }
  clampAll(); checkAch(); checkGO(); renderGame();
}

function doHide() {
  if(S.actionsLeft<=0) return;
  S.actionsLeft--;
  let red=10+Math.floor(S.stealth/5)+skVal('hideBonus')*4;
  S.suspicion=Math.max(0,S.suspicion-red);
  S.stealth=clamp(S.stealth+5,0,100);
  S.energy-=5;
  pistaPos={x:rand(0,1),y:rand(0,1)};
  addLog('🙈',`Schovával ses. −${red}% podezření`);
  if(Math.random()<0.12) triggerRandEvt();
  clampAll(); checkAch(); checkGO(); renderGame();
}

function doBribe() {
  if(S.actionsLeft<=0||S.money<30) return;
  S.actionsLeft--; S.bribesTotal++;
  let cost=30+rand(0,20);
  if(shop.find(i=>i.id==='contacts'&&i.owned)) cost=Math.floor(cost*0.8);
  const rate=0.75+skVal('bribeSuccess')*0.1;
  if(Math.random()<rate){
    S.money-=cost; S.suspicion=Math.max(0,S.suspicion-25);
    S.bribesSuccessful++; addLog('💸',`Úplatek ${cost}€ fungoval! −25%`); gainXP(5);
  } else {
    S.money-=Math.floor(cost/2); S.suspicion+=10;
    addLog('😰',`Úplatek selhal! −${Math.floor(cost/2)}€, +10%`);
  }
  clampAll(); checkAch(); checkGO(); renderGame();
}

function doRest() {
  if(S.actionsLeft<=0) return;
  S.actionsLeft--;
  let sg=20; if(shop.find(i=>i.id==='boots'&&i.owned)) sg+=10;
  S.energy=clamp(S.energy+30,0,100);
  S.stamina=clamp(S.stamina+sg,0,100);
  addLog('😴','Odpočíváš… Energie a stamina ↑');
  if(Math.random()<0.1) triggerRandEvt();
  checkAch(); checkGO(); renderGame();
}

function useFirstAid() {
  const fa=shop.find(i=>i.id==='firstaid'&&i.owned);
  if(!fa||fa.uses<=0||S.firstAidUsed) return;
  fa.uses--; S.firstAidUsed=true;
  S.energy=clamp(S.energy+30,0,100);
  addLog('🩹','Lékárnička: +30 energie');
  renderGame();
}

function endDay() {
  const lc=20+Math.floor(S.day/3)*5;
  S.money-=lc;
  addLog('🏠',`Náklady na život: −${lc}€`);
  if(S.money<0){ gameOver('Došly ti peníze. Nepřežiješ.'); return; }
  S.day++; saveProgress();
  if(S.day%7===0){ S.maxActions=Math.min(5,S.maxActions+1); addLog('📈','+1 akce za den!'); }
  newDay();
}

/* ─── XP ─── */

function gainXP(n) {
  S.xp+=n;
  const need=S.level*50;
  if(S.xp>=need){
    S.xp-=need; S.level++; S.skillPoints++;
    addLog('⬆️',`Level ${S.level}! +1 SP`);
    showModal('⬆️',`Level ${S.level}!`,`Nová úroveň! ${S.skillPoints} SP k využití.`,[{label:'XP',value:`${S.xp}/${S.level*50}`,negative:false}],()=>renderGame());
  }
}

function upgradeSkill(id) {
  const s=sk.find(x=>x.id===id);
  if(!s||s.level>=s.maxLevel||S.skillPoints<s.cost) return;
  S.skillPoints-=s.cost; s.level++;
  S.skillsUnlocked=sk.filter(x=>x.level>0).length;
  addLog('🎯',`"${s.name}" → Lv.${s.level}`);
  checkAch(); renderSkills();
}

/* ─── SHOP ─── */

function buyItem(id) {
  const it=shop.find(i=>i.id===id);
  if(!it||it.owned||S.money<it.price) return;
  S.money-=it.price; it.owned=true; S.itemsBought++;
  if(it.id==='jacket') S.stealth=clamp(S.stealth+8,0,100);
  addLog('🛒',`Koupil jsi: ${it.name}`);
  checkAch(); renderShop(); renderGame();
}

/* ─── BLACK MARKET ─── */

function buyBM() {
  if(!blackMarket||S.money<blackMarket.price) return;
  S.money-=blackMarket.price;
  const e=blackMarket.effect;
  if(e.suspicion) S.suspicion=clamp(S.suspicion+e.suspicion,0,100);
  if(e.stealth) S.stealth=clamp(S.stealth+e.stealth,0,100);
  if(e.fullHeal){ S.energy=100; S.stamina=100; }
  if(e.patrolImmunity) S.patrolImmunity=e.patrolImmunity;
  if(e.autoEscape) S.autoEscape+=e.autoEscape;
  if(e.halfSuspicion) S.halfSuspicion=e.halfSuspicion;
  addLog('🕶️',`Černý trh: ${blackMarket.name}`);
  blackMarket=null; checkAch(); renderGame();
}

/* ─── PATROLS ─── */

function genPatrols(){
  const n=Math.min(4,1+Math.floor(S.day/5));
  patrols=[];
  for(let i=0;i<n;i++) patrols.push({x:rand(0,8),y:rand(0,8),d:rand(0,3)});
}

function movePatrols(){
  const dirs=[{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
  patrols.forEach(p=>{
    if(Math.random()<0.3) p.d=rand(0,3);
    const d=dirs[p.d]; p.x=clamp(p.x+d.x,0,8); p.y=clamp(p.y+d.y,0,8);
  });
}

function triggerPatrol() {
  S.patrolActive=true;
  const p=pick(EVENTS.patrol);

  if(S.autoEscape>0){
    S.autoEscape--; S.patrolsEscaped++;
    addLog('🚗','Únikový vůz tě zachránil!');
    showModal('🚗','Automatický únik!','Tvůj vůz tě odvezl do bezpečí.',[{label:'Zbývající',value:''+S.autoEscape,negative:false}],()=>{S.patrolActive=false;renderGame();});
    return;
  }

  $('patrol-warning')?.classList.add('active');
  setTimeout(()=>$('patrol-warning')?.classList.remove('active'),1500);
  $('scanner')?.classList.add('active');
  setTimeout(()=>$('scanner')?.classList.remove('active'),2000);

  let esc=S.stealth/100;
  if(shop.find(i=>i.id==='phone'&&i.owned)) esc+=0.1;

  if(Math.random()<esc){
    S.suspicion+=5; S.patrolsEscaped++;
    addLog('🏃','Unikl jsi!');
    showModal(p.icon,p.title,p.text+'\n\nUnikl jsi!',[{label:'Podezření',value:'+5%',negative:true}],()=>{S.patrolActive=false;checkAch();renderGame();});
  } else {
    S.suspicion+=20; S.stealth=Math.max(0,S.stealth-10); S.patrolsCaught++;
    if(S.suspicion>=100){
      showModal(p.icon,p.title,p.text+'\n\n⛓️ Chytili tě!',[{label:'Podezření',value:'100%',negative:true}],()=>gameOver('Chytili tě! Deportace.'));
    } else {
      addLog('🚨','Téměř tě chytili!');
      showModal(p.icon,p.title,p.text+'\n\nTěsně jsi unikl!',[{label:'Podezření',value:'+20%',negative:true},{label:'Stealth',value:'−10%',negative:true}],()=>{S.patrolActive=false;checkAch();renderGame();});
    }
  }
}

/* ─── EVENTS ─── */

function triggerRandEvt(){ triggerEvt(pick(Math.random()<0.5?EVENTS.positive:EVENTS.negative)); }

function triggerEvt(ev){
  if(ev.effect) for(const[k,v]of Object.entries(ev.effect)){
    if(k==='money') S[k]+=v; else S[k]=clamp(S[k]+v,0,100);
  }
  const fx=[];
  if(ev.effect) for(const[k,v]of Object.entries(ev.effect)){
    const lb={money:'Peníze',energy:'Energie',suspicion:'Podezření',stamina:'Stamina',stealth:'Stealth'};
    fx.push({label:lb[k]||k,value:(v>0?'+':'')+v+(k==='money'?'€':'%'),negative:k==='suspicion'?v>0:v<0});
  }
  addLog(ev.icon,ev.title);
  showModal(ev.icon,ev.title,ev.text,fx,()=>renderGame());
}

function triggerStory(){
  const m=STORY.find(s=>s.day===S.day&&!S.storySeen.includes(s.day));
  if(m){ S.storySeen.push(m.day); showModal(m.icon,m.title,m.text,[],()=>renderGame()); }
}

/* ─── ACHIEVEMENTS ─── */

function checkAch(){
  ACHIEVEMENTS.forEach(a=>{
    if(!achUnlocked.has(a.id)&&a.cond(S)){
      achUnlocked.add(a.id);
      addLog('🏅',`Achievement: ${a.name}!`);
      showAchToast(a);
    }
  });
  saveProgress();
}

/* ─── GAME OVER ─── */

function checkGO(){
  if(S.gameOver) return;
  if(S.suspicion>=100) gameOver('Chytili tě! Deportace.');
  else if(S.energy<=0&&S.stamina<=0&&S.actionsLeft<=0) gameOver('Vyčerpání. Zkolaboval jsi.');
}

function gameOver(reason){
  S.gameOver=true; saveProgress();
  $('gameover-reason').textContent=reason;
  $('gameover-days').textContent=S.day;
  $('gameover-earned').textContent=S.totalEarned+'€';
  $('gameover-final').textContent=S.money+'€';
  $('gameover-level').textContent=S.level;
  $('gameover-tasks').textContent=S.tasksCompleted;
  const ge=$('gameover-escapes'); if(ge) ge.textContent=S.patrolsEscaped;
  $('modal-overlay')?.classList.remove('active');
  setTimeout(()=>showScreen('gameover-screen'),300);
}

/* ─── RENDER ─── */

function renderGame(){
  if(S.gameOver) return;

  $('hud-money').textContent=S.money+'€';
  $('hud-day').textContent='Den '+S.day;
  $('hud-risk').textContent=clamp(S.suspicion,0,100)+'%';
  $('hud-level').textContent='Lv.'+S.level;
  $('day-title').textContent=`${S.task.icon} ${S.task.name}`;
  $('day-weather').textContent=`${weather.emoji} ${weather.name}`;

  $('task-type').textContent=S.task.type;
  let dr=S.task.reward+Math.floor(S.task.reward*skVal('rewardBonus')*0.15);
  $('task-reward').textContent='+'+dr+'€';
  $('task-name').textContent=S.task.name;
  $('task-desc').textContent=S.task.desc;

  const pct=Math.min(100,(S.taskProgress/S.task.effort)*100);
  $('progress-value').textContent=`${S.taskProgress}/${S.task.effort}`;
  $('progress-fill').style.width=pct+'%';

  const xpN=S.level*50;
  $('xp-fill').style.width=(S.xp/xpN*100)+'%';
  $('xp-text').textContent=`${S.xp}/${xpN} XP`;

  const al=$('alert-bar');
  if(S.suspicion>=60){ al.classList.add('active'); $('alert-text').textContent=S.suspicion>=80?'KRITICKÉ! Schovej se!':'Imigrační služba ve střehu.'; $('alert-level').textContent=S.suspicion+'%'; }
  else al.classList.remove('active');

  const ib=$('immune-banner');
  if(S.patrolImmunity>0){ib.style.display='flex';$('immune-days').textContent=S.patrolImmunity;}
  else ib.style.display='none';

  uM('energy',S.energy); uM('suspicion',S.suspicion); uM('stamina',S.stamina); uM('stealth',S.stealth);

  $('actions-left').textContent=`Akce: ${S.actionsLeft}/${S.maxActions+skVal('maxActions')}`;
  const na=S.actionsLeft<=0, ne=S.energy<=0;
  $('btn-work').disabled=na||ne||S.taskProgress>=S.task.effort;
  $('btn-hide').disabled=na;
  $('btn-bribe').disabled=na||S.money<30;
  $('btn-rest').disabled=na;

  const fab=shop.find(i=>i.id==='firstaid'&&i.owned);
  $('btn-firstaid').style.display=(fab&&fab.uses>0&&!S.firstAidUsed)?'flex':'none';
  $('btn-endday').style.display=(S.taskProgress>=S.task.effort||S.actionsLeft<=0)?'flex':'none';

  renderBM(); renderMap(); renderFeed();

  // Weather color accent
  const wColors={Jasno:'250,204,21','Oblačno':'148,163,184','Déšť':'96,165,250',Mlha:'167,139,250','Sníh':'226,232,240','Bouřka':'129,140,248',Horko:'248,113,113'};
  document.querySelector('.day-bar')?.style.setProperty('--weather-color',`rgba(${wColors[weather.name]||'255,255,255'},0.3)`);
  // Progress complete state
  const pf=$('progress-fill');
  if(pf) pf.classList.toggle('complete',S.taskProgress>=S.task.effort);
  // Animate HUD values
  animateHud();
}

function uM(id,v){
  const el=$(`meter-${id}-value`),f=$(`meter-${id}-fill`);
  if(el) el.textContent=clamp(v,0,100)+'%';
  if(f) f.style.width=clamp(v,0,100)+'%';
}

function renderFeed(){
  const f=$('event-feed'); if(!f) return;
  f.innerHTML=S.eventLog.slice(-6).map(e=>`<div class="feed-item"><span class="feed-icon">${e.icon}</span><span class="feed-text">${e.text}</span></div>`).join('');
  f.scrollTop=f.scrollHeight;
}

function addLog(i,t){ S.eventLog.push({icon:i,text:t}); }

function renderBM(){
  const el=$('black-market'); if(!el) return;
  if(!blackMarket){el.style.display='none';return;}
  el.style.display='block';
  $('bm-icon').textContent=blackMarket.icon;
  $('bm-name').textContent=blackMarket.name;
  $('bm-desc').textContent=blackMarket.desc;
  $('bm-price').textContent=blackMarket.price+'€';
  $('btn-bm-buy').disabled=S.money<blackMarket.price;
}

function renderMap(){
  const c=$('minimap'); if(!c) return;
  const mp=shop.find(i=>i.id==='map'&&i.owned);
  const ctx=c.getContext('2d'), sz=c.width/9;
  ctx.fillStyle='#080c15'; ctx.fillRect(0,0,c.width,c.height);
  ctx.strokeStyle='rgba(56,189,248,0.04)'; ctx.lineWidth=0.5;
  for(let i=0;i<=9;i++){
    ctx.beginPath(); ctx.moveTo(i*sz,0); ctx.lineTo(i*sz,c.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,i*sz); ctx.lineTo(c.width,i*sz); ctx.stroke();
  }
  if(mp) patrols.forEach(p=>{
    const g=ctx.createRadialGradient(p.x*sz+sz/2,p.y*sz+sz/2,0,p.x*sz+sz/2,p.y*sz+sz/2,sz);
    g.addColorStop(0,'rgba(248,113,113,0.5)'); g.addColorStop(1,'rgba(248,113,113,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(p.x*sz+sz/2,p.y*sz+sz/2,sz,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#f87171'; ctx.beginPath(); ctx.arc(p.x*sz+sz/2,p.y*sz+sz/2,sz*.25,0,Math.PI*2); ctx.fill();
  });
  const pg=ctx.createRadialGradient(pistaPos.x*sz+sz/2,pistaPos.y*sz+sz/2,0,pistaPos.x*sz+sz/2,pistaPos.y*sz+sz/2,sz*.8);
  pg.addColorStop(0,'rgba(250,204,21,0.6)'); pg.addColorStop(1,'rgba(250,204,21,0)');
  ctx.fillStyle=pg; ctx.beginPath(); ctx.arc(pistaPos.x*sz+sz/2,pistaPos.y*sz+sz/2,sz*.8,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#facc15'; ctx.beginPath(); ctx.arc(pistaPos.x*sz+sz/2,pistaPos.y*sz+sz/2,sz*.3,0,Math.PI*2); ctx.fill();
  const d=S.suspicion/100;
  ctx.strokeStyle=`rgba(${Math.floor(248*d+56*(1-d))},${Math.floor(113*d+189*(1-d))},${Math.floor(113*d+248*(1-d))},0.35)`;
  ctx.lineWidth=2; ctx.strokeRect(1,1,c.width-2,c.height-2);
}

/* ─── TABS ─── */

function switchTab(t){
  S.tab=t;
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===t));
  ['game','shop','skills','stats'].forEach(id=>{
    const el=$('tab-'+id); if(el) el.style.display=id===t?'flex':'none';
  });
  if(t==='shop') renderShop();
  if(t==='skills') renderSkills();
  if(t==='stats') renderStats();
}

function renderShop(){
  const c=$('shop-list'); if(!c) return;
  const smd=$('shop-money-display'); if(smd) smd.textContent=S.money+'€';
  c.innerHTML=shop.map(i=>`<div class="shop-item ${i.owned?'owned':''} ${S.money<i.price&&!i.owned?'cant-afford':''}">
    <div class="shop-item-icon">${i.icon}</div>
    <div class="shop-item-info"><div class="shop-item-name">${i.name}${i.owned?' <span class="owned-badge">✓</span>':''}</div><div class="shop-item-desc">${i.desc}</div></div>
    <button class="shop-buy-btn" ${i.owned||S.money<i.price?'disabled':''} onclick="buyItem('${i.id}')">${i.owned?'Vlastníš':i.price+'€'}</button>
  </div>`).join('');
}

function renderSkills(){
  const c=$('skills-list'); if(!c) return;
  $('skill-points-display').textContent=S.skillPoints;
  c.innerHTML=sk.map(s=>`<div class="skill-item ${s.level>0?'unlocked':''} ${s.level>=s.maxLevel?'maxed':''}">
    <div class="skill-icon">${s.icon}</div>
    <div class="skill-info"><div class="skill-name">${s.name} <span class="skill-level">${s.level}/${s.maxLevel}</span></div><div class="skill-desc">${s.desc}</div>
    <div class="skill-level-bar">${Array.from({length:s.maxLevel},(_,i)=>`<div class="skill-pip ${i<s.level?'filled':''}"></div>`).join('')}</div></div>
    <button class="skill-btn" ${s.level>=s.maxLevel||S.skillPoints<s.cost?'disabled':''} onclick="upgradeSkill('${s.id}')">${s.level>=s.maxLevel?'MAX':s.cost+' SP'}</button>
  </div>`).join('');
}

function renderStats(){
  const c=$('stats-content'); if(!c) return;
  c.innerHTML=`
    <div class="stats-section"><div class="stats-title">📊 Statistiky</div><div class="stats-grid">
      <div class="stat-row"><span>Den</span><span>${S.day}</span></div>
      <div class="stat-row"><span>Level</span><span>${S.level}</span></div>
      <div class="stat-row"><span>Celkem vyděláno</span><span>${S.totalEarned}€</span></div>
      <div class="stat-row"><span>Max peněz</span><span>${S.peakMoney}€</span></div>
      <div class="stat-row"><span>Splněných úkolů</span><span>${S.tasksCompleted}</span></div>
      <div class="stat-row"><span>Úniků</span><span>${S.patrolsEscaped}</span></div>
      <div class="stat-row"><span>Chycení</span><span>${S.patrolsCaught}</span></div>
      <div class="stat-row"><span>Úplatky</span><span>${S.bribesSuccessful}/${S.bribesTotal}</span></div>
      <div class="stat-row"><span>Koupeno</span><span>${S.itemsBought}</span></div>
      <div class="stat-row"><span>Dovednosti</span><span>${S.skillsUnlocked}</span></div>
      <div class="stat-row"><span>Max podezření</span><span>${S.peakSuspicion}%</span></div>
    </div></div>
    <div class="stats-section"><div class="stats-title">🏅 Achievementy (${achUnlocked.size}/${ACHIEVEMENTS.length})</div><div class="achievements-grid">
      ${ACHIEVEMENTS.map(a=>`<div class="achievement ${achUnlocked.has(a.id)?'unlocked':'locked'}"><span class="ach-icon">${achUnlocked.has(a.id)?a.icon:'🔒'}</span><span class="ach-name">${achUnlocked.has(a.id)?a.name:'???'}</span>${achUnlocked.has(a.id)?`<span class="ach-desc">${a.desc}</span>`:''}</div>`).join('')}
    </div></div>`;
}

/* ─── MODAL ─── */

function showModal(icon,title,text,fx,onClose){
  $('modal-icon').textContent=icon;
  $('modal-title').textContent=title;
  $('modal-text').textContent=text;
  const ec=$('modal-effects');
  if(fx?.length){ec.style.display='flex';ec.innerHTML=fx.map(e=>`<div class="modal-effect"><span class="modal-effect-label">${e.label}</span><span class="modal-effect-value ${e.negative?'negative':'positive'}">${e.value}</span></div>`).join('');}
  else ec.style.display='none';
  const a=$('modal-actions');a.innerHTML='';
  const b=document.createElement('button');b.className='btn btn-primary btn-block';b.textContent='Pokračovat';
  b.onclick=()=>{$('modal-overlay').classList.remove('active');onClose?.();};
  a.appendChild(b);
  $('modal-overlay').classList.add('active');
}

/* ─── HELPERS ─── */

function clampAll(){
  S.energy=clamp(S.energy,0,100);S.stamina=clamp(S.stamina,0,100);
  S.stealth=clamp(S.stealth,0,100);S.suspicion=clamp(S.suspicion,0,100);
  S.peakSuspicion=Math.max(S.peakSuspicion,S.suspicion);
}

function haptic(){ try{navigator.vibrate?.(10);}catch(e){} }
function showHowTo(){ $('howto-overlay').classList.add('active'); }

/* ═══ PARTICLE SYSTEM ═══ */
let particles=[], particleCanvas, particleCtx;

function initParticles(){
  particleCanvas=$('particles');
  if(!particleCanvas) return;
  particleCtx=particleCanvas.getContext('2d');
  resizeParticles();
  window.addEventListener('resize',resizeParticles);
  for(let i=0;i<40;i++) particles.push(newParticle());
  animateParticles();
}

function resizeParticles(){
  if(!particleCanvas) return;
  particleCanvas.width=window.innerWidth;
  particleCanvas.height=window.innerHeight;
}

function newParticle(){
  return {
    x:Math.random()*window.innerWidth,
    y:Math.random()*window.innerHeight,
    vx:(Math.random()-0.5)*0.3,
    vy:(Math.random()-0.5)*0.3,
    size:Math.random()*2+0.5,
    alpha:Math.random()*0.3+0.05,
    color: ['250,204,21','74,222,128','248,113,113','56,189,248','192,132,252'][Math.floor(Math.random()*5)]
  };
}

function animateParticles(){
  if(!particleCtx) return;
  particleCtx.clearRect(0,0,particleCanvas.width,particleCanvas.height);
  particles.forEach(p=>{
    p.x+=p.vx; p.y+=p.vy;
    if(p.x<0) p.x=particleCanvas.width;
    if(p.x>particleCanvas.width) p.x=0;
    if(p.y<0) p.y=particleCanvas.height;
    if(p.y>particleCanvas.height) p.y=0;
    particleCtx.beginPath();
    particleCtx.arc(p.x,p.y,p.size,0,Math.PI*2);
    particleCtx.fillStyle=`rgba(${p.color},${p.alpha})`;
    particleCtx.fill();
  });
  // Draw faint connections
  for(let i=0;i<particles.length;i++){
    for(let j=i+1;j<particles.length;j++){
      const dx=particles[i].x-particles[j].x, dy=particles[i].y-particles[j].y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<100){
        particleCtx.beginPath();
        particleCtx.moveTo(particles[i].x,particles[i].y);
        particleCtx.lineTo(particles[j].x,particles[j].y);
        particleCtx.strokeStyle=`rgba(255,255,255,${0.02*(1-dist/100)})`;
        particleCtx.lineWidth=0.5;
        particleCtx.stroke();
      }
    }
  }
  requestAnimationFrame(animateParticles);
}

/* ═══ RIPPLE EFFECT ═══ */
document.addEventListener('pointerdown',e=>{
  const btn=e.target.closest('.action-btn,.btn,.shop-buy-btn,.skill-btn,.bm-buy,.tab-btn');
  if(!btn||btn.disabled) return;
  const r=document.createElement('span');
  r.className='ripple';
  const rect=btn.getBoundingClientRect();
  const sz=Math.max(rect.width,rect.height)*2;
  r.style.width=r.style.height=sz+'px';
  r.style.left=(e.clientX-rect.left-sz/2)+'px';
  r.style.top=(e.clientY-rect.top-sz/2)+'px';
  btn.appendChild(r);
  r.addEventListener('animationend',()=>r.remove());
});

/* ═══ ANIMATED HUD VALUES ═══ */
let prevHud={money:0,suspicion:0};

function animateHud(){
  const m=S.money, s=S.suspicion;
  const moneyEl=$('hud-money'), riskEl=$('hud-risk');
  if(m!==prevHud.money&&moneyEl){
    moneyEl.classList.remove('flash-up','flash-down');
    void moneyEl.offsetWidth; // reflow
    moneyEl.classList.add(m>prevHud.money?'flash-up':'flash-down');
  }
  if(s!==prevHud.suspicion&&riskEl){
    riskEl.classList.remove('flash-up','flash-down');
    void riskEl.offsetWidth;
    riskEl.classList.add(s>prevHud.suspicion?'flash-down':'flash-up');
  }
  prevHud={money:m,suspicion:s};
}

/* Achievement toast function */

function showAchToast(a){
  const t=document.createElement('div');
  t.className='ach-toast';
  t.innerHTML=`<span class="ach-toast-icon">${a.icon}</span><div class="ach-toast-info"><span class="ach-toast-label">Achievement!</span><span class="ach-toast-name">${a.name}</span></div>`;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),3200);
}

/* Weather colors handled in renderGame */

/* ═══ BOOT ═══ */
document.addEventListener('DOMContentLoaded',()=>{
  init();
  initParticles();
});
