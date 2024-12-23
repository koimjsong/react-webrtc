import { buttonsData } from "./constants.js";
export function addClickListener(selector, handler) {
  const element = document.querySelector(selector);
  if (element) {
    element.addEventListener("click", handler);
    return element; // 버튼 요소 반환
  }
  console.error(`Element with selector "${selector}" not found.`); // 디버깅을 위한 로그
  return null;
}

export function getOcrTypeFromButtonId(buttonId) {
  const button = buttonsData.find((b) => b.id === buttonId);
  return button ? button.type : null;
}

export function showElements(elements) {
  if (typeof elements === "string") {
    elements = document.querySelectorAll(elements);
  }

  // elements가 NodeList 또는 배열인 경우 처리
  if (elements instanceof NodeList || Array.isArray(elements)) {
    elements.forEach((element) => {
      if (element instanceof HTMLElement) {
        element.style.display = "block";
      }
    });
  }
}

export function hideElement(element) {
  if (element instanceof HTMLElement) element.style.display = "none";
}

export function showMessage(element, message) {
  if (element instanceof HTMLElement) element.innerHTML = message;
}

// 요소 숨기기
export function hideElements(elements) {
  // elements가 문자열인 경우 querySelectorAll로 요소를 선택
  if (typeof elements === "string") {
    elements = document.querySelectorAll(elements);
  }

  // elements가 NodeList 또는 배열인 경우 처리
  if (elements instanceof NodeList || Array.isArray(elements)) {
    elements.forEach((element) => {
      if (element instanceof HTMLElement) {
        element.style.display = "none";
      }
    });
  }
}

export function getCurrentTimeWithMilliseconds() {
  const now = new Date();

  // Get hours, minutes, seconds, and milliseconds
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  const milliseconds = Math.floor(now.getMilliseconds() / 100).toString(); // Extract first digit without decimal

  // Combine into the desired format
  const currentTime = `${hours}:${minutes}:${seconds}.${milliseconds}`;

  return currentTime;
}

export function parseTimeString(timeString) {
  const [hours, minutes, seconds] = timeString.split(":");
  const [secs, millis] = seconds.split(".");

  return parseInt(hours) * 3600000 + parseInt(minutes) * 60000 + parseInt(secs) * 1000 + parseInt(millis) * 10;
}

export const isBase64Image = (imageData) => {
  // 정규 표현식을 사용하여 Base64 이미지 문자열인지 확인
  const base64Pattern = /^data:image\/(jpeg|png|gif);base64,/;
  return base64Pattern.test(imageData);
};

export async function loadScript(url) {
  const response = await fetch(url, { cache: "force-cache" });
  const scriptContent = await response.text();
  eval(scriptContent);
}

// export async function base64ToImageData(base64Data) {
//   // Base64 문자열을 이미지로 변환
//   const img = new Image();
//   img.src = base64Data;

//   // 이미지를 로드할 때까지 대기
//   await new Promise((resolve) => {
//     img.onload = resolve;
//   });

//   // Canvas 생성 및 이미지 그리기
//   const canvas = document.createElement("canvas");
//   canvas.width = img.width;
//   canvas.height = img.height;
//   const context = canvas.getContext("2d");
//   context.drawImage(img, 0, 0);

//   // Canvas에서 ImageData 추출
//   const imageData = context.getImageData(0, 0, img.width, img.height);
//   return imageData;
// }
