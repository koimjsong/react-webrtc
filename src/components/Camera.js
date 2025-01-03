import React, { useEffect, useRef, useState } from "react";

const Camera = () => {
  const isInitialized = useRef(false);
  const koiOcrInstanceRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [resultText, setResultText] = useState("");

  useEffect(() => {
    const initializeCamera = async () => {
      try {
        if (isInitialized.current) return;
        isInitialized.current = true;

        console.log("Initializing camera...");
        const KoiOcr = window.koiOcr.default;
        const koiOcrInstance = new KoiOcr();
        koiOcrInstanceRef.current = koiOcrInstance;

        //koiOcrInstance.addEventListener(window.koiOcr.KOI_OCR_EVENT.RESULT, ocrResultHandler);

        koiOcrInstance.addEventListener(window.koiOcr.KOI_OCR_EVENT.RESULT, (event) => {
          console.log("RESULT event:", event);
          processImageData(event.detail.imageData);
        });

        
        await koiOcrInstance.init({
          useWebCamera: true,
          cameraOptions: {
            window: window,
            containerId: "#webcamera_container",
            useRtc: true,
            rtcMaxRetryCount: 2,
            useCapOcr: 1,
            useDetect: true,
            detectRetry: true,
          },
          useWasmOcr: true,
          ocrType: 1,
          ocrWorkerJs: "js/koiOcr/ocrWorkerDemo.js",
          useDemo: false,
        });

        koiOcrInstance.runCamera();
        console.log("Camera initialized.");
      } catch (error) {
        console.error("Error initializing camera:", error);
      }
    };

    initializeCamera();

    return () => {
      const koiOcrInstance = koiOcrInstanceRef.current;
      if (koiOcrInstance) {
        koiOcrInstance.removeEventListener(window.koiOcr.KOI_OCR_EVENT.RESULT, processImageData);
      }
    };
  }, []);

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

  const handleCaptureButton = () => {
    const koiOcrInstance = koiOcrInstanceRef.current;
    if (koiOcrInstance) {
      console.log("먼저 카메라를 안전하게 중지");
      koiOcrInstance.runCamera();
      console.log("카메라 다시 시작");
      koiOcrInstance.runCamera();
    } else {
      console.error("KoiOcr instance not initialized.");
    }
  };

  return (
    <div>
      <div id="webcamera_container" className="camera-container">
        <p></p>
      </div>
      <button onClick={handleCaptureButton}>Run Camera</button>
      {resultText && <p className="result">{resultText}</p>}
      {capturedImage && (
        <div>
          {/* <img src={capturedImage} alt="이미지" /> */}
          <a href={capturedImage} download="captured_image.jpg">
            Download Image
          </a>
        </div>
      )}
    </div>
  );
};

export default Camera;
