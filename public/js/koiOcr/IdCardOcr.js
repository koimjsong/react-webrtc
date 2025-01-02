import  IdCardModule from './idcard/Koi_IdCard.js'
class IdCardOCRProcessor {
  constructor() {
    this.Module = null;
    this.buffer = null;
    this.isModelLoaded = false;
  }

  async loadModel() {
    try {
      if (!this.isModelLoaded) {
        // await import('./idcard/Koi_IdCard.js');
        this.Module = await IdCardModule();

        if (!this.Module) {
          console.error("Failed to load the module.");
          return 0;
        }

        const result = this.Module.ccall("loadONNXModel", "number");

        if (result == 1) {
          this.isModelLoaded = true;
        } else {
          console.error("Model initialization failed.");
          return 0;
        }
      }
      return 1;
    } catch (error) {
      console.error("Error during model loading:", error);
      alert("Error during model loading:" + error);
      return 0;
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

    const resultCharPtr = this.Module.ccall("detectObjectsWithONNX", "number", ["number", "number", "number"], [this.buffer, width, height]);

    const resultString = this.Module.UTF8ToString(resultCharPtr);
    this.Module._free(resultCharPtr);
    this.Module._free(this.buffer);
    return JSON.parse(resultString);
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

// export default IdCardOCRProcessor;
// self.IdCardOCRProcessor = IdCardOCRProcessor;
export {IdCardOCRProcessor};
