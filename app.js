// Diabetes Daily Log PWA (IndexedDB) + Canvas Chart + A4 Landscape export
(function(){
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').catch(console.error);
    });
  }

  let deferredPrompt;
  const installBtn = document.getElementById('installBtn');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.hidden = false;
  });
  installBtn?.addEventListener('click', async () => {
    installBtn.hidden = true;
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
    }
  });

  const netBadge = document.getElementById('netStatus');
  function updateNet(){
    if (navigator.onLine) {
      netBadge.textContent = 'Online';
      netBadge.classList.add('online');
    } else {
      netBadge.textContent = 'Offline';
      netBadge.classList.remove('online');
    }
  }
  window.addEventListener('online', updateNet);
  window.addEventListener('offline', updateNet);
  updateNet();

  const DB_NAME = 'diabetes-daily-v1';
  const STORE = 'days';
  let db;
  function openDB(){
    return new Promise((resolve, reject)=>{
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = ()=>{
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'date' });
        }
      };
      req.onsuccess = ()=> resolve(req.result);
      req.onerror = ()=> reject(req.error);
    });
  }
  async function withStore(mode, fn){
    db = db || await openDB();
    return new Promise((resolve, reject)=>{
      const tx = db.transaction(STORE, mode);
      const store = tx.objectStore(STORE);
      const res = fn(store);
      tx.oncomplete = ()=> resolve(res);
      tx.onerror = ()=> reject(tx.error);
      tx.onabort = ()=> reject(tx.error);
    });
  }
  async function saveDay(day){ return withStore('readwrite', s => s.put(day)); }
  async function loadDay(date){
    return withStore('readonly', s => new Promise((resolve)=>{
      const r = s.get(date);
      r.onsuccess = ()=> resolve(r.result || null);
      r.onerror = ()=> resolve(null);
    }));
  }

  const $ = sel => document.querySelector(sel);
  const dayDate = $('#dayDate');
  const dayText = $('#dayText');
  const addMealBtn = document.getElementById('addMeal');
  const mealsList = document.getElementById('mealsList');
  const mealTpl = document.getElementById('mealTpl');
  const addMedBtn = document.getElementById('addMed');
  const medsList = document.getElementById('medsList');
  const medTpl = document.getElementById('medTpl');
  const addSugarBtn = document.getElementById('addSugar');
  const sugarList = document.getElementById('sugarList');
  const sugarTpl = document.getElementById('sugarTpl');
  const wakeTime = document.getElementById('wakeTime');
  const sleepTime = document.getElementById('sleepTime');
  const chart = document.getElementById('chart');
  const redrawBtn = document.getElementById('redraw');
  const exportA4Btn = document.getElementById('exportA4');

  function todayISO(){
    const d = new Date();
    const pad = n=> String(n).padStart(2,'0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }
  function ensureDay(date){
    return { date, dayText:'', meals:[], meds:[], sugars:[], wakeTime:'', sleepTime:'' };
  }
  function timeToMinutes(t){ if (!t) return null; const [H,M]=t.split(':').map(Number); return H*60+M; }
  function minutesToTime(min){ const H=Math.floor(min/60), M=min%60; return `${String(H).padStart(2,'0')}:${String(M).padStart(2,'0')}`; }

  let current = ensureDay(todayISO());
  dayDate.valueAsDate = new Date();
  (async function init(){
    const d = await loadDay(current.date);
    if (d) current = d;
    renderAll();
  })();

  dayDate.addEventListener('change', async ()=>{
    const date = dayDate.value || todayISO();
    current = ensureDay(date);
    const saved = await loadDay(date);
    if (saved) current = saved;
    renderAll();
  });
  dayText.addEventListener('input', async ()=>{ current.dayText = dayText.value; await saveDay(current); });
  wakeTime.addEventListener('change', async ()=>{ current.wakeTime = wakeTime.value; await saveDay(current); drawChart(); });
  sleepTime.addEventListener('change', async ()=>{ current.sleepTime = sleepTime.value; await saveDay(current); drawChart(); });

  addMealBtn.addEventListener('click', ()=>{ current.meals.push({kind:'Breakfast', time:'', desc:''}); updateMeals(); saveDay(current); });
  addMedBtn.addEventListener('click', ()=>{ current.meds.push({time:'', desc:''}); updateMeds(); saveDay(current); });
  addSugarBtn.addEventListener('click', ()=>{ current.sugars.push({time:'', value:null}); updateSugars(); saveDay(current); });
  redrawBtn.addEventListener('click', drawChart);
  exportA4Btn.addEventListener('click', exportA4);

  function renderAll(){
    dayText.value = current.dayText || '';
    wakeTime.value = current.wakeTime || '';
    sleepTime.value = current.sleepTime || '';
    updateMeals(); updateMeds(); updateSugars(); drawChart();
  }

  function updateMeals(){
    mealsList.innerHTML = '';
    current.meals.forEach((m, idx)=>{
      const node = mealTpl.content.firstElementChild.cloneNode(true);
      const kindEl = node.querySelector('.meal-kind');
      const timeEl = node.querySelector('.meal-time');
      const descEl = node.querySelector('.meal-desc');
      const del = node.querySelector('.del');
      kindEl.value = m.kind || 'Breakfast';
      timeEl.value = m.time || '';
      descEl.value = m.desc || '';
      kindEl.addEventListener('change', async ()=>{ m.kind = kindEl.value; await saveDay(current); drawChart(); });
      timeEl.addEventListener('change', async ()=>{ m.time = timeEl.value; await saveDay(current); drawChart(); });
      descEl.addEventListener('input', async ()=>{ m.desc = descEl.value; await saveDay(current); });
      del.addEventListener('click', async ()=>{ current.meals.splice(idx,1); updateMeals(); await saveDay(current); drawChart(); });
      mealsList.appendChild(node);
    });
  }
  function updateMeds(){
    medsList.innerHTML = '';
    current.meds.forEach((m, idx)=>{
      const node = medTpl.content.firstElementChild.cloneNode(true);
      const timeEl = node.querySelector('.med-time');
      const descEl = node.querySelector('.med-desc');
      const del = node.querySelector('.del');
      timeEl.value = m.time || '';
      descEl.value = m.desc || '';
      timeEl.addEventListener('change', async ()=>{ m.time = timeEl.value; await saveDay(current); drawChart(); });
      descEl.addEventListener('input', async ()=>{ m.desc = descEl.value; await saveDay(current); });
      del.addEventListener('click', async ()=>{ current.meds.splice(idx,1); updateMeds(); await saveDay(current); drawChart(); });
      medsList.appendChild(node);
    });
  }
  function updateSugars(){
    sugarList.innerHTML = '';
    current.sugars.forEach((s, idx)=>{
      const node = sugarTpl.content.firstElementChild.cloneNode(true);
      const timeEl = node.querySelector('.sugar-time');
      const valEl = node.querySelector('.sugar-value');
      const del = node.querySelector('.del');
      timeEl.value = s.time || '';
      valEl.value = s.value ?? '';
      timeEl.addEventListener('change', async ()=>{ s.time = timeEl.value; await saveDay(current); drawChart(); });
      valEl.addEventListener('change', async ()=>{ s.value = Number(valEl.value||0)||null; await saveDay(current); drawChart(); });
      del.addEventListener('click', async ()=>{ current.sugars.splice(idx,1); updateSugars(); await saveDay(current); drawChart(); });
      sugarList.appendChild(node);
    });
  }

  function drawChart(){
    const ctx = chart.getContext('2d');
    const W = chart.width, H = chart.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0,0,W,H);
    const padL=60,padR=20,padT=20,padB=40;
    const x0=padL,y0=padT,x1=W-padR,y1=H-padB;
    ctx.strokeStyle='#1f2937'; ctx.lineWidth=1; ctx.strokeRect(x0,y0,x1-x0,y1-y0);
    const xOfMin = (min)=> x0 + (min/1440)*(x1-x0);
    const values = current.sugars.filter(s=> s.value && s.time).map(s=> s.value);
    let minY = Math.min(80, ...(values.length? [Math.min(...values)-20] : [80]));
    let maxY = Math.max(240, ...(values.length? [Math.max(...values)+20] : [240]));
    if (maxY - minY < 100){ maxY = minY + 100; }
    const yOfVal = (v)=> y1 - ( (v - minY) / (maxY - minY) ) * (y1 - y0);
    ctx.fillStyle='#94a3b8'; ctx.font='12px system-ui, sans-serif';
    for (let h=0; h<=24; h+=2){
      const m=h*60, x=xOfMin(m);
      ctx.strokeStyle='#1f2937'; ctx.beginPath(); ctx.moveTo(x,y0); ctx.lineTo(x,y1); ctx.stroke();
      ctx.fillText(`${String(h).padStart(2,'0')}:00`, x-12, y1+16);
    }
    const yTicks=6;
    for (let i=0;i<=yTicks;i++){
      const v=minY+(i/yTicks)*(maxY-minY), y=yOfVal(v);
      ctx.strokeStyle='#1f2937'; ctx.beginPath(); ctx.moveTo(x0,y); ctx.lineTo(x1,y); ctx.stroke();
      ctx.fillText(String(Math.round(v)), 8, y+4);
    }
    ctx.fillText('Time', (x0+x1)/2 - 12, H-8);
    ctx.save(); ctx.translate(16,(y0+y1)/2); ctx.rotate(-Math.PI/2); ctx.fillText('Blood sugar (mg/dL)', -60, 0); ctx.restore();
    function drawVAt(time, color='#334155', label=''){
      const m=timeToMinutes(time); if (m==null) return;
      const x=xOfMin(m);
      ctx.strokeStyle=color; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(x,y0); ctx.lineTo(x,y1); ctx.stroke(); ctx.setLineDash([]);
      if (label){ ctx.fillStyle='#94a3b8'; ctx.fillText(label, x-20, y0+12); }
    }
    drawVAt(current.wakeTime, '#475569', 'Wake');
    const b = current.meals.find(m=> (m.kind||'').toLowerCase().startsWith('breakfast') && m.time);
    if (b){ const t=timeToMinutes(b.time); if (t!=null){ const t2 = (t+120)%1440; drawVAt(`${String(Math.floor(t2/60)).padStart(2,'0')}:${String(t2%60).padStart(2,'0')}`, '#64748b', '2h after BF'); } }
    drawVAt('12:00','#475569','12:00');
    drawVAt('18:00','#475569','18:00');
    drawVAt(current.sleepTime,'#475569','Sleep');
    const pts = current.sugars.filter(s=> s.time && s.value!=null).map(s=> ({x:xOfMin(timeToMinutes(s.time)), y:yOfVal(s.value)})).sort((a,b)=> a.x-b.x);
    if (pts.length){
      ctx.strokeStyle='#0ea5e9'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
      ctx.fillStyle='#0ea5e9'; for (const p of pts){ ctx.beginPath(); ctx.arc(p.x,p.y,3,0,Math.PI*2); ctx.fill(); }
    }
    function roundRect(ctx, x, y, w, h, r, fill, stroke){
      if (w<2*r) r = w/2; if (h<2*r) r=h/2;
      ctx.beginPath();
      ctx.moveTo(x+r,y);
      ctx.arcTo(x+w,y,x+w,y+h,r);
      ctx.arcTo(x+w,y+h,x,y+h,r);
      ctx.arcTo(x,y+h,x,y,r);
      ctx.arcTo(x,y,x+w,y,r);
      ctx.closePath();
      if (fill) ctx.fill();
      if (stroke) ctx.stroke();
    }
    function drawTag(x, y, text, bg, fg){
      const padX=6, r=6;
      ctx.font='12px system-ui, sans-serif';
      const w = ctx.measureText(text).width + padX*2;
      const h = 20;
      const left = Math.max(x - w/2, x0);
      const right = Math.min(left + w, x1);
      const adjLeft = right - w;
      ctx.fillStyle = bg;
      roundRect(ctx, adjLeft, y, w, h, r, true, false);
      ctx.fillStyle = fg; ctx.fillText(text, adjLeft+padX, y+14);
      ctx.strokeStyle = bg; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y-8); ctx.stroke();
    }
    const topY=y0+8, botY=y1-28;
    for (const m of current.meals){ if (!m.time) continue; const x=xOfMin(timeToMinutes(m.time)); const label=(m.kind||'Meal') + (m.desc? `: ${m.desc}`:''); drawTag(x, topY, label, '#0ea5e980', '#00111a'); }
    for (const md of current.meds){ if (!md.time) continue; const x=xOfMin(timeToMinutes(md.time)); drawTag(x, botY, md.desc||'Medication', '#22c55e80', '#022010'); }
  }

  function exportA4(){
    const A4W = 1400, A4H = Math.round(1400/1.4142);
    const cvs = document.createElement('canvas');
    cvs.width = A4W; cvs.height = A4H;
    const ctx = cvs.getContext('2d');
    const W=A4W,H=A4H;
    ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,W,H);
    const padL=80,padR=30,padT=30,padB=60;
    const x0=padL,y0=padT,x1=W-padR,y1=H-padB;
    ctx.fillStyle='#0b1220'; ctx.fillRect(x0,y0,x1-x0,y1-y0);
    ctx.strokeStyle='#1f2937'; ctx.lineWidth=1; ctx.strokeRect(x0,y0,x1-x0,y1-y0);
    const xOfMin = (min)=> x0 + (min/1440)*(x1-x0);
    const values = current.sugars.filter(s=> s.value && s.time).map(s=> s.value);
    let minY = Math.min(80, ...(values.length? [Math.min(...values)-20] : [80]));
    let maxY = Math.max(240, ...(values.length? [Math.max(...values)+20] : [240]));
    if (maxY - minY < 100){ maxY = minY + 100; }
    const yOfVal = (v)=> y1 - ( (v - minY) / (maxY - minY) ) * (y1 - y0);
    ctx.fillStyle='#94a3b8'; ctx.font='16px system-ui, sans-serif';
    for (let h=0; h<=24; h+=2){
      const m=h*60, x=xOfMin(m);
      ctx.strokeStyle='#374151'; ctx.beginPath(); ctx.moveTo(x,y0); ctx.lineTo(x,y1); ctx.stroke();
      ctx.fillText(`${String(h).padStart(2,'0')}:00`, x-16, y1+24);
    }
    const yTicks=6;
    for (let i=0;i<=yTicks;i++){
      const v=minY+(i/yTicks)*(maxY-minY), y=yOfVal(v);
      ctx.strokeStyle='#374151'; ctx.beginPath(); ctx.moveTo(x0,y); ctx.lineTo(x1,y); ctx.stroke();
      ctx.fillText(String(Math.round(v)), 14, y+6);
    }
    ctx.fillText('Time', (x0+x1)/2 - 18, H-10);
    ctx.save(); ctx.translate(24,(y0+y1)/2); ctx.rotate(-Math.PI/2); ctx.fillText('Blood sugar (mg/dL)', -70, 0); ctx.restore();
    function timeToMinutes(t){ if (!t) return null; const [H,M]=t.split(':').map(Number); return H*60+M; }
    function minutesToTime(min){ const H=Math.floor(min/60), M=min%60; return `${String(H).padStart(2,'0')}:${String(M).padStart(2,'0')}`; }
    function drawVAt(time, color='#6b7280', label=''){
      const m=timeToMinutes(time); if (m==null) return;
      const x=xOfMin(m);
      ctx.strokeStyle=color; ctx.setLineDash([6,6]); ctx.beginPath(); ctx.moveTo(x,y0); ctx.lineTo(x,y1); ctx.stroke(); ctx.setLineDash([]);
      if (label){ ctx.fillStyle='#111827'; ctx.fillText(label, x-28, y0-6); }
    }
    drawVAt(current.wakeTime, '#9ca3af', 'Wake');
    const b = current.meals.find(m=> (m.kind||'').toLowerCase().startsWith('breakfast') && m.time);
    if (b){ const t=timeToMinutes(b.time); if (t!=null){ const t2=(t+120)%1440; drawVAt(`${String(Math.floor(t2/60)).padStart(2,'0')}:${String(t2%60).padStart(2,'0')}`, '#9ca3af', '2h after BF'); } }
    drawVAt('12:00','#9ca3af','12:00'); drawVAt('18:00','#9ca3af','18:00'); drawVAt(current.sleepTime,'#9ca3af','Sleep');
    const pts = current.sugars.filter(s=> s.time && s.value!=null).map(s=> ({x:xOfMin(timeToMinutes(s.time)), y:yOfVal(s.value)})).sort((a,b)=> a.x-b.x);
    if (pts.length){
      ctx.strokeStyle='#0ea5e9'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
      ctx.fillStyle='#0ea5e9'; for (const p of pts){ ctx.beginPath(); ctx.arc(p.x,p.y,4,0,Math.PI*2); ctx.fill(); }
    }
    function roundRect(ctx, x, y, w, h, r, fill, stroke){
      if (w<2*r) r = w/2; if (h<2*r) r=h/2;
      ctx.beginPath();
      ctx.moveTo(x+r,y);
      ctx.arcTo(x+w,y,x+w,y+h,r);
      ctx.arcTo(x+w,y+h,x,y+h,r);
      ctx.arcTo(x,y+h,x,y,r);
      ctx.arcTo(x,y,x+w,y,r);
      ctx.closePath();
      if (fill) ctx.fill();
      if (stroke) ctx.stroke();
    }
    function drawTag(x, y, text, bg, fg){
      const padX=8, r=8;
      ctx.font='16px system-ui, sans-serif';
      const w = ctx.measureText(text).width + padX*2;
      const h = 28;
      const left = Math.max(x - w/2, x0);
      const right = Math.min(left + w, x1);
      const adjLeft = right - w;
      ctx.fillStyle = bg;
      roundRect(ctx, adjLeft, y, w, h, r, true, false);
      ctx.fillStyle = fg; ctx.fillText(text, adjLeft+padX, y+20);
      ctx.strokeStyle = bg; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y-10); ctx.stroke();
    }
    const topY=y0+10, botY=y1-38;
    for (const m of current.meals){ if (!m.time) continue; const x=xOfMin(timeToMinutes(m.time)); const label=(m.kind||'Meal') + (m.desc? `: ${m.desc}`:''); drawTag(x, topY, label, '#0ea5e9cc', '#00111a'); }
    for (const md of current.meds){ if (!md.time) continue; const x=xOfMin(timeToMinutes(md.time)); drawTag(x, botY, md.desc||'Medication', '#22c55ecc', '#022010'); }
    ctx.fillStyle='#111827'; ctx.font='bold 18px system-ui, sans-serif';
    const title = `Diabetes Daily Chart — ${current.date}${current.dayText? ' — ' + current.dayText : ''}`;
    ctx.fillText(title, x0, 22);
    const w = window.open('', '_blank');
    const dataURL = cvs.toDataURL('image/png');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Export A4 — ${current.date}</title>
<style>@page { size: A4 landscape; margin: 10mm; } html,body{height:100%;margin:0} body{display:flex;align-items:center;justify-content:center;background:#fff} img{width:100%;height:auto}</style></head>
<body><img src="${dataURL}" alt="A4 Export"></body></html>`;
    w.document.open(); w.document.write(html); w.document.close(); w.focus(); setTimeout(()=> w.print(), 300);
  }

})();