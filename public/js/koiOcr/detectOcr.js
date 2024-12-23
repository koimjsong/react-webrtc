class detectOCR {
  constructor() {
    this.Module = null;
    this.buffer = null;
    this.isModelLoaded = false;
  }

  async initModule(wasmDirectory, modelType) {
    if (this.modelType != modelType) {
      if (modelType == 1 || modelType == 11) {
        importScripts(`${wasmDirectory}idcard/Koi_idcardDt.js`);
        this.Module = await IdDetectModule({ wasmDirectory });
      } else if (modelType == 3) {
        importScripts(`${wasmDirectory}card/Koi_cardDt.js`);
        this.Module = await cardDetectModule({ wasmDirectory });
      } else if (modelType == 10) {
        importScripts(`${wasmDirectory}giro/Koi_giroDt.js`);
        this.Module = await giroDetectModule({ wasmDirectory });
      } else if (modelType == 16) {
        importScripts(`${wasmDirectory}crop/SegCrop.js`);
        this.Module = await segCropModule({ wasmDirectory });
      }
    }
  }

  async loadModel(modelType) {
    if (this.modelType == modelType && this.isModelLoaded) {
      return 1; // 이미 해당 모델이 로드됨
    }

    let functionName;
    let result;
    if (modelType == 1 || modelType == 11) {
      functionName = "loadONNXModel";
    } else if (modelType == 10) {
      functionName = "loadGiroModel";
    } else if (modelType == 3) {
      functionName = "loadcreditCardModel";
    } else if (modelType == 16) {
      functionName = "initializeModel";
    }

    try {
      if (modelType == 16) {
        result = this.Module.ccall(functionName, "number", [], []);
      } else {
        result = this.Module.ccall(functionName, "number");
      }
      if (result == 1) {
        this.isModelLoaded = true;
        this.modelType = modelType;
        return 1;
      } else {
        console.error("Model initialization failed.");
        return 0;
      }
    } catch (error) {
      console.error("Error during model loading:", error);
      this.Module = null; // 초기화 실패 시 메모리 할당 해제
      postMessage({ type: "unload" });
      return 0;
    }
  }

  detect(imageData, width, height) {
    if (!this.isModelLoaded) {
      throw new Error("Model not loaded. Call loadModel first.");
    }

    const bufferSize = width * height * 4;
    this.buffer = this.Module._malloc(bufferSize);
    const inputBuffer = new Uint8Array(this.Module.HEAPU8.buffer, this.buffer, bufferSize);
    inputBuffer.set(imageData.data);

    // Detect objects
    const detectObjectsResultPtr = this.Module.ccall("detectObjects", "number", ["number", "number", "number"], [this.buffer, width, height]);
    return detectObjectsResultPtr;
  }

  giroType(imageData, width, height) {
    if (!this.isModelLoaded) {
      throw new Error("Model not loaded. Call loadModel first.");
    }

    const bufferSize = width * height * 4;
    this.buffer = this.Module._malloc(bufferSize);
    const inputBuffer = new Uint8Array(this.Module.HEAPU8.buffer, this.buffer, bufferSize);
    inputBuffer.set(imageData.data);

    // Detect objects
    const detectObjectsResultPtr = this.Module.ccall("giroType", "number", ["number", "number", "number"], [this.buffer, width, height]);
    return detectObjectsResultPtr;
  }

  giroDetect(imageData, width, height) {
    if (!this.isModelLoaded) {
      throw new Error("Model not loaded. Call loadModel first.");
    }

    const bufferSize = width * height * 4;
    this.buffer = this.Module._malloc(bufferSize);
    const inputBuffer = new Uint8Array(this.Module.HEAPU8.buffer, this.buffer, bufferSize);
    inputBuffer.set(imageData.data);

    // Detect objects
    const detectObjectsResultPtr = this.Module.ccall("giroDetect", "number", ["number", "number", "number"], [this.buffer, width, height]);
    return detectObjectsResultPtr;
  }

  cardDetect(imageData, width, height) {
    if (!this.isModelLoaded) {
      throw new Error("Model not loaded. Call loadModel first.");
    }

    const bufferSize = width * height * 4;
    this.buffer = this.Module._malloc(bufferSize);
    const inputBuffer = new Uint8Array(this.Module.HEAPU8.buffer, this.buffer, bufferSize);
    inputBuffer.set(imageData.data);

    // Detect objects
    const detectObjectsResultPtr = this.Module.ccall("cardDetect", "number", ["number", "number", "number"], [this.buffer, width, height]);
    return detectObjectsResultPtr;
  }

  crop(imageData, width, height, validCheckDt) {
    if (!this.isModelLoaded) {
      throw new Error("Model not loaded. Call loadModel first.");
    }
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

    const resultJSON = JSON.parse(resultString);

    // resultCode가 "0"인 경우 "0000"으로 수정
    // if (resultJSON.resultCode === 0) {
    //   resultJSON.resultCode = "0000";
    // }

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
// export default IdDetectOCR;
self.detectOCR = detectOCR;
