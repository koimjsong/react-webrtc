import React, { useEffect, useRef, useState } from "react";

const Camera = () => {
  const isInitialized = useRef(false);
  const containerRef = useRef(null);
  const koiOcrInstanceRef = useRef(null);

  const [capturedImage, setCapturedImage] = useState(null);

  //const { KOI_OCR_EVENT } = window.koiOcr;

  useEffect(() => {
    const initializeCamera = async () => {
      try {
        if (isInitialized.current) return; 
        isInitialized.current = true;

        console.log("Initializing camera...");
        const KoiOcr = window.koiOcr.default;
        const koiOcrInstance = new KoiOcr();
        koiOcrInstanceRef.current = koiOcrInstance;

        koiOcrInstance.addEventListener("result", handleOcrResult);

        await koiOcrInstance.init({
          useWebCamera: true,
          cameraOptions: {
            window: window,
            containerId: "#webcamera_container",
            useRtc: true,
            useCapOcr: 1,
            useDetect: false,
            detectRetry: true,
          },
          useWasmOcr: true,
          ocrType: 1,
          ocrWorkerJs: "js/koiOcr/ocrWorkerDemo.js",
          useDemo: true,
        });

        koiOcrInstance.runCamera();

        console.log("Camera initialized.");
      } catch (error) {
        console.error("Error initializing camera:", error);
      }
    };

    const handleOcrResult = (event) => {
      console.log("OCR result received:", event);
      if (!event.detail || !event.detail.ocrResult) {
        console.log("Failed to capture result. Please try again.");
        return;
      }

      const { ocrResult, imageData } = event.detail;
      if (ocrResult.resultJSON.resultCode === "0000") {
        console.log("OCR successful!");

        if (imageData) {
          const canvas = document.createElement("canvas");
          canvas.width = imageData.width;
          canvas.height = imageData.height;

          const context = canvas.getContext("2d");
          context.putImageData(imageData, 0, 0);

          const base64Data = canvas.toDataURL("image/jpeg");
          setCapturedImage(base64Data);
        }
      } else {
        console.log("OCR failed with code:", ocrResult.resultJSON.resultCode);
      }
    };

    // const handleImageCaptured = (event) => {
    //   console.log("Image captured event triggered:", event);

    //   if (event.detail && event.detail.imageData) {
    //     const canvas = document.createElement("canvas");
    //     canvas.width = event.detail.imageWidth;
    //     canvas.height = event.detail.imageHeight;

    //     const context = canvas.getContext("2d");
    //     context.putImageData(event.detail.imageData, 0, 0);

    //     const base64Data = canvas.toDataURL("image/jpeg");
    //     setCapturedImage(base64Data);
    //   } else {
    //     console.error("No image data in event:", event.detail);
    //   }
    // };

    initializeCamera();

    return () => {
      const koiOcrInstance = koiOcrInstanceRef.current;
      if (koiOcrInstance) {
        koiOcrInstance.removeEventListener("result", handleOcrResult);
      }
    };
  }, []);

  // const handleCaptureClick = async () => {
  //   try {
  //     const koiOcrInstance = koiOcrInstanceRef.current;
  //     if (!koiOcrInstance) {
  //       console.error("KoiOcr instance not initialized.");
  //       return;
  //     }

  //     console.log("Triggering capture...");
  //     //koiOcrInstance._webCamera.start(); // Trigger the start process
  //     koiOcrInstance._webCamera.processCapture();
  //   } catch (error) {
  //     console.error("Error during capture:", error);
  //   }
  // };

  return (
    <div>
      <div id="webcamera_container" ref={containerRef} className="camera-container">
        <p></p>
      </div>
      {/* <button onClick={handleCaptureClick}>Capture Image</button> */}
      {capturedImage && (
        <div>
          <h2>Captured Image:</h2>
          <img src={capturedImage} alt="Captured" />
        </div>
      )}
    </div>
  );
};

export default Camera;
