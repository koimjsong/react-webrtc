### A. 프로젝트 설치
Module not found: Error: Can't resolve 'web-vitals' 에러 뜸. web-vitals 패키지 설치
```
npm install web-vitals
```

### B. js 파일 public 경로로 옮기기

### C. webCamera.js 파일 수정
전역적으로 사용 할 수 있도록 WebCamera를 window 객체에 등록
```window.WebCamera = WebCamera;``` 

### D. koiOcr.js을 Webpack으로 번들링하기
1. Webpack 설치
```
npm install --save-dev webpack webpack-cli
```

2. root directory에 ```webpack.config.js``` 파일 생성

3. Webpack 실행
``` 
npx webpack 
```

지정한 경로(/public/js)에 지정한 이름(koiOcr.bundle.js)로 webpack 번들링 됨.


### E. 스크립트 로드

웹팩 번들링 했을 때 ```/js/mobile-detect.min.js```는 포함이 되지 않음. 
React 컴포넌트에서 동적으로 로드해서 사용.


### F. http로 접근 시 navigator.mediaDevices가 undefined
```
npm install -g ngrok
```

```
ngrok authtoken <your-auth-token>
```

```
ngrok http 3000
```

```
Forwarding                    https://e1b5-121-166-140-188.ngrok-free.app -> http://localhost:3000
```

다음과 같이 뜨게 되는데  https://e1b5-121-166-140-188.ngrok-free.app 들어가면 http://localhost:3000 으로 접속한 것 처럼 할 수 있음.

# react-webrtc
# react-webrtc
