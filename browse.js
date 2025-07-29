function fetchAndDisplayParts(){
  showDbSpinner();
  fetch(url,{
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({
          mode: "browse",
          token: token
      })
  }
  ) // replace with your deployment URL
  .then(res => res.json())
  .then(parts => {
    const tbody = document.querySelector("#partsTable tbody");
    tbody.innerHTML = ""; // clear existing

    parts.forEach(part => {
      const row = document.createElement("tr");

      // Create and fill each cell
      const supplierTd = document.createElement("td");
      supplierTd.textContent = part.SUPPLIER_PART_NUMBER;

      const digikeyTd = document.createElement("td");
      digikeyTd.textContent = part.DIGIKEY_PART_NUMBER;

      const qtyTd = document.createElement("td");
      qtyTd.textContent = part.QUANTITY;
      qtyTd.style.cursor = "pointer";
      qtyTd.title = "Click to edit quantity";
      qtyTd.addEventListener("click", () => {
        const newQty = prompt(`Set new quantity for ${part.SUPPLIER_PART_NUMBER}:`, part.QUANTITY);
        if (newQty === null) return; // user cancelled
        const intQty = parseInt(newQty);
        if (!isNaN(intQty)) {
          setQuantity(part.SUPPLIER_PART_NUMBER, intQty);
        } else {
          alert("Invalid quantity");
        }
      });

      const locationTd = document.createElement("td");
      locationTd.textContent = part.LOCATION;

      const typeTd = document.createElement("td");
      typeTd.textContent = part.TYPE;

      const valueTd = document.createElement("td");
      valueTd.textContent = part.VALUE;

      const footprintTd = document.createElement("td");
      footprintTd.textContent = part.FOOTPRINT;

      // Action buttons
      const actionsTd = document.createElement("td");

      const plusBtn = document.createElement("button");
      plusBtn.textContent = "+";
      plusBtn.addEventListener("click", () => adjustQuantity(part.SUPPLIER_PART_NUMBER, 1));

      const minusBtn = document.createElement("button");
      minusBtn.textContent = "-";
      minusBtn.addEventListener("click", () => adjustQuantity(part.SUPPLIER_PART_NUMBER, -1));

      const editBtn = document.createElement("button");
      editBtn.textContent = "✎";
      editBtn.addEventListener("click", () => changeLocation(part.SUPPLIER_PART_NUMBER));

      // Append buttons to action cell
      actionsTd.appendChild(plusBtn);
      actionsTd.appendChild(minusBtn);
      actionsTd.appendChild(editBtn);

      // Append all cells to the row
      row.appendChild(supplierTd);
      row.appendChild(digikeyTd);
      row.appendChild(qtyTd);
      row.appendChild(locationTd);
      row.appendChild(typeTd);
      row.appendChild(valueTd);
      row.appendChild(footprintTd);
      row.appendChild(actionsTd);

      // Add the row to the table
      tbody.appendChild(row);
    });
  })
  .catch(error => console.error("Error:", error))
  .finally(() => {
    hideDbSpinner();
  });
}

document.getElementById("browse-db").addEventListener("click", () => {
    fetchAndDisplayParts();
})

document.getElementById("searchBox").addEventListener("input", () => {
    filterTable();
})


function adjustQuantity(supplierPN, delta) {
  showDbSpinner();
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      mode: "adjust",
      SUPPLIER_PART_NUMBER: supplierPN,
      DELTA: delta,
      token: token
    })
  }).then(() => fetchAndDisplayParts())
  .catch(error => console.error("Error:", error))
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