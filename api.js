
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



setTimeout( () => {
    let selectedDeviceId;
      const codeReader = new ZXing.BrowserMultiFormatReader(hints)
      console.log('ZXing code reader initialized')
      codeReader.listVideoInputDevices()
        .then((videoInputDevices) => {
          const sourceSelect = document.getElementById('sourceSelect')
          selectedDeviceId = videoInputDevices[0].deviceId
          if (videoInputDevices.length >= 1) {
            videoInputDevices.forEach((element) => {
              const sourceOption = document.createElement('option')
              sourceOption.text = element.label
              sourceOption.value = element.deviceId
              sourceSelect.appendChild(sourceOption)
            })

            sourceSelect.onchange = () => {
              selectedDeviceId = sourceSelect.value;
            };

            const sourceSelectPanel = document.getElementById('sourceSelectPanel')
            sourceSelectPanel.style.display = 'block'
          }

          document.getElementById('startButton').addEventListener('click', () => {
            codeReader.decodeFromVideoDevice(selectedDeviceId, 'video', (result, err) => {
              if (result) {
                console.log(result)
                document.getElementById("raw").innerText = result
                document.getElementById('result').textContent = result.text
                let parsed = customParse(result.text);
                console.log("PARSED")
                console.log(JSON.stringify(parsed));
                document.getElementById("parsed").innerText = JSON.stringify(parsed)
              }
              if (err && !(err instanceof ZXing.NotFoundException)) {
                console.error(err)
                document.getElementById('result').textContent = err
              }
            })
            console.log(`Started continous decode from camera with id ${selectedDeviceId}`)
          })

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
  const raw = "[)>06PQ1045-ND1P364019-0130PQ1045-NDK12432 TRAVIS FOSS P1K8573287310K1033329569D2310131TQJ13P11K14LTWQ311ZPICK12Z736098813Z99999920Z0000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
  console.log(customParse(raw))
}

const url = "https://script.google.com/macros/s/AKfycbx5eDGiHa3NCjjrFYuWrmii8wVTiTApn8_MY4Sk7v0f75UEz0A9mwPt9zgD9BbeIsJP/exec";

document.getElementById("add-part").addEventListener("click", () => {
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain"
    },
    body: JSON.stringify({
      "SUPPLIER_PART_NUMBER": lastScannedPart["SUPPLIER_PART_NUMBER"],
      "DIGIKEY_PART_NUMBER": lastScannedPart["DIGIKEY_PART_NUMBER"],
      "QUANTITY": lastScannedPart["QUANTITY"],
      "LOCATION": "NA12",
      "mode": "add"
    })
  })
  .then(response => response.text())
  .then(data => console.log("Success:", data))
  .catch(error => console.error("Error:", error));
})

function checkPart(){
  fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({
        SUPPLIER_PART_NUMBER: lastScannedPart["SUPPLIER_PART_NUMBER"],
        mode: "get"
      })
    })
    .then(res => res.text())
    .then(data => {
      console.log("Part info:", data)
      console.log(JSON.parse(data))
      let results = JSON.parse(data)["part"];

      document.getElementById('db-table-body').innerHTML = `
      <tr>
        <td>${results.SUPPLIER_PART_NUMBER}</td>
        <td>${results.DIGIKEY_PART_NUMBER}</td>
        <td>${results.QUANTITY}</td>
        <td>${results.ORDER_NUMBER}</td>
      </tr>
    `;


    })
    .catch(err => console.error("Error:", err));
}

document.getElementById("check-part").addEventListener("click", () => {
    checkPart();
})

document.getElementById("subtract-part").addEventListener("click", () => {
    fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      SUPPLIER_PART_NUMBER: lastScannedPart["SUPPLIER_PART_NUMBER"],
      QUANTITY: 2,
      mode: "subtract"
    })
  })
  .then(res => res.text())
  .then(data => console.log("Response:", data))
  .catch(err => console.error("Error:", err));
})