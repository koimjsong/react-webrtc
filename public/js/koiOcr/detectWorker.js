importScripts("./detectOcr.js");

let detectOcr = null;
let isModelLoaded = false;
let previousDetectResultCode = null;
let detectCount = 0;
let detectResultCode = -1;
let previousPoints = null;
let currentPoints = null;
let iou = null;

async function initializeModel(modelType) {
  if (!detectOcr) {
    detectOcr = new detectOCR();
  }

  try {
    await detectOcr.initModule("./detect/", modelType);
    const loadModelResult = await detectOcr.loadModel(modelType);
    if (loadModelResult == 1) {
      isModelLoaded = true;
      postMessage({ type: "initComplete" });
    } else {
      postMessage({ type: "initFailed" });
    }
  } catch (error) {
    postMessage({ type: "initFailed" });
  }
}

function calculateIOU(points1, points2) {
  // 사각형의 경계를 구하기 위해 각 사각형의 최소/최대 x, y 좌표를 계산
  const rect1 = {
    xMin: Math.min(points1[0].x, points1[1].x, points1[2].x, points1[3].x),
    xMax: Math.max(points1[0].x, points1[1].x, points1[2].x, points1[3].x),
    yMin: Math.min(points1[0].y, points1[1].y, points1[2].y, points1[3].y),
    yMax: Math.max(points1[0].y, points1[1].y, points1[2].y, points1[3].y),
  };

  const rect2 = {
    xMin: Math.min(points2[0].x, points2[1].x, points2[2].x, points2[3].x),
    xMax: Math.max(points2[0].x, points2[1].x, points2[2].x, points2[3].x),
    yMin: Math.min(points2[0].y, points2[1].y, points2[2].y, points2[3].y),
    yMax: Math.max(points2[0].y, points2[1].y, points2[2].y, points2[3].y),
  };

  // 두 사각형의 교차 영역 계산
  const intersectXMin = Math.max(rect1.xMin, rect2.xMin);
  const intersectXMax = Math.min(rect1.xMax, rect2.xMax);
  const intersectYMin = Math.max(rect1.yMin, rect2.yMin);
  const intersectYMax = Math.min(rect1.yMax, rect2.yMax);

  // 교차 영역의 넓이 계산
  const intersectWidth = Math.max(0, intersectXMax - intersectXMin);
  const intersectHeight = Math.max(0, intersectYMax - intersectYMin);
  const intersectArea = intersectWidth * intersectHeight;

  // 각 사각형의 넓이 계산
  const area1 = (rect1.xMax - rect1.xMin) * (rect1.yMax - rect1.yMin);
  const area2 = (rect2.xMax - rect2.xMin) * (rect2.yMax - rect2.yMin);

  // IOU 계산
  const iou = intersectArea / (area1 + area2 - intersectArea);

  return iou;
}

self.onmessage = async (event) => {
  if (event.data.type == 1 || event.data.type == 3 || event.data.type == 10 || event.data.type == 11 || event.data.type == 16) {
    await initializeModel(event.data.type);
  }

  if (event.data.type == "detect" && isModelLoaded) {
    const { imageData, width, height, ocrType, useCapOcr, validCheckDt } = event.data;
    if (ocrType == 10) {
      detectResultCode = detectOcr.giroDetect(imageData, width, height); // 지로
    } else if (ocrType == 1 || ocrType == 11) {
      detectResultCode = detectOcr.detect(imageData, width, height); // 신분증 인식, 사본판별
    } else if (ocrType == 3) {
      detectResultCode = detectOcr.cardDetect(imageData, width, height); // 신용카드
    } else if (ocrType == 16) {
      detectResultCode = detectOcr.crop(imageData, width, height, validCheckDt); // crop
      resultCode = detectResultCode.resultJSON.resultCode;
      currentPoints = detectResultCode.resultJSON.points;
      // console.log("resultCode: ", resultCode);

      if (validCheckDt) {
        detectCount = 2;
      }
    }

    if (ocrType !== 16) {
      resultCode = detectResultCode;
    }

    if (resultCode === 0) {
      // resultCode가 0일 때, detectCount를 업데이트
      if (detectCount == 0) {
        // 첫 번째 탐지일 때 currentPoints를 previousPoints로 저장
        previousPoints = currentPoints ? [...currentPoints] : null; // currentPoints가 null이 아닐 경우에만 저장
        detectCount++; // 탐지 카운트 증가
      } else if (detectCount == 1) {
        // 두 번째 탐지일 때는 currentPoints를 그대로 사용
        detectCount++; // 탐지 카운트 증가
      }

      // 현재 points 좌표를 currentPoints에 저장합니다.
      currentPoints = currentPoints || []; // null일 경우 배열로 초기화
    } else {
      detectCount = 0; // 탐지 실패 시 카운트 초기화
      previousPoints = null; // 이전 좌표 초기화
      currentPoints = null; // 현재 좌표 초기화
    }

    if (detectCount >= 2) {
      // validCheckDt가 true일 때 IOU를 확인하지 않고 메시지 전송
      if (validCheckDt) {
        postMessage({ type: "detectResult", resultCode: detectResultCode, continuousSuccess: 1 });
        detectCount = 0; // Reset after success
        previousPoints = null;
        currentPoints = null;
      } else {
        if (ocrType == 16) {
          const iou = calculateIOU(previousPoints, currentPoints);
          console.log("iou: ", iou);

          if (iou >= 0.8) {
            // 흔들림이 없는 경우 성공 메시지 전송
            postMessage({ type: "detectResult", resultCode: detectResultCode, continuousSuccess: 1 });
            detectCount = 0; // Reset after success
            previousPoints = null;
            currentPoints = null;
          } else {
            detectCount = 0; // 흔들림이 감지된 경우 count 초기화
            postMessage({ type: "detectResult", resultCode: detectResultCode, continuousSuccess: 0 });
          }
        } else {
          postMessage({ type: "detectResult", resultCode: detectResultCode, continuousSuccess: 1 });
          detectCount = 0; // Reset after success
          previousPoints = null;
          currentPoints = null;
        }
      }
    } else {
      // 아직 detectCount가 2에 도달하지 않은 경우
      postMessage({ type: "detectResult", resultCode: detectResultCode, continuousSuccess: 0 });
    }
  }

  if (event.data.type == "giroType" && isModelLoaded) {
    const { imageData, width, height } = event.data;
    giroType = detectOcr.giroType(imageData, width, height);

    postMessage({ type: "giroType", resultCode: giroType });
  }

  if (event.data.type == "unload") {
    detectOcr.unload();
    isModelLoaded = false;
    postMessage({ type: "unloadComplete" });
  }
};
