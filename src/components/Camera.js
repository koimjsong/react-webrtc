import React, { useEffect, useRef } from "react";

const Camera = () => {
  const containerRef = useRef(null);
  const isInitialized = useRef(false);
  const isRunning = useRef(false);

  useEffect(() => {
    const initializeCamera = async () => {

      if (isInitialized.current) return; 
      isInitialized.current = true;

      try {
        console.log("initialize");

        //await loadScript("/js/mobile-detect.min.js"); 
        //await loadScript("/js/koiOcr.bundle.js");

        console.log("KoiOcr 모듈:", window.koiOcr);
        const KoiOcr = window.koiOcr.default; 

        const koiOcrInstance = new KoiOcr();
        console.log("KoiOcr 인스턴스: ", koiOcrInstance);

        const webCamera = new window.WebCamera();
        console.log("webCamera 인스턴스: ", webCamera);

        console.log("navigator.mediaDevices:", navigator.mediaDevices);
        console.log("enumerateDevices:", navigator.mediaDevices?.enumerateDevices);

        await koiOcrInstance.init({
          useWebCamera: true,
          cameraOptions: {
            window: window,
            containerId: "#webcamera_container",
            useRtc: true,
            useCapOcr: 1,
          },
          ocrType: 2,
        });

        console.log("WebCamera:", koiOcrInstance._webCamera);

        //await koiOcrInstance._webCamera.loadVideoSource();

        koiOcrInstance.runCamera();
        
      } catch (error) {
        console.error(error);
      }
    };

    initializeCamera();

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ""; 
      }
    };
  }, []);

  return (
    <div>
      <div id="webcamera_container" ref={containerRef} className="camera-container">
        <p></p>
      </div>
    </div>
  );
};

export default Camera;
