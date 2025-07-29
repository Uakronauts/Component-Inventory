let prMode = false;

document.getElementById("togglePrMode").addEventListener("click", () => {
  prMode = !prMode;
  document.getElementById("submitPrMode").style.display = prMode ? "inline-block" : "none";
  renderPartsTable(allParts); // re-render with checkboxes
});

document.getElementById("submitPrMode").addEventListener("click", () => {
  const checkedBoxes = document.querySelectorAll(".pr-checkbox:checked");
  const selectedParts = Array.from(checkedBoxes).map(box => box.dataset.partnum);
  console.log("Selected for PR:", selectedParts);
  submitPurchaseRequest(selectedParts);
});

function submitPurchaseRequest() {
  const selectedPartNumbers = [];

  // Find all checked checkboxes in the table
  document.querySelectorAll(".pr-checkbox:checked").forEach(checkbox => {
    const partId = checkbox.dataset.digikey;
    if (partId) selectedPartNumbers.push(partId);
  });

  if (selectedPartNumbers.length === 0) {
    alert("No parts selected.");
    return;
  }

  showDbSpinner();

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      mode: "purchaseRequest",
      token: token,
      digikeyPartNumbers: selectedPartNumbers
    })
  })
  .then(res => res.text())
  .then(response => {
    alert("Purchase request submitted:\n" + response);
  })
  .catch(err => {
    console.error("PR Error:", err);
    alert("Error submitting purchase request.");
  })
  .finally(() => hideDbSpinner());
}

