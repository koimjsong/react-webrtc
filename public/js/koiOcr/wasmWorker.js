importScripts("./ocrProcessor.js");

let ocrProcessor = null;
let isModelLoaded = false;
let previousDetectResultCode = null;
let detectCount = 0;
let getInfo = null;
let detectResult = null;
let shouldStop = false;
let isProcessing = true;

async function initializeModel(modelType) {
  if (!ocrProcessor) {
    ocrProcessor = new OCRProcessor();
  }
  let loadModelResult;
  // wasm에서 emscripten_run_script_string 대신에 url 전달하는 함수로 변경
  try {
    await ocrProcessor.initModule(modelType);
    loadModelResult = await ocrProcessor.loadModel(modelType, getInfo);
    if (loadModelResult == 1) {
      isModelLoaded = true;
      postMessage({ type: "initComplete", result: loadModelResult });
    } else {
      postMessage({ type: "initFailed", result: loadModelResult });
    }
  } catch (error) {
    postMessage({ type: "initFailed", result: loadModelResult });
  }
}

self.onmessage = async (event) => {
  if (event.data.type == "getInfo") {
    getInfo = event.data.info;
  }

  if (event.data.type == "init") {
    ocrType = event.data.ocrType;
    await initializeModel(ocrType);
  }

  if (event.data.type == "pause") {
    console.log("워커 중단");
    // 처리 중인 작업을 일시 중단
    // 예를 들어, 현재 작업을 종료하고 상태를 저장
    return;
  }

  console.log("isModelLoaded : ", isModelLoaded);
  if (event.data.type == "detect" && isModelLoaded) {
    const { imageData, width, height, ocrType, validCheckDt } = event.data;
    console.log("posstMessage 전달받음, validCheckDt: ", validCheckDt);

    let detectResultCode;

    if (ocrType == 10) {
      detectResultCode = ocrProcessor.giroDetect(imageData, width, height);
    } else if (ocrType == 2) {
      detectResult = ocrProcessor.ocr(imageData, width, height);
    } else if (ocrType == 16) {
      detectResult = await ocrProcessor.crop(imageData, width, height, validCheckDt);
    } else {
      detectResultCode = ocrProcessor.detect(imageData, width, height);
    }
    console.log("detectResult: ", detectResult);
    // detectResultCode = detectResult.resultJSON.resultCode;
    // if (detectResultCode == "0000") {
    //   detectCount++;
    // } else {
    //   detectCount = 0;
    // }
    // if (detectCount >= 0) {
    //   postMessage({ type: "detectResult", result: detectResult });
    // }
    postMessage({ type: "detectResult", result: detectResult });
  } else if (event.data.type === "stop") {
    console.log("워커 stop");
    shouldStop = true; // 중단 요청을 받으면 플래그 설정
  }
};
