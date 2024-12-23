import  CreateKoder from './barcode/Koi_Barcode.js'
class Barcode {
  constructor() {
    this.mod = null;
    this.api = null;
  }
  initialize(config) {
    return (async () => {
      // Load WASM file
      config ||= {};
      const directory = config.wasmDirectory || "./";
      // this.mod = await CreateKoder({
      //   locateFile: (file) => `${directory}/${file}`,
      // });
      this.mod = await CreateKoder();

      // Initialize a glue API object (between JavaScript and C++ code)
      this.api = {
        licenseCheck: this.mod.cwrap("licenseCheck", "number", []),
        createBuffer: this.mod.cwrap("createBuffer", "number", ["number"]),
        deleteBuffer: this.mod.cwrap("deleteBuffer", "", ["number"]),
        triggerDecode: this.mod.cwrap("triggerDecode", "number", ["number", "number", "number"]),
        getScanResults: this.mod.cwrap("getScanResults", "number", []),
        getResultType: this.mod.cwrap("getResultType", "number", []),
      };

      const result = this.api.licenseCheck();
      return result;
      // return this;
    })();
  }

  decode(imgData, width, height) {
    const buffer = this.api.createBuffer(width * height * 4);
    this.mod.HEAPU8.set(imgData, buffer);
    const results = [];

    const scanResult = this.api.triggerDecode(buffer, width, height);

    if (scanResult > 0) {
      const resultAddress = this.api.getScanResults();
      const resultType = this.api.getResultType();

      const code = this.mod.UTF8ToString(resultAddress);
      const type = this.mod.UTF8ToString(resultType);

      // Determine resultCode based on code and type
      const resultCode = code == null || type == null ? "1004" : "0000";

      // Construct the result JSON
      const resultJson = {
        resultJSON: {
          resultCode: resultCode,
          formResult: {
            type: "Bar/QR-Code",
            fieldResults: [
              {
                fieldId: "401",
                displayName: "바코드 인식 값",
                value: code,
              },
              {
                fieldId: "402",
                displayName: "바코드 타입",
                value: type,
              },
            ],
          },
        },
      };

      results.push(resultJson);

      // Free memory
      this.api.deleteBuffer(resultAddress);
    }

    if (results.length > 0) {
      return results[0];
    } else {
      // Return NULL structure
      return {
        resultJSON: {
          resultCode: "1004",
          formResult: {
            type: "Bar/QR-Code",
            fieldResults: [
              {
                fieldId: "401",
                displayName: "바코드 인식 값",
                value: null,
              },
              {
                fieldId: "402",
                displayName: "바코드 타입",
                value: null,
              },
            ],
          },
        },
      };
    }
  }
}
// export default Koder;
export {Barcode};
