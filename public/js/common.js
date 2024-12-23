
let koi = {
    CMMERRMSG : "통신이 원활하지 않습니다. 잠시후 다시 시도해주세요."
};

koi.Ajax = {

    fnOcrAjax: function (method, requestUrl, param, callback) {
        $.ajax({
            type: method,
            url: requestUrl,
            data: JSON.stringify(param),
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Content-type", "application/json; charset=utf-8;");
                koi.Ajax.fnIsLoading();
            },
            success: function (res, status, xhr) {
                return callback(res);
            },
            error: function (xhr, status, error) {
                alert(koi.CMMERRMSG);
            },
            complete: function () {
                koi.Ajax.fnIsLoading(false);
            }
        })
    },
    
    fnOcrFileAjax: function (requestUrl, param, callback) {
		$.ajax({
			cache: false,
            type: 'POST',
            data: param,
            url: requestUrl,
            contentType: false,
	        processData: false,
            beforeSend: function (xhr) {
                koi.Ajax.fnIsLoading();
            },
            success: function (res, status, xhr) {
                return callback(res);
            },
            error: function (xhr, status, error) {
                alert(koi.CMMERRMSG);
            },
            complete: function () {
                koi.Ajax.fnIsLoading(false);
            }
        })
	},

    fnIsLoading: function (show = true) {
		if (show) {
			let maskHeight = $(document).height();
    		let maskWidth  = window.document.body.clientWidth;
     
     
	        let mask = '<div id="mask" style="position:absolute; z-index:9000; background-color:#000000; display:block; left:0; top:0;"></div>';
	        mask += '<div id="maskContainer" style="z-index:99999; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); text-align:center;">';
	        mask += '<div class="loading-spinner"></div>'; // 로딩 스피너 추가
	        mask += '<div id="loadingMessage" class="loading-message">인식중입니다...</div>'; // 문구 추가
	        mask += '<div id="dot"></div>';
	        mask += '<div class="step" id="s1"></div>';
	        mask += '<div class="step" id="s2"></div>';
	        mask += '<div class="step" id="s3"></div>';
	        mask += '</div>';
			
			if (!document.getElementById('mask')) {
				$('body').append(mask);
				$('#mask').css({
            		'width' : maskWidth,
            		'height': maskHeight,
            		'opacity' : '0.7'
    			}); 
		 	}
		 } else {
			
			let mask = document.getElementById('mask')
		 	if (mask) {
				document.body.removeChild(mask);  
		 	}
		 	
		 	let maskContainer = document.getElementById('maskContainer')
		 	if(maskContainer) {
				document.body.removeChild(maskContainer);  
			}
			        
			let loadingMessage = document.getElementById('loadingMessage');
	        if(loadingMessage) {
	            document.body.removeChild(loadingMessage);
	        }
		 }
		 
        if (show) {
            let spinner = document.createElement('i')
            spinner.setAttribute('id', 'spinner');
            spinner.setAttribute('class', 'xi-spinner-3 xi-spin xi-3x loading');
            if (!document.getElementById('spinner')) {
                document.body.appendChild(spinner);
            }
        } else {
            let spinner = document.getElementById('spinner');
            if (spinner) {
                document.body.removeChild(spinner);
            }
        }
    },

    fnIsAuthError: function (responseCd) {
        if (responseCd == '00001' ||
            responseCd == '00002' ||
            responseCd == '00003' ||
            responseCd == '00004' ||
            responseCd == '00005' ||
            responseCd == '00006' ||
            responseCd == '00007') {

            return true;
        } else {
            return false;
        }
    }
}

function dataURLtoBlob(dataURL) {
    var byteString = atob(dataURL.split(',')[1]);
    var mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);

    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: mimeString });
}