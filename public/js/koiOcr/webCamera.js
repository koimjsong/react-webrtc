// loadCSS("css/web.css");
const vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty("--vh", `${vh}px`);
document.documentElement.style.backgroundColor = "rgba(255, 255, 255, 1)";
import { OCR_TYPE } from "../constants.js";

export default class WebCamera extends EventTarget {
  _md;
  _container;
  _videoWrapper;
  _videoRef;
  _mediaStream;
  _canvasRef;
  _guideArea;
  _letterboxTop;
  _letterboxBottom;
  _uncoveredArea;
  _video = "video";
  _canvas = "canvas";
  _ocrType = OCR_TYPE.IDCARD;
  _pictureWidth = window.innerWidth;
  _pictureHeight = window.innerHeight;
  _vertical;
  _useCapOcr;
  _a = false;
  _currentCaptueCount;
  _captureInProgress = false;
  _detectInProgress = false;
  _isStartInProgress = false;
  _IdDetectOCR;
  _isIpad;
  _isIOS;
  _isFireFox = false;
  _isSwapWH = false;
  _workType;
  _title;
  _detectRqCount = 0;
  _key;
  _initUseCapOcr;
  _useCapOcrFlag = false;
  _preOcrType;
  _orientationChangeButton;
  _isReversed = false;
  _uploadImg = null;
  _guideMessage = null;
  // _shutterSound = null;
  _emitCaptureEventInProgress = false;
  _successfulDetectionCalled = false; // 플래그 추가
  _link;
  _previousGuideMessage = null;
  _previousMessage = null;

  constructor() {
    super();
    this._md = new MobileDetect(window.navigator.userAgent);
    this.captureStopped = false;
    this.moduleLoaded = false;
    this._isIpad = /Macintosh|iPad/i.test(navigator.userAgent) && navigator.maxTouchPoints && navigator.maxTouchPoints > 1;

    this._isIOS = /Macintosh|iPad|iPhone|iPod/i.test(navigator.userAgent);

    if (this._isIOS) {
      let iosVersion = /(Macintosh|iPad|iPhone|iPod) OS ([1-9]*)/g.exec(window.navigator.userAgent)?.[2] || 0;
      iosVersion = String(iosVersion);
      this._isSwapWH = iosVersion.startsWith("16");
    }
  }

  get md() {
    return this._md;
  }

  isLandscape() {
    if (screen.orientation && screen.orientation.type) {
      return screen.orientation.type.startsWith("landscape");
    } else if (typeof window.orientation !== "undefined") {
      // Note: window.orientation is deprecated, use with caution
      return Math.abs(window.orientation) == 90; // 90 또는 -90이면 가로 모드
    } else {
      console.warn("Unable to determine orientation");
      return false;
    }
  }

  get pictureWidth() {
    return this._pictureWidth;
  }

  set pictureWidth(value) {
    //값이 0으로 넘어오는 경우가 있음. 실제 대입하는 값은 0이 아닌데..
    if (value > 0) {
      this._pictureWidth = value;
    }
  }

  get pictureHeight() {
    return this._pictureHeight;
  }

  set pictureHeight(value) {
    if (value > 0) {
      this._pictureHeight = value;
    }
  }

  async setOptions(options) {
    this._options = options;
    this._useCapOcr = this._options.useCapOcr;
    this._initUseCapOcr = this._useCapOcr;
    this._takePhoto = this._options.takePhoto;

    try {
      // await navigator.mediaDevices.getUserMedia({ video: true });
    } catch (err) {
      console.error("Error requesting camera permission:", err);
      // Handle permission denied or other errors
      return;
    }

    if (!this._webCameraOptionsSet) {
      this._webCameraOptionsSet = true;
      this.initializeComponents(options.containerId);
    }
    // if (!this._shutterSound) {
    //   if (this._options.useDemo) {
    //     this._shutterSound = new Audio("/koiOcr/images/camera_audio.mp3");
    //   } else {
    //     this._shutterSound = new Audio("images/camera_audio.mp3");
    //   }
    // }
  }

  initializeComponents(containerId) {
    this.createElement(containerId);
    this._initEventHandler();
    this.unload();
  }

  async changeOcrType(ocrType) {
    if (ocrType == undefined) {
      return;
    }

    this._ocrType = null;
    if (this._ocrType == ocrType) {
      return;
    }
    this._ocrType = ocrType;
    this._isReversed = false;
    this._resetUI();

    if (this._ocrType == 16) {
      this._options.useDetect = true;
    }

    if (this._options.useDetect && !this._detectWorker) {
      if (this._options.useDemo) {
        this._detectWorker = new Worker("/koiOcr/js/koiOcr/detectWorker.js"); // demo
      } else {
        this._detectWorker = new Worker("js/koiOcr/detectWorker.js");
      }
    }

    await this.loadDetactModule(this._ocrType);

    this._videoRef.style.objectFit = "cover";
    this._captureInProgress = false;
    this._detectInProgress = false;
    this._isStartInProgress = false;
    this._successfulDetectionCalled = false;
  }

  _resetUI() {
    this._letterboxTop.innerHTML = "";
    this._letterboxBottom.innerHTML = "";
    this._guideArea.innerHTML = "";

    this._guideArea.style.backgroundColor = "transparent";
    this._vertical = null;
    const containerSize = this._getContainerSize();
    const videoSize = this._calcVideoSize();
    const hspace = containerSize.width - videoSize.width;
    const vspace = containerSize.height - videoSize.height;

    this._title = document.createElement("div");
    this._title.id = "letterTop-title";
    this._title.setAttribute("role", "alert"); // 스크린 리더가 읽도록 설정
    this._title.setAttribute("aria-live", "assertive");
    this._title.setAttribute("tabindex", "0");
    this._guideArea.appendChild(this._title);
    this._title.innerHTML = "가이드 영역에 맞춰 촬영해주세요.";

    const oldContainerDisplay = this._container.display;
    this._container.display = "none";
    if (hspace > vspace) {
      this._vertical = 0;
      this._letterboxTop.style.display = "inline";
      this._letterboxTop.style.top = `0px`;
      this._letterboxTop.style.bottom = null;
      this._letterboxTop.style.left = `0px`;
      this._letterboxTop.style.right = null;
      this._letterboxTop.style.width = `${hspace / 2}px`;
      this._letterboxTop.style.height = `100%`;

      this._videoWrapper.style.display = "inline";
      this._videoWrapper.style.left = `${hspace / 2}px`;
      this._videoWrapper.style.right = null;
      this._videoWrapper.style.top = `0px`;
      this._videoWrapper.style.bottom = null;
      this._videoWrapper.style.width = `${videoSize.width}px`;
      this._videoWrapper.style.height = `100%`;

      this._letterboxBottom.style.display = "inline";
      this._letterboxBottom.style.left = null;
      this._letterboxBottom.style.right = `0px`;
      this._letterboxBottom.style.top = `0px`;
      this._letterboxBottom.style.bottom = null;
      this._letterboxBottom.style.width = `${hspace / 2}px`;
      this._letterboxBottom.style.height = `100%`;
    } else {
      this._vertical = 1;
      this._letterboxTop.style.display = "block";
      this._letterboxTop.style.top = `0px`;
      this._letterboxTop.style.bottom = null;
      this._letterboxTop.style.left = `0px`;
      this._letterboxTop.style.right = null;
      this._letterboxTop.style.width = `100%`;
      this._letterboxTop.style.height = `${vspace / 2}px`;

      this._videoWrapper.style.display = "block";
      this._videoWrapper.style.width = `100%`;
      this._videoWrapper.style.left = `0px`;
      this._videoWrapper.style.right = null;
      this._videoWrapper.style.top = `${vspace / 2}px`;
      this._videoWrapper.style.bottom = null;
      this._videoWrapper.style.height = `${videoSize.height}px`;

      this._videoRef.style.width = `${videoSize.width}px`;
      this._videoRef.style.height = `${videoSize.height}px`;

      this._letterboxBottom.style.display = "block";
      this._letterboxBottom.style.width = `100%`;
      this._letterboxBottom.style.height = `${vspace / 2}px`;
      this._letterboxBottom.style.left = `0px`;
      this._letterboxBottom.style.right = null;
      this._letterboxBottom.style.top = null;
      this._letterboxBottom.style.bottom = `0px`;
    }

    switch (this._ocrType) {
      case 1: {
        this.createIdCardGuide();
        break;
      }
      case 2: {
        this.createPassportGuide();
        break;
      }
      case 3: {
        this.createCreaditGuide();
        break;
      }
      case 4: {
        this.createQrcodeGuide();
        break;
      }
      case 5: {
        this.createSealCertGuide();
        break;
      }
      case 6: {
        this.createBizGuide();
        break;
      }
      case 7: {
        this.createCROP();
        break;
      }
      case 8: {
        this.createAccountGuide();
        break;
      }
      case 9: {
        this.createCheckGuide();
        break;
      }
      case 10: {
        this.createGiroGuide();
        break;
      }
      case 11: {
        this.createIDfake();
        break;
      }
      case 12: {
        this.createGiroEPN();
        break;
      }
      case 13: {
        this.createIDFACE();
        break;
      }
      case 14: {
        this.createDocsEdge();
        break;
      }
      case 15: {
        this.createFULLPAGE();
        break;
      }
      case 16: {
        this.createCROPLIVE();
        break;
      }
    }

    this._container.display = oldContainerDisplay;
    this.loadVideoSource();
  }

  createIdCardGuide() {
    // this._guideArea.style.border = "3px solid yellow";
    this._guideArea.style.zIndex = "10006";

    this._innerGuideBox = document.createElement("div");
    this._innerGuideBox.style.position = "absolute";
    this._innerGuideBox.style.top = "0";
    this._innerGuideBox.style.left = "2%";
    this._innerGuideBox.style.width = "96%";
    this._innerGuideBox.style.height = "100%";
    this._innerGuideBox.style.padding = "0";
    this._innerGuideBox.style.margin = "0";
    this._innerGuideBox.style.border = "none"; // 기존 테두리 제거
    this._innerGuideBox.style.pointerEvents = "none"; // 클릭 이벤트 방지
    this._innerGuideBox.style.boxSizing = "border-box";
    this._innerGuideBox.className = "innerGuideBox";
    this._guideArea.appendChild(this._innerGuideBox);

    // 꺽쇠 추가 함수
    const createCorner = (content, position) => {
      const corner = document.createElement("div");
      corner.textContent = content; // 꺽쇠 모양
      corner.style.position = "absolute";
      corner.style.color = "yellow"; // 꺽쇠 색상
      corner.style.fontSize = "80px"; // 꺽쇠 크기
      corner.style.lineHeight = "1"; // 줄 높이를 최소화
      corner.style.pointerEvents = "none"; // 클릭 방지

      // 위치에 따라 스타일 지정
      if (position === "top-left") {
        corner.style.top = "0";
        corner.style.left = "0";
      } else if (position === "top-right") {
        corner.style.top = "0";
        corner.style.right = "0";
      } else if (position === "bottom-left") {
        corner.style.bottom = "0";
        corner.style.left = "0";
      } else if (position === "bottom-right") {
        corner.style.bottom = "0";
        corner.style.right = "0";
      }

      return corner;
    };

    // 꺽쇠 요소 추가
    this._innerGuideBox.appendChild(createCorner("⌜", "top-left"));
    this._innerGuideBox.appendChild(createCorner("⌝", "top-right"));
    this._innerGuideBox.appendChild(createCorner("⌞", "bottom-left"));
    this._innerGuideBox.appendChild(createCorner("⌟", "bottom-right"));
  }

  createIDfake() {
    // this._guideArea.style.border = "3px solid yellow";
    this._guideArea.style.zIndex = "10006";

    this._innerGuideBox = document.createElement("div");
    this._innerGuideBox.style.position = "absolute";
    this._innerGuideBox.style.top = "0";
    this._innerGuideBox.style.left = "2%";
    this._innerGuideBox.style.width = "96%";
    this._innerGuideBox.style.height = "100%";
    this._innerGuideBox.style.padding = "0";
    this._innerGuideBox.style.margin = "0";
    this._innerGuideBox.style.border = "none"; // 기존 테두리 제거
    this._innerGuideBox.style.pointerEvents = "none"; // 클릭 이벤트 방지
    this._innerGuideBox.style.boxSizing = "border-box";
    this._innerGuideBox.className = "innerGuideBox";
    this._guideArea.appendChild(this._innerGuideBox);

    // 꺽쇠 추가 함수
    const createCorner = (content, position) => {
      const corner = document.createElement("div");
      corner.textContent = content; // 꺽쇠 모양
      corner.style.position = "absolute";
      corner.style.color = "yellow"; // 꺽쇠 색상
      corner.style.fontSize = "80px"; // 꺽쇠 크기
      corner.style.lineHeight = "1"; // 줄 높이를 최소화
      corner.style.pointerEvents = "none"; // 클릭 방지
      // corner.style.transform = "translateY(-50%)";

      // 위치에 따라 스타일 지정
      if (position === "top-left") {
        corner.style.top = "0";
        corner.style.left = "0";
      } else if (position === "top-right") {
        corner.style.top = "0";
        corner.style.right = "0";
      } else if (position === "bottom-left") {
        corner.style.bottom = "0";
        corner.style.left = "0";
      } else if (position === "bottom-right") {
        corner.style.bottom = "0";
        corner.style.right = "0";
      }

      return corner;
    };

    // 꺽쇠 요소 추가
    this._innerGuideBox.appendChild(createCorner("⌜", "top-left"));
    this._innerGuideBox.appendChild(createCorner("⌝", "top-right"));
    this._innerGuideBox.appendChild(createCorner("⌞", "bottom-left"));
    this._innerGuideBox.appendChild(createCorner("⌟", "bottom-right"));
  }

  createCreaditGuide() {
    // this._guideArea.style.border = "3px solid yellow";
    this._guideArea.style.zIndex = "10006";

    this._innerGuideBox = document.createElement("div");
    this._innerGuideBox.style.position = "absolute";
    this._innerGuideBox.style.top = "0";
    this._innerGuideBox.style.left = "2%";
    this._innerGuideBox.style.width = "96%";
    this._innerGuideBox.style.height = "100%";
    this._innerGuideBox.style.padding = "0";
    this._innerGuideBox.style.margin = "0";
    this._innerGuideBox.style.border = "none"; // 기존 테두리 제거
    this._innerGuideBox.style.pointerEvents = "none"; // 클릭 이벤트 방지
    this._innerGuideBox.style.boxSizing = "border-box";
    this._innerGuideBox.className = "innerGuideBox";
    this._guideArea.appendChild(this._innerGuideBox);

    // 꺽쇠 추가 함수
    const createCorner = (content, position) => {
      const corner = document.createElement("div");
      corner.textContent = content; // 꺽쇠 모양
      corner.style.position = "absolute";
      corner.style.color = "yellow"; // 꺽쇠 색상
      corner.style.fontSize = "80px"; // 꺽쇠 크기
      corner.style.lineHeight = "1"; // 줄 높이를 최소화
      corner.style.pointerEvents = "none"; // 클릭 방지

      // 위치에 따라 스타일 지정
      if (position === "top-left") {
        corner.style.top = "0";
        corner.style.left = "0";
      } else if (position === "top-right") {
        corner.style.top = "0";
        corner.style.right = "0";
      } else if (position === "bottom-left") {
        corner.style.bottom = "0";
        corner.style.left = "0";
      } else if (position === "bottom-right") {
        corner.style.bottom = "0";
        corner.style.right = "0";
      }

      return corner;
    };

    // 꺽쇠 요소 추가
    this._innerGuideBox.appendChild(createCorner("⌜", "top-left"));
    this._innerGuideBox.appendChild(createCorner("⌝", "top-right"));
    this._innerGuideBox.appendChild(createCorner("⌞", "bottom-left"));
    this._innerGuideBox.appendChild(createCorner("⌟", "bottom-right"));

    this._orientationChangeButton = document.createElement("button");
    this._orientationChangeButton.id = "orientationchange";
    this._orientationChangeButton.style.position = "absolute";
    this._orientationChangeButton.style.bottom = "9%";
    this._orientationChangeButton.style.right = "7%";
    this._orientationChangeButton.style.backgroundColor = "transparent";
    this._orientationChangeButton.style.border = "transparent";

    // 아이콘 이미지 추가
    const icon = document.createElement("img");
    if (this._options.useDemo) {
      icon.src = "/koiOcr/images/360-camera_1-removebg.png"; // 아이콘 경로
    } else {
      icon.src = "images/360-camera_1-removebg.png"; // 아이콘 경로
    }
    icon.alt = "카메라 전환";
    icon.style.width = "50px"; // 아이콘 크기
    icon.style.height = "50px";
    icon.style.backgroundColor = "transparent";
    this._orientationChangeButton.appendChild(icon);

    this._guideArea.appendChild(this._orientationChangeButton);

    this._orientationChangeButton.addEventListener("click", () => {
      this._isReversed = !this._isReversed;
      this._resetUI();
    });
  }

  createSealCertGuide() {
    this._guideArea.style.border = "3px solid yellow";
    this._guideArea.style.zIndex = "10006";
  }

  createBizGuide() {
    this._guideArea.style.border = "3px solid yellow";
    this._guideArea.style.zIndex = "10006";
  }

  createDocsEdge() {
    this._guideArea.style.border = "3px solid yellow";
    this._guideArea.style.zIndex = "10006";
  }
  createCROP() {
    this._guideArea.style.border = "3px solid yellow";
    this._guideArea.style.zIndex = "10006";
  }
  createIDFACE() {
    this._guideArea.style.border = "3px solid yellow";
    this._guideArea.style.zIndex = "10006";
  }
  createFULLPAGE() {
    this._guideArea.style.border = "3px solid yellow";
    this._guideArea.style.zIndex = "10006";
  }

  createCROPLIVE() {
    // this._guideArea.style.border = "3px solid yellow";
    this._guideArea.style.zIndex = "10006";

    // 가이드 박스 생성
    this._innerGuideBox = document.createElement("div");
    this._innerGuideBox.style.position = "absolute";
    this._innerGuideBox.style.top = "0";
    this._innerGuideBox.style.left = "2%";
    this._innerGuideBox.style.width = "96%";
    this._innerGuideBox.style.height = "100%";
    this._innerGuideBox.style.padding = "0";
    this._innerGuideBox.style.margin = "0";
    this._innerGuideBox.style.border = "none"; // 기존 테두리 제거
    this._innerGuideBox.style.pointerEvents = "none"; // 클릭 이벤트 방지
    this._innerGuideBox.style.boxSizing = "border-box";
    this._innerGuideBox.className = "innerGuideBox";
    this._guideArea.appendChild(this._innerGuideBox);

    // 꺽쇠 추가 함수
    const createCorner = (content, position) => {
      const corner = document.createElement("div");
      corner.textContent = content; // 꺽쇠 모양
      corner.style.position = "absolute";
      corner.style.color = "yellow"; // 꺽쇠 색상
      corner.style.fontSize = "80px"; // 꺽쇠 크기
      corner.style.lineHeight = "1"; // 줄 높이를 최소화
      corner.style.pointerEvents = "none"; // 클릭 방지

      // 위치에 따라 스타일 지정
      if (position === "top-left") {
        corner.style.top = "0";
        corner.style.left = "0";
      } else if (position === "top-right") {
        corner.style.top = "0";
        corner.style.right = "0";
      } else if (position === "bottom-left") {
        corner.style.bottom = "0";
        corner.style.left = "0";
      } else if (position === "bottom-right") {
        corner.style.bottom = "0";
        corner.style.right = "0";
      }

      return corner;
    };

    // 꺽쇠 요소 추가
    this._innerGuideBox.appendChild(createCorner("⌜", "top-left"));
    this._innerGuideBox.appendChild(createCorner("⌝", "top-right"));
    this._innerGuideBox.appendChild(createCorner("⌞", "bottom-left"));
    this._innerGuideBox.appendChild(createCorner("⌟", "bottom-right"));

    this._orientationChangeButton = document.createElement("button");
    this._orientationChangeButton.id = "orientationchange";
    this._orientationChangeButton.style.position = "absolute";
    this._orientationChangeButton.style.bottom = "9%";
    this._orientationChangeButton.style.right = "7%";
    this._orientationChangeButton.style.backgroundColor = "transparent";
    this._orientationChangeButton.style.border = "transparent";

    // 아이콘 이미지 추가
    const icon = document.createElement("img");
    if (this._options.useDemo) {
      icon.src = "/koiOcr/images/360-camera_1-removebg.png"; // 아이콘 경로
    } else {
      icon.src = "images/360-camera_1-removebg.png"; // 아이콘 경로
    }
    icon.alt = "카메라 전환";
    icon.style.width = "50px"; // 아이콘 크기
    icon.style.height = "50px";
    icon.style.backgroundColor = "transparent";
    this._orientationChangeButton.appendChild(icon);

    this._guideArea.appendChild(this._orientationChangeButton);

    this._orientationChangeButton.addEventListener("click", () => {
      this._isReversed = !this._isReversed;
      this._resetUI();
    });
  }

  createPassportGuide() {
    const uncoveredAreaTop = document.createElement("div");
    const uncoveredAreaBottom = document.createElement("div");
    const mrzFace = document.createElement("div"); // 새로운 div 엘리먼트 생성

    // 새로운 uncovered-area에 클래스를 추가합니다.
    uncoveredAreaTop.classList.add("uncovered-area", "uncovered-area-top");
    uncoveredAreaBottom.classList.add("uncovered-area", "uncovered-area-bottom");

    // 윗 영역 스타일을 수정합니다.
    uncoveredAreaTop.style.backgroundColor = "rgba(169, 169, 169, 0.6)";
    uncoveredAreaTop.style.width = "100%";
    uncoveredAreaTop.style.height = "75%";
    uncoveredAreaTop.style.top = "0px";
    // uncoveredAreaTop.style.bottom = "4rem";
    uncoveredAreaTop.style.position = "absolute";
    uncoveredAreaTop.style.zIndex = "10020";

    uncoveredAreaBottom.style.border = "3px solid yellow";
    uncoveredAreaBottom.style.width = "100%";
    uncoveredAreaBottom.style.height = "25%";
    uncoveredAreaBottom.style.zIndex = "10205";
    uncoveredAreaBottom.style.position = "absolute";
    uncoveredAreaBottom.style.bottom = "0px";

    mrzFace.classList.add("mrz_face");
    mrzFace.style.position = "absolute";
    mrzFace.style.width = "27%";
    mrzFace.style.height = "60%";
    mrzFace.style.top = "30%";
    mrzFace.style.left = "5%";
    mrzFace.style.backgroundImage = "url('images/faceline.png')";
    mrzFace.style.backgroundSize = "cover";
    mrzFace.style.backgroundPosition = "center";

    this._letterboxTop.style.backgroundColor = "rgba(255, 255, 255, 0)";

    this._uncoveredAreaTop = uncoveredAreaTop;
    this._uncoveredAreaBottom = uncoveredAreaBottom;
    this._guideArea.appendChild(uncoveredAreaTop);
    this._guideArea.appendChild(uncoveredAreaBottom);
    uncoveredAreaTop.appendChild(mrzFace);
  }

  createDocumentGuide() {}

  createCornerHighlight(parentElement, character, vertical, horizontal) {
    const cornerHighlight = document.createElement("div");
    cornerHighlight.classList.add("corner-highlight");
    cornerHighlight.style.position = "absolute";
    cornerHighlight.style.width = "20px"; // Adjust the size as needed
    cornerHighlight.style.height = "20px"; // Adjust the size as needed
    cornerHighlight.style.color = "#fff"; // White color
    cornerHighlight.style[vertical] = "0";
    cornerHighlight.style[horizontal] = "0";
    cornerHighlight.style.fontSize = "60px"; // Adjust the font size as needed
    cornerHighlight.textContent = character;

    parentElement.appendChild(cornerHighlight);
  }

  createQrcodeGuide() {
    // Create a div for QR code area box

    this._guideArea.style.border = "3px solid yellow";
    this._guideArea.style.zIndex = "10006";

    // this._guideArea.setAttribute("style", "border: 3px solid yellow; z-index:10006;");

    const qrCodeBox = document.createElement("div");
    qrCodeBox.classList.add("qr-code-box");

    // Add styles to highlight the corners of the QR code area
    qrCodeBox.style.position = "absolute";
    qrCodeBox.style.top = "10%";
    qrCodeBox.style.left = "18%";
    qrCodeBox.style.width = "60%";
    qrCodeBox.style.height = "60%";
    qrCodeBox.style.borderRadius = "10px"; // Rounded corners

    // Add corner highlights
    this.createCornerHighlight(qrCodeBox, "⌜", "top", "left");
    this.createCornerHighlight(qrCodeBox, "⌝", "top", "right");
    this.createCornerHighlight(qrCodeBox, "⌞", "bottom", "left");
    this.createCornerHighlight(qrCodeBox, "⌟", "bottom", "right");

    // Add the QR code box to the guideArea
    this._guideArea.appendChild(qrCodeBox);
  }

  createAccountGuide() {
    this._guideArea.style.border = "3px solid yellow";
    this._guideArea.style.zIndex = "10006";
  }

  createCheckGuide() {
    this._guideArea.style.border = "3px solid yellow";
    this._guideArea.style.zIndex = "10006";
  }

  createGiroGuide() {
    this._guideArea.style.border = "3px solid yellow";
    this._guideArea.style.zIndex = "10006";

    // const topPadding = document.createElement("div");
    // topPadding.style.position = "absolute";
    // topPadding.style.top = "0px";
    // topPadding.style.left = "0px";
    // topPadding.style.width = "100%";
    // topPadding.style.height = "37.5%";
    // topPadding.style.backgroundColor = "rgba(169, 169, 169, 0.6)";

    // const sampleBox = document.createElement("div");
    // sampleBox.classList.add("fade-out-box");
    // sampleBox.style.border = "2px solid red";
    // sampleBox.style.position = "absolute";
    // sampleBox.style.top = "37.5%";
    // sampleBox.style.left = "0px";
    // sampleBox.style.width = "100%";
    // sampleBox.style.height = "25%";
    // sampleBox.style.backgroundImage = "url('images/giro_sample.jpg')";
    // sampleBox.style.backgroundSize = "contain";
    // sampleBox.style.backgroundPosition = "center";
    // sampleBox.style.backgroundRepeat = "no-repeat";

    // const guideBox = document.createElement("div");
    // guideBox.style.border = "2px solid red";
    // guideBox.style.position = "absolute";
    // guideBox.style.top = "37.5%";
    // guideBox.style.left = "0px";
    // guideBox.style.width = "100%";
    // guideBox.style.height = "25%";
    // guideBox.style.backgroundImage = "url('images/giro_guide.png')";
    // guideBox.style.backgroundSize = "contain";
    // guideBox.style.backgroundPosition = "center";
    // guideBox.style.backgroundRepeat = "no-repeat";

    // const bottomPadding = document.createElement("div");
    // bottomPadding.style.position = "absolute";
    // bottomPadding.style.bottom = "0px";
    // bottomPadding.style.left = "0px";
    // bottomPadding.style.width = "100%";
    // bottomPadding.style.height = "37.5%";
    // bottomPadding.style.backgroundColor = "rgba(169, 169, 169, 0.6)";

    // this._guideArea.appendChild(topPadding);
    // this._guideArea.appendChild(bottomPadding);
    // this._guideArea.appendChild(sampleBox);
    // this._guideArea.appendChild(guideBox);
  }

  createGiroEPN() {
    // this._guideArea.style.border = "3px solid yellow";
    // this._guideArea.style.zIndex = "10006";

    const topPadding = document.createElement("div");
    topPadding.style.position = "absolute";
    topPadding.style.top = "0px";
    topPadding.style.left = "0px";
    topPadding.style.width = "100%";
    topPadding.style.height = "42.5%";
    topPadding.style.backgroundColor = "rgba(169, 169, 169, 0.6)";

    const guideBox = document.createElement("div");
    guideBox.style.border = "2px solid red";
    guideBox.style.position = "absolute";
    guideBox.style.top = "42.5%";
    guideBox.style.left = "40%";
    guideBox.style.width = "60%";
    guideBox.style.height = "15%";

    const outguideBox = document.createElement("div");
    outguideBox.style.position = "absolute";
    // outguideBox.style.border = "2px solid red";
    outguideBox.style.top = "42.5%";
    outguideBox.style.left = "0px";
    outguideBox.style.width = "40%";
    outguideBox.style.height = "15%";
    outguideBox.style.backgroundColor = "rgba(169, 169, 169, 0.6)";
    outguideBox.style.backgroundImage = "url('images/giro_epn.png')";
    outguideBox.style.backgroundSize = "cover";
    outguideBox.style.backgroundPosition = "center";
    outguideBox.style.backgroundRepeat = "no-repeat";

    // const rightPadding = document.createElement("div");
    // rightPadding.style.position = "absolute";
    // rightPadding.style.top = "42.5%";
    // rightPadding.style.left = "90%";
    // rightPadding.style.width = "10%";
    // rightPadding.style.height ="15%";
    // rightPadding.style.backgroundColor = "rgba(169, 169, 169, 0.6)";

    const bottomPadding = document.createElement("div");
    bottomPadding.style.position = "absolute";
    bottomPadding.style.bottom = "0px";
    bottomPadding.style.left = "0px";
    bottomPadding.style.width = "100%";
    bottomPadding.style.height = "42.5%";
    bottomPadding.style.backgroundColor = "rgba(169, 169, 169, 0.6)";

    this._guideArea.appendChild(topPadding);
    this._guideArea.appendChild(bottomPadding);
    // this._guideArea.appendChild(sampleBox);
    this._guideArea.appendChild(outguideBox);
    this._guideArea.appendChild(guideBox);
  }

  getCropImage(ocrType) {
    this.pictureWidth = this._videoRef.videoWidth;
    this.pictureHeight = this._videoRef.videoHeight;

    const swapSize = this._isSwapWH && !this.isLandscape();
    if (swapSize) {
      let temp = this.pictureWidth;
      this.pictureWidth = this.pictureHeight;
      this.pictureHeight = temp;
    }

    const coordinates = this.convertGuideAreaCoordinates(this._guideArea, this._container, this._uncoveredArea, ocrType);

    let cropX = coordinates.x;
    let cropY = coordinates.y;
    let cropWidth = coordinates.width;
    let cropHeight = coordinates.height;

    if (swapSize && ocrType == 2) {
      cropX += 130;
      cropY -= 60;
      cropWidth -= 260;
      cropHeight -= 50;
    }

    const canvasRef = this._canvasRef;

    canvasRef.width = this.pictureWidth;
    canvasRef.height = this.pictureHeight;

    const ctx = canvasRef.getContext("2d");

    ctx.drawImage(this._videoRef, 0, 0, this.pictureWidth, this.pictureHeight);

    //for test 이미지 및 카메라 속성 확인용
    const printObj = {
      swapSize: swapSize,
      videoWidth: this._videoRef.videoWidth,
      videoHeight: this._videoRef.videoHeight,
      isIOS: this._isIOS,
      isIpad: this._isIpad,
      isLandscape: this.isLandscape(),
      userAgent: navigator.userAgent,
      _stream_settings: this._stream_settings,
    };

    // const div = document.createElement("div");
    // div.style.wordBreak = "break-word";
    // div.innerText = JSON.stringify(printObj);
    // document.querySelector(".result-section").appendChild(div);

    // const img2 = document.createElement("img");
    // img2.src = canvasRef.toDataURL();
    // document.querySelector(".result-section").appendChild(img2);

    // IDCARD인 경우 리사이징
    // if (ocrType == 1) {
    //   const resizedCanvas = document.createElement("canvas");
    //   const resizedCtx = resizedCanvas.getContext("2d");

    //   const targetWidth = 640;
    //   const targetHeight = 480;

    //   resizedCanvas.width = targetWidth;
    //   resizedCanvas.height = targetHeight;

    //   resizedCtx.drawImage(canvasRef, cropX, cropY, cropWidth, cropHeight, 0, 0, targetWidth, targetHeight);

    //   cropWidth = targetWidth;
    //   cropHeight = targetHeight;

    //   cropWidth = Math.floor(cropWidth);
    //   cropHeight = Math.floor(cropHeight);
    //   const imageData = resizedCtx.getImageData(0, 0, cropWidth, cropHeight);

    //   return { imageData, cropWidth, cropHeight };
    // }

    const croppedCanvas = document.createElement("canvas");
    const croppedCtx = croppedCanvas.getContext("2d");

    croppedCanvas.width = cropWidth;
    croppedCanvas.height = cropHeight;

    croppedCtx.drawImage(canvasRef, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
    cropWidth = Math.floor(cropWidth);
    cropHeight = Math.floor(cropHeight);

    const imageData = croppedCtx.getImageData(0, 0, cropWidth, cropHeight);

    // if (!this._a) {
    const croppedImageData = canvasRef.toDataURL("image/png");
    this._link = document.createElement("a");
    this._link.href = croppedImageData;
    this._link.download = "getCropImage.png";
    // link.click();

    //   const div = document.createElement("div");
    //   div.style.wordBreak = "break-word";
    //   div.innerText = JSON.stringify(printObj);
    //   document.querySelector(".result-section").appendChild(div);

    //   this._a = true;
    // }

    return { imageData, cropWidth, cropHeight };
  }

  convertGuideAreaCoordinates(guideArea, container, uncoveredArea, ocrType, swapSize) {
    var containerStyle = window.getComputedStyle(container);
    var containerRect = container.getBoundingClientRect();
    var guideAreaRect = guideArea.getBoundingClientRect();

    // guideArea의 현재 좌표를 계산합니다.
    var left = guideAreaRect.left - containerRect.left;
    var top = guideAreaRect.top - containerRect.top;

    // 크롭 영역 초기화
    var cropWidth = 0;
    var cropHeight = 0;
    var guideAreaX = 0;
    var guideAreaY = 0;

    var fitWidth = this.pictureWidth / guideAreaRect.width <= this.pictureHeight / guideAreaRect.height;

    // 세로가 더 큰 경우에 대한 처리
    if (fitWidth) {
      switch (ocrType) {
        // case OCR_TYPE.IDCARD: //
        //   cropWidth = this.pictureWidth;
        //   cropHeight = (this.pictureWidth * guideAreaRect.height) / guideAreaRect.width;
        //   cropHeight = cropHeight * 0.55;
        //   cropWidth = cropWidth * 0.68;
        //   guideAreaY = cropHeight * 0.4;
        //   guideAreaX = this.pictureWidth * 0.25;
        //   break;
        case OCR_TYPE.PASSPORT: //
          cropWidth = this.pictureWidth;
          cropHeight = (this.pictureWidth * guideAreaRect.height) / guideAreaRect.width;
          guideAreaY = (this.pictureHeight - cropHeight) / 2;
          guideAreaX = 0;
          guideAreaY += (cropHeight * 3) / 4;
          cropHeight = cropHeight / 4;
          break;
        case OCR_TYPE.GIROEPN: //
          cropWidth = this.pictureWidth;
          cropHeight = (this.pictureWidth * guideAreaRect.height) / guideAreaRect.width;
          cropWidth = cropWidth * 0.6;
          cropHeight = cropHeight * 0.15;
          guideAreaY = (this.pictureHeight - cropHeight) / 2;
          guideAreaX = this.pictureWidth * 0.4;
          break;
        // case OCR_TYPE.GIRO: //
        //   cropWidth = this.pictureWidth;
        //   cropHeight = (this.pictureWidth * guideAreaRect.height) / guideAreaRect.width;
        //   cropHeight = cropHeight * (2 / 8);

        //   guideAreaY = (this.pictureHeight - cropHeight) / 2;
        //   guideAreaX = (this.pictureWidth - cropWidth) / 2;
        //   break;
        default:
          cropWidth = this.pictureWidth;
          cropHeight = (this.pictureWidth * guideAreaRect.height) / guideAreaRect.width;
          guideAreaY = (this.pictureHeight - cropHeight) / 2;
          guideAreaX = 0;
          // 다른 OCR_TYPE에 대한 처리 추가
          break;
      }
    } else {
      switch (ocrType) {
        case OCR_TYPE.PASSPORT:
          // OCR_TYPE.PASSPORT에 대한 처리 추가
          cropHeight = this.pictureHeight;
          cropWidth = (this.pictureHeight * guideAreaRect.width) / guideAreaRect.height;
          guideAreaY = 0;
          guideAreaX = (this.pictureWidth - cropWidth) / 2;
          guideAreaY += (cropHeight * 3) / 4;
          cropHeight = cropHeight / 4;
          break;
        case OCR_TYPE.GIROEPN:
          cropHeight = this.pictureHeight;
          cropWidth = (this.pictureHeight * guideAreaRect.width) / guideAreaRect.height;
          cropWidth = cropWidth * 0.6;
          // cropWidth = cropWidth * (2 / 8);
          cropHeight = cropHeight * 0.15;
          guideAreaY = (this.pictureHeight - cropHeight) / 2;
          guideAreaX = this.pictureWidth * 0.4;
          // guideAreaX = this.pictureWidth / 2 - cropWidth / 2;
          break;
        // case OCR_TYPE.GIRO: //
        //   cropHeight = this.pictureHeight;
        //   cropWidth = (this.pictureHeight * guideAreaRect.width) / guideAreaRect.height;
        //   cropWidth = cropWidth * (2 / 8);

        //   guideAreaY = (this.pictureHeight - cropHeight) / 2;
        //   guideAreaX = (this.pictureWidth - cropWidth) / 2;
        //   break;
        default:
          cropHeight = this.pictureHeight;
          cropWidth = (this.pictureHeight * guideAreaRect.width) / guideAreaRect.height;
          guideAreaY = 0;
          guideAreaX = (this.pictureWidth - cropWidth) / 2;
          // 다른 OCR_TYPE에 대한 처리 추가
          break;
      }
    }

    var coordinates = {
      x: guideAreaX,
      y: guideAreaY,
      width: cropWidth,
      height: cropHeight,
    };

    return coordinates;
  }

  getVideoRatio(ocrType) {
    let ratio = { width: 4, height: 3 }; // 기본 비율

    switch (ocrType) {
      case OCR_TYPE.IDCARD:
      case OCR_TYPE.PASSPORT:
      case OCR_TYPE.QRCODE:
        ratio = { width: 4, height: 3 };
        break;
      case OCR_TYPE.CREDITCARD:
        ratio = { width: 1, height: 0.65 };
        break;
      case OCR_TYPE.SEALCERT:
      case OCR_TYPE.BIZREGCERT:
      case OCR_TYPE.CROP:
      case OCR_TYPE.IDFACE:
      case OCR_TYPE.FULLPAGE:
      case OCR_TYPE.CROPLIVE:
        ratio = { width: 1, height: 1.4 };
        break;
      case OCR_TYPE.ACCOUNT:
        ratio = { width: 2, height: 1 };
        break;
      case OCR_TYPE.CHECK:
        ratio = { width: 40, height: 17 };
        break;
      case OCR_TYPE.GIRO:
      case OCR_TYPE.GIROEPN:
        ratio = { width: 13, height: 8 };
        break;
      default:
        ratio = { width: 4, height: 3 };
    }

    // 비율 반전 여부에 따라 width와 height 값을 반전
    if (this._isReversed) {
      return { width: ratio.height, height: ratio.width };
    }

    return ratio;
  }

  createElement(containerId) {
    this._container = document.querySelector(containerId);

    // top or left letter box
    this._letterboxTop = document.createElement("div");
    this._letterboxTop.classList.add("background", "top");
    this._letterboxTop.setAttribute("style", "display: block !important;");
    this._container.appendChild(this._letterboxTop);

    // create video wrapper
    this._videoWrapper = document.createElement("div");
    this._videoWrapper.classList.add("wrapper");
    this._videoWrapper.style.position = "absolute";

    // video
    this._videoRef = document.createElement("video");
    this._videoRef.id = "kwcVideo";
    this._videoRef.classList.add("video");
    this._videoRef.autoplay = "autoplay";
    this._videoRef.WebKitPlaysInline = true;
    this._videoRef.setAttribute("playsinline", true);
    this._videoRef.muted = true;
    this._videoRef.setAttribute("muted", true);
    this._videoRef.setAttribute("aria-hidden", "true");

    // canvas
    this._canvasRef = document.createElement("canvas");
    this._canvasRef.id = "kwcCanvas";
    this._canvasRef.classList.add("canvas");
    this._canvasRef.setAttribute("style", "display: none;");

    // guide
    this._guideArea = document.createElement("div");
    this._guideArea.id = "kwcGuideArea";
    this._guideArea.style.position = "absolute";
    this._guideArea.style.width = "100%";
    this._guideArea.style.height = "100%";

    // this._orientationChangeButton = document.createElement("button");
    // this._orientationChangeButton.id = "orientationchange";
    // this._orientationChangeButton.style.position = "absolute";
    // this._orientationChangeButton.style.bottom = "0";
    // this._orientationChangeButton.style.right = "3%";
    // this._orientationChangeButton.textContent = "카메라 전환"; // Optional button text
    // this._guideArea.appendChild(this._orientationChangeButton);

    this._videoWrapper.appendChild(this._videoRef);
    this._videoWrapper.appendChild(this._canvasRef);
    this._videoWrapper.appendChild(this._guideArea);

    this._container.appendChild(this._videoWrapper);

    // bottom or right letter box
    this._letterboxBottom = document.createElement("div");
    this._letterboxBottom.classList.add("background", "bottom");
    this._container.appendChild(this._letterboxBottom);
  }

  _getContainerSize() {
    let oldDisplay = null;
    oldDisplay = this._container.style.display;
    this._container.style.display = "block";
    // Get the container size
    const sizeObj = {
      width: this._container.clientWidth,
      height: this._container.clientHeight, // Use offsetHeight instead of clientHeight
    };

    this._container.style.display = oldDisplay;

    return sizeObj;
  }

  _calcVideoSize() {
    const containerSize = this._getContainerSize();
    const videoRatio = this.getVideoRatio(this._ocrType);

    const wl = containerSize.width / videoRatio.width;
    const hl = containerSize.height / videoRatio.height;
    const minLength = Math.min(wl, hl);

    return {
      width: minLength * videoRatio.width,
      height: minLength * videoRatio.height,
    };
  }

  _initEventHandler() {
    this._videoRef.addEventListener("loadedmetadata", (event) => {
      this.dispatchEvent(new Event("webcamready"));
    });

    window.addEventListener("beforeunload", (event) => {
      this.unload();
      this.unloadDetect();
    });

    window.addEventListener("orientationchange", (event) => {
      this.unload();
      setTimeout(() => {
        this._resetUI();
      }, 300);
    });

    // this._orientationChangeButton.addEventListener("click", () => {
    //   this._isReversed = !this._isReversed;
    //   this._resetUI();
    // });
  }

  async unloadDetect() {
    if (this._detectWorker) {
      this._detectWorker.postMessage({ type: "unload" });

      const unloadResult = await new Promise((resolve) => {
        this._detectWorker.onmessage = (event) => {
          if (event.data.type == "unloadComplete") {
            resolve(true);
          }
        };
      });

      if (unloadResult) {
        // console.log("Detect module successfully unloaded.");
        this._detectWorker.terminate();
        this._detectWorker = null;
      }
    }
  }

  async getUsers() {
    try {
      const constraints = await this.getConstraints();
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("mediaStream: ",mediaStream);
      // this._mediaStream = mediaStream;
      return mediaStream;
    } catch (err) {
      console.log("err: ", err);
      if (err.name === "NotAllowedError") {
        // 기존 오류 메시지에 추가 설명을 덧붙여 새로운 에러 객체를 생성하여 던지기
        throw new Error(`${err.message}. \n\n카메라 사용 권한을 허용해 주세요.`);
      } else if (err.name === "NotReadableError") {
        // 'Device in use' 에러에 대한 추가 메시지 처리
        throw new Error(`${err.message}. \n\n다른 탭에서 카메라를 사용 중입니다.\n카메라를 종료하고 다시 시도하세요.`);
      } else {
        throw new Error(`An error occurred: ${err.message}`);
      }
    }
  }

  async loadVideoSource() {
    try {
      const mediaStream = await this.getUsers();
      this._stream_settings = mediaStream.getVideoTracks()[0].getSettings();
      this._mediaStream = mediaStream;

      if ("srcObject" in this._videoRef) {
        this._videoRef.srcObject = mediaStream;
      } else {
        this._videoRef.src = URL.createObjectURL(mediaStream);
      }
    } catch (err) {
      console.log(err);
      alert(err);
      throw err;
    }
  }

  async getConstraints() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const filteredDevices = devices.filter((v) => {
      return v.kind == "videoinput";
    });

    for (const device of filteredDevices) {
    }

    const deviceId = filteredDevices[filteredDevices.length - 1].deviceId;

    const constraints = {
      audio: false,
      video: {
        facingMode: { ideal: "environment" },
        zoom: true,
        focusMode: "continuous",
        width: 1920,
        height: 1080,
      },
    };

    if (/Android/i.test(navigator.userAgent)) {
      // console.log("This is an android device.");
      if (filteredDevices.length > 0) {
        constraints.video.deviceId = filteredDevices[filteredDevices.length - 1].deviceId;
      }
    } else if (this._isIOS) {
      var iOSVersion = this.getiOSVersion();
      constraints.video.width = 2560;
      constraints.video.height = 1440;
    } else {
      // console.log("Etc device : " + navigator.userAgent);
      //alert("Etc device : " + navigator.userAgent)
    }

    if (navigator.userAgent.includes("Firefox")) {
      this._isFireFox = true;
    }
    return constraints;
  }

  getiOSVersion() {
    var userAgent = navigator.userAgent || navigator.vendor || window.opera;
    var iOSVersionMatch = userAgent.match(/OS (\d+_\d+(_\d+)?)/i);

    if (iOSVersionMatch && iOSVersionMatch.length > 1) {
      return iOSVersionMatch[1].replace(/_/g, ".");
    }
    return null;
  }

  unload() {
    if (this._mediaStream) {
      this._mediaStream.getTracks().forEach((track) => track.stop());
      this._mediaStream = null;
      this._videoRef.srcObject = null;
    }
  }

  //move To Utils
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async stop() {
    this._captureinProgress = false;
    if (this._detectTimeoutId) {
      clearTimeout(this._detectTimeoutId);
      this._detectTimeoutId = null;
    }
    if (this._orientationChangeButton) {
      this._orientationChangeButton.remove(); // DOM에서 버튼 제거
      this._orientationChangeButton = null; // 참조를 null로 설정하여 메모리 해제
    }
  }

  // webCamera 객체의 startFile 메서드
  async startFile(eventDetail) {
    const { imageData, imageWidth, imageHeight } = eventDetail;
    const cropWidth = imageWidth;
    const cropHeight = imageHeight;
    // const validCheckDt = true;
    this._uploadImg = { imageData, cropWidth, cropHeight };
    this.start();
  }

  async start() {
    this._isStartInProgress = true;

    try {
      const options = this._options;
      // 수동 촬영 모드 처리
      if (this._useCapOcr == 2 || this._useCapOcr == 3 || this._useCapOcr == 4) {
        options.rtcMaxRetryCount = 1;
      }

      if (options.rtcStartDelay > 0) {
        await this.delay(options.rtcStartDelay);
      }

      this._captureinProgress = true;
      this._currentCaptueCount = 0;
      this._detectRqCount = 0;
      this._key = crypto.randomUUID();
      if (!this._successfulDetectionCalled) {
        await this.processCapture(); // 비동기 캡처 시작
      }
    } finally {
      this._isStartInProgress = false; // 플래그 리셋
      // this._captureinProgress = false;
    }
  }

  async loadDetactModule(workType) {
    if (this._detectWorker) {
      if (this._ocrType === 1 || this._ocrType === 3 || this._ocrType === 11 || this._ocrType === 10 || this._ocrType === 16) {
        try {
          this._detectWorker.postMessage({ type: workType });

          const initResult = await new Promise((resolve) => {
            this._detectWorker.onmessage = (event) => {
              if (event.data.type === "initComplete") {
                resolve(true);
              } else if (event.data.type === "initFailed") {
                resolve(false);
              }
            };
          });

          this._useDetect = initResult;
          this.moduleLoaded = initResult;

          if (!initResult) {
            throw new Error("WASM module loading failed.");
          }
        } catch (error) {
          this._useDetect = false;
          this.moduleLoaded = false;
          alert(`Error: ${error.message}`);
          console.error("WASM module loading error:", error);
        }
      }
    } else {
      this._useDetect = false;
    }
  }

  async processCapture() {
    if (this._detectInProgress || !this._captureinProgress) {
      console.warn("Detection already in progress or capture not active.");
      return;
    }
    while (this._captureinProgress && this._currentCaptueCount < this._options.rtcMaxRetryCount) {
      this._currentCaptueCount++;
      const options = this._options;
      let cropImageData = null;
      let validCheckDt = this._currentCaptueCount >= options.rtcMaxRetryCount;
      let resultCode = null;
      let successDt = null;

      console.log("총 시도 횟수 : ", options.rtcMaxRetryCount, ", 현재 시도 횟수 : ", this._currentCaptueCount);

      if (this._useDetect) {
        const detectionResult = await this.handleDetection(options, validCheckDt);
        // console.log("this._guideMessage: ", this._guideMessage);
        // this._title.innerHTML = this._guideMessage;

        if (detectionResult) {
          cropImageData = detectionResult.cropImageData;
          resultCode = detectionResult.resultCode;
          successDt = detectionResult.detectTime;

          if (this._ocrType === 16 && resultCode?.resultJSON?.resultCode === "0") {
            resultCode.resultJSON.resultCode = "0000";
          }

          await this.handleSuccessfulDetection(cropImageData, validCheckDt, resultCode, successDt);
          this._successfulDetectionCalled = true; // 플래그 업데이트

          break;
        }
      } else {
        // this._useDetect가 false일 때
        cropImageData = this.getCropImage(this._ocrType);
        resultCode = null;
        await this.emitCaptureEvent(cropImageData, validCheckDt, resultCode, successDt);
        break;
      }

      // delay 후 다시 시도
      if (this._currentCaptueCount < options.rtcMaxRetryCount) {
        await this.delay(options.rtcRetryDelay);
        this.resetDetectionState();
      }
    }

    this._captureinProgress = false; // 모든 시도가 끝났을 경우
  }

  resetDetectionState() {
    // 상태 변수를 초기화합니다.
    this._detectInProgress = true; // 필요에 따라 초기화
    this._detectRqCount = 0; // 탐지 요청 수 초기화
    // 이외의 필요한 상태 변수를 초기화
  }

  async handleDetection(options, validCheckDt) {
    let detectResultCode = 0;
    let detectMessage = null;
    let imageData = null;
    let cropImageData = null;
    this._detectInProgress = true;
    let resultCode = null;
    let detectResults = null;
    let detectTime = null;
    this._previousGuideMessage = null;
    // const detectTimeoutId = this.startDetectionTimer(rtcDetectTime);
    const rtcDetectTime = options.rtcDetectTime ? options.rtcDetectTime : 10000;
    const detectTimeoutId = setTimeout(() => {
      this._detectInProgress = false;
    }, rtcDetectTime);

    while (this._captureinProgress && this._detectInProgress) {
      if (this._useCapOcr == 3) {
        cropImageData = this._uploadImg;
        validCheckDt = true;
        // imageData = cropImageData.data;
      } else {
        cropImageData = this.getCropImage(this._ocrType);
      }
      imageData = cropImageData.imageData;

      if (this._ocrType === 10) {
        await this.handleGiroTypeDetection(imageData, null);
      }

      if ([1, 3, 10, 11, 16].includes(this._ocrType)) {
        detectResults = await this.sendDetectRequest(imageData, validCheckDt);
        // if (this._ocrType == 16) {
        resultCode = detectResults.resultCode;
        detectTime = detectResults.detectTime;
        // } else {
        // resultCode = null;
        // }

        // console.log("detectResults: ", detectResults);
        detectResultCode = this.getDetectResultCode(detectResults);

        const detectSuccess = detectResults.continuousSuccess;

        if (this._ocrType == 1 || this._ocrType == 11) {
          detectMessage = this.updateTitleID(detectResultCode);
        } else if (this._ocrType == 3) {
          detectMessage = this.updateTitleCredit(detectResultCode);
        } else if (this._ocrType == 16) {
          detectMessage = "문서를 가이드 영역에 맞춰주세요.";
        }

        this._guideMessage = detectMessage;

        if (detectMessage !== this._previousGuideMessage) {
          this._title.innerHTML = this._guideMessage;
          this._previousGuideMessage = detectMessage;
        }

        // 탐지 성공
        if (await this.isDetectSuccessful(detectSuccess)) {
          if (this._orientationChangeButton) {
            this._orientationChangeButton.remove(); // DOM에서 버튼 제거
            this._orientationChangeButton = null; // 참조를 null로 설정하여 메모리 해제
          }
          // detectMessage = this.getOcrMessage(this._ocrType);
          // this._guideMessage = detectMessage;

          this._detectInProgress = false;
          this._captureInProgress = false;
          clearTimeout(detectTimeoutId);
          return {
            cropImageData: cropImageData,
            resultCode: resultCode,
            detectTime: detectTime,
          };
        } else {
          // console.log("탐지 실패");
          // detectMessage = this.handleFailedDetection(detectResultCode);
          // cropImageData = null;
          // break;
        }
      }
      // await this.delay(20);
    }

    if (this._detectRqCount >= options.rtcMaxRetryCount) {
      this._detectRqCount = 0;
    }

    if (this._currentCaptueCount >= options.rtcMaxRetryCount) {
      return {
        cropImageData: cropImageData,
        resultCode: resultCode,
        detectTime: detectTime,
      };
    }
    return null;
  }

  async sendDetectRequest(imageData, validCheckDt) {
    const startTime = performance.now();
    this._detectWorker.postMessage({
      type: "detect",
      imageData,
      width: imageData.width,
      height: imageData.height,
      ocrType: this._ocrType,
      useCapOcr: this._useCapOcr,
      validCheckDt: validCheckDt,
    });

    return new Promise((resolve) => {
      this._detectWorker.onmessage = (event) => {
        if (event.data.type === "detectResult") {
          const endTime = performance.now(); // detect 시간 측정 끝
          const detectTime = endTime - startTime;
          event.data.detectTime = detectTime;
          resolve(event.data);
        }
      };
    });
  }

  getDetectResultCode(detectResults) {
    return this._ocrType === 16 ? detectResults.resultCode.resultJSON.resultCode : detectResults.resultCode;
  }

  isDetectSuccessful(detectSuccess) {
    return detectSuccess;
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async applyBlinkEffect(element) {
    element.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    await this.sleep(50);
    element.style.backgroundColor = "rgba(0, 0, 0, 0)";
  }

  getOcrTitleMessage(ocrType) {
    switch (ocrType) {
      case 1:
      case 11:
        return "신분증 촬영중입니다.";
      case 3:
        return "카드 촬영중입니다.";
      case 16:
        return "문서 촬영중입니다.";
      default:
        return "촬영중입니다.";
    }
  }

  async handleSuccessfulDetection(cropImageData, validCheckDt, resultCode, detectTime) {
    try {
      this._videoRef.pause();
      let successImgData = null;

      // Set OCR title message
      this._title.innerHTML = this.getOcrTitleMessage(this._ocrType);

      // Determine image processing logic
      if (this._isIOS || this._ocrType == 16 || this._isFireFox) {
        successImgData = cropImageData;
        await this.applyBlinkEffect(this._guideArea);
      } else if (this._takePhoto) {
        try {
          const mediaStream = await this.getUsers();
          const imageCapture = new ImageCapture(mediaStream.getVideoTracks()[0]);
          const capabilities = await imageCapture.getPhotoCapabilities();

          // const photoSettings = {
          //   imageHeight: capabilities.imageHeight.max,
          //   imageWidth: capabilities.imageWidth.max,
          // };

          const QHD_WIDTH = 2560;
          const QHD_HEIGHT = 1440;

          const closestWidth = Math.min(capabilities.imageWidth.max, QHD_WIDTH);
          const closestHeight = Math.min(capabilities.imageHeight.max, QHD_HEIGHT);

          const photoSettings = {
            imageWidth: closestWidth,
            imageHeight: closestHeight,
          };

          const startTime = performance.now();
          const blob = await imageCapture.takePhoto(photoSettings);
          await this.applyBlinkEffect(this._guideArea);
          const endTime = performance.now();

          // console.log("photoSettings: ", photoSettings);

          // console.log(`takePhoto 처리 시간: ${(endTime - startTime).toFixed(2)} ms`);
          successImgData = await this.drawImageToCanvasAndGetDataUrl(blob);
        } catch (error) {
          console.error("Image capture failed. Falling back to cropImageData:", error);
          // alert("takephoto 실패");
          successImgData = cropImageData;
        }
      } else {
        successImgData = cropImageData;
      }

      // Clear title and emit capture event
      this._title.innerHTML = "";
      await this.emitCaptureEvent(successImgData, validCheckDt, resultCode, detectTime);

      // Update the title with the success message
      this._title.innerHTML = this.getOcrMessage(this._ocrType);

      // Additional cleanup
      this._detectRqCount++;
      this._detectInProgress = false;
      if (this._innerGuideBox) {
        this._innerGuideBox.style.display = "none";
      }
    } catch (error) {
      console.error("Error:", error.message, error);
      alert("error: " + error.message);
    }
  }

  drawImageToCanvasAndGetDataUrl(imageBlob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(imageBlob);

      reader.onload = () => {
        const dataUrl = reader.result;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const targetAspectRatio = img.width > img.height ? 16 / 9 : 9 / 16;
          const tolerance = 0.05;
          // 원본 이미지 비율 계산
          const originalAspectRatio = img.width / img.height;

          let startX = 0,
            startY = 0,
            cutWidth = img.width,
            cutHeight = img.height;

          // 비율 차이가 허용 범위 내이면 크롭하지 않음
          if (Math.abs(originalAspectRatio - targetAspectRatio) < tolerance) {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
          } else {
            // 비율 차이가 크면 크롭
            if (originalAspectRatio > targetAspectRatio) {
              // 너비를 줄여야 함
              cutWidth = img.height * targetAspectRatio;
              startX = (img.width - cutWidth) / 2; // 가운데 정렬
            } else {
              // 높이를 줄여야 함
              cutHeight = img.width / targetAspectRatio;
              startY = (img.height - cutHeight) / 2; // 가운데 정렬
            }

            canvas.width = cutWidth;
            canvas.height = cutHeight;

            ctx.drawImage(img, startX, startY, cutWidth, cutHeight, 0, 0, cutWidth, cutHeight);
          }

          this.pictureWidth = canvas.width;
          this.pictureHeight = canvas.height;

          const coordinates = this.convertGuideAreaCoordinates(this._guideArea, this._container, this._uncoveredArea, this._ocrType);

          let cropX = coordinates.x;
          let cropY = coordinates.y;
          let cropWidth = coordinates.width;
          let cropHeight = coordinates.height;

          const croppedCanvas = document.createElement("canvas");
          const croppedCtx = croppedCanvas.getContext("2d");

          croppedCanvas.width = cropWidth;
          croppedCanvas.height = cropHeight;

          croppedCtx.drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

          // const originImageData = croppedCanvas.toDataURL("image/png");
          // const link2 = document.createElement("a");
          // link2.href = originImageData;
          // link2.download = "takePhoto.png";
          // link2.click();

          resolve({
            imageData: croppedCtx.getImageData(0, 0, croppedCanvas.width, croppedCanvas.height),
            cropWidth: croppedCanvas.width,
            cropHeight: croppedCanvas.height,
          });
        };
        img.src = dataUrl;
      };

      reader.onerror = (error) => {
        reject(error);
      };
    });
  }

  getOcrMessage(ocrType) {
    switch (ocrType) {
      case 1:
        return "OCR 진행중입니다.";
      case 3:
        return "OCR 진행중입니다.";
      case 10:
        return "OCR 진행중입니다.";
      case 11:
        return "사본판별 진행중입니다.";
      case 16:
        return "문서 탐지 진행중입니다.";
      default:
        return "OCR 진행중입니다.";
    }
  }

  handleFailedDetection(detectResultCode) {
    let detectMessage = null;

    if (detectResultCode !== 0) {
      this._guideArea.style.border = "3px solid red";
      detectMessage = this.updateTitleBasedOnCode(detectResultCode);
    }

    return detectMessage;
  }

  // updateTitleBasedOnOcrType() {
  //   this._title.innerHTML = "";
  //   switch (this._ocrType) {
  //     case 1:
  //     case 11:
  //       this._title.innerHTML = "신분증을 인식중입니다. </br> 잠시만 기다려주세요.";
  //       break;
  //     case 3:
  //       this._title.innerHTML = "카드 인식중입니다. </br> 잠시만 기다려주세요.";
  //       break;
  //     case 10:
  //       this._title.innerHTML = "지로 인식중입니다. </br> 잠시만 기다려주세요.";
  //       break;
  //     case 16:
  //       this._title.innerHTML = "문서 인식중입니다. </br> 잠시만 기다려주세요.";
  //       break;
  //     default:
  //       break;
  //   }
  // }

  async emitCaptureEvent(cropImageData, validCheckDt, resultCode, detectTime) {
    const eventDetail = {
      imageData: cropImageData ? cropImageData.imageData : null,
      imageWidth: cropImageData ? cropImageData.cropWidth : null,
      imageHeight: cropImageData ? cropImageData.cropHeight : null,
      currentCount: this._currentCaptueCount,
      totalCount: this._options.rtcMaxRetryCount,
      validCheckDt: validCheckDt,
      rtcToken: this._key,
      resultCode: cropImageData ? resultCode : null,
      detectTime: detectTime,
    };

    this.dispatchEvent(new CustomEvent("imagecaptured", { detail: eventDetail }));
  }

  async emitCaptureFileEvent(eventDetail, result, validCheckDt) {
    const eventDetailFile = {
      imageData: eventDetail.imageData,
      imageWidth: eventDetail.imageWidth,
      imageHeight: eventDetail.imageHeight,
      currentCount: eventDetail.currentCount,
      totalCount: eventDetail.totalCount,
      validCheckDt: validCheckDt,
      rtcToken: this._key,
      resultCode: result.resultCode,
      detectTime: result.detectTime,
    };

    this.dispatchEvent(new CustomEvent("imagecaptured", { detail: eventDetailFile }));
  }

  async handleGiroTypeDetection(imageData, currentGiroType) {
    this._detectWorker.postMessage({
      type: "giroType",
      imageData,
      width: imageData.width,
      height: imageData.height,
    });

    const giroType = await new Promise((resolve) => {
      this._detectWorker.onmessage = (event) => {
        if (event.data.type == "giroType") {
          resolve(event.data.resultCode);
        }
      };
    });

    // 추후에 지로타입에 따른 UI 변경필요
    const borderColorMap = {
      0: "yellow", // 기본
      1: "red", // ocr
      2: "blue", // 표준 ocr
      3: "green", // MICR ocr
    };

    if (borderColorMap.hasOwnProperty(giroType)) {
      if (giroType !== 0) {
        currentGiroType = giroType;
        this._guideArea.style.border = `3px solid ${borderColorMap[giroType]}`;
      } else if (currentGiroType !== null) {
        this._guideArea.style.border = `3px solid ${borderColorMap[currentGiroType]}`;
      }
    } else {
      console.log("nonType");
    }
  }

  updateTitleID(detectResultCode) {
    let message = this._previousMessage;

    switch (detectResultCode) {
      case 0:
        // message = "";
        break;
      case -1:
        message = "신분증을 가까이서 촬영해주세요."; // 원거리
        break;
      case -2:
        message = "신분증을 레이아웃 안에 맞춰서 촬영해주세요."; // 신분증 잘림(사진)
        break;
      case -3:
        message = "신분증을 레이아웃 안에 맞춰서 촬영해주세요."; // 신분증 기울어짐. 잘림
        break;
      case -4:
        message = "빛반사를 피하여 신분증을 가리지 않게 촬영해주세요."; // 신분증 필드 일부 없음
        break;
      case -5:
        message = "신분증 영역을 찾을 수 없습니다.";
        break;
      case -6:
        message = "신분증 영역을 찾을 수 없습니다.";
        break;
      default:
        message = "";
    }
    this._previousMessage = message;
    return message;
  }

  updateTitleCredit(detectResultCode) {
    let message = this._previousMessage;

    switch (detectResultCode) {
      case 0:
        // message = "";
        break;
      case -1:
        message = "카드를 가까이서 촬영해주세요."; // size_ratio, 원거리
        break;
      case -2:
        message = "카드를 레이아웃 안에 맞춰서 촬영해주세요."; // photo_ratio, 카드는 x
        break;
      case -3:
        message = "카드를 레이아웃 안에 맞춰서 촬영해주세요."; // type_ratio, 가로/세로 비율, 잘리거나 기울어진 경우
        break;
      case -4:
        message = "카드를 가리지 말고 빛반사에 주의하여<br>잘 보이도록 촬영해주세요."; // 필드 영역 일부 없음
        break;
      case -5:
        message = "카드 영역을 찾을 수 없습니다."; // 탐지 안됨
        break;
      default:
        message = "카드를 다시 촬영해주세요.";
    }
    this._previousMessage = message;
    return message;
  }
}

window.WebCamera = WebCamera;