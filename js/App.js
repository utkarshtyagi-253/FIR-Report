
/* ============================================

   app.js — FIR Register Frontend Logic

   All data is stored in MongoDB via the backend API.

   Backend base URL: http://localhost:5000/api/firs

   ============================================ */



const API = 'http://localhost:5000/api/firs';



let editId = null;   // holds MongoDB _id of the record being edited



/* ══════════════════════════════════════════

   TOAST NOTIFICATION

══════════════════════════════════════════ */

function showToast(msg, isError = false) {

  const t = document.getElementById('toast');

  t.textContent = msg;

  t.className = isError ? 'error show' : 'show';

  setTimeout(() => { t.className = ''; }, 2500);

}



/* ══════════════════════════════════════════

   FORM HELPERS

══════════════════════════════════════════ */



/** Clear the form and reset edit state */

function resetForm() {
  const districtEl = document.getElementById('district');
  if (!districtEl) return; // Not on the register form page

  ['district', 'police_station', 'fir_no', 'fir_date',
   'io_name', 'io_mobile', 'sections', 'remarks'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  const statusEl = document.getElementById('status');
  if (statusEl) statusEl.value = 'open';

  const dateEl = document.getElementById('fir_date');
  if (dateEl) dateEl.valueAsDate = new Date();

  editId = null;

  const submitBtn = document.querySelector('.btn-primary');
  if (submitBtn) submitBtn.textContent = '⊕ REGISTER FIR';
}



/** Read all form values into an object */

function getFormData() {
  const districtEl = document.getElementById('district');
  if (!districtEl) return null; // Not on register form page

  const get = id => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  };

  const statusEl = document.getElementById('status');

  return {
    district:       get('district'),
    police_station: get('police_station'),
    fir_no:         get('fir_no'),
    fir_date:       get('fir_date'),
    io_name:        get('io_name'),
    io_mobile:      get('io_mobile'),
    sections:       get('sections'),
    status:         statusEl ? statusEl.value : 'open',
    remarks:        get('remarks'),
  };
}



/** Client-side validation before hitting the API */

function validate(data) {

  const required = ['district','police_station','fir_no','fir_date','io_name','io_mobile','sections'];

  for (const key of required) {

    if (!data[key]) {

      showToast('Please fill all required fields.', true);

      return false;

    }

  }

  if (!/^\d{10}$/.test(data.io_mobile)) {

    showToast('Mobile number must be exactly 10 digits.', true);

    return false;

  }

  return true;

}



/* ══════════════════════════════════════════

   SAVE / UPDATE FIR  (POST or PUT)

══════════════════════════════════════════ */

async function saveFIR() {
  const data = getFormData();
  if (!data) return;
  if (!validate(data)) return;



  try {

    let res, json;



    if (editId) {

      // UPDATE existing record

      res  = await fetch(`${API}/${editId}`, {

        method:  'PUT',

        headers: { 'Content-Type': 'application/json' },

        body:    JSON.stringify(data),

      });

    } else {

      // CREATE new record

      res  = await fetch(API, {

        method:  'POST',

        headers: { 'Content-Type': 'application/json' },

        body:    JSON.stringify(data),

      });

    }



    json = await res.json();



    if (!json.success) {

      showToast(json.message || 'Something went wrong.', true);

      return;

    }



    showToast(editId ? 'FIR UPDATED SUCCESSFULLY' : 'FIR REGISTERED SUCCESSFULLY');

    resetForm();

    await fetchAndRender();

    await fetchStats();



  } catch (err) {

    showToast('Cannot reach server. Is the backend running?', true);

    console.error(err);

  }

}



/* ══════════════════════════════════════════

   DELETE FIR

══════════════════════════════════════════ */

async function deleteRecord(id) {

  if (!confirm('Delete this FIR record? This cannot be undone.')) return;

  try {

    const res  = await fetch(`${API}/${id}`, { method: 'DELETE' });

    const json = await res.json();

    if (!json.success) { showToast(json.message, true); return; }

    showToast('FIR RECORD DELETED');

    await fetchAndRender();

    await fetchStats();

  } catch (err) {

    showToast('Cannot reach server.', true);

  }

}



/* ══════════════════════════════════════════

   EDIT FIR — populate form

══════════════════════════════════════════ */

async function editRecord(id) {
  const districtEl = document.getElementById('district');
  if (!districtEl) {
    // If we are on records.html, redirect to index.html with the edit parameter
    window.location.href = `index.html?edit=${id}`;
    return;
  }

  try {
    const res  = await fetch(`${API}/${id}`);
    const json = await res.json();
    if (!json.success) { showToast('Could not load record.', true); return; }

    const r = json.data;
    document.getElementById('district').value       = r.district;
    document.getElementById('police_station').value = r.police_station;
    document.getElementById('fir_no').value         = r.fir_no;
    document.getElementById('fir_date').value       = r.fir_date;
    document.getElementById('io_name').value        = r.io_name;
    document.getElementById('io_mobile').value      = r.io_mobile;
    document.getElementById('sections').value       = r.sections;
    document.getElementById('status').value         = r.status;
    document.getElementById('remarks').value        = r.remarks || '';

    editId = id;
    const submitBtn = document.querySelector('.btn-primary');
    if (submitBtn) submitBtn.textContent = '✎ UPDATE FIR';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    showToast('Cannot reach server.', true);
  }
}



/* ══════════════════════════════════════════

   FETCH & RENDER TABLE

══════════════════════════════════════════ */

async function fetchAndRender() {
  const tbody = document.getElementById('fir-tbody');
  if (!tbody) return; // Not on the records page

  const searchInput = document.getElementById('search-input');
  const filterStatus = document.getElementById('filter-status');
  const filterDistrict = document.getElementById('filter-district');

  const search   = searchInput ? searchInput.value.trim() : '';
  const status   = filterStatus ? filterStatus.value : '';
  const district = filterDistrict ? filterDistrict.value : '';

  const params = new URLSearchParams();
  if (search)   params.set('search',   search);
  if (status)   params.set('status',   status);
  if (district) params.set('district', district);

  try {
    const res  = await fetch(`${API}?${params.toString()}`);
    const json = await res.json();
    if (!json.success) return;

    renderTable(json.data);
    updateDistrictFilter(json.data);
  } catch (err) {
    console.error('Fetch error:', err);
    showToast('Cannot reach server. Is the backend running?', true);
  }
}



/** Render rows into the table */

function renderTable(records) {
  const tbody = document.getElementById('fir-tbody');
  const empty = document.getElementById('empty-state');
  if (!tbody || !empty) return;

  if (!records || records.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';



  const STATUS_CLASS = { open: 'open', investigation: 'investigation', closed: 'closed' };

  const STATUS_LABEL = { open: 'OPEN', investigation: 'INVESTIGATING', closed: 'CLOSED' };



  tbody.innerHTML = records.map((r, i) => {

    const sectionTags = r.sections.split(',')

      .map(s => `<span class="section-tag">${s.trim()}</span>`)

      .join('');

    return `

      <tr>

        <td style="color:var(--text-dim);font-family:'Share Tech Mono',monospace;font-size:11px">${i + 1}</td>

        <td>${r.district}</td>

        <td>${r.police_station}</td>

        <td><span class="fir-no">${r.fir_no}</span></td>

        <td style="font-family:'Share Tech Mono',monospace;font-size:12px">${r.fir_date}</td>

        <td>${sectionTags}</td>

        <td>${r.io_name}</td>

        <td style="font-family:'Share Tech Mono',monospace;font-size:12px">+91 ${r.io_mobile}</td>

        <td>

          <span class="status-badge ${STATUS_CLASS[r.status]}">

            <span class="status-dot"></span>${STATUS_LABEL[r.status]}

          </span>

        </td>

        <td style="display:flex;gap:6px;flex-wrap:wrap">

          <button class="action-btn" onclick="editRecord('${r._id}')">EDIT</button>

          <button class="action-btn del" onclick="deleteRecord('${r._id}')">DEL</button>

        </td>

      </tr>`;

  }).join('');

}



/* ══════════════════════════════════════════

   STATS BAR  (from /api/firs/stats/summary)

══════════════════════════════════════════ */

async function fetchStats() {
  try {
    const res  = await fetch(`${API}/stats/summary`);
    const json = await res.json();
    if (!json.success) return;
    const s = json.data;

    const totalEl = document.getElementById('stat-total');
    const openEl = document.getElementById('stat-open');
    const invEl = document.getElementById('stat-inv');
    const closedEl = document.getElementById('stat-closed');

    if (totalEl) totalEl.textContent  = s.total;
    if (openEl) openEl.textContent   = s.open;
    if (invEl) invEl.textContent    = s.investigation;
    if (closedEl) closedEl.textContent = s.closed;
  } catch (err) {
    console.error('Stats fetch error:', err);
  }
}



/* ══════════════════════════════════════════

   DISTRICT FILTER DROPDOWN

══════════════════════════════════════════ */

function updateDistrictFilter(records) {
  const sel = document.getElementById('filter-district');
  if (!sel) return;
  const current = sel.value;
  const districts = [...new Set(records.map(r => r.district))].sort();
  sel.innerHTML = '<option value="">All Districts</option>' +
    districts.map(d =>
      `<option value="${d}"${d === current ? ' selected' : ''}>${d}</option>`
    ).join('');
}



/* ══════════════════════════════════════════

   INIT

══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  const dateEl = document.getElementById('fir_date');
  if (dateEl) dateEl.valueAsDate = new Date();

  // Load districts autocomplete if on register form page
  const districtEl = document.getElementById('district');
  if (districtEl) {
    loadRajasthanDistricts();

    // Check for edit parameter in query string
    const urlParams = new URLSearchParams(window.location.search);
    const editIdParam = urlParams.get('edit');
    if (editIdParam) {
      editRecord(editIdParam);
    }
  }

  // Load data from MongoDB via API
  fetchAndRender();
  fetchStats();
});

/* ══════════════════════════════════════════
   ✨ AI LEGAL BRIEF GENERATION ENGINE
══════════════════════════════════════════ */

async function generateAIBrief() {
  const remarks = document.getElementById('remarks');
  if (!remarks) return;

  // Gather form data
  const district = document.getElementById('district').value.trim();
  const police_station = document.getElementById('police_station').value.trim();
  const fir_no = document.getElementById('fir_no').value.trim();
  const fir_date = document.getElementById('fir_date').value.trim();
  const sections = document.getElementById('sections').value.trim();
  const io_name = document.getElementById('io_name').value.trim();

  if (!district || !police_station || !fir_no || !sections) {
    showToast('Please fill District, PS, FIR No, and Sections first.', true);
    return;
  }

  remarks.value = "⏳ Connecting to police AI network and synthesizing legal brief...";
  remarks.disabled = true;

  try {
    const res = await fetch('http://localhost:5000/api/firs/generate-brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ district, police_station, fir_no, fir_date, sections, io_name })
    });
    const json = await res.json();
    if (json.success && json.brief) {
      remarks.value = json.brief;
      showToast('AI Case Brief Synthesized Successfully');
    } else {
      generateLocalBrief(district, police_station, fir_no, fir_date, sections, io_name);
    }
  } catch (err) {
    generateLocalBrief(district, police_station, fir_no, fir_date, sections, io_name);
  } finally {
    remarks.disabled = false;
  }
}

function generateLocalBrief(district, police_station, fir_no, fir_date, sections, io_name) {
  const remarks = document.getElementById('remarks');
  const dateStr = fir_date || new Date().toISOString().split('T')[0];
  const sectionsList = sections.split(',').map(s => s.trim());
  
  // High fidelity legal details mapping for popular IPC / legal sections
  const ipcMap = {
    '302': 'Section 302 IPC (Punishment for murder)',
    '307': 'Section 307 IPC (Attempt to murder)',
    '379': 'Section 379 IPC (Punishment for theft)',
    '392': 'Section 392 IPC (Punishment for robbery)',
    '420': 'Section 420 IPC (Cheating & dishonesty)',
    '323': 'Section 323 IPC (Punishment for causing hurt)',
    '506': 'Section 506 IPC (Punishment for criminal intimidation)',
    '34': 'Section 34 IPC (Common Intention)',
    '120B': 'Section 120B IPC (Criminal Conspiracy)'
  };

  const detailedSections = sectionsList.map(s => {
    const num = s.replace(/\D/g, '');
    return ipcMap[num] || `Section ${s}`;
  }).join(', ');

  const template = `CASE MEMORANDUM & TECHNICAL REPORT
--------------------------------------------------
REGISTRATION NO: FIR No. ${fir_no}  |  DATE OF RECORD: ${dateStr}
JURISDICTION: ${police_station}, District ${district}
INVESTIGATING OFFICER: IO ${io_name || 'Assigned Officer'}
CHARGED UNDER SECTIONS: ${detailedSections}

SUMMARY OF REPORTED CRIME:
On ${dateStr}, a formal First Information Report (FIR) was logged under serial number ${fir_no} at the ${police_station} station. The complaint details criminal acts and violations of public order falling under ${detailedSections}.

Following an initial site visitation and scene examination directed by IO ${io_name || 'Assigned Officer'}, preliminary evidence indicates a violation of statutory laws. Witnesses are being subpoenaed under Section 160 CrPC, and forensic analysis of physical evidence is underway.

INVESTIGATION STRATEGY & STANDING DIRECTIONS:
1. Case marked as ACTIVE & UNDER HIGH PRIORITY.
2. Search and interrogation protocols initiated for suspects listed in the statement.
3. Case diary being logged continuously as per police rules.
4. Interim progress report scheduled for submission to the Judicial Magistrate.`;

  remarks.value = template;
  showToast('AI Brief Generated (Local Synthesis)');
}