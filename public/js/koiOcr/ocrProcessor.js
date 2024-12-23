class OCRProcessor {
  constructor() {
    this.Module = null;
    this.buffer = null;
    this.isModelLoaded = false;
  }

  async initModule(modelType) {
    let wasmDirectory;
    if (!this.Module) {
      if (modelType == 2) {
        wasmDirectory = "passport";
        importScripts(`${wasmDirectory}/Koi_Passport.js`);
        this.Module = await passportModule({ wasmDirectory });
      } else if (modelType == 16) {
        wasmDirectory = "crop";
        importScripts(`${wasmDirectory}/SegCrop.js`);
        this.Module = await segCropModule({ wasmDirectory });
      }

      if (!this.Module) {
        console.error("Failed to load the module.");
        throw new Error("Failed to load the module.");
      }
    }
  }

  async loadModel(modelType, getInfo) {
    if (this.modelType == modelType && this.isModelLoaded) {
      return 1; // 이미 해당 모델이 로드됨
    }

    let functionName;
    if (modelType == 1) {
      functionName = "loadONNXModel";
    } else if (modelType == 10) {
      functionName = "loadGiroModel";
    } else if (modelType == 2) {
      functionName = "initializeTesseract";
    } else if (modelType == 16) {
      functionName = "initializeModel";
    }

    try {
      if (!this.isModelLoaded) {
        let result = null;
        if (modelType == 16) {
          console.log("this.Module: ", this.Module);
          result = this.Module.ccall(functionName, "number", [], []);
        } else {
          result = this.Module.ccall(functionName, "number", ["string"], [getInfo]);
        }
        if (result == 1) {
          this.isModelLoaded = true;
          this.modelType = modelType;
        } else {
          // console.error("Error during model loading:", error);
          // return 0;
          // console.log("result: ", result);
        }
        return result;
      }
      return 1;
    } catch (error) {
      console.error("Error during model loading:", err);
      alert("Error during model loading:" + error);
      return result;
    }
  }

  ocr(imageData, width, height) {
    if (!this.isModelLoaded) {
      throw new Error("Model not loaded. Call loadModel first.");
    }

    const bufferSize = width * height * 4;
    this.buffer = this.Module._malloc(bufferSize);
    const inputBuffer = new Uint8Array(this.Module.HEAPU8.buffer, this.buffer, bufferSize);
    inputBuffer.set(imageData.data);

    const resultCharPtr = this.Module.ccall("mrz_read", "number", ["number", "number", "number"], [this.buffer, width, height]);

    const resultString = this.Module.UTF8ToString(resultCharPtr);
    this.Module._free(resultCharPtr);

    const result = {
      resultJSON: JSON.parse(resultString),
    };

    console.log("result: ", result);
    this.Module._free(this.buffer);
    return result;
  }

  crop(imageData, width, height, validCheckDt) {
    if (!this.isModelLoaded) {
      throw new Error("Model not loaded. Call loadModel first.");
    }
    console.log("crop 시작, validCheckDt: ", validCheckDt);
    // console.log("validCheckDt: ", validCheckDt);

    const bufferSize = width * height * 4;
    this.buffer = this.Module._malloc(bufferSize);
    const inputBuffer = new Uint8Array(this.Module.HEAPU8.buffer, this.buffer, bufferSize);
    inputBuffer.set(imageData.data);

    const resultCharPtr = this.Module.ccall(
      "processImage", // 호출할 함수 이름
      "number", // 반환 타입
      ["number", "number", "number", "number"], // 인자 타입 배열
      [this.buffer, width, height, validCheckDt ? 1 : 0] // 인자 값 배열
    );

    const resultString = this.Module.UTF8ToString(resultCharPtr);
    console.log("resultString: ", resultString);

    const resultJSON = JSON.parse(resultString);

    // resultCode가 "0"인 경우 "0000"으로 수정
    if (resultJSON.resultCode === 0) {
      resultJSON.resultCode = "0000";
    }

    const result = {
      resultJSON: resultJSON,
    };
    this.Module._free(this.buffer);
    return result;
  }

  unload() {
    if (this.Module) {
      this.Module._free(this.buffer);
      this.buffer = null;
      this.Module = null;
      this.isModelLoaded = false;
    }
  }
}

// export default OCRProcessor;
self.detectOCR = OCRProcessor;
