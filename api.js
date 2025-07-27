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

  // Strip [)> and RS header
  if (raw.startsWith("[)>")) raw = raw.substring(4);
  if (raw[0] === RS) raw = raw.substring(1);
  if (raw.endsWith(EOT)) raw = raw.slice(0, -1);

  const fields = raw.split(GS);
  const result = {};

  for (const field of fields) {
    const match = field.match(/^([0-9A-Z]{1,3})(.+)$/);
    if (match) {
      const [, key, value] = match;
      result[key] = value;
    }
  }

  return result;
}

// Example use:
const raw = "[)>06PQ1045-ND1P364019-0130PQ1045-NDK12432 TRAVIS FOSS P1K8573287310K1033329569D2310131TQJ13P11K14LTWQ311ZPICK12Z736098813Z99999920Z0000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
console.log(parseEIGP(raw));
