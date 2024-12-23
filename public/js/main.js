import { buttonsData, rtcType } from "./constants.js";
import * as koiUtils from "./koiOcr/koiutils.js";
import { isBase64Image, parseTimeString, showElements, showMessage } from "./utils.js";

// 버튼 생성 함수
export function createButton(id, imgSrc, useCapOcr) {
  // useCapOcr에 따라 특정 버튼만 생성
  if (useCapOcr == rtcType.AUTO) {
    // id가 idcard, idfake, card, giro인 버튼만 생성
    if (!["idcard", "idfake", "card", "crops", "account", "giro", "giroEPN"].includes(id)) {
      return null; // 조건에 맞지 않으면 null 반환
    }
  }

  const button = document.createElement("button");
  button.id = id;
  button.className = "btn";

  const img = document.createElement("img");
  img.src = imgSrc;

  const overlayText = document.createElement("span");
  overlayText.className = "overlay-text";
  overlayText.innerText = getButtonText(id);

  button.appendChild(img);
  button.appendChild(overlayText);
  return button;
}

function getButtonText(id) {
  const texts = {
    idcard: "신분증",
    idfake: "사본판별",
    card: "신용카드",
    giro: "지로",
    crops: "문서",
    account: "계좌번호",
    giroEPN: "전자납부번호",
  };
  return texts[id] || "";
}

export function getOcrTypeFromButtonId(buttonId) {
  const button = buttonsData.find((b) => b.id == buttonId);
  return button ? button.type : null;
}

export function clickButtonByOcrMethod(ocrMethod) {
  let buttonId;

  switch (ocrMethod) {
    case "0001":
    case "0002":
    case "0014":
      buttonId = "idcard";
      break;
    case "0009":
      buttonId = "card";
      break;
    case "0016":
      buttonId = "idfake";
      break;
    case "0017":
      buttonId = "giro";
      break;
    case "0018":
      buttonId = "crops";
      break;
    case "0019":
      buttonId = "crops";
      break;
    case "0020":
      buttonId = "giroEPN";
      break;
    case "0021":
      buttonId = "account";
      break;
    case "0022":
      buttonId = "crops";
      break;
    default:
      console.error(`No button ID configured for ocrMethod: ${ocrMethod}`);
      return; // 버튼 ID가 설정되지 않은 ocrMethod에 대해서는 실행하지 않음
  }

  const button = document.querySelector(`#${buttonId}`);
  if (button) {
    button.click();
  } else {
    console.error(`${buttonId} not found.`);
  }
}

// 개별 이벤트 핸들러
export function handleStartButton(ocrType) {
  changeContentViewStack("start", ocrType);
  const buttons = document.querySelectorAll(".btn");

  if (buttons.length == 1) {
    buttons[0].click();
  } else {
    toggleStartButton(buttons);
  }
  update("quarter");
}

async function getImageDataFromBase64(imgElement) {
  return new Promise((resolve) => {
    // Canvas 생성
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // 이미지가 로드되었을 때 실행
    imgElement.onload = () => {
      // 캔버스 크기를 이미지 크기로 설정
      canvas.width = imgElement.width;
      canvas.height = imgElement.height;

      // 캔버스에 이미지 그리기
      ctx.drawImage(imgElement, 0, 0, imgElement.width, imgElement.height);

      // 이미지 데이터 가져오기
      const imageData = ctx.getImageData(0, 0, imgElement.width, imgElement.height);
      resolve(imageData);
    };

    // src 속성 설정으로 이미지 로드 트리거
    imgElement.src = imgElement.src;
  });
}

export async function handleSubmitButton() {
  const imgElement = document.querySelector("#imageUpload img");
  if (imgElement) {
    const imageData = await getImageDataFromBase64(imgElement);
    dispatchOcrEvent(imageData);
    // showMessage(".titleUpload", "ocr 진행중입니다.");
  }
}

export function handleBackButton(ocrType) {
  // window.close(); // demo
  window.scrollTo({ top: 0, behavior: "smooth" });
  changeContentViewStack("intro", ocrType);
  const buttons = document.querySelectorAll(".btn");
  const pgTexts = document.querySelectorAll(".circle-text");

  resetBackButtonUI(buttons, pgTexts);
  update("start");
}

export function handleFileInput(event) {
  const fileInput = event.target; // 현재 파일 입력 요소
  const file = fileInput.files[0]; // 선택된 파일
  const imageUploadDiv = document.getElementById("imageUpload");

  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      // 기존 이미지 요소를 제거
      imageUploadDiv.innerHTML = ""; // 이미지 제거

      const imgElement = document.createElement("img");
      imgElement.src = e.target.result;
      imgElement.alt = file.name;
      imgElement.style.width = "100%"; // 이미지가 상위 요소를 채우도록 설정

      imageUploadDiv.appendChild(imgElement); // 새로운 이미지 추가
      showMessage(".titleUpload", `${file.name} 파일이 선택되었습니다.`);
      showElements("#submitBtn"); // submit 버튼 표시
    };
    reader.readAsDataURL(file);
  } else {
    // 파일이 선택되지 않은 경우 처리
    showMessage(".titleUpload", "파일을 선택해주세요.");
    imageUploadDiv.innerHTML = ""; // 이미지 제거
  }

  // 동일한 파일 이름 문제 해결을 위해 input의 value를 빈 문자열로 설정
  fileInput.value = ""; // 선택된 파일 제거
}

export function toggleStartButton(buttons) {
  const menu_txt = document.querySelector(".menu_txt");
  const menu_txt2 = document.querySelector(".menu_txt2");

  menu_txt.style.display = "none";
  menu_txt2.style.display = "none";
  buttons.forEach((button) => (button.style.display = "block"));
}

export function resetImageUpload() {
  const imgElement = document.querySelector("#imageUpload img");
  const titleupload = document.querySelector(".titleUpload");
  const titleEl = document.querySelector(".title");

  titleupload.innerHTML = "파일을 선택해주세요.";
  titleEl.innerHTML = "";
  if (imgElement) imgElement.remove();
}

export function resetBackButtonUI(buttons, pgTexts) {
  const startBtn = document.querySelector("#start_btn");
  const btnArea = document.querySelector(".btn-area");
  const kwcGuideArea = document.getElementById("kwcGuideArea");

  startBtn.style.display = "block";
  btnArea.style.alignItems = "";
  btnArea.style.height = "";

  buttons.forEach((button) => (button.style.display = "none"));
  activateCircle("first");

  kwcGuideArea.style.zIndex = "10001";
  pgTexts.forEach((pgText) => {
    pgText.style.bottom = "";
    pgText.style.top = "";
  });
}

// export function setCaptureTitle(ocrType) {
//   const titleEl = document.querySelector(".title");
//   if (ocrType == 7) {
//     titleEl.innerHTML = "포인터를 움직여 문서 영역 모서리에 맞추고 아래 버튼을 눌러 교정을 시작해주세요.";
//   } else {
//     titleEl.innerText = "";
//   }
// }

async function dispatchOcrEvent(imageData) {
  const eventDetail = {
    imageData: imageData,
    imageWidth: imageData.width,
    imageHeight: imageData.height,
    currentCount: 1,
    totalCount: 1,
  };

  const event = new CustomEvent("fileUpload", { detail: eventDetail });
  window.dispatchEvent(event);
}

export function activateCircle(action) {
  // 현재 active 상태인 circle을 찾습니다.
  const currentActiveCircle = document.querySelector(".circle.active");

  // 분기 처리를 통해 각각의 기능을 수행합니다.
  switch (action) {
    case "next": // 다음 circle을 활성화합니다.
      const nextCircle = currentActiveCircle.nextElementSibling;
      if (nextCircle) {
        currentActiveCircle.classList.remove("active");
        nextCircle.classList.add("active");
      }
      break;

    case "previous": // 이전 circle을 활성화합니다.
      const previousCircle = currentActiveCircle.previousElementSibling;
      if (previousCircle) {
        currentActiveCircle.classList.remove("active");
        previousCircle.classList.add("active");
      }
      break;

    case "first": // 첫 번째 circle을 활성화합니다.
      const circles = document.querySelectorAll(".circle");
      const firstCircle = circles[0];
      currentActiveCircle.classList.remove("active");
      firstCircle.classList.add("active");
      break;

    default:
      console.warn(`Unknown action: ${action}`);
      break;
  }
}

export const update = (progressStatus) => {
  const progress = document.getElementById("progress");
  const circles = document.querySelectorAll(".circle");

  let progressWidth = "0%";

  switch (progressStatus) {
    case "start":
      progressWidth = "0%";
      break;
    case "quarter":
      progressWidth = "25%";
      break;
    case "half":
      progressWidth = "50%";
      break;
    case "three-quarters":
      progressWidth = "75%";
      break;
    case "complete":
      progressWidth = "100%";
      break;
    default:
      console.warn("Unknown progress status:", progressStatus);
      break;
  }

  progress.style.width = progressWidth;
};

// export const ocrResultFormat = (ocrResult, timeCheckJSON) => {
//   // Accessing resultJSON from data
//   let resultItems = "";
//   const fieldResults = ocrResult.resultJSON.formResult.fieldResults;

//   // Determine the type of document and add it as the first element
//   const documentType =
//     ocrResult.resultJSON.formResult.type  "00110"
//       ? "운전면허증"
//       : ocrResult.resultJSON.formResult.type == "00100"
//       ? "주민등록증"
//       : // : ocrResult.resultJSON.formResult.type == "00190"
//         // ? "사본판별"
//         "";

//   // Insert the document type at the beginning of the fieldResults array
//   if (!ocrResult.resultJSON.formResult.type == "00190") {
//     fieldResults.unshift({ displayName: "문서 종류", value: documentType });
//   }

//   // Get the necessary number of currentTime values from timeCheckJSON
//   const timeValues = Object.values(timeCheckJSON);
//   let valueAdded = false; // Value가 추가되었는지 여부를 추적하는 플래그

//   // Loop through timeValues and construct resultItems
//   for (let i = 0; i < Math.max(fieldResults.length, timeValues.length); i++) {
//     // Get the corresponding fieldResult or use an empty object if out of bounds
//     const fieldResult = i < fieldResults.length ? fieldResults[i] : {};

//     let value = fieldResult.value || ""; // Default to empty string if value is undefined
//     if (value instanceof String) {
//       console.log("value: ", value);
//       value = value.replaceAll("<", "&lt;");
//     }

//     // Check if the field is '카드번호' and if the value is numeric
//     if (fieldResult.displayName == "카드번호" && /^\d+$/.test(value)) {
//       // Formatting based on the length of the value
//       if (value.length == 16) {
//         // Splitting the value into groups of 4 digits
//         value = value.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, "$1 $2 $3 $4");
//       } else if (value.length == 15) {
//         // Splitting the value into groups of 4, 6, and 5 digits
//         value = value.replace(/(\d{4})(\d{6})(\d{5})/, "$1 $2 $3");
//       }
//     }

//     if (ocrResult.resultJSON.formResult.type == "00190" && !valueAdded) {
//       if (value == 1) {
//         value = "진본";
//       } else if (value == 0) {
//         value = "사본";
//       }
//       valueAdded = true;
//     }

//     const timePrefixes = ["시작: ", "종료: ", "처리시간: ", "- 전송시간: ", "- 인식시간: "];

//     // Add the current time with the prefix to the result items
//     const currentTime = i < timeValues.length ? timePrefixes[i] + timeValues[i] : "";

//     let style = "display: flex;";

//     const styleType =
//       ocrResult.resultJSON.formResult.type == "00190" ||
//       ocrResult.resultJSON.formResult.type == "00110" ||
//       ocrResult.resultJSON.formResult.type == "00100";

//     // Apply additional style if the conditions are met
//     if (styleType && (timePrefixes[i] == "- 전송시간: " || timePrefixes[i] == "- 인식시간: ")) {
//       style += " font-size: small;";
//     }

//     resultItems += `<tr>
//                     <td>${value}</td>
//                     <td style="${style}">${currentTime}</td>
//                   </tr>`;
//   }

//   return `<table class="result_content">
//             <thead>
//               <tr>
//                 <th>인식 결과</th>
//                 <th style="display: flex;">Time Check</th>
//               </tr>
//             </thead>
//             <tbody>
//               ${resultItems}
//             </tbody>
//           </table>`;
// };

export const changeContentViewStack = (sectionName, ocrType) => {
  const sectionList = document.querySelectorAll(".contents-section");
  const Section = document.querySelector(`.${sectionName}-section`);
  const topContainer = document.querySelector(".top-container");
  const pgTexts = document.querySelectorAll(".circle-text");
  const kwcGuideArea = document.getElementById("kwcGuideArea");
  const imageUploadDiv = document.getElementById("imageUpload");
  const titleupload = document.querySelector(".titleUpload");
  const imgElement = imageUploadDiv.querySelector("img");
  const fileUpload = document.querySelector(".upload");

  for (let section of sectionList) {
    section.style.display = "none";
  }

  let displayType = "block";
  if (sectionName == "intro") {
    displayType = "flex";
    Section.style.display = displayType;
    const subElements = Section.querySelectorAll("div");
    subElements.forEach((element) => {
      element.style.display = "block";
    });
    topContainer.style.paddingTop = "40px";
  } else if (sectionName == "start") {
    displayType = "flex";
    topContainer.style.paddingTop = "25px";
  } else if (sectionName == "camera") {
    pgTexts.forEach((pgText) => {
      pgText.style.bottom = "0px";
      pgText.style.top = "-25px";
    });
    if (ocrType == 7) {
      kwcGuideArea.style.zIndex = "10001";
    } else {
      kwcGuideArea.style.zIndex = "10003";
    }
  } else if (sectionName == "upload") {
    titleupload.innerHTML = "파일을 선택해주세요.";
    fileUpload.style.display = "block";
    if (imgElement) {
      imgElement.remove();
    }
  }
  Section.style.display = displayType;
};

export const ocrResultFormat = (ocrResult) => {
  // Accessing resultJSON from data
  let resultItems = "";
  let firstImageSkipped = false;
  const fieldResults = ocrResult.resultJSON.formResult.fieldResults;
  const type = ocrResult.resultJSON.formResult.type;

  for (let i = 0; i < fieldResults.length; i++) {
    const fieldResult = fieldResults[i];
    let value = fieldResult.value;
    // value = value.replaceAll("<", "&lt;");
    if (typeof value == "string") {
      value = value.replaceAll("<", "&lt;");
    }
    // Check if the field is '카드번호' and if the value is numeric
    if (fieldResult.displayName == "카드번호" && /^\d+$/.test(value)) {
      // Formatting based on the length of the value
      if (value.length == 16) {
        // Splitting the value into groups of 4 digits
        value = value.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, "$1 $2 $3 $4");
      } else if (value.length == 15) {
        // Splitting the value into groups of 4, 6, and 5 digits
        value = value.replace(/(\d{4})(\d{6})(\d{5})/, "$1 $2 $3");
      }
    }

    if (type == "00190") {
      // value가 boolean인 경우를 먼저 처리
      if (typeof value == "boolean") {
        value = value ? "진본" : "사본";
      } else if (typeof value == "string") {
        // value가 문자열 "true" 또는 "false"인 경우 숫자로 변환
        const numericValue = value == "true" ? 1 : value == "false" ? 0 : parseInt(value, 10);

        if (numericValue == 1) {
          value = "진본";
        } else if (numericValue == 0) {
          value = "사본";
        }
      }
    } else if (type == "00960") {
      if (isBase64Image(value)) {
        if (!firstImageSkipped) {
          firstImageSkipped = true; // 첫 번째 이미지를 건너뜀
          continue; // 첫 번째 이미지는 무시하고 다음으로 넘어감
        }
        // 두 번째 이미지를 처리하고 테이블을 반환
        value = `<img src="${value}" alt="Base64 이미지" style="width: 90%; height: auto; padding-bottom: 100px;" />`;
        resultItems += `<tr>
                          <td>${value}</td>
                        </tr>`;

        return `<table class="result_content">
                  <thead>
                    <tr>
                      <th>인식 결과</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${resultItems}
                  </tbody>
                </table>`;
      }
    } else if (type == "00800") {
      if (isBase64Image(value)) {
        value = `<img src="${value}" alt="Base64 이미지" style="width: 90%; height: auto; padding-bottom: 30px;" />`;
        resultItems += `<tr>
                          <td>${value}</td>
                        </tr>`;

        return `<table class="result_content">
                  <thead>
                    <tr>
                      <th>인식 결과</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${resultItems}
                  </tbody>
                </table>`;
      }
    } else {
      // 다른 경우의 value 유지
      value = value;
    }

    resultItems += `<tr>
                              <td>${fieldResult.displayName}</td>
                              <td>${value}</td>
                          </tr>`;
  }

  return `<table class="result_content">
                  <thead>
                      <tr>
                          <th>인식 타입</th>
                          <th>인식 결과</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${resultItems}
                  </tbody>
              </table>`;
};

export const getImageDataURL = (base64Data, imageData, ocrType) => {
  if (ocrType == 7 && base64Data) {
    return `data:image/jpeg;base64,${base64Data}`;
  } else if (imageData) {
    return getImageFromImageData(imageData);
  }
  return null;
};

export const getImageFromImageData = (imageData) => {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const context = canvas.getContext("2d");
  context.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/jpeg");
};

export const getTimeCheckJSON = (startTime, endTime, detail) => {
  if (startTime && endTime) {
    const startTimeMillis = parseTimeString(startTime);
    const endTimeMillis = parseTimeString(endTime);
    const totalTime = (endTimeMillis - startTimeMillis) / 1000;
    const ocrTime = parseFloat(parseFloat(detail.ocrResult.resultJSON.processTime).toFixed(1));
    const requestTime = (totalTime - ocrTime).toFixed(1);

    return { startTime, endTime, totalTime, requestTime, ocrTime };
  }
  return null;
};

export const handleResultScreen = (event, ocrType, useCapOcr) => {
  const pointerBtn = document.getElementById("pointerBtn");
  if (pointerBtn) {
    pointerBtn.remove(); // pointerBtn이 존재하면 DOM에서 제거
  }
  if (event.detail.success) {
    const { ocrResult, base64Data, imageData, startTime, endTime } = event.detail;
    const resultJSON = ocrResult.resultJSON;

    // OCR 결과 처리
    if (resultJSON.resultCode == "0000" || resultJSON.resultCode == "0") {
      if (ocrType == 16) {
        if (event.detail.ocrType == 14) {
          handleSuccess(event, ocrType, useCapOcr);
        } else {
          if (useCapOcr == 3) {
            document.querySelector(`.upload-section`).style.display = "none";
            document.querySelector(`.camera-section`).style.display = "block";
          }
          handleCropSuccess(event, ocrType, useCapOcr);
        }
      } else {
        handleSuccess(event, ocrType, useCapOcr);
      }
    } else {
      handleFailure(event, ocrType, useCapOcr);
    }
  } else {
    if (ocrType == 16) {
      handleCropFailure(event, ocrType, useCapOcr);
    } else {
      handleFailure(event, ocrType, useCapOcr);
    }
  }
};

export const handleCropSuccess = (event, ocrType, useCapOcr) => {
  const { ocrResult, base64Data, imageData, startTime, endTime } = event.detail;
  let imageDataURL = null;
  const titleEl = document.querySelector(".title");
  const result_text = document.querySelector("#result_text");
  const imageContainer = document.querySelector("#imageContainer");
  const timeCheckJSON = getTimeCheckJSON(startTime, endTime, event.detail);
  const detectTime = event.detail.detectTime;
  const validCheckDt = event.detail.validCheckDt;
  const rtcToken = event.detail.rtcToken;

  titleEl.innerHTML = "포인터를 사용하여 문서를 교정한 후 <br> 저장 버튼을 눌러주세요.";

  const existingModal = document.querySelector(".affineDiv");
  if (existingModal) {
    existingModal.remove();
  }

  // crop 성공
  // 좌표 -> 카메라
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
  modalContent.style.width = "100%";
  modalContent.style.height = "100%";
  modal.appendChild(modalContent);
  kwcGuideArea.appendChild(modal);

  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const context = canvas.getContext("2d");
  context.putImageData(imageData, 0, 0);
  imageDataURL = canvas.toDataURL("image/jpeg");

  const guideImage = document.createElement("img");
  guideImage.id = "guideImage";
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

  let points = [];
  points = ocrResult.resultJSON.points;

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
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
  const containerId = event.currentTarget._options.cameraOptions.containerId;
  const container = document.querySelector(containerId);
  // pointerBtn이 이미 존재하지 않는 경우에만 버튼 생성
  if (!document.getElementById("pointerBtn")) {
    const pointerBtn = document.createElement("button");
    pointerBtn.id = "pointerBtn";
    pointerBtn.setAttribute("class", "cropButton");
    pointerBtn.innerText = "인식";
    pointerBtn.style.display = "block";

    // 생성한 버튼을 원하는 위치에 추가 (예: body에 추가)
    document.body.appendChild(pointerBtn);
  }

  const retryBtn = document.createElement("button");
  retryBtn.id = "pointerRetryBtn";
  retryBtn.setAttribute("class", "cropButton");
  retryBtn.innerText = "재촬영";
  retryBtn.style.display = "block";

  container.appendChild(pointerBtn);
  // container.appendChild(retryBtn);
  pointerBtn.onclick = (event) => {
    return new Promise((resolve, reject) => {
      // 커스텀 이벤트 생성 및 dispatch
      const customEvent = new CustomEvent("pointerBtnClick", {
        detail: {
          affinePoints,
          guideAreaRect,
          imageData,
          radius,
          originalEvent: event,
          resolve, // resolve를 전달합니다.
          pointerBtn,
          detectTime,
        },
      });

      document.dispatchEvent(customEvent); // 이벤트 발생
    })
      .then((result) => {
        // base64Data를 화면에 표시하는 로직 추가
        const base64Data = result.resultJSON.base64image;
        dispatchCropEvent(base64Data, imageData, validCheckDt, rtcToken, ocrType, detectTime);
        titleEl.innerHTML = "문서 인식중입니다.";
        const modal = document.querySelector(".affineDiv");
        if (modal) {
          modal.remove();
        }
        // displayBase64Image(base64Data, ocrType, useCapOcr, detectTime);
      })
      .catch((error) => {
        console.error("Error occurred while processing:", error);
      })
      .finally(() => {
        pointerBtn.remove(); // 비동기 처리 후 버튼을 반드시 제거
      });
  };

  // 자동촬영 시 문서 탐지되면 자동으로 affine
  // if(useCapOcr == 1){
  //   pointerBtn.click();
  // }
};

export const handleCropSuccessFile = (event, ocrType, useCapOcr) => {
  document.querySelector(`.upload-section`).style.display = "none";
  document.querySelector(`.camera-section`).style.display = "block";

  const { ocrResult, base64Data, imageData, startTime, endTime } = event.detail;
  let imageDataURL = null;
  const titleEl = document.querySelector(".title");
  const result_text = document.querySelector("#result_text");
  const imageContainer = document.querySelector("#imageContainer");
  const timeCheckJSON = getTimeCheckJSON(startTime, endTime, event.detail);
  const detectTime = event.detail.detectTime;
  const validCheckDt = event.detail.validCheckDt;
  const rtcToken = event.detail.rtcToken;

  titleEl.innerHTML = "포인터를 사용하여 문서를 교정한 후 <br> 저장 버튼을 눌러주세요.";

  const existingModal = document.querySelector(".affineDiv");
  if (existingModal) {
    existingModal.remove();
  }

  // crop 성공
  // 좌표 -> 카메라
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
  imageDataURL = canvas.toDataURL("image/jpeg");

  const guideImage = document.createElement("img");
  guideImage.id = "guideImage";
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

  let points = [];
  points = ocrResult.resultJSON.points;

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
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
  const containerId = event.currentTarget._options.cameraOptions.containerId;
  const container = document.querySelector(containerId);
  const pointerBtn = document.createElement("button");
  pointerBtn.id = "pointerBtn";
  pointerBtn.setAttribute("class", "cropButton");
  pointerBtn.innerText = "인식";
  pointerBtn.style.display = "block";

  const retryBtn = document.createElement("button");
  retryBtn.id = "pointerRetryBtn";
  retryBtn.setAttribute("class", "cropButton");
  retryBtn.innerText = "재촬영";
  retryBtn.style.display = "block";

  container.appendChild(pointerBtn);
  // container.appendChild(retryBtn);

  pointerBtn.onclick = (event) => {
    // Promise를 생성하여 resolve와 reject를 정의합니다.
    return new Promise((resolve, reject) => {
      // 커스텀 이벤트 생성 및 dispatch
      const customEvent = new CustomEvent("pointerBtnClick", {
        detail: {
          affinePoints,
          guideAreaRect,
          imageData,
          radius,
          originalEvent: event,
          resolve, // resolve를 전달합니다.
          pointerBtn,
          detectTime,
        },
      });

      document.dispatchEvent(customEvent); // 이벤트 발생
      pointerBtn.remove();
    })
      .then((result) => {
        // base64Data를 화면에 표시하는 로직 추가
        const base64Data = result.resultJSON.base64image;
        dispatchCropEvent(base64Data, imageData, validCheckDt, rtcToken, ocrType, detectTime);
        titleEl.innerHTML = "문서 인식중입니다.";
        const modal = document.querySelector(".affineDiv");
        if (modal) {
          modal.remove();
        }
        // displayBase64Image(base64Data, ocrType, useCapOcr, detectTime);
      })
      .catch((error) => {
        console.error("Error occurred while processing:", error);
      });
  };

  // 자동촬영 시 문서 탐지되면 자동으로 affine
  // if(useCapOcr == 1){
  //   pointerBtn.click();
  // }
};

function downloadBase64Image(base64Data, filename = "downloaded_image.jpg") {
  // a 태그 생성
  const link = document.createElement("a");

  // base64 이미지를 href로 설정
  link.href = base64Data;

  // 다운로드할 파일 이름 설정
  link.download = filename;

  // 링크 클릭을 트리거하여 다운로드 시작
  document.body.appendChild(link);
  link.click();

  // 다운로드 후 링크 제거
  document.body.removeChild(link);
}

async function dispatchCropEvent(base64Data, imageData, validCheckDt, rtcToken, ocrType, detectTime) {
  const eventDetail = {
    imageData: `data:image/jpeg;base64,${base64Data}`,
    imageWidth: imageData.width,
    imageHeight: imageData.height,
    totalCount: 1,
    currentCount: 1,
    ocrType: 14,
    validCheckDt: validCheckDt,
    rtcToken: rtcToken,
    detectTime: detectTime,
  };
  const event = new CustomEvent("imageProcessed", { detail: eventDetail });
  window.dispatchEvent(event);
}

function displayBase64Image(base64Data, ocrType, useCapOcr, detectTime) {
  changeContentViewStack("result", ocrType);
  activateCircle("next");
  update("complete");
  // UI 설정
  finalizeUI(ocrType, useCapOcr);
  const imageContainer = document.querySelector("#imageContainer");
  const result_text = document.querySelector("#result_text");
  const imageDataURL = `data:image/jpeg;base64,${base64Data}`;
  imageContainer.innerHTML = `<img src="${imageDataURL}">`;
  const detectTimeInSeconds = (detectTime / 1000).toFixed(2);
  result_text.style.height = "20%";
  result_text.innerHTML = `Detection Time: ${detectTimeInSeconds} seconds`;
}

export const handleSuccess = (event, ocrType, useCapOcr) => {
  changeContentViewStack("result", ocrType);
  activateCircle("next");
  update("complete");
  // UI 설정
  finalizeUI(ocrType, useCapOcr);
  const { ocrResult, base64Data, imageData, startTime, endTime } = event.detail;
  let imageDataURL;
  const titleEl = document.querySelector("#title_text");
  const result_text = document.querySelector("#result_text");
  const imageContainer = document.querySelector("#imageContainer");
  const timeCheckJSON = getTimeCheckJSON(startTime, endTime, event.detail);
  if (event.detail.base64Data) {
    imageDataURL = getImageDataURL(base64Data, imageData);
  }

  titleEl.innerHTML = "";
  result_text.innerHTML = "";

  if (ocrType == 14 || ocrType == 16) {
    result_text.style.paddingTop = "0px";
    result_text.style.paddingBottom = "30%";
  }

  if (ocrType == 7 && base64Data) {
    imageDataURL = `data:image/jpeg;base64,${base64Data}`;
    result_text.style.height = "5%";
  } else {
    if (ocrType == 1 && base64Data) {
      imageDataURL = `${base64Data}`;
    } else {
      const canvas = document.createElement("canvas");
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const context = canvas.getContext("2d");
      if (isBase64Image(imageData)) {
        imageDataURL = imageData; // 문자열 그대로 할당
      } else {
        context.putImageData(imageData, 0, 0);
        // Canvas를 이미지로 변환하여 표시
        imageDataURL = canvas.toDataURL("image/jpeg");
      }
    }
    result_text.innerHTML = `<div class="custom-style">${ocrResultFormat(ocrResult, timeCheckJSON)}</div>`;
  }

  const imgElement = new Image();
  imgElement.src = imageDataURL;
  imgElement.onload = () => {
    if (imgElement.height > imgElement.width) {
      result_text.style.paddingBottom = "20%";
      result_text.style.paddingTop = "5%";

      setTimeout(() => {
        result_text.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300); // 100ms 지연
    }
  };

  imageContainer.innerHTML = `<img src="${imageDataURL}">`;
  adjustResultTextStyle(result_text, ocrType);
  // 결과 화면을 표시하고 나서 result_text로 스크롤 이동
  // result_text.scrollIntoView({ behavior: "smooth", block: "center" });
};

export const handleCropFailure = (event, ocrType, useCapOcr) => {
  const { ocrResult, base64Data, imageData, startTime, endTime } = event.detail;
  const titleEl = document.querySelector("#title_text");
  const result_text = document.querySelector("#result_text");
  const imageContainer = document.querySelector("#imageContainer");
  // fail 일때 처리
  // resultCode 1~15까지는 문서가 좌표를 벗어난 경우 -> 가이드 UI 처리
  // checkEmptyCoordinates(ocrResult.resultJSON.resultCode, ocrResult.resultJSON.points, useCapOcr);
};

const checkEmptyCoordinates = (resultCode, ocrType, useCapOcr) => {
  const titleEl = document.querySelector("#title_text");
  // 1~15 이외의 resultCode에 대한 처리
  if (resultCode < 1 || resultCode > 15) {
    changeContentViewStack("result", ocrType);
    activateCircle("next");
    update("complete");
    finalizeUI(ocrType, useCapOcr);
    handleFailure(event, ocrType, useCapOcr);
    return; // 함수 종료
  }

  const emptyCoordinates = [];

  // 좌표 비트 연산을 통해 빈 좌표 확인
  if (resultCode & 1) {
    emptyCoordinates.push("좌상단"); // 좌상단이 벗어남
  }
  if (resultCode & 2) {
    emptyCoordinates.push("우상단"); // 우상단이 벗어남
  }
  if (resultCode & 4) {
    emptyCoordinates.push("우하단"); // 우하단이 벗어남
  }
  if (resultCode & 8) {
    emptyCoordinates.push("좌하단"); // 좌하단이 벗어남
  }

  // 비어있는 좌표 출력
  if (emptyCoordinates.length > 0) {
    // const kwcGuideArea = document.getElementById("kwcGuideArea");

    // // 새로운 텍스트 요소 생성
    // const newTextElement = document.createElement("p");
    console.log("좌표가 벗어난 부분:", emptyCoordinates.join(", "));
    // newTextElement.textContent = "좌표가 벗어난 부분: " + emptyCoordinates.join(", ");
    // kwcGuideArea.appendChild(newTextElement);
  } else {
    console.log("모든 좌표가 정상입니다.");
  }
};

export const handleFailure = (event, ocrType, useCapOcr) => {
  changeContentViewStack("result", ocrType);
  activateCircle("next");
  update("complete");
  // UI 설정
  finalizeUI(ocrType, useCapOcr);
  const { ocrResult, base64Data, imageData, startTime, endTime } = event.detail;
  const titleEl = document.querySelector("#title_text");
  const result_text = document.querySelector("#result_text");
  const imageContainer = document.querySelector("#imageContainer");
  let imageDataURL = null;

  if (event.detail.success) {
    const resultJSON = event.detail.ocrResult.resultJSON;

    titleEl.innerHTML = "";
    result_text.style.height = "40%";

    if (resultJSON.resultCode == "1005") {
      result_text.innerHTML = "신분증 이미지가 너무 작습니다. <br>다시 촬영해주세요.";
    } else {
      result_text.innerHTML = "다시 시도해주세요.";
    }
  } else {
    result_text.innerHTML = "다시 시도해주세요.";
    if (event.detail.ocrType) {
      result_text.style.paddingBottom = "20%";
      result_text.style.height = "auto";
    }
  }
  // 약간의 지연 후 스크롤
  if (ocrType == 14) {
    setTimeout(() => {
      result_text.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300); // 100ms 지연
  }
  if (base64Data) {
    imageDataURL = getImageDataURL(base64Data, imageData);
  } else {
    imageDataURL = `${event.detail.imageData}`;
  }

  if (imageDataURL && imageDataURL !== "null") {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    // base64 이미지인 경우 처리
    if (imageDataURL.startsWith("data:image")) {
      const img = new Image();
      img.src = imageDataURL;

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);

        // Canvas를 이미지로 변환하여 표시
        const newImageDataURL = canvas.toDataURL("image/jpeg");
        imageContainer.innerHTML = `<img src="${newImageDataURL}">`;
      };

      img.onerror = (error) => {
        console.error("이미지 로드 실패:", error);
      };
    } else {
      // imageData가 ImageData인 경우
      canvas.width = event.detail.imageData.width;
      canvas.height = event.detail.imageData.height;
      context.putImageData(event.detail.imageData, 0, 0);

      // Canvas를 이미지로 변환하여 표시
      const newImageDataURL = canvas.toDataURL("image/jpeg");
      imageContainer.innerHTML = `<img src="${newImageDataURL}">`;
    }
  }
};

export const adjustResultTextStyle = (result_text, ocrType) => {
  result_text.style.height = "auto";
  if (ocrType == 2) {
    result_text.style.height = "70%";
  } else if (ocrType == 1 || ocrType == 10) {
    result_text.style.paddingTop = "5px";
    result_text.style.height = "45%";
  } else if (ocrType == 14 || ocrType == 16) {
    result_text.style.paddingTop = "5%";
    result_text.style.paddingBottom = "30%";
  } else {
    result_text.style.paddingTop = "20%";
  }
};

export const finalizeUI = (ocrType, useCapOcr) => {
  const retryBtn = document.querySelector("#retry_btn");
  const backBtn = document.querySelector("#back_btn");
  const captureBtn = document.querySelector("#cap_btn");
  const result_text = document.querySelector("#result_text");
  const imageContainer = document.querySelector("#imageContainer");
  const title = document.querySelector(".title");

  retryBtn.style.display = "block";
  backBtn.style.display = "block";
  captureBtn.style.display = "none";

  // 초기 설정
  result_text.style.marginTop = "";
  imageContainer.style.marginTop = "";
  title.innerHTML = "";

  if (ocrType == 12) {
    imageContainer.style.marginTop = "30%";
    result_text.style.marginTop = "0px";
  }
};

// export function cropFailed() {
//   const titleEl = document.querySelector(".title");
//   titleEl.innerHTML = "";
//   titleEl.innerHTML = "문서를 찾을 수 없습니다. </br>다시 시도해주세요.";
//   showElements("#cap_btn");
// }

// 에러 처리
export function handleError(error) {
  console.error("Error occurred: ", error);
  try {
    const errObject = JSON.parse(error.message);
    alert("Error: " + errObject.message);
  } catch (parseError) {
    console.error("JSON parse error: ", parseError);
    alert("An unexpected error occurred: " + error.message);
  }
}
