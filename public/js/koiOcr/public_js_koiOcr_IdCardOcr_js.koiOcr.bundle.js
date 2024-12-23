"use strict";
/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(self["webpackChunkkoiOcr"] = self["webpackChunkkoiOcr"] || []).push([["public_js_koiOcr_IdCardOcr_js"],{

/***/ "./public/js/koiOcr/IdCardOcr.js":
/*!***************************************!*\
  !*** ./public/js/koiOcr/IdCardOcr.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   IdCardOCRProcessor: () => (/* binding */ IdCardOCRProcessor)\n/* harmony export */ });\nObject(function webpackMissingModule() { var e = new Error(\"Cannot find module './koiOcr/idcard/Koi_IdCard.js'\"); e.code = 'MODULE_NOT_FOUND'; throw e; }());\n\nclass IdCardOCRProcessor {\n  constructor() {\n    this.Module = null;\n    this.buffer = null;\n    this.isModelLoaded = false;\n  }\n  async loadModel() {\n    try {\n      if (!this.isModelLoaded) {\n        // await import('./idcard/Koi_IdCard.js');\n        this.Module = await Object(function webpackMissingModule() { var e = new Error(\"Cannot find module './koiOcr/idcard/Koi_IdCard.js'\"); e.code = 'MODULE_NOT_FOUND'; throw e; }())();\n        if (!this.Module) {\n          console.error(\"Failed to load the module.\");\n          return 0;\n        }\n        const result = this.Module.ccall(\"loadONNXModel\", \"number\");\n        if (result == 1) {\n          this.isModelLoaded = true;\n        } else {\n          console.error(\"Model initialization failed.\");\n          return 0;\n        }\n      }\n      return 1;\n    } catch (error) {\n      console.error(\"Error during model loading:\", error);\n      alert(\"Error during model loading:\" + error);\n      return 0;\n    }\n  }\n  ocr(imageData, width, height) {\n    if (!this.isModelLoaded) {\n      throw new Error(\"Model not loaded. Call loadModel first.\");\n    }\n    const bufferSize = width * height * 4;\n    this.buffer = this.Module._malloc(bufferSize);\n    const inputBuffer = new Uint8Array(this.Module.HEAPU8.buffer, this.buffer, bufferSize);\n    inputBuffer.set(imageData.data);\n    const resultCharPtr = this.Module.ccall(\"detectObjectsWithONNX\", \"number\", [\"number\", \"number\", \"number\"], [this.buffer, width, height]);\n    const resultString = this.Module.UTF8ToString(resultCharPtr);\n    this.Module._free(resultCharPtr);\n    this.Module._free(this.buffer);\n    return JSON.parse(resultString);\n  }\n  unload() {\n    if (this.Module) {\n      this.Module._free(this.buffer);\n      this.buffer = null;\n      this.Module = null;\n      this.isModelLoaded = false;\n    }\n  }\n}\n\n// export default IdCardOCRProcessor;\n// self.IdCardOCRProcessor = IdCardOCRProcessor;\n\n\n//# sourceURL=webpack://koiOcr/./public/js/koiOcr/IdCardOcr.js?");

/***/ })

}]);