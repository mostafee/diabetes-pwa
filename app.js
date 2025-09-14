// Diabetes Day Log PWA v2
(function(){
  /* SW register */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').catch(console.error);
    });
  }

  /* Install prompt */
  let deferredPrompt;
  const installBtn = document.getElementById('installBtn');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferredPrompt = e; installBtn.hidden = false;
  });
  installBtn?.addEventListener('click', async () => {
    installBtn.hidden = true;
    if (deferredPrompt) { deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; }
  });

  /* Net badge */
  const netBadge = document.getElementById('netStatus');
  function updateNet(){ if (navigator.onLine){ netBadge.textContent='Online'; netBadge.classList.add('online'); } else { netBadge.textContent='Offline'; netBadge.classList.remove('online'); } }
  window.addEventListener('online', updateNet); window.addEventListener('offline', updateNet); updateNet();

  /* IndexedDB */
  const DB_NAME = 'diabetes-daylog-v2';
  const STORES  = { meals:'meals', meds:'meds', sugars:'sugars', meta:'meta' };
  let db;
  function openDB(){
    return new Promise((resolve, reject)=>{
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains(STORES.meals))  { const s=d.createObjectStore(STORES.meals,  {keyPath:'id',autoIncrement:true}); s.createIndex('by_date','date',{unique:false}); }
        if (!d.objectStoreNames.contains(STORES.meds))   { const s=d.createObjectStore(STORES.meds,   {keyPath:'id',autoIncrement:true}); s.createIndex('by_date','date',{unique:false}); }
        if (!d.objectStoreNames.contains(STORES.sugars)) { const s=d.createObjectStore(STORES.sugars, {keyPath:'id',autoIncrement:true}); s.createIndex('by_date','date',{unique:false}); }
        if (!d.objectStoreNames.contains(STORES.meta))   { d.createObjectStore(STORES.meta, {keyPath:'date'}); }
      };
      req.onsuccess = ()=> resolve(req.result);
      req.onerror   = ()=> reject(req.error);
    });
  }
  async function tx(store, mode, fn){
    db = db || await openDB();
    return new Promise((resolve,reject)=>{
      const t = db.transaction(store, mode);
      const s = t.objectStore(store);
      const r = fn(s);
      t.oncomplete = ()=> resolve(r);
      t.onerror = t.onabort = ()=> reject(t.error);
    });
  }

  /* Helpers */
  const fmt2 = n => String(n).padStart(2,'0');
  function todayISO(){ return new Date().toISOString().slice(0,10); }
  function timeToMinutes(t){ if(!t) return 0; const [h,m]=t.split(':'); return (+h)*60+(+m); }
  function minutesToTime(m){ const h=Math.floor(m/60), mi=m%60; return fmt2(h)+':'+fmt2(mi); }
  function dateToWeekday(iso){ return new Date(iso+'T00:00').toLocaleDateString(undefined,{weekday:'long'}); }
  function addMinutes(time, mins){ const mm=((timeToMinutes(time)+mins)%1440+1440)%1440; return minutesToTime(mm); }

  /* DOM */
  const dayDate=document.getElementById('dayDate'), dayName=document.getElementById('dayName'), clearDayBtn=document.getElementById('clearDayBtn');
  const mealsList=document.getElementById('mealsList'), medsList=document.getElementById('medsList'), sugarsList=document.getElementById('sugarsList');
  const addMealBtn=document.getElementById('addMealBtn'), addMedBtn=document.getElementById('addMedBtn'), addSugarBtn=document.getElementById('addSugarBtn');
  const quickTimes=document.getElementById('quickTimes'), wakeTime=document.getElementById('wakeTime'), sleepTime=document.getElementById('sleepTime');
  const saveMetaBtn=document.getElementById('saveMetaBtn'), chartCanvas=document.getElementById('chart'), yMaxInput=document.getElementById('yMax');
  const refreshChartBtn=document.getElementById('refreshChartBtn'), exportBtn=document.getElementById('exportBtn'), printChartCanvas=document.getElementById('printChart'), overlayDiv=document.getElementById('overlay');

  /* Init day */
  dayDate.value = todayISO();
  dayName.value = dateToWeekday(dayDate.value);
  dayDate.addEventListener('change', async ()=>{ dayName.value=dateToWeekday(dayDate.value); await loadDay(); });

  /* Quick preset times */
  function renderQuickTimes(){
    quickTimes.innerHTML='';
    const presets = [
      {label:'Fasting (wake)', key:'fasting'},
      {label:'+2h breakfast',  key:'post2h'},
      {label:'12:00',          key:'noon'},
      {label:'18:00',          key:'evening'},
      {label:'Before sleep',   key:'sleep'}
    ];
    presets.forEach(p=>{
      const b=document.createElement('button'); b.className='qt'; b.textContent=p.label;
      b.addEventListener('click', async ()=>{
        const m = await getMeta(dayDate.value) || {};
        let t='00:00';
        if (p.key==='fasting') t = m.wake || '06:00';
        else if (p.key==='post2h') t = addMinutes(m.breakfastTime || '08:00', 120);
        else if (p.key==='noon') t = '12:00';
        else if (p.key==='evening') t = '18:00';
        else if (p.key==='sleep') t = m.sleep || '23:00';
        addSugarEditor(t);
      });
      quickTimes.appendChild(b);
    });
  }

  /* CRUD */
  async function addMeal(date,time,kind,desc){ return tx(STORES.meals,'readwrite', s=> s.add({date,time,kind,desc})); }
  async function addMed(date,time,desc){     return tx(STORES.meds,'readwrite',  s=> s.add({date,time,desc})); }
  async function addSugar(date,time,value,note){ return tx(STORES.sugars,'readwrite', s=> s.add({date,time,value,note})); }
  async function delById(store,id){ return tx(store,'readwrite', s=> s.delete(id)); }
  async function listByDate(store, date){
    return tx(store,'readonly', s => new Promise((resolve,reject)=>{
      const req = s.index('by_date').getAll(date);
      req.onsuccess = ()=> resolve(req.result || []); req.onerror = ()=> reject(req.error);
    }));
  }
  async function setMeta(date, obj){ obj.date=date; return tx(STORES.meta, 'readwrite', s=> s.put(obj)); }
  async function getMeta(date){ return tx(STORES.meta,'readonly', s=> new Promise((resolve,reject)=>{ const r=s.get(date); r.onsuccess=()=>resolve(r.result||null); r.onerror=()=>reject(r.error);})); }
  async function clearDay(date){
    await tx(STORES.meals, 'readwrite', s=>{ s.index('by_date').getAllKeys(date).onsuccess=e=> e.target.result.forEach(k=>s.delete(k)); });
    await tx(STORES.meds,  'readwrite', s=>{ s.index('by_date').getAllKeys(date).onsuccess=e=> e.target.result.forEach(k=>s.delete(k)); });
    await tx(STORES.sugars,'readwrite', s=>{ s.index('by_date').getAllKeys(date).onsuccess=e=> e.target.result.forEach(k=>s.delete(k)); });
    await tx(STORES.meta,  'readwrite', s=> s.delete(date));
  }

  /* Add-row templates */
  const mealTpl = document.getElementById('mealRow');
  const medTpl  = document.getElementById('medRow');
  const sugarTpl= document.getElementById('sugarRow');

  function addMealEditor(time='08:00'){
    const li = mealTpl.content.firstElementChild.cloneNode(true);
    li.querySelector('.m-time').value = time;
    li.querySelector('.save').addEventListener('click', async ()=>{
      const t=li.querySelector('.m-time').value;
      const k=li.querySelector('.m-kind').value;
      const d=li.querySelector('.m-desc').value.trim();
      if(!t) return alert('Pick a time');
      await addMeal(dayDate.value,t,k,d);
      await loadDay();
    });
    li.querySelector('.cancel').addEventListener('click', ()=> li.remove());
    mealsList.prepend(li);
  }
  function addMedEditor(time='08:00'){
    const li = medTpl.content.firstElementChild.cloneNode(true);
    li.querySelector('.d-time').value=time;
    li.querySelector('.save').addEventListener('click', async ()=>{
      const t=li.querySelector('.d-time').value;
      const d=li.querySelector('.d-desc').value.trim();
      if(!t) return alert('Pick a time');
      await addMed(dayDate.value,t,d);
      await loadDay();
    });
    li.querySelector('.cancel').addEventListener('click', ()=> li.remove());
    medsList.prepend(li);
  }
  function addSugarEditor(time='08:00'){
    const li = sugarTpl.content.firstElementChild.cloneNode(true);
    li.querySelector('.s-time').value=time;
    li.querySelector('.save').addEventListener('click', async ()=>{
      const t=li.querySelector('.s-time').value;
      const v=Number(li.querySelector('.s-val').value);
      const n=li.querySelector('.s-note').value.trim();
      if(!t || !v) return alert('Fill time and value');
      await addSugar(dayDate.value,t,v,n);
      await loadDay();
    });
    li.querySelector('.cancel').addEventListener('click', ()=> li.remove());
    sugarsList.prepend(li);
  }

  addMealBtn.addEventListener('click', ()=> addMealEditor());
  addMedBtn.addEventListener('click', ()=> addMedEditor());
  addSugarBtn.addEventListener('click', ()=> addSugarEditor());
  clearDayBtn.addEventListener('click', async ()=>{ if(confirm('Delete ALL data for this date?')){ await clearDay(dayDate.value); await loadDay(); }});

  saveMetaBtn.addEventListener('click', async ()=>{
    await setMeta(dayDate.value, { date:dayDate.value, wake:wakeTime.value||null, sleep:sleepTime.value||null, yMax:Number(yMaxInput.value)||300 });
    alert('Saved.');
  });

  /* List renderers */
  function tag(text){ const s=document.createElement('span'); s.className='tag'; s.textContent=text; return s; }
  function mkDel(fn){ const b=document.createElement('button'); b.className='del'; b.textContent='Delete'; b.addEventListener('click', async ()=>{ await fn(); await loadDay(); }); return b; }

  function renderMealItem(m){
    const li=document.createElement('li'); li.className='item';
    const left=document.createElement('div'); left.className='entry';
    const top=document.createElement('div'); top.className='top';
    top.append(tag(m.time), tag(m.kind));
    const d=document.createElement('div'); d.textContent=m.desc||'';
    left.append(top,d);
    const del = mkDel(()=> delById(STORES.meals,m.id));
    li.append(left, del);
    return li;
  }
  function renderMedItem(m){
    const li=document.createElement('li'); li.className='item';
    const left=document.createElement('div'); left.className='entry';
    const top=document.createElement('div'); top.className='top';
    top.append(tag(m.time), tag('Medication'));
    const d=document.createElement('div'); d.textContent=m.desc||'';
    left.append(top,d);
    const del=mkDel(()=> delById(STORES.meds,m.id));
    li.append(left,del); return li;
  }
  function renderSugarItem(s){
    const li=document.createElement('li'); li.className='item';
    const left=document.createElement('div'); left.className='entry';
    const top=document.createElement('div'); top.className='top';
    top.append(tag(s.time), tag(s.value+' mg/dL'));
    const d=document.createElement('div'); d.textContent=s.note||'';
    left.append(top,d);
    const del=mkDel(()=> delById(STORES.sugars,s.id));
    li.append(left,del); return li;
  }

  /* Load day */
  async function loadDay(){
    const date = dayDate.value;
    const [meals, meds, sugars, meta] = await Promise.all([
      listByDate(STORES.meals,date),
      listByDate(STORES.meds,date),
      listByDate(STORES.sugars,date),
      getMeta(date)
    ]);
    const sortByTime = (a,b)=> timeToMinutes(a.time)-timeToMinutes(b.time);
    meals.sort(sortByTime); meds.sort(sortByTime); sugars.sort(sortByTime);

    mealsList.innerHTML = meals.length ? '' : '<div class="muted">No meals yet.</div>';
    medsList.innerHTML  = meds.length  ? '' : '<div class="muted">No medications yet.</div>';
    sugarsList.innerHTML= sugars.length? '' : '<div class="muted">No readings yet.</div>';

    meals.forEach(m=> mealsList.appendChild(renderMealItem(m)));
    meds.forEach(m=>  medsList.appendChild(renderMedItem(m)));
    sugars.forEach(s=> sugarsList.appendChild(renderSugarItem(s)));

    wakeTime.value = meta?.wake || '';
    sleepTime.value= meta?.sleep || '';
    yMaxInput.value= meta?.yMax || yMaxInput.value;

    renderQuickTimes();
    drawChart(sugars, Number(yMaxInput.value));
  }

  /* Chart (vanilla canvas) */
  function drawChart(sugars, yMax=300, canvas=chartCanvas){
    const ctx = canvas.getContext('2d');
    const W=canvas.width, H=canvas.height;
    const L=50,R=20,T=20,B=40;
    ctx.clearRect(0,0,W,H);
    const grad = ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0,'#0b1220'); grad.addColorStop(1,'#0c1624');
    ctx.fillStyle = grad; ctx.fillRect(0,0,W,H);

    // grid
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid').trim()||'#223046';
    ctx.lineWidth=1; ctx.beginPath();
    for(let h=0; h<=24; h+=2){ const x=L+(W-L-R)*(h/24); ctx.moveTo(x,T); ctx.lineTo(x,H-B); }
    const yStep = 50;
    for(let y=0; y<=yMax; y+=yStep){ const yy=mapY(y); ctx.moveTo(L,yy); ctx.lineTo(W-R,yy); }
    ctx.stroke();

    // axes
    ctx.strokeStyle='#2e3e58'; ctx.lineWidth=1.5; ctx.beginPath();
    ctx.moveTo(L,T); ctx.lineTo(L,H-B); ctx.lineTo(W-R,H-B); ctx.stroke();

    // labels
    ctx.fillStyle='#a7b4cc'; ctx.font='12px system-ui,-apple-system,Segoe UI,Roboto';
    for(let h=0; h<=24; h+=2){ const x=L+(W-L-R)*(h/24); ctx.fillText(fmt2(h)+':00', x-14, H-18); }
    for(let y=0; y<=yMax; y+=yStep){ const yy=mapY(y); ctx.fillText(String(y), 8, yy+4); }

    // data
    const pts = sugars.map(s => ({ x:L+(W-L-R)*(timeToMinutes(s.time)/1440), y:mapY(s.value), v:s.value, t:s.time }));
    if (pts.length){
      ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--line').trim()||'#60a5fa';
      ctx.lineWidth=2; ctx.beginPath();
      pts.forEach((p,i)=>{ if(i===0) ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y); });
      ctx.stroke();
      ctx.fillStyle='#93c5fd';
      pts.forEach(p=>{ ctx.beginPath(); ctx.arc(p.x,p.y,3,0,Math.PI*2); ctx.fill(); });
    }

    function mapY(val){ const h=H-T-B; return T + (1 - Math.min(val,yMax)/yMax) * h; }
  }

  refreshChartBtn.addEventListener('click', async ()=>{
    const sugars = await listByDate(STORES.sugars, dayDate.value);
    sugars.sort((a,b)=> timeToMinutes(a.time)-timeToMinutes(b.time));
    drawChart(sugars, Number(yMaxInput.value));
 
