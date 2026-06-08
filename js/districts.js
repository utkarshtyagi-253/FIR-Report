/* ============================================
   districts.js — Rajasthan Districts Autocomplete
   All 33 official districts of Rajasthan, India
   ============================================ */

const RAJASTHAN_DISTRICTS = [
  "Ajmer", "Alwar", "Banswara", "Baran", "Barmer",
  "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh",
  "Churu", "Dausa", "Dholpur", "Dungarpur", "Hanumangarh",
  "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu",
  "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali",
  "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar",
  "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"
];

// Always use the sorted hardcoded list — no API key required
let allDistricts = [...RAJASTHAN_DISTRICTS].sort();

/** Renders matching districts into the dropdown div */
function filterDistricts(val) {
  const dd = document.getElementById('district-dropdown');
  if (!dd) return;

  const q = val.trim().toLowerCase();
  const matches = q
    ? allDistricts.filter(d => d.toLowerCase().includes(q))
    : allDistricts;

  if (matches.length === 0) {
    dd.innerHTML = `<div class="district-item no-result">No district found</div>`;
  } else {
    dd.innerHTML = matches
      .map(d => `<div class="district-item" onmousedown="selectDistrict('${d}')">${d}</div>`)
      .join('');
  }

  dd.style.display = 'block';
}

/** Fills the input with the chosen district and closes dropdown */
async function selectDistrict(name) {
  const input = document.getElementById('district');
  if (input) input.value = name;
  hideDistrictDropdown();
}

/** Opens dropdown and shows full list (or filtered if text already typed) */
function showDistrictDropdown() {
  const input = document.getElementById('district');
  filterDistricts(input ? input.value : '');
}

/** Hides the dropdown */
function hideDistrictDropdown() {
  const dd = document.getElementById('district-dropdown');
  if (dd) dd.style.display = 'none';
}

/** Dummy — kept so app.js DOMContentLoaded call doesn't throw */
function loadRajasthanDistricts() {
  // List is already loaded — nothing async needed
}
