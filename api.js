
const hints = new Map();
hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
//   ZXing.BarcodeFormat.CODE_128,
//   ZXing.BarcodeFormat.CODE_39,
//   ZXing.BarcodeFormat.CODE_93,
//   ZXing.BarcodeFormat.EAN_13,
//   ZXing.BarcodeFormat.EAN_8,
//   ZXing.BarcodeFormat.UPC_A,
//   ZXing.BarcodeFormat.UPC_E,
//   ZXing.BarcodeFormat.ITF,
//   ZXing.BarcodeFormat.CODABAR,
//   // 2D formats
//   ZXing.BarcodeFormat.QR_CODE,
  ZXing.BarcodeFormat.DATA_MATRIX,
  // ZXing.BarcodeFormat.AZTEC,
  // ZXing.BarcodeFormat.PDF_417,
  // ZXing.BarcodeFormat.MAXICODE
]);

var codeReader, sourceSelect, sourceOption, sourceSelectPanel, selectedDeviceId;

setTimeout( () => {
      codeReader = new ZXing.BrowserMultiFormatReader(hints)
      console.log('ZXing code reader initialized')
      codeReader.listVideoInputDevices()
        .then((videoInputDevices) => {
          sourceSelect = document.getElementById('sourceSelect')
          selectedDeviceId = videoInputDevices[0].deviceId
          if (videoInputDevices.length >= 1) {
            videoInputDevices.forEach((element) => {
              sourceOption = document.createElement('option')
              sourceOption.text = element.label
              sourceOption.value = element.deviceId
              sourceSelect.appendChild(sourceOption)
            })

            sourceSelect.onchange = () => {
              selectedDeviceId = sourceSelect.value;
            };

            sourceSelectPanel = document.getElementById('sourceSelectPanel')
            sourceSelectPanel.style.display = 'block'
          }

          // document.getElementById('startButton').addEventListener('click', () => {
          //   codeReader.decodeFromVideoDevice(selectedDeviceId, 'video', (result, err) => {
          //     if (result) {
          //       console.log(result)
          //       document.getElementById("raw").innerText = result
          //       document.getElementById('result').textContent = result.text
          //       let parsed = customParse(result.text);
          //       console.log("PARSED")
          //       console.log(JSON.stringify(parsed));
          //       document.getElementById("parsed").innerText = JSON.stringify(parsed)

          //       showCheckmark()
          //     }
          //     if (err && !(err instanceof ZXing.NotFoundException)) {
          //       console.error(err)
          //       document.getElementById('result').textContent = err
          //     }
          //   })
          //   console.log(`Started continous decode from camera with id ${selectedDeviceId}`)
          // })

          document.getElementById('resetButton').addEventListener('click', () => {
            codeReader.reset()
            document.getElementById('result').textContent = '';
            console.log('Reset.')
          })

        })
        .catch((err) => {
          console.error(err)
        })


} ,1000);


const videoWrapper = document.getElementById("videoWrapper");
const overlay = document.getElementById("start-overlay");
const video = document.getElementById("video");

overlay.addEventListener("click", startScanner);
    
// function startScanner() {
//   const overlay = document.getElementById("start-overlay");
//   overlay.style.display = "none"; // Hide overlay

//   codeReader.decodeFromVideoDevice(selectedDeviceId, 'video', (result, err) => {
//     if (result) {
//       console.log(result)
//       document.getElementById("raw").innerText = result
//       document.getElementById('result').textContent = result.text
//       let parsed = customParse(result.text);
//       console.log("PARSED")
//       console.log(JSON.stringify(parsed));
//       document.getElementById("parsed").innerText = JSON.stringify(parsed)

//       showCheckmark()
//     }
//     if (err && !(err instanceof ZXing.NotFoundException)) {
//       console.error(err)
//       document.getElementById('result').textContent = err
//     }
//   })
//   console.log(`Started continous decode from camera with id ${selectedDeviceId}`)
// }

function startScanner() {
  videoWrapper.classList.add("active");

  codeReader.decodeFromVideoDevice(selectedDeviceId, 'video', (result, err) => {
    if (result) {
      document.getElementById("raw").innerText = result;
      document.getElementById("result").textContent = result.text;
      document.getElementById("parsed").innerText = JSON.stringify(customParse(result.text));
      showCheckmark();
    }
    if (err && !(err instanceof ZXing.NotFoundException)) {
      console.error(err);
      document.getElementById("result").textContent = err;
    }
  });

  console.log(`Started decode from camera: ${selectedDeviceId}`);
}

// function stopScanner() {
//   // Stop the code reader
//   if (codeReader) {
//     codeReader.reset(); // Stops video stream and decoding
//   }

//   // Show the overlay again
//   const overlay = document.getElementById("start-overlay");
//   overlay.style.display = "flex"; // or "block" depending on your CSS layout

//   // Optionally clear any previous results
//   document.getElementById("raw").innerText = "";
//   document.getElementById("result").textContent = "";
//   document.getElementById("parsed").innerText = "";
// }


function stopScanner() {
  codeReader.reset();
  videoWrapper.classList.remove("active");
  document.getElementById("result").textContent = '';
  console.log("Camera stopped.");
}


document.getElementById("start-overlay").addEventListener("click", ()=>{
  startScanner()
})



var lastScannedPart = {};

function customParse(raw){

    let parsedFields = raw.split('\x1D'); // []
    console.log(parsedFields)
    let fields = [
        "HEADER",
        "CUSTOMER_PART_NUMBER",
        "SUPPLIER_PART_NUMBER",
        "DIGIKEY_PART_NUMBER",
        "PURCHASE_ORDER_NUMBER",
        "ORDER_NUMBER",
        "INVOICE_NUMBER",
        "DATE_CODE",
        "LOT_CODE",
        "PACKING_LIST_NUMBER",
        "COUNTRY_ORIGIN",
        "QUANTITY",
        "LABEL_TYPE_DONTUSE",
        "PARTID_DONTUSE",
        "NOT_USED",
        "PADDING"
    ];

    let outDict = {};

    for (let i = 0; i<parsedFields.length; i++){
      outDict[fields[i]] = parsedFields[i];
    }

    outDict["CUSTOMER_PART_NUMBER"] = outDict["CUSTOMER_PART_NUMBER"].slice(1);
    outDict["SUPPLIER_PART_NUMBER"] = outDict["SUPPLIER_PART_NUMBER"].slice(2);
    outDict["DIGIKEY_PART_NUMBER"] = outDict["DIGIKEY_PART_NUMBER"].slice(3);
    outDict["QUANTITY"] = outDict["QUANTITY"].slice(1);

    lastScannedPart = outDict;


    document.getElementById('scanned-table-body').innerHTML = `
      <tr>
        <td>${outDict.SUPPLIER_PART_NUMBER}</td>
        <td>${outDict.DIGIKEY_PART_NUMBER}</td>
        <td>${outDict.QUANTITY}</td>
        <td>${outDict.ORDER_NUMBER}</td>
      </tr>
    `;

    checkPart()

    return outDict
}

function fakeData(){
// Example use:
  const raw = "[)>06P311-4.7KJRCT-ND1PRC0402JR-074K7L30P311-4.7KJRCT-NDK12432 TRAVIS FOSS P1K8573287310K1033329569D2310131TQJ13P11K14LTWQ311ZPICK12Z736098813Z99999920Z0000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
  console.log(customParse(raw))
}

const url = "https://script.google.com/macros/s/AKfycbxmCclSl1FJxoZDDWAU_hVKPnQoVfNFi7hTNNCH2m9RdR9EWSDvSRnJpKdR4jcC8Nhj/exec";

// document.getElementById("add-part").addEventListener("click", () => {
//     let location = prompt("Enter part location:", "NA12");
//   if (location === null || location.trim() === "") {
//     location = "undefined";
//   }

//   showDbSpinner();

//   fetch(url, {
//     method: "POST",
//     headers: {
//       "Content-Type": "text/plain"
//     },
//     body: JSON.stringify({
//       "SUPPLIER_PART_NUMBER": lastScannedPart["SUPPLIER_PART_NUMBER"],
//       "DIGIKEY_PART_NUMBER": lastScannedPart["DIGIKEY_PART_NUMBER"],
//       "QUANTITY": lastScannedPart["QUANTITY"],
//       "LOCATION": location,
//       "mode": "add",
//       "token": token
//     })
//   })
//   .then(response => response.text())
//   .then(data => {
//     console.log("Success:", data);
//     checkPart();
//     fetchAndDisplayParts();
//   })
//   .catch(error => console.error("Error:", error))
//   .finally(() => {
//     hideDbSpinner();
//   });
// })

const addModal = document.getElementById("addModal");
const addClose = document.getElementById("addClose");
const addQtyInput = document.getElementById("addQty");
const addLocationInput = document.getElementById("addLocation");

document.getElementById("add-part").addEventListener("click", () => {
  // Set placeholder for quantity based on scanned data
  const scannedQty = parseInt(lastScannedPart?.QUANTITY || "");
  addQtyInput.placeholder = !isNaN(scannedQty) ? scannedQty : "e.g. 100";
  addQtyInput.value = "";
  addLocationInput.value = "";

  addModal.style.display = "block";
});

addClose.onclick = () => addModal.style.display = "none";
window.addEventListener("click", (e) => {
  if (e.target === addModal) addModal.style.display = "none";
});

document.getElementById("confirmAdd").addEventListener("click", () => {
  const quantity = parseInt(addQtyInput.value || addQtyInput.placeholder);
  const location = addLocationInput.value.trim() || "undefined";

  if (!lastScannedPart || !lastScannedPart["SUPPLIER_PART_NUMBER"]) {
    alert("No scanned part to add.");
    return;
  }

  if (isNaN(quantity) || quantity <= 0) {
    alert("Enter a valid quantity.");
    return;
  }

  addModal.style.display = "none";
  showDbSpinner();

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      "SUPPLIER_PART_NUMBER": lastScannedPart["SUPPLIER_PART_NUMBER"],
      "DIGIKEY_PART_NUMBER": lastScannedPart["DIGIKEY_PART_NUMBER"],
      "QUANTITY": quantity,
      "LOCATION": location,
      "mode": "add",
      "token": token
    })
  })
  .then(response => response.text())
  .then(data => {
    console.log("Success:", data);
    checkPart();
    fetchAndDisplayParts();
  })
  .catch(error => console.error("Error:", error))
  .finally(() => hideDbSpinner());
});


function checkPart(){
  showDbSpinner();
  fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({
        SUPPLIER_PART_NUMBER: lastScannedPart["SUPPLIER_PART_NUMBER"],
        mode: "get",
        token: token
      })
    })
    .then(res => res.text())
    .then(data => {
      console.log("Part info:", data)
      console.log(JSON.parse(data))
      var results = JSON.parse(data);


      if (!results["success"]){
          document.getElementById('db-table-body').innerHTML = `
          <tr>
            <td>${lastScannedPart.SUPPLIER_PART_NUMBER}</td>
            <td>${lastScannedPart.DIGIKEY_PART_NUMBER}</td>
            <td>0</td>
            <td>N/A</td>
          </tr>
        `;
      }
      else {
        var partResults = results["part"]
          document.getElementById('db-table-body').innerHTML = `
          <tr>
            <td>${partResults.SUPPLIER_PART_NUMBER}</td>
            <td>${partResults.DIGIKEY_PART_NUMBER}</td>
            <td>${partResults.QUANTITY}</td>
            <td>${partResults.ORDER_NUMBER}</td>
          </tr>
        `;
      }
    })
    .catch(err => console.error("Error:", err))
    .finally(() => {
      hideDbSpinner();
    })
}

document.getElementById("check-part").addEventListener("click", () => {
    checkPart();
})

document.getElementById("subtract-part").addEventListener("click", () => {
  openSubtractModal()
})








const modal = document.getElementById("subtractModal");
const closeBtn = document.querySelector(".close");
const confirmBtn = document.getElementById("confirmSubtract");
const input = document.getElementById("subtractQty");

// Open the modal
function openSubtractModal() {
  input.value = "";
  modal.style.display = "block";
}

// Close the modal
closeBtn.onclick = () => modal.style.display = "none";
window.onclick = e => { if (e.target === modal) modal.style.display = "none"; }

// Handle submit
confirmBtn.onclick = () => {
  const qty = parseInt(input.value);
  if (!qty || qty < 1) {
    alert("Please enter a valid quantity.");
    return;
  }
  showDbSpinner();
fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      SUPPLIER_PART_NUMBER: lastScannedPart["SUPPLIER_PART_NUMBER"],
      QUANTITY: qty,
      mode: "subtract",
      token: token
    })
  })
  .then(res => res.text())
  .then(data => {
    console.log("Response:", data)
    modal.style.display = "none";
    checkPart()
  })
  .catch(err => {
    console.error("Error:", err);
    alert("Failed to subtract.");
  })
  .finally(() => {
    hideDbSpinner();
  })
};

function showCheckmark(duration = 3000) {
  const overlay = document.getElementById("checkmark-overlay");
  overlay.style.display = "block";
  setTimeout(() => {
    overlay.style.display = "none";
    stopScanner();
  }, duration);
}

let dbSpinnerRefCount = 0;
function showDbSpinner() {
  dbSpinnerRefCount++;
  document.getElementById("db-spinner").style.display = "inline-block";
}

function hideDbSpinner() {
  dbSpinnerRefCount = Math.max(0, dbSpinnerRefCount - 1);
  if (dbSpinnerRefCount === 0) {
    document.getElementById("db-spinner").style.display = "none";
  }
}
