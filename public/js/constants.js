export const KOI_OCR_EVENT = {
  READY: "ready",
  RESULT: "result",
  PROGRESS: "progress",
  CAMERA_STARTED: "camerastarted",
  CAPTURE: "capture",
};

export const OCR_TYPE = {
  IDCARD: 1, // 주민등록증, 운전면허증, 여권(외국인등록증 미포함) WASM
  PASSPORT: 2, // 여권 MRZ WASM
  CREDITCARD: 3, // 신용카드 API
  QRCODE: 4, // QR/Barcode WASM
  SEALCERT: 5, // 인감증명서
  BIZREGCERT: 6, // 사업자등록증
  CROP: 7, // 문서 crop WASM
  ACCOUNT: 8, // 계좌번호 인식
  CHECK: 9, // 수표 인식
  GIRO: 10, // 지로번호 인식
  IDFAKE: 11, // 사본판별
  GIROEPN: 12, // 지로 전자납부번호 인식
  IDFACE: 13, // 안면인증
  DOCS: 14, // 정형문서
  FULLPAGE: 15, // 전문인식
  CROPLIVE: 16, // 문서 crop server
};

export const rtcType = {
  AUTO: 1,
  MANUAL: 2,
  FILE: 3,
  CAPTURE: 4,
};

export const buttonsData = [
  // { id: "passport", imgSrc: "./images/passport_image.png", type: OCR_TYPE.PASSPORT },
  // { id: "qr_barcode", imgSrc: "./images/qr_image.png", type: OCR_TYPE.QRCODE },
  { id: "idcard", imgSrc: "./images/idcard.png", type: OCR_TYPE.IDCARD },
  { id: "idfake", imgSrc: "./images/idcard.png", type: OCR_TYPE.IDFAKE },
  { id: "card", imgSrc: "./images/credit.jpg", type: OCR_TYPE.CREDITCARD },
  // { id: "docs_edge", imgSrc: "./images/crop.png", type: OCR_TYPE.CROP },
  { id: "account", imgSrc: "./images/account.jpg", type: OCR_TYPE.ACCOUNT },
  { id: "giro", imgSrc: "./images/giro.jpg", type: OCR_TYPE.GIRO },
  { id: "giroEPN", imgSrc: "./images/giro_epn.jpg", type: OCR_TYPE.GIROEPN },
  { id: "crops", imgSrc: "./images/docs.jpg", type: OCR_TYPE.CROPLIVE },
];
