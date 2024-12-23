let startX, startY;

export function convertImageDataToBase64(imageData) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  context.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.9).split(",")[1];
}

export function canvasX(clientX, guideAreaRect, imageData, radius) {
  var bound = guideAreaRect;
  return Math.round(clientX * (bound.width / imageData.width) - radius - 2);
}

export function canvasY(clientY, guideAreaRect, imageData, radius) {
  var bound = guideAreaRect;
  return Math.round(clientY * (bound.height / imageData.height) - radius - 2);
}

export function reverseCanvasX(relativeX, guideAreaRect, imageData, radius) {
  var bound = guideAreaRect;
  return Math.round((relativeX + radius + 2) / (bound.width / imageData.width));
}

export function reverseCanvasY(relativeY, guideAreaRect, imageData, radius) {
  var bound = guideAreaRect;
  return Math.round((relativeY + radius + 2) / (bound.height / imageData.height));
}

export function createLine(x1, y1, x2, y2) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", x1);
  line.setAttribute("y1", y1);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y2);
  line.setAttribute("stroke", "#3498db");
  line.setAttribute("stroke-width", "2");
  return line;
}

export function updateLines(innerCircles, lines) {
  for (let i = 0; i < lines.length; i++) {
    const start = innerCircles[i];
    const end = innerCircles[(i + 1) % innerCircles.length];
    lines[i].setAttribute("x1", start.x);
    lines[i].setAttribute("y1", start.y);
    lines[i].setAttribute("x2", end.x);
    lines[i].setAttribute("y2", end.y);
  }
}

// 터치 시작 처리 함수
export function handleTouchStart(index, pointDiv, affinePoints, x, y) {
  return function (event) {
    startX = event.touches[0].clientX - parseInt(pointDiv.style.left);
    startY = event.touches[0].clientY - parseInt(pointDiv.style.top);

    // 현재 좌표 기록
    affinePoints[index] = { x: x, y: y };

    // 다음 터치 핸들러에서 참조할 수 있도록 반환
    return { startX, startY };
  };
}

// 터치 이동 처리 함수
export function handleTouchMove(pointDiv, affinePoints, innerCircles, lines) {
  return function (event) {
    const touchX = event.touches[0].clientX;
    const touchY = event.touches[0].clientY;

    // 현재 터치 위치로 점 이동
    pointDiv.style.left = touchX - startX + "px";
    pointDiv.style.top = touchY - startY + "px";

    // 움직인 좌표 저장
    const movedX = parseInt(pointDiv.style.left); // 점의 중심으로 보정
    const movedY = parseInt(pointDiv.style.top); // 점의 중심으로 보정

    const index = parseInt(pointDiv.className.split(" ")[1].slice(-1)); // class 이름에서 인덱스 추출

    affinePoints[index - 1] = { x: movedX, y: movedY };
    innerCircles[index - 1].x = movedX + 12.5; // Update the center position
    innerCircles[index - 1].y = movedY + 12.5;

    updateLines(innerCircles, lines);
  };
}

// 터치 종료 처리 함수
export function handleTouchEnd(event) {
  // 터치 종료 시 필요한 작업 수행
  // console.log("affinePoints: ", affinePoints);
}

export function sortPoints(originalPoints) {
  // 배열의 길이가 4가 아니면 예외 처리
  if (originalPoints.length !== 4) {
    throw new Error("Invalid number of points. Expected 4 points.");
  }

  let sorted = false;

  while (!sorted) {
    sorted = true; // 초기에는 정렬되었다고 가정

    // 첫 번째와 두 번째 배열의 x 좌표 비교 후 순서 변경
    if (originalPoints[0].x > originalPoints[1].x) {
      [originalPoints[0], originalPoints[1]] = [originalPoints[1], originalPoints[0]];
      sorted = false; // 정렬이 발생했으므로 다시 확인 필요
    }

    // 세 번째와 네 번째 배열의 x 좌표 비교 후 순서 변경
    if (originalPoints[3].x > originalPoints[2].x) {
      [originalPoints[2], originalPoints[3]] = [originalPoints[3], originalPoints[2]];
      sorted = false; // 정렬이 발생했으므로 다시 확인 필요
    }

    // 추가 조건: 첫 번째 배열의 y 좌표가 네 번째 배열의 y 좌표보다 크면 순서 변경
    if (originalPoints[0].y > originalPoints[3].y) {
      [originalPoints[0], originalPoints[3]] = [originalPoints[3], originalPoints[0]];
      sorted = false; // 정렬이 발생했으므로 다시 확인 필요
    }

    // 추가 조건: 두 번째 배열의 y 좌표가 세 번째 배열의 y 좌표보다 크면 순서 변경
    if (originalPoints[1].y > originalPoints[2].y) {
      [originalPoints[1], originalPoints[2]] = [originalPoints[2], originalPoints[1]];
      sorted = false; // 정렬이 발생했으므로 다시 확인 필요
    }

    // 추가 조건: 첫 번째 배열의 y 좌표가 세 번째 배열의 y 좌표보다 크면 순서 변경
    if (originalPoints[0].y > originalPoints[2].y) {
      [originalPoints[0], originalPoints[1], originalPoints[2], originalPoints[3]] = [originalPoints[1], originalPoints[2], originalPoints[3], originalPoints[0]];
      sorted = false; // 정렬이 발생했으므로 다시 확인 필요
    }
  }

  // 정렬된 좌표 배열을 반환합니다.
  return originalPoints;
}

// 토큰&라이선스 체크 결과 처리 함수
export function getErrorMessage(tokenResult) {
  switch (tokenResult) {
    case 1:
      return "Loading Success.";
    case -1:
      return "Token authentication failed. Please check the token.";
    case -2:
      return "License authentication error. Please check your license.";
    case -3:
      return "The model license has expired. Please check the license.";
    default:
      return "Error initializing KoiOcr.";
  }
}

export function generateFileName(prefix = "rtc_", extension = ".jpg") {
  const currentDate = new Date();

  const year = currentDate.getFullYear();
  const month = ("0" + (currentDate.getMonth() + 1)).slice(-2); // 월은 0부터 시작하므로 +1
  const day = ("0" + currentDate.getDate()).slice(-2);
  const hours = ("0" + currentDate.getHours()).slice(-2);
  const minutes = ("0" + currentDate.getMinutes()).slice(-2);
  const seconds = ("0" + currentDate.getSeconds()).slice(-2);

  // 파일 이름 형식: prefix + 년월일시분초 + 확장자
  return `${prefix}${year}${month}${day}${hours}${minutes}${seconds}${extension}`;
}

export const base64toBlob = (base64Data, mimeString) => {
  var byteString = atob(base64Data);
  var ab = new ArrayBuffer(byteString.length);
  var ia = new Uint8Array(ab);

  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ab], { type: mimeString });
};

