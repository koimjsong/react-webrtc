import React, { useEffect, useRef, useState } from "react";

const Camera = () => {
  const isInitialized = useRef(false);
  const koiOcrInstanceRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [resultText, setResultText] = useState("");

  useEffect(() => {

    if (!isInitialized.current) {
       initializeCamera();
    }

    return () => {
      const koiOcrInstance = koiOcrInstanceRef.current;
      if (koiOcrInstance) {
        koiOcrInstance.removeEventListener(window.koiOcr.KOI_OCR_EVENT.RESULT, processImageData);
        //console.log("카메라를 안전하게 중지");
        //koiOcrInstance.stopCamera();
      }
    };
  }, []);

  const initializeCamera = async () => {
    try {
      if (isInitialized.current) return;
      isInitialized.current = true;

      console.log("Initializing camera...");
      const KoiOcr = window.koiOcr.default;
      const koiOcrInstance = new KoiOcr();
      koiOcrInstanceRef.current = koiOcrInstance;

      const options = {
        useWebCamera: true,
        cameraOptions: {
          window: window,
          containerId: "#webcamera_container",
          useRtc: true,
          //rtcMaxRetryCount: 2,
          useCapOcr: 2,
          useDetect: true,
          detectRetry: true,
        },
        useWasmOcr: true,
        ocrType: 1,
        ocrWorkerJs: "js/koiOcr/ocrWorkerDemo.js",
        useDemo: false,
      }
      await koiOcrInstance.init(options);
      koiOcrInstance._webCamera._resetUI();
      //await koiOcrInstance.changeOcrType(options.ocrType);

      //koiOcrInstance.runCamera();
      console.log("Camera initialized.");
    } catch (error) {
      console.error("Error initializing camera:", error);
    }
  };

  const processImageData = (imageData) => {
    if (!imageData) {
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = imageData.width;
    canvas.height = imageData.height;

    const context = canvas.getContext("2d");
    const clampedArray = new Uint8ClampedArray(imageData.data);

    const processedImageData = new ImageData(clampedArray, imageData.width, imageData.height);
    context.putImageData(processedImageData, 0, 0);

    const base64Data = canvas.toDataURL("image/jpeg");
    setCapturedImage(base64Data);
  };
  

  const captureCropImage = async () => {
    const koiOcrInstance = koiOcrInstanceRef.current;
    try{
      //console.log("먼저 카메라를 안전하게 중지");
      //await koiOcrInstance.stopCamera();
      console.log("크롭 이미지 캡처를 위한 카메라 실행");
      await koiOcrInstance.runCamera();

      // koiOcrInstance.addEventListener(window.koiOcr.KOI_OCR_EVENT.RESULT, (event) => {
      //   console.log("Processing captured image...");
      //   if (event.detail && event.detail.imageData) {
      //     processImageData(event.detail.imageData);
      //   }
      // });
      const handleResult = (event) => {
        console.log("크롭 이미지 캡처중");
        if (event.detail && event.detail.imageData) {
          processImageData(event.detail.imageData);
        }
      };

      //koiOcrInstance.removeEventListener(window.koiOcr.KOI_OCR_EVENT.RESULT, handleResult);
      koiOcrInstance.addEventListener(window.koiOcr.KOI_OCR_EVENT.RESULT, handleResult);

    } catch(error) {
      console.error("크롭이미지 캡처실패:", error);
    }
  };

  const captureOriginalImage = async () => {
    const koiOcrInstance = koiOcrInstanceRef.current;

    try {
      //await koiOcrInstance._webCamera.processCapture();

      const videoElement = koiOcrInstance._webCamera._videoRef;
      const canvasElement = koiOcrInstance._webCamera._canvasRef;

      canvasElement.width = videoElement.videoWidth;
      canvasElement.height = videoElement.videoHeight;

      const ctx = canvasElement.getContext("2d");
      ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

      const originalImageData = canvasElement.toDataURL("image/jpeg");
      setCapturedImage(originalImageData);
      console.log("원본이미지 다운로드 준비완료");

    } catch (error) {
      console.error("원본이미지 캡처실패:", error);
    }
  };
  
  return (
    <div>
      <div id="webcamera_container" className="camera-container">
        <p></p>
      </div>
      <button onClick={captureCropImage}>Capture Crop Image</button>
      <button onClick={captureOriginalImage}>Capture Original Image</button>
      {resultText && <p className="result">{resultText}</p>}
      {capturedImage && (
        <div className="image-container">
          <img src={capturedImage} className="image" alt="이미지" />
          <a href={capturedImage} download="captured_image.jpg">
            다운로드
          </a>
        </div>
      )}
    </div>
  );
};

export default Camera;
