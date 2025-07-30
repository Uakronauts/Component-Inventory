let allParts = [];

function fetchAndDisplayParts() {
  showDbSpinner();
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      mode: "browse",
      token: token
    })
  })
  .then(res => res.json())
  .then(parts => {


    allParts = parts;                    // Save full data set
    parts.NORMALIZED_VALUE = normalizeValue(parts.VALUE);
    initializeFilters(parts)
    renderPartsTable(parts);             // Render all initially
  })
  .catch(error => console.error("Error:", error))
  .finally(() => hideDbSpinner());
}

document.getElementById("browse-db").addEventListener("click", () => {
    fetchAndDisplayParts();
})

document.getElementById("searchBox").addEventListener("input", () => {
    filterTable();
})


function updatePart(part) {
  showDbSpinner();
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      mode: "update",
      token: token,
      ...part  // spreads part fields like SUPPLIER_PART_NUMBER, QUANTITY, etc.
    })
  })
    .then(() => fetchAndDisplayParts())
    .catch(error => console.error("Error updating part:", error))
    .finally(() => {
      hideDbSpinner();
    });
}

function setQuantity(supplierPartNumber, newQuantity) {
  showDbSpinner();
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      mode: "set",
      SUPPLIER_PART_NUMBER: supplierPartNumber,
      QUANTITY: newQuantity,
      token: token
    })
  })
  .then(response => response.text())
  .then(data => {
    console.log("Quantity set:", data);
    fetchAndDisplayParts(); 
  })
  .catch(err => {
    console.error("Error setting quantity:", err);
    alert("Failed to set quantity");
  })
  .finally(() => {
    hideDbSpinner();
  });
}

function changeLocation(supplierPN) {
  const newLocation = prompt("Enter new location:");
  if (!newLocation) return;
  showDbSpinner();
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      mode: "relocate",
      SUPPLIER_PART_NUMBER: supplierPN,
      LOCATION: newLocation,
      token: token
    })
  }).then(() => {
    setTimeout(fetchAndDisplayParts, 1000);
  })
  .catch(error => console.error("Error:", error))
  .finally(() => {
    hideDbSpinner();
  });
}

function filterTable() {
  const search = document.getElementById("searchBox").value.toLowerCase();
  const rows = document.querySelectorAll("#partsTable tbody tr");

  rows.forEach(row => {
    row.style.display = row.innerText.toLowerCase().includes(search) ? "" : "none";
  });
}

// document.getElementById("applyFilter").addEventListener("click", applyFilters);
function applyFilters() {
  const type = document.getElementById("typeSelect").value.trim().toLowerCase();
  const value = document.getElementById("valueSelect").value.trim().toLowerCase();
  const footprint = document.getElementById("footprintSelect").value.trim().toLowerCase();

  const filtered = allParts.filter(p => {
    const matchesType = !type || (typeof p.TYPE === "string" && p.TYPE.toLowerCase() === type);
    const matchesValue = !value || (typeof p.VALUE === "string" && p.VALUE.toLowerCase() === value);
    const matchesFootprint = !footprint || (typeof p.FOOTPRINT === "string" && p.FOOTPRINT.toLowerCase() === footprint);
    return matchesType && matchesValue && matchesFootprint;
  });

  renderPartsTable(filtered);
}

function updateAllSelects() {
  const typeSelect = document.getElementById("typeSelect");
  const valueSelect = document.getElementById("valueSelect");
  const footprintSelect = document.getElementById("footprintSelect");

  const selectedType = typeSelect.value.trim().toLowerCase();
  const selectedValue = normalizeValue(valueSelect.value.trim());
  const selectedFootprint = footprintSelect.value.trim().toLowerCase();

  const filtered = allParts.filter(p => {
    const matchType = !selectedType || (typeof p.TYPE === "string" && p.TYPE.toLowerCase() === selectedType);
    const matchValue = !selectedValue || (p.NORMALIZED_VALUE && p.NORMALIZED_VALUE === selectedValue);
    const matchFootprint = !selectedFootprint || (typeof p.FOOTPRINT === "string" && p.FOOTPRINT.toLowerCase() === selectedFootprint);
    return matchType && matchValue && matchFootprint;
  });

  rebuildSelect(typeSelect, filtered, "TYPE", selectedType);
  rebuildSelect(valueSelect, filtered, "VALUE", valueSelect.value.trim());
  rebuildSelect(footprintSelect, filtered, "FOOTPRINT", selectedFootprint);

  valueSelect.disabled = !selectedType;
  footprintSelect.disabled = !selectedType;

  renderPartsTable(filtered);
}


function rebuildSelect(selectEl, parts, field, selectedRaw) {
  const isValueField = (field === "VALUE");
  const map = new Map();

  parts.forEach(p => {
    const raw = p[field];
    const norm = isValueField ? normalizeValue(raw) : raw;
    if (typeof raw === "string" && !map.has(norm)) {
      map.set(norm, raw); // dedupe by normalized, keep original display
    }
  });

  selectEl.innerHTML = `<option value="">All</option>` +
    [...map.entries()].map(([norm, raw]) => {
      const selected = raw.toLowerCase() === selectedRaw.toLowerCase() ? "selected" : "";
      return `<option value="${raw}" ${selected}>${raw}</option>`;
    }).join('');
}

document.getElementById("typeSelect").addEventListener("change", updateAllSelects);
document.getElementById("valueSelect").addEventListener("change", updateAllSelects);
document.getElementById("footprintSelect").addEventListener("change", updateAllSelects);

function updateDependentSelect(select, parts, field) {
  const unique = [...new Set(parts.map(p => p[field]).filter(Boolean))];
  select.innerHTML = `<option value="">All</option>` +
    unique.map(v => `<option value="${v}">${v}</option>`).join('');
}

function initializeFilters(parts) {
  allParts = parts;
  updateAllSelects(); 
}


function renderPartsTable(parts) {
  const tbody = document.querySelector("#partsTable tbody");
  tbody.innerHTML = "";

  parts.forEach(part => {
    const row = document.createElement("tr");

    const supplierTd = document.createElement("td");
    supplierTd.textContent = part.SUPPLIER_PART_NUMBER;

    const digikeyTd = document.createElement("td");
    digikeyTd.textContent = part.DIGIKEY_PART_NUMBER;

    const qtyTd = document.createElement("td");
    qtyTd.innerHTML = `${part.QUANTITY}`;

    if (prMode) {
      const checkboxTd = document.createElement("td");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "pr-checkbox";
      checkbox.dataset.partnum = part.DIGIKEY_PART_NUMBER;
      checkboxTd.appendChild(checkbox);
      row.appendChild(checkboxTd);
    }

    if (prMode) {
      const th = document.createElement("th");
      th.textContent = "Select";
      document.querySelector("#partsTable thead tr").prepend(th);
    }

    const locationTd = document.createElement("td");
    locationTd.textContent = part.LOCATION;

    const typeTd = document.createElement("td");
    typeTd.textContent = part.TYPE;

    const valueTd = document.createElement("td");
    valueTd.textContent = part.VALUE;

    const footprintTd = document.createElement("td");
    footprintTd.textContent = part.FOOTPRINT;

    const actionsTd = document.createElement("td");

    const editBtn = document.createElement("button");
    editBtn.textContent = "✎";
    editBtn.addEventListener("click", () => {
      if (editBtn.textContent === "✎") {
        // Enter edit mode
        editBtn.textContent = "💾";

        // Replace editable cells with input elements
        [digikeyTd, qtyTd, locationTd, typeTd, valueTd, footprintTd].forEach(td => {
          const val = td.textContent.replace(/ ✎$/, ""); // remove icon if needed
          td.dataset.oldValue = val;
          td.innerHTML = `<input type="text" value="${val}" style="width: 100%;">`;
        });

      } else {
        // Save edits
        editBtn.textContent = "✎";

        const updated = {
          SUPPLIER_PART_NUMBER: part.SUPPLIER_PART_NUMBER,
          DIGIKEY_PART_NUMBER: digikeyTd.querySelector("input").value.trim(),
          QUANTITY: parseInt(qtyTd.querySelector("input").value.trim()),
          LOCATION: locationTd.querySelector("input").value.trim(),
          TYPE: typeTd.querySelector("input").value.trim(),
          VALUE: valueTd.querySelector("input").value.trim(),
          FOOTPRINT: footprintTd.querySelector("input").value.trim()
        };

        digikeyTd.textContent = updated.DIGIKEY_PART_NUMBER;
        qtyTd.innerHTML = `${updated.QUANTITY} <span class="edit-icon">✎</span>`;
        locationTd.textContent = updated.LOCATION;
        typeTd.textContent = updated.TYPE;
        valueTd.textContent = updated.VALUE;
        footprintTd.textContent = updated.FOOTPRINT;

        updatePart(updated);
      }
    });

    actionsTd.appendChild(editBtn);

    row.appendChild(supplierTd);
    row.appendChild(digikeyTd);
    row.appendChild(qtyTd);
    row.appendChild(locationTd);
    row.appendChild(typeTd);
    row.appendChild(valueTd);
    row.appendChild(footprintTd);
    row.appendChild(actionsTd);

    tbody.appendChild(row);
  });
}

document.getElementById("clearFilter").addEventListener("click", () => {
  document.getElementById("typeSelect").value = "";
  document.getElementById("valueSelect").value = "";
  document.getElementById("footprintSelect").value = "";

  updateAllSelects(); // This re-applies filter logic and disables selects
});

function fillMissing(){
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      mode: "missing",
      token: token
    })
  })
  .then(response => response.text())
  .then(data => {
    console.log("Fill missing results:", data);
  })
}

function normalizeValue(value) {
  if (typeof value !== "string") return "";

  let v = value.toUpperCase().replace(/\s/g, "").replace(/Ω/g, ""); // Remove Ω symbol

  // Normalize resistor values to ohms
  if (/[KM]/.test(v)) {
    v = v.replace(/([KM])/, match => {
      return match === "K" ? "000" : "000000";
    });
  }

  // Convert to number if possible
  const numeric = parseFloat(v);
  if (!isNaN(numeric)) return numeric.toString();

  // Capacitor normalization (all to nF)
  if (/F$/.test(v)) {
    if (v.endsWith("UF")) return (parseFloat(v) * 1000).toString();      // µF → nF
    if (v.endsWith("NF")) return parseFloat(v).toString();              // nF
    if (v.endsWith("PF")) return (parseFloat(v) / 1000).toString();     // pF → nF
  }

  return v;
}
