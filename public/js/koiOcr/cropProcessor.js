class cropProcessor {
  constructor() {
    this.Module = null;
    this.buffer = null;
    this.isModelLoaded = false;
  }

  async initModule(wasmDirectory) {
    if (!this.Module) {
      importScripts(`${wasmDirectory}/SegCrop.js`);
      this.Module = await passportModule({ wasmDirectory });
      if (!this.Module) {
        console.error("Failed to load the module.");
        throw new Error("Failed to load the module.");
      }
    }
  }

  async loadModel(modelType) {
    if (this.modelType == modelType && this.isModelLoaded) {
      return 1; // 이미 해당 모델이 로드됨
    }

    try {
      const result = this.Module.ccall("initializeModel", "number");
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

    const resultCharPtr = this.Module.ccall("processImage", "number", ["number", "number", "number"], [this.buffer, width, height]);

    const resultString = this.Module.UTF8ToString(resultCharPtr);
    this.Module._free(resultCharPtr);

    const result = {
      resultJSON: JSON.parse(resultString),
    };

    console.log("result: ", result);
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

self.cropProcessor = cropProcessor;
