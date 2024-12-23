let controller = new AbortController();

const OCR_TYPE = {
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

const serverUrls = {};
//serverUrls[OCR_TYPE.IDCARD] = "/poc/id-card";
serverUrls[OCR_TYPE.IDCARD] = "/sample/id-card"; //crop version
// serverUrls[OCR_TYPE.IDCARD] = "/nhlife/id-card";
// serverUrls[OCR_TYPE.CREDITCARD] = "/poc/credit-card";
serverUrls[OCR_TYPE.CREDITCARD] = "/sample/credit-card";
serverUrls[OCR_TYPE.ACCOUNT] = "/poc/account";
serverUrls[OCR_TYPE.GIRO] = "/poc/giro";
serverUrls[OCR_TYPE.IDFAKE] = "/sample/id-cls";
// serverUrls[OCR_TYPE.IDFAKE] = "/dev/clone_identifier"; // 신분증 타입별 모델
// serverUrls[OCR_TYPE.IDFAKE] = "/nhlife/id-cls";
serverUrls[OCR_TYPE.GIROEPN] = "/poc/giro2";
serverUrls[OCR_TYPE.DOCS] = "/sample/document";

const BASE_URL = "https://121.166.140.188:19444";
// const BASE_URL = "http://172.30.1.3:19815";

const getApiUrl = (ocrType, isExternal) => {
  const internalUrl = serverUrls[ocrType];
  return isExternal ? `${BASE_URL}${internalUrl}` : internalUrl;
};

// 지정된 URL(API 주소)로 이미지를 전송하고, 요청에 대한 응답 반환
const attemptFetch = async (url, data) => {
  const result = await fetch(url, {
    method: "POST",
    signal: controller.signal, // AbortController의 시그널을 사용하여 요청을 취소
    headers: {},
    body: data,
  });
  return result;
  ``;
};

let validCheck = null;
self.onmessage = async (e) => {
  if (e?.data) {
    if (e.data.ocrType && e.data.base64Data) {
      const ocrType = e.data.ocrType;
      const isExternalRequest = true; // 이 값을 변경하여 내부/외부 요청을 선택
      const apiUrl = getApiUrl(ocrType, isExternalRequest);
      console.log("api:", apiUrl);
      const base64Data = e.data.base64Data;
      const fileData = base64toBlob(base64Data, "image/jpeg");
      // const fileSizeInBytes = fileData.size; // 파일 크기를 바이트 단위로 가져옴
      // const fileSizeInKB = (fileSizeInBytes / 1024).toFixed(2); // KB 단위로 변환하고 소수점 두 자리까지 출력

      // console.log(`File size: ${fileSizeInKB} KB`);

      if (e.data.validCheck) {
        validCheck = e.data.validCheck;
      } else {
        validCheck = true;
      }
      const maskOption = true;

      const payload = new FormData();
      payload.append("srcFile", fileData, ocrType + ".jpg");
      // if (ocrType == OCR_TYPE.IDCARD) {
      payload.append("maskOption", maskOption);
      payload.append("validCheck", validCheck); // validCheck 추가
      // }

      try {
        const result = await Promise.race([
          attemptFetch(apiUrl, payload),
          // attemptFetch("https://example/ocr/api", e.data.imageData), // OCR API에 데이터를 보내고 응답을 기다림
        ]);
        let response = await result.json();
        // console.log("response", response); // OCR Response Return
        // self.postMessage(response); // response를 그대로 전송
        let resultJSON = { resultJSON: response };
        // self.postMessage({ type: 'ocrResult', result: resultJSON });
        self.postMessage({ type: "ocrResult", message: resultJSON });
      } catch (e) {
        console.log(e);
        controller?.abort(); // AbortController를 사용하여 이전 요청을 취소
        self.postMessage({ type: "ocrResult", message: null });
      }
    } else if (e.data == "new") {
      controller = new AbortController();
      self.postMessage({ type: "ocrResult", message: null });
    }
  }
};

const dataURLtoBlob = (dataURL) => {
  var mimeString = dataURL.split(",")[0].split(":")[1].split(";")[0];
  return base64toBlob(dataURL.split(",")[1], mimeString);
};

const base64toBlob = (base64Data, mimeString) => {
  var byteString = atob(base64Data);
  var ab = new ArrayBuffer(byteString.length);
  var ia = new Uint8Array(ab);

  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ab], { type: mimeString });
};
