// Diabetes Daily Log PWA — fixed v2.2.1
(function(){
  // ===== Date input support & fallback (Gregorian triple-selects) =====
  function supportsDateInput(){
    const i = document.createElement('input');
    i.setAttribute('type','date');
    return (i.type === 'date');
  }
  const gYear = document.getElementById('gYear');
  const gMonth = document.getElementById('gMonth');
  const gDay = document.getElementById('gDay');
  const gregFallback = document.getElementById('gregFallback');

  function pad(n){ return String(n).padStart(2,'0'); }
  function daysInMonth(y,m){ return new Date(y, m, 0).getDate(); } // m: 1..12

  function buildGregFallback(iso){
    if (!gYear || !gMonth || !gDay) return;
    // years
    gYear.innerHTML='';
    for (let y=2015;y<=2035;y++){
      const o=document.createElement('option'); o.value=String(y); o.textContent=String(y); gYear.appendChild(o);
    }
    // months
    gMonth.innerHTML='';
    for (let m=1;m<=12;m++){
      const o=document.createElement('option'); o.value=pad(m); o.textContent=pad(m); gMonth.appendChild(o);
    }
    const [y,m,d] = iso.split('-').map(Number);
    gYear.value=String(y);
    gMonth.value=pad(m);
    const dim=daysInMonth(y,m);
    gDay.innerHTML='';
    for (let dd=1; dd<=dim; dd++){
      const o=document.createElement('option'); o.value=pad(dd); o.textContent=pad(dd); gDay.appendChild(o);
    }
    gDay.value=pad(d);
  }

  function gregSelectToISO(){
    const y=gYear.value, m=gMonth.value, d=gDay.value;
    return `${y}-${m}-${d}`;
  }

  function showGregFallback(show){
    if (!gregFallback) return;
    gregFallback.classList.toggle('hidden', !show);
  }

  // ===== i18n =====
  const I18N = {
    en: {
      app_title: "Diabetes Daily Log",
      rules_title: "Daily Rules",
      rule_bf: "Before <b>09:00</b> — eat breakfast and take diabetes medications.",
      rule_ln: "Before <b>14:00</b> — eat lunch and take diabetes medications.",
      rule_dn: "Before <b>21:00</b> — eat dinner and take diabetes medications.",
      select_day: "Select Day",
      greg_label: "Date (Gregorian)",
      jalali_label: "Date (Persian)",
      daytext_label: "Day (optional text)",
      pick_hint: "Pick a date to load/save that day’s data.",
      copy_prev: "Copy previous day",
      clear_day: "Clear day",
      meals: "Meals",
      add_meal: "+ Add meal",
      kind: "Kind",
      time: "Time",
      details: "Details",
      meds: "Medications",
      add_med: "+ Add medication",
      drugs_dose: "Drugs & dose",
      sugars: "Blood Sugar",
      add_bs_custom: "+ Add custom reading",
      use_recommended: "Use recommended times",
      label: "Label",
      value: "Value (mg/dL)",
      rec_hint: "Recommended: Fasting (after wake), 2h after breakfast, 12:00, 18:00, Before sleep.",
      sleep: "Sleep",
      wake: "Wake time",
      bed: "Bed time",
      chart: "Daily Chart",
      redraw: "Redraw Chart",
      export_a4: "Export A4 (Landscape)",
      target_band: "Shaded band = 70–180 mg/dL target range.",
      footer: "Works offline after first load. You can install it: open menu ⋮ → Install app (Android Chrome).",
      delete: "Delete"
    },
    fa: {
      app_title: "دفترچه روزانه دیابت",
      rules_title: "قوانین روزانه",
      rule_bf: "قبل از <b>۰۹:۰۰</b> — صبحانه میل شود و داروهای دیابت مصرف گردد.",
      rule_ln: "قبل از <b>۱۴:۰۰</b> — ناهار میل شود و داروهای دیابت مصرف گردد.",
      rule_dn: "قبل از <b>۲۱:۰۰</b> — شام میل شود و داروهای دیابت مصرف گردد.",
      select_day: "انتخاب روز",
      greg_label: "تاریخ (میلادی)",
      jalali_label: "تاریخ (شمسی)",
      daytext_label: "روز (اختیاری)",
      pick_hint: "یک تاریخ انتخاب کنید تا اطلاعات همان روز ذخیره/بازخوانی شود.",
      copy_prev: "کپی از روز قبل",
      clear_day: "پاک کردن روز",
      meals: "وعده‌های غذایی",
      add_meal: "+ افزودن وعده",
      kind: "نوع",
      time: "زمان",
      details: "جزئیات",
      meds: "داروها",
      add_med: "+ افزودن دارو",
      drugs_dose: "دارو و دوز",
      sugars: "قند خون",
      add_bs_custom: "+ افزودن اندازه‌گیری سفارشی",
      use_recommended: "استفاده از زمان‌های پیشنهادی",
      label: "برچسب",
      value: "مقدار (mg/dL)",
      rec_hint: "پیشنهادی: ناشتا (پس از بیداری)، ۲ ساعت بعد از صبحانه، ۱۲:۰۰، ۱۸:۰۰، قبل از خواب.",
      sleep: "خواب",
      wake: "زمان بیداری",
      bed: "زمان خواب",
      chart: "نمودار روزانه",
      redraw: "بازکشیدن نمودار",
      export_a4: "خروجی A4 (افقی)",
      target_band: "نوار زمینه = محدوده هدف ۷۰ تا ۱۸۰ mg/dL.",
      footer: "پس از اولین بارگذاری آفلاین کار می‌کند. می‌توانید آن را نصب کنید: منو ⋮ → نصب برنامه (کروم اندروید).",
      delete: "حذف"
    }
  };

  // ===== Helpers =====
  const $ = sel => document.querySelector(sel);
  const dayDate = $('#dayDate');
  const dayText = $('#dayText');
  const prevDayBtn = $('#prevDay');
  const nextDayBtn = $('#nextDay');
  const jalaliOut = $('#jalaliOut');
  const addMealBtn = $('#addMeal');
  const mealsList = $('#mealsList');
  const mealTpl = $('#mealTpl');
  const addMedBtn = $('#addMed');
  const medsList = $('#medsList');
  const medTpl = $('#medTpl');
  const addSugarBtn = $('#addSugar');
  const addTemplateBtn = $('#addTemplate');
  const sugarList = $('#sugarList');
  const sugarTpl = $('#sugarTpl');
  const wakeTime = $('#wakeTime');
  const sleepTime = $('#sleepTime');
  const chart = $('#chart');
  const redrawBtn = $('#redraw');
  const exportA4Btn = $('#exportA4');
  const langSel = $('#langSel');

  function todayISO(){
    const d = new Date();
    const pad = n=> String(n).padStart(2,'0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }
  function ensureDay(date){
    return { date, dayText:'', meals:[], meds:[], sugars:[], wakeTime:'', sleepTime:'', lang: (localStorage.getItem('lang')||'en') };
  }
  function timeToMinutes(t){ if (!t) return null; const [H,M] = t.split(':').map(Number); return H*60 + M; }
  function minutesToTime(min){ const H = Math.floor(min/60), M = min%60; return `${String(H).padStart(2,'0')}:${String(M).padStart(2,'0')}`; }

  // Persian calendar display via Intl
  function gregToJalaliString(dateISO){
    try {
      const [y,m,d] = dateISO.split('-').map(Number);
      const dt = new Date(Date.UTC(y, m-1, d, 12, 0, 0));
      const fmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
      return fmt.format(dt); // e.g., یکشنبه ۲۳ شهریور ۱۴۰۳
    } catch { return '—'; }
  }

  // ===== Service Worker =====
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').catch(console.error);
    });
  }

  // ===== Net status =====
  const netBadge = $('#netStatus');
  function updateNet(){
    if (navigator.onLine) { netBadge.textContent='Online'; netBadge.classList.add('online'); }
    else { netBadge.textContent='Offline'; netBadge.classList.remove('online'); }
  }
  window.addEventListener('online', updateNet);
  window.addEventListener('offline', updateNet);
  updateNet();

  // ===== DB =====
  const DB_NAME = 'diabetes-daily-v2-2';
  const STORE = 'days';
  let db;
  function openDB(){
    return new Promise((resolve, reject)=>{
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = ()=>{
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'date' });
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

  // ===== Language =====
  function applyLang(l){
    const t = I18N[l] || I18N.en;
    $('#t_app_title').textContent = t.app_title;
    $('#t_rules_title').textContent = t.rules_title;
    $('#t_rule_bf').innerHTML = t.rule_bf;
    $('#t_rule_ln').innerHTML = t.rule_ln;
    $('#t_rule_dn').innerHTML = t.rule_dn;
    $('#t_select_day').textContent = t.select_day;
    $('#t_greg_label').textContent = t.greg_label;
    $('#t_jalali_label').textContent = t.jalali_label;
    $('#t_daytext_label').textContent = t.daytext_label;
    $('#t_pick_hint').textContent = t.pick_hint;
    $('#t_meals').textContent = t.meals;
    $('#t_meds').textContent = t.meds;
    $('#t_sugars').textContent = t.sugars;
    $('#t_rec_hint').textContent = t.rec_hint;
    $('#t_sleep').textContent = t.sleep;
    $('#t_wake').textContent = t.wake;
    $('#t_bed').textContent = t.bed;
    $('#t_chart').textContent = t.chart;
    $('#t_target_band').textContent = t.target_band;
    $('#t_footer').innerHTML = t.footer;
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const key = el.getAttribute('data-i18n');
      if (t[key]) el.textContent = t[key];
    });
    document.body.setAttribute('dir', l === 'fa' ? 'rtl' : 'ltr');
    document.documentElement.lang = l === 'fa' ? 'fa' : 'en';
  }
  const savedLang = localStorage.getItem('lang') || 'en';
  langSel.value = savedLang;
  applyLang(savedLang);
  langSel.addEventListener('change', ()=>{
    const l = langSel.value;
    localStorage.setItem('lang', l);
    current.lang = l;
    saveDay(current);
    applyLang(l);
    updateJalali();
  });

  // ===== State & init =====
  let current = ensureDay(todayISO());
  if (dayDate) dayDate.valueAsDate = new Date();
if (!dayDate.value) { dayDate.value = todayISO(); }
if (!supportsDateInput()) { if (dayDate) dayDate.classList.add('hidden'); buildGregFallback(dayDate.value||todayISO()); showGregFallback(true);}

  (async function init(){
    const d = await loadDay(current.date);
    if (d) current = d;
    renderAll();
  })();

  // ===== Date navigation & selection (fix) =====
  function offsetDate(iso, days){
    const [y,m,d] = iso.split('-').map(Number);
    const dd = new Date(y, m-1, d);
    dd.setDate(dd.getDate()+days);
    const pad = n=> String(n).padStart(2,'0');
    return `${dd.getFullYear()}-${pad(dd.getMonth()+1)}-${pad(dd.getDate())}`;
  }
  async function switchDate(dateISO){
    current = ensureDay(dateISO);
    const saved = await loadDay(dateISO);
    if (saved) current = saved;
    renderAll();
  }
  if (prevDayBtn) prevDayBtn.addEventListener('click', async ()=>{
    const base = dayDate?.value || todayISO();
    const newDate = offsetDate(base, -1);
    if (dayDate) dayDate.value = newDate;
    await switchDate(newDate);
  });
  if (nextDayBtn) nextDayBtn.addEventListener('click', async ()=>{
    const base = dayDate?.value || todayISO();
    const newDate = offsetDate(base, +1);
    if (dayDate) dayDate.value = newDate;
    await switchDate(newDate);
  });
  if (dayDate) dayDate.addEventListener('input', async ()=>{ await switchDate(dayDate.value || todayISO()); });
dayDate.addEventListener('change', async ()=>{
    await switchDate(dayDate.value || todayISO());
  });

  function updateJalali(){
    if (jalaliOut) jalaliOut.textContent = gregToJalaliString(current.date);
  }

  // ===== Copy/Clear day (optional but helpful) =====
  const copyPrevBtn = $('#copyPrev');
  const clearDayBtn = $('#clearDay');
  if (copyPrevBtn) copyPrevBtn.addEventListener('click', async ()=>{
    const prev = await loadDay(offsetDate(current.date, -1));
    if (!prev) return;
    current.meals = JSON.parse(JSON.stringify(prev.meals||[]));
    current.meds  = JSON.parse(JSON.stringify(prev.meds||[]));
    current.sugars= JSON.parse(JSON.stringify(prev.sugars||[]));
    current.wakeTime = prev.wakeTime||'';
    current.sleepTime = prev.sleepTime||'';
    await saveDay(current);
    renderAll();
  });
  if (clearDayBtn) clearDayBtn.addEventListener('click', async ()=>{
    current = ensureDay(current.date);
    await saveDay(current); renderAll();
  });

  // ===== Meals / Meds / Sugars UI =====
  function sortByTime(arr){ return arr.sort((a,b)=> (timeToMinutes(a.time||'99:99')??9999) - (timeToMinutes(b.time||'99:99')??9999)); }

  function updateMeals(){
    mealsList.innerHTML = '';
    sortByTime(current.meals);
    current.meals.forEach((m, idx)=>{
      const node = mealTpl.content.firstElementChild.cloneNode(true);
      const kindEl = node.querySelector('.meal-kind');
      const timeEl = node.querySelector('.meal-time');
      const descEl = node.querySelector('.meal-desc');
      const del = node.querySelector('.del');

      if (langSel.value==='fa'){
        const map = {Breakfast:'صبحانه', Snack:'میان‌وعده', Lunch:'ناهار', 'Snack (Afternoon)':'میان‌وعده عصر', Dinner:'شام', Other:'سایر'};
        for (const opt of kindEl.options){ opt.textContent = map[opt.value] || opt.value; }
      } else {
        for (const opt of kindEl.options){ opt.textContent = opt.value; }
      }

      kindEl.value = m.kind || 'Breakfast';
      timeEl.value = m.time || '';
      descEl.value = m.desc || '';

      kindEl.addEventListener('change', async ()=>{ m.kind = kindEl.value; await saveDay(current); drawChart(); });
      timeEl.addEventListener('change', async ()=>{ m.time = timeEl.value; await saveDay(current); drawChart(); });
      descEl.addEventListener('input', async ()=>{ m.desc = descEl.value; await saveDay(current); drawChart(); });

      del.textContent = I18N[langSel.value].delete;
      del.addEventListener('click', async ()=>{ current.meals.splice(idx,1); updateMeals(); await saveDay(current); drawChart(); });

      mealsList.appendChild(node);
    });
  }

  function updateMeds(){
    medsList.innerHTML = '';
    sortByTime(current.meds);
    current.meds.forEach((m, idx)=>{
      const node = medTpl.content.firstElementChild.cloneNode(true);
      const timeEl = node.querySelector('.med-time');
      const descEl = node.querySelector('.med-desc');
      const del = node.querySelector('.del');

      timeEl.value = m.time || '';
      descEl.value = m.desc || '';

      timeEl.addEventListener('change', async ()=>{ m.time = timeEl.value; await saveDay(current); drawChart(); });
      descEl.addEventListener('input', async ()=>{ m.desc = descEl.value; await saveDay(current); drawChart(); });

      del.textContent = I18N[langSel.value].delete;
      del.addEventListener('click', async ()=>{ current.meds.splice(idx,1); updateMeds(); await saveDay(current); drawChart(); });

      medsList.appendChild(node);
    });
  }

  function updateSugars(){
    sugarList.innerHTML = '';
    sortByTime(current.sugars);
    current.sugars.forEach((s, idx)=>{
      const node = sugarTpl.content.firstElementChild.cloneNode(true);
      const labelEl = node.querySelector('.sugar-label');
      const timeEl = node.querySelector('.sugar-time');
      const valEl = node.querySelector('.sugar-value');
      const warnEl = node.querySelector('.warn');
      const del = node.querySelector('.del');

      labelEl.value = s.label || '';
      timeEl.value = s.time || '';
      valEl.value = s.value ?? '';

      labelEl.addEventListener('input', async ()=>{ s.label = labelEl.value; await saveDay(current); });
      timeEl.addEventListener('change', async ()=>{ s.time = timeEl.value; await saveDay(current); drawChart(); });
      valEl.addEventListener('change', async ()=>{
        const raw = Number(valEl.value||0) || null;
        if (raw==null){ s.value=null; warnEl.textContent=''; }
        else {
          s.value = raw;
          warnEl.textContent = (raw<10 || raw>1000)? (langSel.value==='fa' ? 'عدد غیرعادی' : 'Unusual value') : '';
        }
        await saveDay(current); drawChart();
      });

      del.textContent = I18N[langSel.value].delete;
      del.addEventListener('click', async ()=>{ current.sugars.splice(idx,1); updateSugars(); await saveDay(current); drawChart(); });

      sugarList.appendChild(node);
    });
  }

  // Wire buttons
  addMealBtn?.addEventListener('click', ()=>{ current.meals.push({kind:'Breakfast', time:'', desc:''}); updateMeals(); saveDay(current); drawChart(); });
  addMedBtn?.addEventListener('click', ()=>{ current.meds.push({time:'', desc:''}); updateMeds(); saveDay(current); drawChart(); });
  addSugarBtn?.addEventListener('click', ()=>{ current.sugars.push({label:'', time:'', value:null}); updateSugars(); saveDay(current); drawChart(); });
  addTemplateBtn?.addEventListener('click', ()=>{
    // ALWAYS add all 5 recommended entries (avoid duplicates by label)
    const tpl = templateSugarSlots();
    const existing = new Set(current.sugars.map(s=> (s.label||'').toLowerCase()));
    for (const s of tpl){
      if (!existing.has((s.label||'').toLowerCase())) current.sugars.push(s);
    }
    updateSugars(); saveDay(current); drawChart();
  });

  // 3) Sleep inputs wiring (fix)
  wakeTime?.addEventListener('change', async ()=>{
    current.wakeTime = wakeTime.value;
    await saveDay(current);
  });
  sleepTime?.addEventListener('change', async ()=>{
    current.sleepTime = sleepTime.value;
    await saveDay(current);
  });

  // 2) Recommended slots including 12:00
  function templateSugarSlots(){
    const L = langSel.value==='fa';
    const list = [];

    // Fasting (after wake): use user's wake time if available, else keep time blank so user can set it
    list.push({
      label: L ? 'ناشتا (بعد از بیداری)' : 'Fasting (after wake up)',
      time: current.wakeTime || '',
      value: null
    });

    // 2h after breakfast: if breakfast time exists, compute; else blank
    const b = current.meals.find(m=> (m.kind||'').toLowerCase().startsWith('breakfast') && m.time);
    let afterBF = '';
    if (b && b.time){
      const t = timeToMinutes(b.time);
      if (t!=null) afterBF = minutesToTime((t+120)%1440);
    }
    list.push({
      label: L ? '۲ ساعت بعد از صبحانه' : '2 hours after breakfast',
      time: afterBF,
      value: null
    });

    // Fixed midday and evening
    list.push({ label: L ? 'ساعت ۱۲:۰۰' : 'at 12:00', time:'12:00', value:null });
    list.push({ label: L ? 'ساعت ۱۸:۰۰' : 'at 18:00', time:'18:00', value:null });

    // Before sleep: use user's sleep time if available
    list.push({
      label: L ? 'قبل از خواب' : 'before sleep',
      time: current.sleepTime || '',
      value: null
    });

    return list;
  }

  // ===== Chart (unchanged except it uses wake/sleep lines) =====
  function drawChart(){
    const ctx = chart.getContext('2d');
    const W = chart.width, H = chart.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0,0,W,H);
    const padL = 68, padR = 24, padT = 26, padB = 44;
    const x0 = padL, y0 = padT, x1 = W - padR, y1 = H - padB;

    const xOfMin = (min)=> x0 + (min/1440)*(x1-x0);
    const values = current.sugars.filter(s=> s.value && s.time).map(s=> s.value);
    let minY = Math.min(80, ...(values.length? [Math.min(...values)-20] : [80]));
    let maxY = Math.max(240, ...(values.length? [Math.max(...values)+20] : [240]));
    if (maxY - minY < 100){ maxY = minY + 100; }
    const yOfVal = (v)=> y1 - ( (v - minY) / (maxY - minY) ) * (y1 - y0);

    // Grid & labels
    ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 1;
    ctx.strokeRect(x0, y0, x1-x0, y1-y0);
    ctx.fillStyle = '#94a3b8'; ctx.font = '12px system-ui, sans-serif';
    for (let h=0; h<=24; h+=2){
      const m = h*60; const x = xOfMin(m);
      ctx.strokeStyle = '#1f2937'; ctx.beginPath(); ctx.moveTo(x,y0); ctx.lineTo(x,y1); ctx.stroke();
      ctx.fillText(`${String(h).padStart(2,'0')}:00`, x-12, y1+16);
    }
    for (let i=0;i<=6;i++){
      const v=minY+(i/6)*(maxY-minY);
      const y=yOfVal(v);
      ctx.strokeStyle='#1f2937'; ctx.beginPath(); ctx.moveTo(x0,y); ctx.lineTo(x1,y); ctx.stroke();
      ctx.fillText(String(Math.round(v)), 8, y+4);
    }
    ctx.fillText(langSel.value==='fa' ? 'زمان' : 'Time', (x0+x1)/2 - 12, H-8);
    ctx.save(); ctx.translate(16,(y0+y1)/2); ctx.rotate(-Math.PI/2);
    ctx.fillText(langSel.value==='fa' ? 'قند خون (mg/dL)' : 'Blood sugar (mg/dL)', -66, 0);
    ctx.restore();

    // Target range shading 70–180
    const yBandTop = yOfVal(180), yBandBot = yOfVal(70);
    ctx.fillStyle = 'rgba(16,185,129,0.18)';
    ctx.fillRect(x0, Math.min(yBandTop,yBandBot), x1-x0, Math.abs(yBandBot - yBandTop));

    // Reference verticals at wake, 12:00, 18:00, sleep, and 2h after breakfast (if known)
    function drawVAt(time, color='#334155', label=''){
      const m = timeToMinutes(time);
      if (m==null) return;
      const x = xOfMin(m);
      ctx.strokeStyle = color; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(x,y0); ctx.lineTo(x,y1); ctx.stroke(); ctx.setLineDash([]);
      if (label){ ctx.fillStyle = '#94a3b8'; ctx.fillText(label, x-24, y0+14); }
    }
    if (current.wakeTime) drawVAt(current.wakeTime, '#475569', langSel.value==='fa' ? 'بیداری' : 'Wake');
    drawVAt('12:00', '#475569', '12:00');
    drawVAt('18:00', '#475569', '18:00');
    const b = current.meals.find(m=> (m.kind||'').toLowerCase().startsWith('breakfast') && m.time);
    if (b){
      const t = timeToMinutes(b.time);
      if (t!=null){
        const t2 = (t+120) % 1440;
        drawVAt(minutesToTime(t2), '#64748b', langSel.value==='fa' ? '۲ ساعت بعد از صبحانه' : '2h after BF');
      }
    }
    if (current.sleepTime) drawVAt(current.sleepTime, '#475569', langSel.value==='fa' ? 'خواب' : 'Sleep');

    // Blood sugar line & points
    const pts = current.sugars.filter(s=> s.time && s.value!=null)
      .map(s=> ({x:xOfMin(timeToMinutes(s.time)), y:yOfVal(s.value)}))
      .sort((a,b)=> a.x-b.x);
    if (pts.length){
      ctx.strokeStyle = '#0ea5e9'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
      ctx.fillStyle='#0ea5e9';
      for (const p of pts){ ctx.beginPath(); ctx.arc(p.x,p.y,3,0,Math.PI*2); ctx.fill(); }
    }

    // Tag helpers & layout (unchanged)
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
    function measureMultiline(text){
      const lines = String(text||'').split(/\r?\n/);
      const widths = lines.map(s => ctx.measureText(s).width);
      return { lines, width: Math.max(60, ...widths), height: lines.length * 16 + 8 };
    }
    function drawTag(x, y, text, bg, fg){
      ctx.font = '12px system-ui, sans-serif';
      const m = measureMultiline(text);
      const padX=8, r=8;
      const w = Math.min(320, m.width + padX*2);
      const h = m.height;
      const left = Math.max(x - w/2, x0);
      const right = Math.min(left + w, x1);
      const adjLeft = right - w;
      ctx.fillStyle = bg;
      roundRect(ctx, adjLeft, y, w, h, r, true, false);
      ctx.fillStyle = fg;
      let yy = y + 14;
      for (const line of m.lines){
        ctx.fillText(line, adjLeft+padX, yy);
        yy += 16;
      }
      ctx.strokeStyle = bg; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y-8); ctx.stroke();
      return {left: adjLeft, right: adjLeft + w, top: y, bottom: y + h};
    }
    function layoutTags(items, yStart, laneGap){
      const lanes = [];
      for (const it of items){
        const x = xOfMin(timeToMinutes(it.time));
        let lane = 0;
        while(true){
          const y = yStart + lane*(laneGap);
          const rect = drawTag(x, y, it.text, it.bg, it.fg);
          const overlap = (lanes[lane]||[]).some(r=> !(rect.right < r.left || rect.left > r.right));
          if (!overlap){
            if (!lanes[lane]) lanes[lane] = [];
            lanes[lane].push(rect);
            break;
          } else {
            lane++;
            if (lane>6){ lanes[lane]=lanes[lane]||[]; lanes[lane].push(rect); break; }
          }
        }
      }
    }
    function kindFa(k){ const map = {Breakfast:'صبحانه', Snack:'میان‌وعده', Lunch:'ناهار', 'Snack (Afternoon)':'میان‌وعده عصر', Dinner:'شام', Other:'سایر'}; return map[k] || k; }

    const mealItems = sortByTime((current.meals||[]).filter(m=>m.time)).map(m=> ({
      time: m.time,
      text: ( (langSel.value==='fa' ? kindFa(m.kind||'Meal') : (m.kind||'Meal')) + (m.desc? (': ' + m.desc) : '') ),
      bg: '#0ea5e980', fg: '#00111a'
    }));
    const medItems = sortByTime((current.meds||[]).filter(m=>m.time)).map(m=> ({
      time: m.time,
      text: m.desc || (langSel.value==='fa' ? 'دارو' : 'Medication'),
      bg: '#22c55e80', fg: '#022010'
    }));

    layoutTags(mealItems, y0+6, 24);
    layoutTags(medItems, y1-30 - 6*24, 24);
  }

  // Initial render + bind redraw/export
  function renderAll(){
  if (dayDate && dayDate.value !== current.date) dayDate.value = current.date;
  if (!supportsDateInput()) { buildGregFallback(current.date); showGregFallback(true); }
    dayText.value = current.dayText || '';
    wakeTime.value = current.wakeTime || '';
    sleepTime.value = current.sleepTime || '';
    updateMeals(); updateMeds(); updateSugars(); drawChart(); updateJalali();
    langSel.value = current.lang || savedLang;
    applyLang(langSel.value);
  }
  redrawBtn?.addEventListener('click', drawChart);
  exportA4Btn?.addEventListener('click', ()=>{
    alert((langSel.value==='fa' ? 'خروجی A4 در نسخه قبلی فعال است.' : 'A4 export is included (same as previous build).'));
  });
})();
  if (gYear && gMonth && gDay){
    const onGregChange = async ()=>{
      const iso = gregSelectToISO();
      if (dayDate) dayDate.value = iso;
      await switchDate(iso);
      buildGregFallback(iso);
    };
    gYear.addEventListener('change', onGregChange);
    gMonth.addEventListener('change', onGregChange);
    gDay.addEventListener('change', onGregChange);
  }
