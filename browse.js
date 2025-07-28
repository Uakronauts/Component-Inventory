function fetchAndDisplayParts(){
    fetch(url,{
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

        row.innerHTML = `
          <td>${part.SUPPLIER_PART_NUMBER}</td>
          <td>${part.DIGIKEY_PART_NUMBER}</td>
          <td>${part.QUANTITY}</td>
          <td>${part.LOCATION}</td>
          <td>
            <button onclick="adjustQuantity('${part.SUPPLIER_PART_NUMBER}', 1)">+</button>
            <button onclick="adjustQuantity('${part.SUPPLIER_PART_NUMBER}', -1)">-</button>
            <button onclick="changeLocation('${part.SUPPLIER_PART_NUMBER}')">✎</button>
          </td>
        `;

        tbody.appendChild(row);
      });
    });
}

document.getElementById("browse-db").addEventListener("click", () => {
    fetchAndDisplayParts();
})

document.getElementById("searchBox").addEventListener("input", () => {
    filterTable();
})


function adjustQuantity(supplierPN, delta) {
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "adjust",
      SUPPLIER_PART_NUMBER: supplierPN,
      DELTA: delta,
      token: token
    })
  }).then(() => fetchAndDisplayParts());
}

function changeLocation(supplierPN) {
  const newLocation = prompt("Enter new location:");
  if (!newLocation) return;

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "relocate",
      SUPPLIER_PART_NUMBER: supplierPN,
      LOCATION: newLocation,
      token: token
    })
  }).then(() => fetchAndDisplayParts());
}

function filterTable() {
  const search = document.getElementById("searchBox").value.toLowerCase();
  const rows = document.querySelectorAll("#partsTable tbody tr");

  rows.forEach(row => {
    row.style.display = row.innerText.toLowerCase().includes(search) ? "" : "none";
  });
}