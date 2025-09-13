// Basic PWA + IndexedDB Diabetes Log
(function(){
  // Service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').catch(console.error);
    });
  }

  // Install prompt
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

  // Network status
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

  // IndexedDB minimal wrapper
  const DB_NAME = 'diabetes-db';
  const STORE = 'entries';
  let db;
  function openDB(){
    return new Promise((resolve, reject)=>{
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = (e)=>{
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
          store.createIndex('by_date', 'date', { unique: false });
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
  async function addEntry(entry){
    return withStore('readwrite', s => s.add(entry));
  }
  async function getAll(){
    return withStore('readonly', s => s.getAll());
  }
  async function clearAll(){
    return withStore('readwrite', s => s.clear());
  }
  async function remove(id){
    return withStore('readwrite', s => s.delete(id));
  }

  // UI elements
  const dt     = document.getElementById('dt');
  const glucose= document.getElementById('glucose');
  const insulin= document.getElementById('insulin');
  const carbs  = document.getElementById('carbs');
  const note   = document.getElementById('note');
  const form   = document.getElementById('entryForm');
  const list   = document.getElementById('entriesList');
  const empty  = document.getElementById('entriesEmpty');
  const exportBtn = document.getElementById('exportBtn');
  const clearBtn  = document.getElementById('clearBtn');

  // Default datetime to now (local)
  function toLocalDTStr(d=new Date()){
    const pad = n => String(n).padStart(2,'0');
    return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  dt.value = toLocalDTStr();

  function renderItem(e){
    const li = document.createElement('li');
    li.className = 'item';
    const entryDiv = document.createElement('div');
    entryDiv.className = 'entry';
    const top = document.createElement('div');
    top.className = 'top';
    const date = new Date(e.date);
    const when = document.createElement('span');
    when.className = 'muted';
    when.textContent = date.toLocaleString();
    const g = document.createElement('span');
    g.className = 'tag';
    g.textContent = `Glucose: ${e.glucose} mg/dL`;
    const ins = document.createElement('span');
    ins.className = 'tag';
    ins.textContent = `Insulin: ${e.insulin ?? 0} U`;
    const c = document.createElement('span');
    c.className = 'tag';
    c.textContent = `Carbs: ${e.carbs ?? 0} g`;
    top.append(when,g,ins,c);
    const n = document.createElement('div');
    n.textContent = e.note || '';
    entryDiv.append(top,n);

    const del = document.createElement('button');
    del.className = 'del';
    del.textContent = 'Delete';
    del.addEventListener('click', async ()=>{
      await remove(e.id);
      await refresh();
    });

    li.append(entryDiv, del);
    return li;
  }

  async function refresh(){
    const data = await getAll();
    // sort by date desc
    data.sort((a,b)=> new Date(b.date) - new Date(a.date));
    list.innerHTML = '';
    if (!data.length){ empty.style.display = 'block'; return; }
    empty.style.display = 'none';
    for (const e of data){
      list.appendChild(renderItem(e));
    }
  }

  form.addEventListener('submit', async (ev)=>{
    ev.preventDefault();
    const entry = {
      date: new Date(dt.value || new Date()).toISOString(),
      glucose: Number(glucose.value),
      insulin: insulin.value ? Number(insulin.value) : null,
      carbs: carbs.value ? Number(carbs.value) : null,
      note: note.value.trim()
    };
    if (!entry.glucose || entry.glucose < 10){ alert('Enter a valid glucose value.'); return; }
    await addEntry(entry);
    glucose.value=''; insulin.value=''; carbs.value=''; note.value='';
    dt.value = toLocalDTStr();
    await refresh();
  });

  exportBtn.addEventListener('click', async ()=>{
    const data = await getAll();
    const header = ['id','date','glucose_mg_dL','insulin_U','carbs_g','note'];
    const rows = data.map(e=>[e.id, e.date, e.glucose ?? '', e.insulin ?? '', e.carbs ?? '', (e.note||'').replace(/\n/g,' ')]);
    const csv = [header, ...rows].map(r=> r.map(x => {
      const s = String(x ?? '');
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
    }).join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
    a.download = `diabetes-log-${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  });

  clearBtn.addEventListener('click', async ()=>{
    if (confirm('Delete ALL entries? This cannot be undone.')){
      await clearAll();
      await refresh();
    }
  });

  // Initial render
  refresh();
})();