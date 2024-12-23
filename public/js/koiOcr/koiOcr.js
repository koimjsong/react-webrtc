import { KOI_OCR_EVENT, OCR_TYPE, rtcType } from "../constants.js";
import * as koiUtils from "./koiutils.js";
import WebCamera from "./webCamera.js";

class KoiOcr extends EventTarget {
  _webCamera;
  _ocrWorker;
  _ocrProcessor;
  _IdCardOCRProcessor;
  _Barcode;
  _DocsAffine;
  _cropProcessor;
  _ocrType = OCR_TYPE.PASSPORT;
  _rtcType = rtcType.MANUAL;
  _options;
  _useWasmOcr;
  _useCapOcr;
  _useDetect;
  _points;
  _serverUrls = {};
  _isOcrRequestSent = false;
  _isProcessing = false;
  _isResultDispatched = false;
  _isPaused = false;
  _successCount = 0;
  _requestQueue = [];

  constructor(options) {
    super();
    this._webCamera = new WebCamera();
    this._initEventHandler();
    this.initialize();
  }

  async initialize() {
    try {
      this._getUsers = await this._webCamera.getUsers();
    } catch (err) {
      console.error("카메라 권한 허가 실패:", err);
    }
  }

  async init(options) {
    if (options.ocrWorkerJs && !this.ocrWorkerJs) {
      this._ocrWorker = new Worker(options.ocrWorkerJs);
    }

    const defaultOptions = {
      useWebCamera: true,
      cameraOptions: {},
      useWasmOcr: true,
      ocrType: OCR_TYPE.PASSPORT,
    };
    // 기본 옵션과 제공된 옵션을 병합하여 this._options 설정
    this._options = { ...defaultOptions, ...options };
    this._requestQueue = [];
    this._ocrType = this._options.ocrType;
    this._useWasmOcr = this._options.useWasmOcr;
    this._useDemo = this._options.useDemo;
    this._cameraOptions = this._options.cameraOptions;
    this._cameraOptions.useDemo = this._useDemo;
    this._useCapOcr = this._cameraOptions.useCapOcr;
    this._useDetect = this._cameraOptions.useDetect;
    this._iseDetectRetry = this._cameraOptions.detectRetry;
    this._webCamera.setOptions(this._cameraOptions, this._getUsers);
  }

  get useWebCamera() {
    return this._webCamera != null;
  }

  get useWasmOcr() {
    return this._ocrProcessor != null && this._IdCardOCRProcessor != null;
  }

  _initEventHandler() {
    if (this.useWebCamera) {
      this._webCamera.addEventListener("webcamready", (event) => {
        this.dispatchReadyEvent();
        // return KOI_OCR_EVENT.CAMERA_STARTED;
      });

      this._webCamera.addEventListener("imagecaptured", async (event) => {
        this.dispatchCaptureEvent();
        if (await this.processImage(event.detail)) {
          event.preventDefault();
        }
      });
    }

    document.addEventListener(
      "touchmove",
      function (event) {
        if (event.touches.length > 1 || (event.scale && event.scale !== 1)) return;
        if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
          event.preventDefault();
        }
      },
      { passive: false }
    );

    // fileUpload 이벤트 리스너 설정
    window.addEventListener("fileUpload", async (event) => {
      this.dispatchCaptureEvent();

      // startFile 메서드를 호출하여 event.detail을 전달
      if (this._webCamera && this._webCamera.startFile) {
        this._webCamera.startFile(event.detail);
      }
    });

    window.addEventListener("imageProcessed", async (event) => {
      this.dispatchCaptureEvent();
      const { imageData, imageWidth, imageHeight, totalCount, currentCount, ocrType, validCheckDt, rtcToken, detectTime } = event.detail;
      let eventType = "result";
      const eventDetail = {
        success: false,
        imageData,
        imageWidth,
        imageHeight,
        ocrResult: null,
        type: ocrType,
      };

      if (this._useDemo) {
        if (await this.sendToOcrWorkerDemo(imageData, eventDetail, totalCount, currentCount, ocrType, validCheckDt, rtcToken, detectTime)) {
          event.preventDefault();
        } // demo
      } else {
        if (await this.sendToOcrWorker(imageData, eventDetail, totalCount, currentCount, ocrType, validCheckDt, rtcToken, detectTime)) {
          event.preventDefault();
        }
      }
      this.dispatchEvent(new CustomEvent(eventType, { detail: eventDetail }));
      return eventType == KOI_OCR_EVENT.RESULT;
    });

    window.addEventListener("beforeunload", (event) => {
      // WebAssembly 모듈 초기화
      if (this.useWasmOcr) {
        this._ocrProcessor.unload();
        this._IdCardOCRProcessor.unload();
        this._DocsAffine.unload();
        this._Barcode.unload();
      }
    });
  }

  async processImage(data) {
    const { imageData, imageWidth, imageHeight, totalCount, currentCount, validCheckDt, rtcToken, resultCode, detectTime } = data;
    const eventDetail = {
      success: false,
      imageData,
      imageWidth,
      imageHeight,
      ocrResult: null,
    };

    try {
      let eventType;
      if (imageData && this._useCapOcr != 4) {
        eventType = await this.processOCR(imageData, imageWidth, imageHeight, eventDetail, totalCount, currentCount, this._ocrType, validCheckDt, rtcToken, resultCode, detectTime);
      } else {
        const result = null;
        eventType = await this.processOCRResult(result, eventDetail, totalCount, currentCount, imageData, validCheckDt, rtcToken, resultCode, detectTime);
      }

      this.dispatchEvent(new CustomEvent(eventType, { detail: eventDetail }));
      return eventType == KOI_OCR_EVENT.RESULT;
    } catch (error) {
      console.error("Error processing image:", error.message);
      // 적절한 에러 처리 추가
    }
  }

  async processOCR(imageData, imageWidth, imageHeight, eventDetail, totalCount, currentCount, ocrType, validCheckDt, rtcToken, resultCode, detectTime) {
    // const methodValue = document.getElementById("methodId").value;
    if (this._useDetect && this._ocrType == 1 && !this._useDemo) {
      // 탐지(WASM) -> 인식(서버)
      return await this.sendToOcrWorker(imageData, eventDetail, totalCount, currentCount, ocrType, validCheckDt, rtcToken, detectTime);
    } else if (this._useWasmOcr && !this._useDemo) {
      // WASM
      return await this.processWasm(imageData, imageWidth, imageHeight, eventDetail, totalCount, currentCount, ocrType, validCheckDt, rtcToken, resultCode, detectTime);
    } else if (this._useDemo) {
      if (this._useWasmOcr) {
        return await this.processWasm(imageData, imageWidth, imageHeight, eventDetail, totalCount, currentCount, ocrType, validCheckDt, rtcToken, resultCode, detectTime);
      } else {
        if (methodValue == "0014") {
          return await this.sendToImgDemo(imageData, eventDetail, totalCount, currentCount, ocrType, validCheckDt, rtcToken);
        } else {
          return await this.sendToOcrWorkerDemo(imageData, eventDetail, totalCount, currentCount, ocrType, validCheckDt, rtcToken, resultCode, detectTime);
        }
      }
    } else {
      // WASM 아닌 경우
      return await this.sendToOcrWorker(imageData, eventDetail, totalCount, currentCount, ocrType, validCheckDt, detectTime);
    }
  }

  async processWasm(imageData, imageWidth, imageHeight, eventDetail, totalCount, currentCount, ocrType, validCheckDt, rtcToken, resultCode, detectTime) {
    let result = null;
    try {
      if (ocrType == 2) {
        // 여권
        return await this.sendToWasmWorker(imageData, eventDetail, totalCount, currentCount, ocrType, validCheckDt);
      } else if (ocrType == 4) {
        // 바코드
        result = this._Barcode.decode(imageData.data, imageWidth, imageHeight);
      } else if (ocrType == 1) {
        // 신분증
        result = this._IdCardOCRProcessor.ocr(imageData, imageWidth, imageHeight);
      } else if (ocrType == 7) {
        // 문서 crop
        result = await this.processDocumentAffine(imageData, eventDetail, imageWidth, imageHeight);
      } else if (ocrType == 16) {
        // console.log("eventDetail: ", eventDetail);
        // result = await this.sendToResultDemo(imageData, eventDetail, totalCount, currentCount, ocrType, validCheckDt, rtcToken, resultCode, detectTime);
      }
    } catch (error) {
      console.error("Error:", error.message);
      alert("Error:" + error.message);
      // OCR 실패 시에 대한 처리 추가
    }
    return this.processOCRResult(result, eventDetail, totalCount, currentCount, imageData, validCheckDt, rtcToken, resultCode, detectTime);
  }

  async sendToWasmWorker(imageData, eventDetail, totalCount, currentCount, ocrType, validCheckDt) {
    // 워커 종료 상태 초기화
    if (!this._wasmWorker) {
      console.log("워커가 초기화되지 않았습니다.");
      return;
    }
    // 현재 요청을 큐에 추가
    this._requestQueue.push({ imageData, eventDetail, totalCount, currentCount, ocrType, validCheckDt });
    // 현재 요청이 처리 중이지 않으면 다음 요청을 처리
    if (!this._isProcessing) {
      await this.processQueue(); // 큐 처리 시작
    }
  }

  async processQueue() {
    // 큐가 비어있지 않을 때까지 반복
    while (this._requestQueue.length > 0) {
      this._isProcessing = true; // 처리 중 상태로 설정
      // const { imageData, eventDetail, totalCount, currentCount, ocrType, validCheckDt } = this._requestQueue.shift();
      this._currentRequest = this._requestQueue.shift();
      const { imageData, ocrType, validCheckDt } = this._currentRequest;

      const result = await this.processRequest(imageData, ocrType, validCheckDt);
      this.handleResult(result); // 결과 처리
    }

    this._isProcessing = false; // 큐가 비었으므로 처리 종료
    this._currentRequest = null;
  }

  processRequest(imageData, ocrType, validCheckDt) {
    return new Promise((resolve, reject) => {
      if (this._wasmWorker) {
        if (this._isResultDispatched) {
          resolve(null);
          return;
        }

        this._wasmWorker.postMessage({
          type: "detect",
          imageData: imageData,
          width: imageData.width,
          height: imageData.height,
          ocrType: ocrType,
          validCheckDt: validCheckDt,
        });
        this._wasmWorker.onmessage = (e) => {
          if (e.data.type == "detectResult") {
            e.data.ocrResult = {
              resultJSON: e.data.result.resultJSON,
            };
            e.data.imageData = imageData;

            if (e.data.ocrResult.resultJSON.resultCode == "0000") {
              this._successCount++;
              if (!this._isResultDispatched) {
                if (this._successCount >= 1 || validCheckDt) {
                  e.data.success = true;
                  this.dispatchResultEvent(e.data);
                  this._isResultDispatched = true;
                  this._isProcessing = false;
                  this._requestQueue = [];
                }
              }
            } else {
              resolve(e.data.ocrResult);
              this.dispatchCropEvent(e.data);
            }
          } else {
            reject(new Error("Unexpected message type"));
          }
        };
      } else {
        resolve(null);
      }
    });
  }

  handleWorkerMessage(event) {
    // 워커로부터 메시지를 처리하는 로직
    console.log("워커로부터 메시지를 받았습니다:", event.data);
  }

  handleResult(result) {
    // 결과 처리 로직
    if (result) {
      // 처리할 로직
    }
  }

  async processWasmDemo(imageData, imageWidth, imageHeight, eventDetail, totalCount, currentCount, ocrType) {
    let result = null;
    try {
      if (ocrType == 2) {
        // 여권
        result = await this.sendToWasmWorker(imageData, eventDetail, totalCount, currentCount, ocrType);
      } else if (ocrType == 4) {
        // 바코드
        result = this._Barcode.decode(imageData.data, imageWidth, imageHeight);
      } else if (ocrType == 1) {
        // 신분증
        result = this._IdCardOCRProcessor.ocr(imageData, imageWidth, imageHeight);
      } else if (ocrType == 7) {
        // 문서 crop
        result = await this.processDocumentAffine(imageData, eventDetail, imageWidth, imageHeight);
      }
    } catch (error) {
      console.error("Error:", error.message);
      alert("Error:" + error.message);
      // OCR 실패 시에 대한 처리 추가
    }
    const canvas = document.createElement("canvas");
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const context = canvas.getContext("2d");
    context.putImageData(imageData, 0, 0);

    const base64Data = canvas.toDataURL("image/jpeg").split(",")[1];
    const messageData = {
      imageData: {
        srcFile: base64Data,
      },
      resultJSON: result,
      // imageDiv: someImageDiv, // 필요한 경우에 맞게 설정
      // methodValue: someMethodValue, // 필요한 경우에 맞게 설정
    };
    window.opener.postMessage(JSON.stringify(messageData), "*");
    // window.close();
    // return this.processOCRResult(result, eventDetail, totalCount, currentCount, imageData);
  }

  async sendToOcrWorker(imageData, eventDetail, totalCount, currentCount, ocrType, validCheckDt, rtcToken, detectTime) {
    // const startTime = getCurrentTimeWithMilliseconds();
    // eventDetail.startTime = startTime;
    const result = await new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      let base64Data = null;
      if (imageData instanceof ImageData) {
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const context = canvas.getContext("2d");
        context.putImageData(imageData, 0, 0);
        base64Data = canvas.toDataURL("image/jpeg").split(",")[1];
      } else {
        // 이미 base64 형식이면 그대로 사용
        base64Data = imageData.split(",")[1];
      }

      const fileData = koiUtils.base64toBlob(base64Data, "image/jpeg");
      const fileSizeInBytes = fileData.size; // 파일 크기를 바이트 단위로 가져옴
      const fileSizeInKB = (fileSizeInBytes / 1024).toFixed(2); // KB 단위로 변환하고 소수점 두 자리까지 출력

      // 이미지의 width와 height를 확인

      const imageWidth = imageData.width;
      const imageHeight = imageData.height;

      // console.log(`File size: ${fileSizeInKB} KB`);
      // console.log(`Image dimensions: ${imageWidth} x ${imageHeight}`);
      // alert(`File size: ${fileSizeInKB} KB\nImage width: ${imageWidth}, Image height: ${imageHeight}`);

      if (this._ocrWorker && !this._isOcrRequestSent) {
        this._isOcrRequestSent = true;
        this._ocrWorker.postMessage({ ocrType, base64Data, validCheck: validCheckDt });

        this._ocrWorker.onmessage = (e) => {
          if (e.data.type == "ocrResult") {
            const ocrResult = e.data.message;
            // const endTime = getCurrentTimeWithMilliseconds();
            // eventDetail.endTime = endTime;
            eventDetail.ocrType = ocrType;
            resolve(ocrResult); // Resolve the promise with the OCR result

            this._isOcrRequestSent = false; // Set the flag to true to indicate the request has been sent
          }
        };
      } else {
        resolve(null); // Resolve with null if the worker is not available or request is already sent
      }
    });
    // const endTime = getCurrentTimeWithMilliseconds();
    // eventDetail.endTime = endTime;
    return this.processOCRResult(result, eventDetail, totalCount, currentCount, imageData, validCheckDt, rtcToken, detectTime);
  }

  // 시연 서버 요청
  async sendToOcrWorkerDemo(imageData, eventDetail, totalCount, currentCount, ocrType, validCheckDt, rtcToken, resultCode, detectTime) {
    const result = await new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      let base64Data = null;
      if (imageData instanceof ImageData) {
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const context = canvas.getContext("2d");
        context.putImageData(imageData, 0, 0);
        base64Data = canvas.toDataURL("image/jpeg");
      } else {
        // 이미 base64 형식이면 그대로 사용
        // base64Data = imageData.split(",")[1];
        base64Data = imageData;
      }

      const methodValue = document.getElementById("methodId").value;
      const typeValue = document.getElementById("typeId").value;
      const licenseKey = document.getElementById("licenseKey").value;
      const rtcLicenseKey = rtcToken;
      var formData = new FormData();
      let validCheck = validCheckDt;
      let maskOption = true;

      const fileName = koiUtils.generateFileName(); // 기본값으로 호출 (prefix "rtc_", extension ".jpg")
      formData.append("file", dataURLtoBlob(base64Data), fileName);

      formData.append("maskOption", maskOption);
      formData.append("validCheck", validCheck);
      formData.append("ocrType", typeValue);
      formData.append("method", methodValue);
      formData.append("licenseKey", licenseKey);
      formData.append("rtcTransId", rtcLicenseKey);

      const requestUrl = "/ocr-api/request";

      koi.Ajax.fnOcrFileAjax(requestUrl, formData, function (data) {
        if (data) {
          const ocrResult = {
            resultJSON: data.resultData,
          };
          eventDetail.ocrType = ocrType;
          resolve(ocrResult);
        } else {
          resolve(null);
        }
      });
    });
    return this.processOCRResult(result, eventDetail, totalCount, currentCount, imageData, validCheckDt, rtcToken, resultCode, detectTime);
  }

  async sendToResultDemo(imageData, eventDetail, totalCount, currentCount, ocrType, validCheckDt, rtcToken, resultCode, detectTime) {
    const result = await new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const context = canvas.getContext("2d");
      context.putImageData(imageData, 0, 0);
      const base64Data = canvas.toDataURL("image/jpeg");

      const methodValue = document.getElementById("methodId").value;
      const typeValue = document.getElementById("typeId").value;
      const licenseKey = document.getElementById("licenseKey").value;
      const rtcLicenseKey = rtcToken;
      const resultData = resultCode;
      var formData = new FormData();
      let validCheck = validCheckDt;
      let maskOption = true;

      const fileName = koiUtils.generateFileName(); // 기본값으로 호출 (prefix "rtc_", extension ".jpg")
      formData.append("file", dataURLtoBlob(base64Data), fileName);

      formData.append("maskOption", maskOption);
      formData.append("validCheck", validCheck);
      formData.append("type", typeValue);
      formData.append("method", methodValue);
      formData.append("licenseKey", licenseKey);
      formData.append("rtcTransId", rtcLicenseKey);
      formData.append("result", resultData);

      const requestUrl = "/ocr-api/result";

      koi.Ajax.fnOcrResultAjax(requestUrl, formData);
    });
    return this.processOCRResult(result, eventDetail, totalCount, currentCount, imageData, validCheckDt, rtcToken, resultCode, detectTime);
  }

  async sendToImgDemo(imageData, eventDetail, totalCount, currentCount, ocrType) {
    const result = await new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const context = canvas.getContext("2d");
      context.putImageData(imageData, 0, 0);

      const imageDivision = document.getElementById("imageDiv").value;
      const methodValue = document.getElementById("methodId").value;
      const base64Data = canvas.toDataURL("image/png").split(",")[1];
      const base64DataURL = canvas.toDataURL("image/png");

      //const base64Data = JSON.stringify({ srcFile: base64String });
      // console.log("base64Data: ", base64Data);

      const validCheck = currentCount < totalCount;

      const messageData = {
        imageData: {
          srcFile: base64DataURL,
        },
        imageDiv: imageDivision,
        methodValue: methodValue,
        validCheck: validCheck,
      };
      window.opener.postMessage(JSON.stringify(messageData), "*");
      window.close();
    });
    // return this.processOCRResult(result, eventDetail, totalCount, currentCount, imageData);
  }

  async processDocumentAffine(imageData, eventDetail, imageWidth, imageHeight) {
    return new Promise((resolve, reject) => {
      const resultPoints = this._DocsAffine.getPoints(imageData, imageWidth, imageHeight);
      let points = [];
      points = resultPoints.resultJSON.points;
      this._points = points;

      // this._points 배열에서 -1이 있는지 확인
      const hasNegativeOne = this._points.some((point) => point.x == -1 || point.y == -1);
      if (!hasNegativeOne) {
        const kwcGuideArea = document.getElementById("kwcGuideArea");
        kwcGuideArea.style.border = "0px";
        const guideAreaRect = kwcGuideArea.getBoundingClientRect();
        kwcGuideArea.style.zIndex = "10002";
        const modal = document.createElement("div");
        modal.classList.add("affineDiv");
        modal.style.display = "flex";
        modal.style.justifyContent = "center";
        modal.style.width = "100%";
        modal.style.height = "100%";
        modal.style.alignItems = "center";

        const modalContent = document.createElement("modalContent");
        modalContent.classList.add("affineContent");
        modal.appendChild(modalContent);
        kwcGuideArea.appendChild(modal);

        const canvas = document.createElement("canvas");
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const context = canvas.getContext("2d");
        context.putImageData(imageData, 0, 0);
        const guideImage = document.createElement("img");
        guideImage.id = "guideImage";
        const imageDataURL = canvas.toDataURL("image/jpeg");
        guideImage.src = imageDataURL;
        modalContent.appendChild(guideImage);

        guideImage.style.width = "100%";
        guideImage.style.height = "100%";

        const radius = 10; // 포인트의 반지름을 설정합니다.

        let affinePoints = [];

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", modalContent.clientWidth);
        svg.setAttribute("height", modalContent.clientHeight);
        svg.style.position = "absolute";
        svg.style.top = "0";
        svg.style.left = "0";
        svg.style.zIndex = "10020";
        svg.style.width = "100%";
        svg.style.height = "100%";
        modalContent.appendChild(svg);

        const innerCircles = [];
        const lines = [];

        for (let i = 0; i < this._points.length; i++) {
          const point = this._points[i];
          const x = point.x;
          const y = point.y;

          const relativeX = koiUtils.canvasX(x, guideAreaRect, imageData, radius);
          const relativeY = koiUtils.canvasY(y, guideAreaRect, imageData, radius);

          affinePoints.push({ x: relativeX, y: relativeY });

          const pointDiv = document.createElement("div");
          pointDiv.className = "point-div point-div" + (i + 1);
          pointDiv.style.position = "absolute";
          pointDiv.style.width = "25px";
          pointDiv.style.height = "25px";
          pointDiv.style.backgroundColor = "rgb(52 152 219 / 28%)";
          pointDiv.style.borderRadius = "50%";
          pointDiv.style.zIndex = "10040";
          pointDiv.style.border = "2px solid var(--line-border-fill)";

          pointDiv.style.left = `${relativeX}px`;
          pointDiv.style.top = `${relativeY}px`;

          const innerCircle = document.createElement("div");
          innerCircle.style.position = "absolute";
          innerCircle.style.width = "4px";
          innerCircle.style.height = "4px";
          innerCircle.style.backgroundColor = "#3498db";
          innerCircle.style.borderRadius = "50%";

          // Adjusting innerCircle position to center it within pointDiv
          innerCircle.style.left = "50%";
          innerCircle.style.top = "50%";
          innerCircle.style.transform = "translate(-50%, -50%)";

          // pointDiv.appendChild(innerCircle);
          modalContent.appendChild(pointDiv);

          innerCircles.push({
            x: relativeX + 12.5, // Offset to the center of pointDiv
            y: relativeY + 12.5,
            div: pointDiv, // Store the pointDiv reference
          });

          // 터치 이벤트 등록
          pointDiv.addEventListener("touchstart", koiUtils.handleTouchStart(i, pointDiv, affinePoints, x, y), { passive: true });
          pointDiv.addEventListener("touchmove", koiUtils.handleTouchMove(pointDiv, affinePoints, innerCircles, lines), { passive: true });
          pointDiv.addEventListener("touchend", koiUtils.handleTouchEnd, { passive: true });
        }

        for (let i = 0; i < innerCircles.length; i++) {
          const start = innerCircles[i];
          const end = innerCircles[(i + 1) % innerCircles.length]; // Connect the last point to the first point
          const line = koiUtils.createLine(start.x, start.y, end.x, end.y);
          lines.push(line);
          svg.appendChild(line);
        }

        const containerId = this._cameraOptions.containerId;
        const container = document.querySelector(containerId);
        const pointerBtn = document.createElement("button");
        pointerBtn.id = "pointerBtn";
        pointerBtn.setAttribute("class", "cropButton");
        pointerBtn.innerText = "SAVE";
        container.appendChild(pointerBtn);
        pointerBtn.style.display = "block";

        pointerBtn.onclick = () => this.handlePointerBtnClick(affinePoints, guideAreaRect, imageData, radius, eventDetail, resolve, pointerBtn);
      } else {
        const result = null;
        resolve(result);
      }
    });
  }

  async handlePointerBtnClick(affinePoints, guideAreaRect, imageData, radius, eventDetail, resolve, pointerBtn) {
    let originalPoints = [];

    for (let i = 0; i < affinePoints.length; i++) {
      const affinePoint = affinePoints[i];
      const originalX = koiUtils.reverseCanvasX(affinePoint.x, guideAreaRect, imageData, radius);
      const originalY = koiUtils.reverseCanvasY(affinePoint.y, guideAreaRect, imageData, radius);
      originalPoints.push({ x: originalX, y: originalY });
    }

    const sortedPoints = koiUtils.sortPoints(originalPoints);
    const result = this._DocsAffine.getAffine(imageData, imageData.width, imageData.height, sortedPoints);

    resolve(result);
    const base64Data = result.resultJSON.base64image;
    if (eventDetail) {
      eventDetail.base64Data = base64Data;
    } else {
      console.error("eventDetail is undefined");
    }
    pointerBtn.style.display = "none";
  }

  async processOCRResult(result, eventDetail, totalCount, currentCount, imageData, validCheckDt, rtcToken, resultCode, detectTime) {
    if (!result && this._ocrType !== 16) {
      console.warn("result 없음");
      if (currentCount >= totalCount) {
        eventDetail.success = false;
        return KOI_OCR_EVENT.RESULT;
      }
    }

    // currentCount가 totalCount에 도달했을 때 처리 - 마지막 시도
    if (currentCount >= totalCount) {
      // this._webCamera.stop();
      eventDetail.detectTime = detectTime;
      eventDetail.validCheckDt = validCheckDt;
      eventDetail.rtcToken = rtcToken;
      // OCR 결과 설정
      if (this._ocrType == 16) {
        eventDetail.ocrResult = result || resultCode;
      } else {
        eventDetail.ocrResult = result;
      }

      // 성공 여부 판단
      const isSuccess = (this._ocrType === 16 && eventDetail.ocrResult.resultJSON.resultCode == "0000") || (this._ocrType !== 16 && eventDetail.ocrResult.resultJSON.resultCode == "0000");

      eventDetail.success = isSuccess;

      // 특정 OCR 타입이나 재시도 경우에 대한 진행 상황 반환
      // if (this._ocrType === 7 || this._iseDetectRetry) {
      //   return KOI_OCR_EVENT.PROGRESS;
      // }

      return KOI_OCR_EVENT.RESULT;
    }

    // result가 존재하고, 정상 처리된 경우
    // if (result) {
    if (result && result.resultJSON && result.resultJSON.resultCode == "0000") {
      eventDetail.ocrResult = result;
      eventDetail.detectTime = detectTime;
      // this._webCamera.stop();
      eventDetail.success = true;

      if (result.resultJSON.formResult && result.resultJSON.formResult.cropImage) {
        eventDetail.base64Data = result.resultJSON.formResult.cropImage;
      }

      return KOI_OCR_EVENT.RESULT;
    } else {
      if (result && result.resultJSON.resultCode == "1004") {
        // this._webCamera.stop();
        eventDetail.detectTime = detectTime;
        eventDetail.validCheckDt = validCheckDt;
        eventDetail.rtcToken = rtcToken;

        eventDetail.ocrResult = result;

        const isSuccess = (this._ocrType === 16 && eventDetail.ocrResult.resultJSON.resultCode == "0000") || (this._ocrType !== 16 && eventDetail.ocrResult.resultJSON.resultCode == "0000");

        eventDetail.success = isSuccess;

        return KOI_OCR_EVENT.RESULT;
      }
    }

    // resultCode가 존재하고 정상적인 결과일 때 처리 - 문서 crop
    if (resultCode.resultJSON.resultCode == "0000" && this._ocrType == 16) {
      eventDetail.ocrResult = result || resultCode;
      eventDetail.detectTime = detectTime;
      eventDetail.validCheckDt = validCheckDt;
      eventDetail.rtcToken = rtcToken;
      eventDetail.success = true;
      return KOI_OCR_EVENT.RESULT;
    }
    // }
    // 그 외의 경우 OCR 진행 중 이벤트는 따로 처리할 수 있도록 주석 처리
    // return KOI_OCR_EVENT.PROGRESS;
  }

  async runCamera() {
    if (this.useWebCamera) {
      this._stopOcr = false; // Reset the flag before starting OCR
      this._webCamera.start(); // Pass the flag to stop OCR
      this._isResultDispatched = false;
      this._isProcessing = false;
      // this.dispatchEvent(new Event(KOI_OCR_EVENT.CAMERA_STARTED));
      // return KOI_OCR_EVENT.CAMERA_STARTED;
    } else {
      throw new Error("WebCamera disabled.");
    }
  }

  // startCamera() {
  //   if (this.useWebCamera) {
  //     this._webCamera.start();
  //   }
  // }

  stopCamera() {
    if (this.useWebCamera) {
      this._webCamera.stop();
    } else {
      throw new Error("WebCamera disabled.");
    }
  }
  async stopWorker() {
    if (this._wasmWorker) {
      this._wasmWorker.terminate(); // 워커 종료
      // this._wasmWorker = null; // 워커 참조를 null로 설정
    }
  }

  dispatchReadyEvent() {
    this.dispatchEvent(new Event(KOI_OCR_EVENT.READY));
  }

  dispatchCameraEvent() {
    this.dispatchEvent(new Event(KOI_OCR_EVENT.CAMERA_STARTED));
  }

  dispatchCaptureEvent() {
    this.dispatchEvent(new Event(KOI_OCR_EVENT.CAPTURE));
  }

  dispatchResultEvent(e) {
    // this.dispatchEvent(new CustomEvent(KOI_OCR_EVENT.RESULT));
    const event = new CustomEvent(KOI_OCR_EVENT.RESULT, {
      detail: e, // cropData에 원하는 데이터를 포함할 수 있음
      // imageData: imageData,
    });
    this.dispatchEvent(event);
  }

  async startWasmWorker(ocrType) {
    // 새 워커 인스턴스를 생성
    this._wasmWorker = new Worker("js/koiOcr/wasmWorker.js");

    // 현재 페이지 URL을 워커로 전달
    const getInfo = window.location.href;
    this._wasmWorker.postMessage({ type: "getInfo", info: getInfo });

    // OCR 타입을 워커로 전달하여 초기화 요청
    this._wasmWorker.postMessage({ type: "init", ocrType: ocrType });

    // 워커의 초기화 결과를 기다림
    const loadModelResult = await new Promise((resolve) => {
      this._wasmWorker.onmessage = (e) => {
        if (e.data.type === "initComplete") {
          // 초기화 성공 시 결과 반환
          resolve(e.data.result);
        } else if (e.data.type === "initFailed") {
          // 초기화 실패 시 결과 반환
          resolve(e.data.result);
        }
      };
    });

    return loadModelResult;
  }

  async changeOcrType(ocrType) {
    if (ocrType == undefined) {
      return;
    }

    this._ocrType = null;
    if (this._ocrType == ocrType) {
      return;
    }

    const options = this._options;

    let loadModelResult = 1;
    if (this._options.useWasmOcr) {
      if (ocrType == 2) {
        const { DocsAffine } = await import("./affineProcessor.js");
        this._DocsAffine = new DocsAffine();
        loadModelResult = await this._DocsAffine.loadModel({
          wasmDirectory: "./js/affine/",
        });
        this._wasmWorker = new Worker("js/koiOcr/wasmWorker.js"); // 워커 띄울때 url 전달
        const getInfo = window.location.href;
        this._wasmWorker.postMessage({ type: "getInfo", info: getInfo });
        this._wasmWorker.postMessage({ type: "init", ocrType: ocrType });

        loadModelResult = await new Promise((resolve) => {
          this._wasmWorker.onmessage = (e) => {
            if (e.data.type == "initComplete") {
              resolve(e.data.result);
            } else if (e.data.type == "initFailed") {
              resolve(e.data.result);
            }
          };
        });
        if (loadModelResult == 1) {
          if (this.useWebCamera) {
            await this._webCamera.changeOcrType(ocrType);
          }
        } else {
          const error = {
            code: loadModelResult,
            message: koiUtils.getErrorMessage(loadModelResult),
          };
          throw new Error(JSON.stringify(error));
        }
      } else if (ocrType == 1 && !this._useDetect && !this._IdCardOCRProcessor) {
        const { IdCardOCRProcessor } = await import("./IdCardOcr.js");
        this._IdCardOCRProcessor = new IdCardOCRProcessor();
        loadModelResult = await this._IdCardOCRProcessor.loadModel({
          wasmDirectory: "./js/idcard/",
        });

        if (loadModelResult == 1) {
          if (this.useWebCamera) {
            await this._webCamera.changeOcrType(ocrType);
          }
        } else {
          this._IdCardOCRProcessor.unload();
          this._IdCardOCRProcessor = null;
        }
      } else if (ocrType == 4 && !this._Barcode) {
        const { Barcode } = await import("./barcodeProcessor.js");
        this._Barcode = new Barcode();
        loadModelResult = await this._Barcode.initialize({
          wasmDirectory: "./js/barcode/",
        });
        if (loadModelResult == 1) {
          if (this.useWebCamera) {
            await this._webCamera.changeOcrType(ocrType);
          }
        } else {
          this._Barcode = null;
        }
      } else if ((ocrType == 7 || ocrType == 16) && !this._DocsAffine) {
        const { DocsAffine } = await import("./affineProcessor.js");
        this._DocsAffine = new DocsAffine();
        loadModelResult = await this._DocsAffine.loadModel({
          wasmDirectory: "./js/affine/",
          // wasmDirectory: "/affine/", // demo
        });

        if (loadModelResult == 1) {
          if (this.useWebCamera) {
            await this._webCamera.changeOcrType(ocrType);
          }
        } else {
          this._DocsAffine = null;
        }
      }
    } else {
      if (this.useWebCamera) {
        await this._webCamera.changeOcrType(ocrType);
      }
    }

    if (this.useWebCamera && ocrType == 16) {
      await this._webCamera.changeOcrType(ocrType);
    }

    if (loadModelResult != 1) {
      const error = {
        code: loadModelResult,
        message: koiUtils.getErrorMessage(loadModelResult),
      };
      throw new Error(JSON.stringify(error));
    }

    this._ocrType = ocrType;
  }
}

export { KoiOcr as default, KOI_OCR_EVENT, OCR_TYPE, rtcType };
