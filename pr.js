let prMode = false;

document.getElementById("togglePrMode").addEventListener("click", () => {
  prMode = !prMode;
  document.getElementById("submitPrMode").style.display = prMode ? "inline-block" : "none";
  renderPartsTable(allParts); // re-render with checkboxes
});

var dgToken;
var dgClientId;
document.getElementById("submitPrMode").addEventListener("click", () => {
  const checkedBoxes = document.querySelectorAll(".pr-checkbox:checked");
  const selectedParts = Array.from(checkedBoxes).map(box => box.dataset.partnum);
  console.log("Selected for PR:", selectedParts);

  // get DigiKey token
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      mode: "token",
      "token": token
    })

  })
  .then(response => response.text())
  .then(data => {
    console.log("Token:", data);
    let jdata = JSON.parse(data);
    dgToken = jdata.token;
    dgClientId = jdata.clientId;

    const token = localStorage.getItem("digikey_token");

    if (!token) {
      openDigiKeyPopup();
    } else {
      submitPurchaseRequest(token);
    }


  })
  .catch(error => console.error("Error:", error))
});

// function submitPurchaseRequest(selectedPartNumbers) {
//   if (!Array.isArray(selectedPartNumbers) || selectedPartNumbers.length === 0) {
//     alert("No parts selected.");
//     return;
//   }

//   showDbSpinner();

//   fetch(url, {
//     method: "POST",
//     headers: { "Content-Type": "text/plain" },
//     body: JSON.stringify({
//       mode: "purchaseRequest",
//       token: token,
//       digikeyPartNumbers: selectedPartNumbers
//     })
//   })
//   .then(res => res.text())
//   .then(response => {
//     alert("Purchase request submitted:\n" + response);
//   })
//   .catch(err => {
//     console.error("PR Error:", err);
//     alert("Error submitting purchase request.");
//   })
//   .finally(() => hideDbSpinner());
// }



const redirectUri = window.location.origin + "/digikey-popup.html"; // You'll create this file

// document.getElementById("submitPrMode").addEventListener("click", async () => {
//   const token = localStorage.getItem("digikey_token");

//   if (!token) {
//     openDigiKeyPopup();
//   } else {
//     submitPurchaseRequest(token);
//   }
// });

function openDigiKeyPopup() {
  const width = 600;
  const height = 700;
  const left = (screen.width - width) / 2;
  const top = (screen.height - height) / 2;

  const popup = window.open(
    `${redirectUri}?popup=true`,
    "DigiKeyLogin",
    `width=${width},height=${height},top=${top},left=${left}`
  );

  window.addEventListener("message", function receiveToken(e) {
    if (e.origin !== window.location.origin) return;
    if (e.data?.type === "digikey-token") {
      localStorage.setItem("digikey_token", e.data.token);
      window.removeEventListener("message", receiveToken);
      popup.close();
      submitPurchaseRequest(e.data.token);
    }
  });
}

function submitPurchaseRequest(token) {
  const checkedBoxes = document.querySelectorAll(".pr-checkbox:checked");
  const partNumbers = Array.from(checkedBoxes).map(cb => cb.dataset.partnum);

  if (partNumbers.length === 0) {
    alert("No parts selected.");
    return;
  }

  fetch("https://api.digikey.com/mylists/v1/lists", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "X-DIGIKEY-Client-Id": clientId,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ListName: "Akronauts PR List",
      Items: partNumbers.map(pn => ({ ManufacturerPartNumber: pn }))
    })
  })
  .then(res => res.json())
  .then(data => {
    alert("List created!\n" + (data.WebLink || JSON.stringify(data)));
  })
  .catch(err => {
    console.error(err);
    alert("Failed to create list.");
  });
}
