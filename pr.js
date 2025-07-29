let prMode = false;

document.getElementById("togglePrMode").addEventListener("click", () => {
  prMode = !prMode;
  document.getElementById("submitPrMode").style.display = prMode ? "inline-block" : "none";
  renderPartsTable(currentParts); // re-render with checkboxes
});

document.getElementById("submitPrMode").addEventListener("click", () => {
  const checkedBoxes = document.querySelectorAll(".pr-checkbox:checked");
  const selectedParts = Array.from(checkedBoxes).map(box => box.dataset.partnum);
  console.log("Selected for PR:", selectedParts);
  submitPurchaseRequest(selectedParts);
});
