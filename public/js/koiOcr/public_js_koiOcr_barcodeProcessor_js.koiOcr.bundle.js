"use strict";
/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(self["webpackChunkkoiOcr"] = self["webpackChunkkoiOcr"] || []).push([["public_js_koiOcr_barcodeProcessor_js"],{

/***/ "./public/js/koiOcr/barcodeProcessor.js":
/*!**********************************************!*\
  !*** ./public/js/koiOcr/barcodeProcessor.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   Barcode: () => (/* binding */ Barcode)\n/* harmony export */ });\nObject(function webpackMissingModule() { var e = new Error(\"Cannot find module './barcode/Koi_Barcode.js'\"); e.code = 'MODULE_NOT_FOUND'; throw e; }());\n\nclass Barcode {\n  constructor() {\n    this.mod = null;\n    this.api = null;\n  }\n  initialize(config) {\n    return (async () => {\n      // Load WASM file\n      config || (config = {});\n      const directory = config.wasmDirectory || \"./\";\n      // this.mod = await CreateKoder({\n      //   locateFile: (file) => `${directory}/${file}`,\n      // });\n      this.mod = await Object(function webpackMissingModule() { var e = new Error(\"Cannot find module './barcode/Koi_Barcode.js'\"); e.code = 'MODULE_NOT_FOUND'; throw e; }())();\n\n      // Initialize a glue API object (between JavaScript and C++ code)\n      this.api = {\n        licenseCheck: this.mod.cwrap(\"licenseCheck\", \"number\", []),\n        createBuffer: this.mod.cwrap(\"createBuffer\", \"number\", [\"number\"]),\n        deleteBuffer: this.mod.cwrap(\"deleteBuffer\", \"\", [\"number\"]),\n        triggerDecode: this.mod.cwrap(\"triggerDecode\", \"number\", [\"number\", \"number\", \"number\"]),\n        getScanResults: this.mod.cwrap(\"getScanResults\", \"number\", []),\n        getResultType: this.mod.cwrap(\"getResultType\", \"number\", [])\n      };\n      const result = this.api.licenseCheck();\n      return result;\n      // return this;\n    })();\n  }\n  decode(imgData, width, height) {\n    const buffer = this.api.createBuffer(width * height * 4);\n    this.mod.HEAPU8.set(imgData, buffer);\n    const results = [];\n    const scanResult = this.api.triggerDecode(buffer, width, height);\n    if (scanResult > 0) {\n      const resultAddress = this.api.getScanResults();\n      const resultType = this.api.getResultType();\n      const code = this.mod.UTF8ToString(resultAddress);\n      const type = this.mod.UTF8ToString(resultType);\n\n      // Determine resultCode based on code and type\n      const resultCode = code == null || type == null ? \"1004\" : \"0000\";\n\n      // Construct the result JSON\n      const resultJson = {\n        resultJSON: {\n          resultCode: resultCode,\n          formResult: {\n            type: \"Bar/QR-Code\",\n            fieldResults: [{\n              fieldId: \"401\",\n              displayName: \"바코드 인식 값\",\n              value: code\n            }, {\n              fieldId: \"402\",\n              displayName: \"바코드 타입\",\n              value: type\n            }]\n          }\n        }\n      };\n      results.push(resultJson);\n\n      // Free memory\n      this.api.deleteBuffer(resultAddress);\n    }\n    if (results.length > 0) {\n      return results[0];\n    } else {\n      // Return NULL structure\n      return {\n        resultJSON: {\n          resultCode: \"1004\",\n          formResult: {\n            type: \"Bar/QR-Code\",\n            fieldResults: [{\n              fieldId: \"401\",\n              displayName: \"바코드 인식 값\",\n              value: null\n            }, {\n              fieldId: \"402\",\n              displayName: \"바코드 타입\",\n              value: null\n            }]\n          }\n        }\n      };\n    }\n  }\n}\n// export default Koder;\n\n\n//# sourceURL=webpack://koiOcr/./public/js/koiOcr/barcodeProcessor.js?");

/***/ })

}]);