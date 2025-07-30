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
    updateTypeOptions(parts);            // Update dropdown
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

document.getElementById("applyFilter").addEventListener("click", applyFilters);
function applyFilters() {
  const selectedType = document.getElementById("typeSelect").value;
  const value = document.getElementById("valueInput").value.trim().toLowerCase();
  const footprint = document.getElementById("footprintInput").value.trim().toLowerCase();

  const filtered = allParts.filter(part =>
    (!selectedType || part.TYPE === selectedType) &&
    (!value || (part.VALUE && part.VALUE.toLowerCase().includes(value))) &&
    (!footprint || (part.FOOTPRINT && part.FOOTPRINT.toLowerCase().includes(footprint)))
  );

  renderPartsTable(filtered);
}

function updateTypeOptions(parts) {
  const typeSelect = document.getElementById("typeSelect");
  const uniqueTypes = [...new Set(parts.map(p => p.TYPE).filter(Boolean))];
  typeSelect.innerHTML = `<option value="">All</option>` + 
    uniqueTypes.map(type => `<option value="${type}">${type}</option>`).join('');
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
  document.getElementById("valueInput").value = "";
  document.getElementById("footprintInput").value = "";
  renderPartsTable(allParts); // Reset to full list
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