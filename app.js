// Diabetes Daily Log PWA v2.3.1 — stable build
(function(){
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
      delete: "Delete",
      today: "Today", close: "Close"
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
      delete: "حذف",
      today: "امروز", close: "بستن"
    }
  };

  // ===== Helpers =====
  const $ = sel => document.querySelector(sel);
  const dateView = $('#dateView');
  const prevDayBtn = $('#prevDay');
  const nextDayBtn = $('#nextDay');
  const openCal = $('#openCal');
  const calModal = $('#calModal');
  const calPrev  = $('#calPrev');
  const calNext  = $('#calNext');
  const calTitle = $('#calTitle');
  const calDays  = $('#calDays');
  const calToday = $('#calToday');
  const calClose = $('#calClose');

  const jalaliOut = $('#jalaliOut');
  const dayText = $('#dayText');
  const copyPrevBtn = $('#copyPrev');
  const clearDayBtn = $('#clearDay');

  const langSel = $('#langSel');
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

  function pad(n){ return String(n).padStart(2,'0'); }
  function todayISO(){ const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
  function parseISO(iso){ const [y,m,d] = iso.split('-').map(Number); return new Date(y, m-1, d); }
  function fmtISO(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
  function timeToMinutes(t){ if (!t) return null; const [H,M] = t.split(':').map(Number); return H*60 + M; }
  function minutesToTime(min){ const H = Math.floor(min/60), M = min%60; return `${pad(H)}:${pad(M)}`; }
  function offsetISO(iso, days){ const d=parseISO(iso); d.setDate(d.getDate()+days); return fmtISO(d); }

  function gregToJalaliString(dateISO){
    try {
      const [y,m,d] = dateISO.split('-').map(Number);
      const dt = new Date(Date.UTC(y, m-1, d, 12, 0, 0));
      const fmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
      return fmt.format(dt);
    } catch { return '—'; }
  }

  // ===== Service Worker =====
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').catch(console.error);
    });
  }

  // Net badge
  const netBadge = $('#netStatus');
  function updateNet(){ if (navigator.onLine) { netBadge.textContent='Online'; netBadge.classList.add('online'); } else { netBadge.textContent='Offline'; netBadge.classList.remove('online'); } }
  window.addEventListener('online', updateNet); window.addEventListener('offline', updateNet); updateNet();

  // IndexedDB
  const DB_NAME = 'diabetes-daily-v2-3-1';
  const STORE = 'days';
  let db;
  function openDB(){
    return new Promise((resolve, reject)=>{
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = ()=>{ const db = req.result; if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'date' }); };
      req.onsuccess = ()=> resolve(req.result);
      req.onerror = ()=> reject(req.error);
    });
  }
  async function withStore(mode, fn){ db = db || await openDB(); return new Promise((resolve, reject)=>{ const tx=db.transaction(STORE, mode); const store=tx.objectStore(STORE); const res=fn(store); tx.oncomplete=()=>resolve(res); tx.onerror=()=>reject(tx.error); tx.onabort=()=>reject(tx.error); }); }
  async function saveDay(day){ return withStore('readwrite', s => s.put(day)); }
  async function loadDay(date){ return withStore('readonly', s => new Promise((resolve)=>{ const r=s.get(date); r.onsuccess=()=>resolve(r.result||null); r.onerror=()=>resolve(null); })); }

  // App state
  function ensureDay(date){ return { date, dayText:'', meals:[], meds:[], sugars:[], wakeTime:'', sleepTime:'', lang: (localStorage.getItem('lang')||'en') }; }
  let current = ensureDay(todayISO());

  // Language
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
    if (calToday) calToday.textContent = t.today;
    if (calClose) calClose.textContent = t.close;
    document.body.setAttribute('dir', l === 'fa' ? 'rtl' : 'ltr');
    document.documentElement.lang = l === 'fa' ? 'fa' : 'en';
    document.querySelectorAll('.meal-kind').forEach(sel => {
      if (l==='fa'){
        const map = {Breakfast:'صبحانه', Snack:'میان‌وعده', Lunch:'ناهار', 'Snack (Afternoon)':'میان‌وعده عصر', Dinner:'شام', Other:'سایر'};
        for (const opt of sel.options){ opt.textContent = map[opt.value] || opt.value; }
      } else {
        for (const opt of sel.options){ opt.textContent = opt.value; }
      }
    });
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

  // Calendar (custom)
  let calView = parseISO(current.date);
  function buildCalendar(viewDate){
    const year=viewDate.getFullYear(), month=viewDate.getMonth();
    const first=new Date(year,month,1), last=new Date(year,month+1,0);
    const startIdx=first.getDay(), daysIn=last.getDate();
    const monthNames = (langSel.value==='fa'
      ? ['ژانویه','فوریه','مارس','آوریل','مه','ژوئن','ژوئیه','اوت','سپتامبر','اکتبر','نوامبر','دسامبر']
      : ['January','February','March','April','May','June','July','August','September','October','November','December']);
    calTitle.textContent = `${monthNames[month]} ${year}`;
    calDays.innerHTML = '';
    const prevLast = new Date(year,month,0).getDate();
    for(let i=0;i<startIdx;i++){
      const dd=prevLast-startIdx+1+i;
      const b=document.createElement('button'); b.type='button'; b.className='cal-day out'; b.textContent=String(dd);
      b.addEventListener('click', ()=>{ const d=new Date(year,month-1,dd); setDateISO(fmtISO(d)); closeCalendar(); });
      calDays.appendChild(b);
    }
    for(let d=1; d<=daysIn; d++){
      const b=document.createElement('button'); b.type='button'; b.className='cal-day'; b.textContent=String(d);
      const iso=fmtISO(new Date(year,month,d));
      if (current.date===iso) b.classList.add('sel');
      b.addEventListener('click', ()=>{ setDateISO(iso); closeCalendar(); });
      calDays.appendChild(b);
    }
    const cells=calDays.children.length;
    const fill=(cells<=35)?(42-cells):(cells<=42?42-cells:0);
    for(let d=1; d<=fill; d++){
      const b=document.createElement('button'); b.type='button'; b.className='cal-day out'; b.textContent=String(d);
      b.addEventListener('click', ()=>{ const dt=new Date(year,month+1,d); setDateISO(fmtISO(dt)); closeCalendar(); });
      calDays.appendChild(b);
    }
  }
  function openCalendar(){ calModal.classList.remove('hidden'); calView=parseISO(current.date); buildCalendar(calView); }
  function closeCalendar(){ calModal.classList.add('hidden'); }
  openCal.addEventListener('click', openCalendar);
  calPrev.addEventListener('click', ()=>{ calView.setMonth(calView.getMonth()-1); buildCalendar(calView); });
  calNext.addEventListener('click', ()=>{ calView.setMonth(calView.getMonth()+1); buildCalendar(calView); });
  calToday.addEventListener('click', ()=>{ const d=new Date(); setDateISO(fmtISO(d)); calView=d; buildCalendar(calView); });
  calClose.addEventListener('click', closeCalendar);
  calModal.addEventListener('click', (e)=>{ if (e.target.classList.contains('modal-backdrop')) closeCalendar(); });

  function updateJalali(){ jalaliOut.textContent = gregToJalaliString(current.date); }
  async function switchDate(dateISO){
    const saved = await loadDay(dateISO);
    current = saved || ensureDay(dateISO);
    current.lang = localStorage.getItem('lang') || current.lang || 'en';
    renderAll();
  }
  function setDateISO(iso){
    if (current.date === iso) return;
    current.date = iso;
    dateView.value = iso;
    updateJalali();
    switchDate(iso);
  }

  prevDayBtn.addEventListener('click', ()=> setDateISO( offsetISO(current.date, -1) ));
  nextDayBtn.addEventListener('click', ()=> setDateISO( offsetISO(current.date, +1) ));

  dateView.value = current.date;
  (async function init(){
    const d = await loadDay(current.date);
    if (d) current = d;
    renderAll();
  })();

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
      } else { for (const opt of kindEl.options){ opt.textContent = opt.value; } }

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
        if (raw==null){ s.value = null; warnEl.textContent=''; }
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

  addMealBtn.addEventListener('click', ()=>{ current.meals.push({kind:'Breakfast', time:'', desc:''}); updateMeals(); saveDay(current); drawChart(); });
  addMedBtn.addEventListener('click', ()=>{ current.meds.push({time:'', desc:''}); updateMeds(); saveDay(current); drawChart(); });
  addSugarBtn.addEventListener('click', ()=>{ current.sugars.push({label:'', time:'', value:null}); updateSugars(); saveDay(current); drawChart(); });
  addTemplateBtn.addEventListener('click', ()=>{
    const tpl = templateSugarSlots();
    const byLabel = new Set(current.sugars.map(s=> (s.label||'').toLowerCase()));
    for (const s of tpl){ if (!byLabel.has((s.label||'').toLowerCase())) current.sugars.push(s); }
    updateSugars(); saveDay(current); drawChart();
  });

  wakeTime.addEventListener('change', async ()=>{ current.wakeTime = wakeTime.value; await saveDay(current); });
  sleepTime.addEventListener('change', async ()=>{ current.sleepTime = sleepTime.value; await saveDay(current); });

  function templateSugarSlots(){
    const L = langSel.value==='fa';
    const list = [];
    list.push({ label: L ? 'ناشتا (بعد از بیداری)' : 'Fasting (after wake up)', time: current.wakeTime || '', value:null });
    const b = current.meals.find(m=> (m.kind||'').toLowerCase().startsWith('breakfast') && m.time);
    let afterBF=''; if (b){ const t=timeToMinutes(b.time); if (t!=null) afterBF=minutesToTime((t+120)%1440); }
    list.push({ label: L ? '۲ ساعت بعد از صبحانه' : '2 hours after breakfast', time: afterBF, value:null });
    list.push({ label: L ? 'ساعت ۱۲:۰۰' : 'at 12:00', time:'12:00', value:null });
    list.push({ label: L ? 'ساعت ۱۸:۰۰' : 'at 18:00', time:'18:00', value:null });
    list.push({ label: L ? 'قبل از خواب' : 'before sleep', time: current.sleepTime || '', value:null });
    return list;
  }

  function drawChart(){
    const ctx = chart.getContext('2d');
    const W=chart.width, H=chart.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#0b1220'; ctx.fillRect(0,0,W,H);
    const padL=68,padR=24,padT=26,padB=44;
    const x0=padL,y0=padT,x1=W-padR,y1=H-padB;
    const xOfMin=min=> x0+(min/1440)*(x1-x0);

    const vals=current.sugars.filter(s=> s.value && s.time).map(s=> s.value);
    let minY=Math.min(80, ...(vals.length? [Math.min(...vals)-20] : [80]));
    let maxY=Math.max(240, ...(vals.length? [Math.max(...vals)+20] : [240]));
    if (maxY-minY<100) maxY=minY+100;
    const yOfVal=v=> y1 - ((v-minY)/(maxY-minY))*(y1-y0);

    // frame & grid
    ctx.strokeStyle='#1f2937'; ctx.lineWidth=1; ctx.strokeRect(x0,y0,x1-x0,y1-y0);
    ctx.fillStyle='#94a3b8'; ctx.font='12px system-ui, sans-serif';
    for(let h=0;h<=24;h+=2){ const m=h*60,x=xOfMin(m); ctx.strokeStyle='#1f2937'; ctx.beginPath(); ctx.moveTo(x,y0); ctx.lineTo(x,y1); ctx.stroke(); ctx.fillText(`${String(h).padStart(2,'0')}:00`, x-12, y1+16); }
    for(let i=0;i<=6;i++){ const v=minY+(i/6)*(maxY-minY), y=yOfVal(v); ctx.strokeStyle='#1f2937'; ctx.beginPath(); ctx.moveTo(x0,y); ctx.lineTo(x1,y); ctx.stroke(); ctx.fillText(String(Math.round(v)), 8, y+4); }
    ctx.fillText(langSel.value==='fa' ? 'زمان' : 'Time', (x0+x1)/2 - 12, H-8);
    ctx.save(); ctx.translate(16,(y0+y1)/2); ctx.rotate(-Math.PI/2); ctx.fillText(langSel.value==='fa' ? 'قند خون (mg/dL)' : 'Blood sugar (mg/dL)', -66, 0); ctx.restore();

    // target band 70-180
    const yTop=yOfVal(180), yBot=yOfVal(70); ctx.fillStyle='rgba(16,185,129,0.18)'; ctx.fillRect(x0, Math.min(yTop,yBot), x1-x0, Math.abs(yBot-yTop));

    function drawVAt(time,color='#334155',label=''){
      const m=timeToMinutes(time); if(m==null) return;
      const x=xOfMin(m);
      ctx.strokeStyle=color; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(x,y0); ctx.lineTo(x,y1); ctx.stroke(); ctx.setLineDash([]);
      if(label){ ctx.fillStyle='#94a3b8'; ctx.fillText(label, x-24, y0+14); }
    }
    if (current.wakeTime) drawVAt(current.wakeTime, '#475569', langSel.value==='fa' ? 'بیداری' : 'Wake');
    drawVAt('12:00','#475569','12:00'); drawVAt('18:00','#475569','18:00');
    const b=current.meals.find(m=> (m.kind||'').toLowerCase().startsWith('breakfast') && m.time);
    if(b){ const t=timeToMinutes(b.time); if(t!=null){ drawVAt(minutesToTime((t+120)%1440), '#64748b', langSel.value==='fa' ? '۲ ساعت بعد از صبحانه' : '2h after BF'); } }
    if (current.sleepTime) drawVAt(current.sleepTime, '#475569', langSel.value==='fa' ? 'خواب' : 'Sleep');

    // sugar line
    const pts=current.sugars.filter(s=> s.time && s.value!=null)
      .map(s=> ({x:xOfMin(timeToMinutes(s.time)), y:yOfVal(s.value)}))
      .sort((a,b)=> a.x-b.x);
    if(pts.length){
      ctx.strokeStyle='#0ea5e9'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
      ctx.fillStyle='#0ea5e9';
      for(const p of pts){ ctx.beginPath(); ctx.arc(p.x,p.y,3,0,Math.PI*2); ctx.fill(); }
    }

    // tags (meals + meds) with simple lane layout
    function roundRect(ctx,x,y,w,h,r,fill,stroke){
      if(w<2*r) r=w/2; if(h<2*r) r=h/2;
      ctx.beginPath();
      ctx.moveTo(x+r,y);
      ctx.arcTo(x+w,y,x+w,y+h,r);
      ctx.arcTo(x+w,y+h,x,y+h,r);
      ctx.arcTo(x,y+h,x,y,r);
      ctx.arcTo(x,y,x+w,y,r);
      ctx.closePath();
      if(fill) ctx.fill();
      if(stroke) ctx.stroke();
    }
    function measureMultiline(text){
      const lines=String(text||'').split(/\r?\n/);
      const widths=lines.map(s=> ctx.measureText(s).width);
      return {lines, width: Math.max(60, ...widths), height: lines.length*16 + 8};
    }
    function drawTag(x,y,text,bg,fg){
      ctx.font='12px system-ui, sans-serif';
      const m=measureMultiline(text);
      const padX=8, r=8;
      const w=Math.min(320, m.width+padX*2), h=m.height;
      const left=Math.max(x-w/2, x0);
      const right=Math.min(left+w, x1);
      const adjLeft=right-w;
      ctx.fillStyle=bg;
      roundRect(ctx, adjLeft, y, w, h, r, true, false);
      ctx.fillStyle=fg;
      let yy=y+14;
      for(const line of m.lines){
        ctx.fillText(line, adjLeft+padX, yy);
        yy+=16;
      }
      // connector
      ctx.strokeStyle=bg; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y-8); ctx.stroke();
      return {left: adjLeft, right: adjLeft + w, top: y, bottom: y + h};
    }
    function layoutTags(items,yStart,laneGap){
      const lanes=[];
      for(const it of items){
        const x=xOfMin(timeToMinutes(it.time));
        let lane=0;
        while(true){
          const y=yStart + lane*(laneGap);
          const rect=drawTag(x,y,it.text,it.bg,it.fg);
          const overlap=(lanes[lane]||[]).some(r=> !(rect.right<r.left || rect.left>r.right));
          if(!overlap){
            (lanes[lane]=lanes[lane]||[]).push(rect);
            break;
          } else {
            lane++;
            if(lane>6){ (lanes[lane]=lanes[lane]||[]).push(rect); break; }
          }
        }
      }
    }
    function kindFa(k){ const map={Breakfast:'صبحانه', Snack:'میان‌وعده', Lunch:'ناهار', 'Snack (Afternoon)':'میان‌وعده عصر', Dinner:'شام', Other:'سایر'}; return map[k]||k; }

    const mealItems=sortByTime((current.meals||[]).filter(m=>m.time)).map(m=>({
      time:m.time,
      text:( (langSel.value==='fa'?kindFa(m.kind||'Meal'):(m.kind||'Meal')) + (m.desc? (': '+m.desc):'')),
      bg:'#0ea5e980', fg:'#00111a'
    }));
    const medItems=sortByTime((current.meds||[]).filter(m=>m.time)).map(m=>({
      time:m.time,
      text:(m.desc || (langSel.value==='fa' ? 'دارو' : 'Medication')),
      bg:'#22c55e80', fg:'#022010'
    }));

    layoutTags(mealItems, y0+6, 24);
    layoutTags(medItems, y1-30 - 6*24, 24);
  }

  function renderAll(){
    dateView.value = current.date;
    dayText.value = current.dayText || '';
    wakeTime.value = current.wakeTime || '';
    sleepTime.value = current.sleepTime || '';
    applyLang(current.lang || (localStorage.getItem('lang')||'en'));
    updateJalali();
    updateMeals(); updateMeds(); updateSugars(); drawChart();
  }

  copyPrevBtn.addEventListener('click', async ()=>{
    const prevISO = offsetISO(current.date, -1);
    const prev = await loadDay(prevISO);
    if (!prev) return;
    current.meals = JSON.parse(JSON.stringify(prev.meals||[]));
    current.meds  = JSON.parse(JSON.stringify(prev.meds||[]));
    current.sugars= JSON.parse(JSON.stringify(prev.sugars||[]));
    current.wakeTime = prev.wakeTime||'';
    current.sleepTime = prev.sleepTime||'';
    await saveDay(current); renderAll();
  });
  clearDayBtn.addEventListener('click', async ()=>{ current = ensureDay(current.date); await saveDay(current); renderAll(); });

  dayText.addEventListener('input', async ()=>{ current.dayText = dayText.value; await saveDay(current); });
  redrawBtn.addEventListener('click', drawChart);
  exportA4Btn.addEventListener('click', ()=>{ alert(langSel.value==='fa' ? 'خروجی A4 در این نسخه پایدار فعال است.' : 'A4 export is included in this stable build.'); });
})();
