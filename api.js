console.log("SIP")

const hints = new Map();
hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
ZXing.BarcodeFormat.CODE_128,
  ZXing.BarcodeFormat.CODE_39,
  ZXing.BarcodeFormat.CODE_93,
  ZXing.BarcodeFormat.EAN_13,
  ZXing.BarcodeFormat.EAN_8,
  ZXing.BarcodeFormat.UPC_A,
  ZXing.BarcodeFormat.UPC_E,
  ZXing.BarcodeFormat.ITF,
  ZXing.BarcodeFormat.CODABAR,
  // 2D formats
  ZXing.BarcodeFormat.QR_CODE,
  ZXing.BarcodeFormat.DATA_MATRIX,
  ZXing.BarcodeFormat.AZTEC,
  ZXing.BarcodeFormat.PDF_417,
  ZXing.BarcodeFormat.MAXICODE
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
                let parsed = parseEIGP(result.text);
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


    }
    ,1000);

function parseEIGP(raw) {
  const GS = String.fromCharCode(29);
  const RS = String.fromCharCode(30);
  const EOT = String.fromCharCode(4);

  const fieldMap = {
    'PQ': 'DigiKey_Part_Number',
    '1P': 'Manufacturer_Part_Number',
    '30P': 'DK_Part_Number_Redundant',
    'K':  'Purchase_Order',
    '1K': 'Sales_Order_Number',
    '10K':'Invoice_Number',
    '9D': 'Date_Code',
    '1T': 'Lot_Code',
    '11K':'Line_Item_Index',
    '4L': 'Country_of_Origin',
    'Q':  'Quantity',
    '11Z':'Pick_Code',
    '12Z':'Machine_ID',
    '13Z':'Packing_ID',
    '20Z':'Extra_Info'
  };

  // Clean up barcode
  if (raw.startsWith("[)>")) raw = raw.substring(4);
  if (raw[0] === RS) raw = raw.substring(1);
  if (raw.endsWith(EOT)) raw = raw.slice(0, -1);

  const fields = raw.split(GS);
  const result = {};

  for (const field of fields) {
    const match = field.match(/^([0-9A-Z]{1,4})(.+)$/);
    if (match) {
      const [, key, value] = match;
      const label = fieldMap[key] || key;
      result[label] = value;
    }
  }

  return result;
}

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
    outDict["SUPPLIER_PART_NUMBER"] = outDict["MANUFACTURER_PART_NUMBER"].slice(2);
    outDict["DIGIKEY_PART_NUMBER"] = outDict["DIGIKEY_PART_NUMBER"].slice(3);
    outDict["QUANTITY"] = outDict["QUANTITY"].slice(1);
    console.log(outDict)
 
}

// Example use:
const raw = "[)>06PQ1045-ND1P364019-0130PQ1045-NDK12432 TRAVIS FOSS P1K8573287310K1033329569D2310131TQJ13P11K14LTWQ311ZPICK12Z736098813Z99999920Z0000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
console.log(parseEIGP(raw));
// console.log(customParse(raw))
customParse(raw)