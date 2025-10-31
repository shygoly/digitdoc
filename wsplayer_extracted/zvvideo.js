(
    function () {
        class ZVPlayer {
          constructor(ip, port) {
            this.ip = ip;
            this.port = port;
            this.token = "";
            this.sessionId = "";
            this.recorder = null; // 录像
            this.encoderPcmWorker = null;// 双向语音
            this.socket = null; // 双向语音  socket
            this.bufferByte = null; // 双向语音  语音数据
            this.voiceTimer = null; // 双向语音  定时器
            this.recorderItem = null; // 双向语音 Record
          }
            // ***********授权获取token、sessionId
          vcmsAuth(ip, port, user, password, callback) {
            let url = 'http://' + ip + ':' + port + '/api/scms/iv/cmsproxy/login'
            let pwd = md5(md5(password) + user);
            // let pwd = '888888';
            this.ip = ip;
            this.port = port;
            let param = {
              Action: '1',
              AddtionAuth: 0,
              ClientType: '1',
              LocalIp: '',
              LoginType: '0',
              LoginUserID: user,
              LoginUserPswd: pwd
            }
            var self = this
            axios.post(url, param).then(res => {
              if (res.data.code == 200) {
                self.token = res.headers['x-auth-token']
                self.sessionId = res.headers['x-session-id']
                callback({
                  code: res.data.code,
                  token: self.token,
                  sessionId: self.sessionId,
                  message: "视频鉴权获取成功"
                })
              } else {
                callback({
                  token: "",
                  sessionId: "",
                  message: "视频鉴权获取失败！"
                })
              }
            }).catch(err => {
              callback({
                token: "",
                sessionId: "",
                message: "视频鉴权获取失败！"
              })
            })
          };   
          
          // *************退出
          vcmsLogout(callback) {
            let url = 'http://' + this.ip + ':' + this.port + '/api/scms/iv/cmsproxy/loginOut'
            let self = this
            axios.post(url,{},
              {
                headers: {
                  'X-Auth-Token': this.token,
                  'X-Session-ID': this.sessionId
                }
              })
              .then(res => {
                self.token = ""
                self.sessionId = ""
                callback(res.data)
              })
              .catch(err => {
                callback(res.data)
                console.info(err);
              });
          }

          // *************销毁播放器
          destroyPlayer(videoId) {
            let pvideo = $("#" + videoId)[0];
            if(pvideo && pvideo.rtspPlayer) {
              pvideo.rtspPlayer.destroy(); // true:重连，false:不重连
              pvideo.rtspPlayer = null
            }
          }

          // *************停止视频
          stop(videoId) {
            let pvideo = $("#" + videoId)[0];
            pvideo && pvideo.stopFn && pvideo.stopFn(videoId)
          }

          // *************录像
          recordVideo(videoId, state) {
            let pvideo = $("#" + videoId)[0];
            pvideo && pvideo.recordVideo && pvideo.recordVideo(videoId, state)
          }

          // *************录像新方法
          recordVideoNew(videoId, recording) { // recording  true:正在录像。false：录像结束
            var pvideo = $("#" + videoId)[0];
            pvideo.isRecording = recording
            if(!pvideo.rtspPlayer) {
              console.log("截图失败！")
              return
            }
            if (pvideo.isRecording) {
              // 开始录像
              pvideo.rtspPlayer.videoRecording = true
              pvideo.rtspPlayer.videoRecorded = false
            } else {
              // 停止录像
              pvideo.rtspPlayer.videoRecording = false
              pvideo.rtspPlayer.videoRecorded = true

              var date = new Date();
              var datestr = moment(date).format("YYYYMMDDHHmmss");
              var name = pvideo.cameraId + "_" + datestr + ".mp4";
              pvideo.rtspPlayer.videoName = name
            }
          }

          // *************播放视频
          play(params, callback) { // 获取rtspUrl并播放
            const controller = new AbortController();
            // const abortSignal = signal || controller.signal;
            // debugger

            var videoId = params.videoId
            var cameraId = params.cameraId
            var streamType = params.stream || 0
            var errorId = params.errorId
            var startTime = params.startTime
            var endTime = params.endTime

            if(!videoId || !cameraId) {
              return;
            }
            var pvideo = $("#" + videoId)[0];
            try {
              if (pvideo && pvideo.rtspPlayer) {
                pvideo.stopFn && pvideo.stopFn(videoId)
              }
            } catch (e) {
              console.log(e);
            }
            // pvideo.playState = 'Play'
            pvideo.errorId = errorId
            pvideo.replay = false

            var rtspWebSocketUrl = "ws://"+baseWsIp+"/ws"
            params.rtspWebSocketUrl = rtspWebSocketUrl
            params.isH265Url = rtspWebSocketUrl
            params.rtspUrl = "rtsp://"+baseWsIp+"/rtsp"
            params.streamMark = 'mark'
            pvideo.playState = 'Play'
            return this.playVideo(params, callback);

          //   let url = 'http://' + this.ip + ':' + this.port + '/api/scms/iv/cmsproxy/rtsp/realTimeStreamUrl?clientFlag=1&cameraId=' + cameraId + '&streamType=' + streamType + '&isWsUsed=true&mediaType=MediaServer'        
          //  console.log('======port', this.ip, this.port)
            // const promise = new Promise((resolve, reject) => {

            //   axios.get(url, {
            //     headers: {
            //         'X-Auth-Token': this.token,
            //         'X-Session-ID': this.sessionId
            //       }
            //     }
            //   )
            //     .then((res) => {
            //       if (res.headers['x-auth-token'] != undefined) { // token更新为刷新token
            //         console.log('token更新：', res.headers['x-auth-token'])
            //         this.token = res.headers['x-auth-token'];
            //       }


            //       // 在处理视频播放请求结果前，先检查 Promise 的状态，处理在视频接口返回前进行了停止操作
            //       if (promise.status === 'rejected') {
            //         console.log("zvvideo.js   取消视频请求操作")
            //         return;
            //       }

            //       if (res.data.code === 200){
            //         var rtspWebSocketUrl = "ws:" + res.data.data.ip + ":" + res.data.data.port + "/ws"
            //         params.rtspWebSocketUrl = rtspWebSocketUrl
            //         params.isH265Url = res.data.data.wsUrl
            //         params.rtspUrl = res.data.data.rtspUrl
            //         params.streamMark = res.data.data.streamMark
            //         pvideo.playState = 'Play'
            //         return this.playVideo(params, callback);
            //       }
            //     })
            //     .catch(err => {
            //       console.log(err)
            //       // 写死的测试代码-------------
            //         var rtspWebSocketUrl = "ws://127.0.0.1:8060/ws"
            //         params.rtspWebSocketUrl = rtspWebSocketUrl
            //         params.isH265Url = rtspWebSocketUrl
            //         params.rtspUrl = "rtsp://127.0.0.1:8060/rtsp"
            //         params.streamMark = 'mark'
            //         pvideo.playState = 'Play'
            //         return this.playVideo(params, callback);

            //       // 写死的测试代码------------

            //       // 播放状态、文字修改
            //       if(document.getElementById(errorId)) {
            //         document.getElementById(errorId).innerHTML = '视频请求失败！'
            //       }
            //       if(pvideo) {
            //         pvideo.playInfo = '视频请求失败！'
            //       }
            //       // callback('视频请求失败！')
            //       callback(err)
            //       reject(err);
            //     });

            // })
            // promise.abort = () => {
            //   controller.abort(); // 取消异步操作
            //   promise.status = 'rejected'; // 修改 Promise 对象的状态
            // };
           
            // return promise;
          }

          // ******************回放
          // forward: 0，存储服务器。 1, 前端。(播放前端录像类型)
          // ******************
          playBack(params, callback) { // 获取rtspUrl并播放
            var videoId = params.videoId
            var cameraId = params.cameraId
            var startTime = params.startTime
            var endTime = params.endTime
            var storeId = params.storeId
            var forward = params.forward 
            var reconnectTime = params.reconnectTime // 回放断线后，需要从进度条当前位置播放

            if(!videoId || !cameraId || !startTime || !endTime || !storeId) {
              console.log("回放参数不完整")
              callback("回放参数不完整")
              return;
            }
            var pvideo = $("#" + videoId)[0];
            if(!pvideo) {
              callback("视频组件获取失败！")
              console.log("视频组件获取失败！")
              return
            }
            // try {
            //   if (pvideo && pvideo.rtspPlayer) {
            //     pvideo.rtspPlayer.destroy();
            //   }
            // } catch (e) {
            //   console.log(e);
            // }
            try {
              if (pvideo && pvideo.rtspPlayer) {
                pvideo.stopFn && pvideo.stopFn(videoId)
              }
            } catch (e) {
              console.log(e);
            }
            pvideo.errorId = params.errorId
            // pvideo.playState = 'Play'
            var startTimeUnix = this.getUnixTime(startTime)
            var endTimeUnix = this.getUnixTime(endTime)
            params.startTimeUnix = startTimeUnix
            params.endTimeUnix = endTimeUnix

            this.PlayRtspVideoHistory(params, function (v) {
              // callback({
              //   "code": 200,
              //   "message": "请求录像回放"
              // })
              // self.playerVideo = v
              callback(v)
              $("#" + videoId)[0].onplay = function () {
                if($("#" + videoId)[0].playState==='Play') {
                }
              }
              $("#" + videoId)[0].onplaying = function () {
                // debugger
              }
              $("#" + videoId)[0].onpause = function () {
                // if($("#" + id)[0].paused) {
                //
                // }
              }
              $("#" + videoId)[0].onended = function () {
                // debugger
              }
              $("#" + videoId)[0].onseeked = function () {
                // debugger
              }
              $("#" + videoId)[0].onseeking = function () {
                // debugger
              }
              $("#" + videoId)[0].onratechange = function () {
                // debugger
              }
            })
          }

          // *************录像
          saveRecord(videoId) {
            let html5Player = document.getElementById(videoId)
            var fileType = "MP4"; // 如果文件名中没有带后缀，默认使用png
            var video = html5Player;
            var stream = video.captureStream(); // build a 15 fps stream
            this.recorder = new MediaRecorder(stream, {mimeType: 'video/webm;codecs=h264'});
            this.recorder.addEventListener('dataavailable', this.finishCapturing);
            this.recorder.start();
          }
          
          // *************停止保存录像
          stopRecord() {
            if(this.recorder) {
              this.recorder.stop();
            }
          }

          // *************心跳
          heartbeat() {
            let url ='http://' + this.ip + ':' + this.port +  "/api/scms/iv/cmsproxy/heartbeat";
            let self=this
            axios.get(url,{
              headers: {
                'X-Auth-Token': this.token,
                'X-Session-ID': this.sessionId
              }
            }).then((res) => {
              if (res.headers['x-auth-token'] != undefined) { // token更新为刷新token
                console.log('token更新：', res.headers['x-auth-token'])
                this.token = res.headers['x-auth-token'];
              }
            })
              .catch(err => {
                console.log(err)
              });
          }

          // *************双向语音：开始对讲
          openTalk(cameraId, callback) {
            let params = {
              "cameraId": cameraId
            }
            let url = 'http://' + this.ip + ':' + this.port + '/api/scms/iv/cmsproxy/voiceIntercom/startIntercom'                    
            axios.post(url, params,
              {
                headers: {
                  'X-Auth-Token': this.token,
                  'X-Session-ID': this.sessionId
                }
              })
              .then(res => {
                if (res.headers['x-auth-token'] != undefined) { // token更新为刷新token
                  console.log('token更新：', res.headers['x-auth-token'])
                  this.token = res.headers['x-auth-token'];
                }
                var ws = res.data.data
                this.initSocket(ws).then(this.startTalking())
                callback("对讲功能开启。")
              })
              .catch(err => {
                // console.info(err);
                callback("对讲功能开启失败，请通过ip:port方式访问页面。")
              });
          }

          // 双向语音websocket
          async initSocket(path) {
            if (typeof (WebSocket) === 'undefined') {
            } else {
              this.socket = new WebSocket(path)
              this.socket.onopen = function () {
                console.log("voice socket open")
              }
              this.socket.onmessage = function (e) {
                console.log(e)
              }
              this.socket.onerror = function (e) {
                console.log(e)
              }
            }
          }

          // 双向语音 开启对讲
          startTalking() {
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
            if (!navigator.getUserMedia) {
              alert('浏览器不支持音频输入');
              return
            }
            var self=this
            var aacFrame = []
            var byte = null
            var workerPath = this.getUrlRelativePath() + "/libAacEncoder/encoderPcmToAac.js"
            this.encoderPcmWorker = new Worker(workerPath)
            this.encoderPcmWorker.onmessage = function(event) {
              var frameBuffer = event.data;
              aacFrame.push(frameBuffer);
              // 音频下载 aac格式测试
              // if (byte) {
              //   byte.appendData(aacFrame.shift());
              //   console.log(byte.data)
              //   console.log("this.byte.data.length:", byte.data.length);
              // } else {
              //   byte = new NALUH265(aacFrame.shift())
              // }
              //
              // if (byte.data.length > 10000) {
              //   var file = new File([byte.data], "audiotest.aac", {type: "text/plain;charset=utf-8"});
              //   saveAs.saveAs(file);
              // }
              if (frameBuffer) {
                // self.socketSend(aacFrame.shift())
                self.socket.send(aacFrame.shift())
              }
            }

            var self = this
            this.recorderItem = new Record()
            this.recorderItem.startRecord({
              success: res => {
                let subByte
                this.voiceTimer = setInterval(function () {
                  self.recorderItem.startReceive()
                  let frameBuffer = new Uint8Array(self.recorderItem.getBlob1().buffer)
                  if (this.bufferByte) {
                    this.bufferByte.appendData(frameBuffer.subarray(0));
                  } else {
                    this.bufferByte = new NALUH265(frameBuffer.subarray(0))
                  }
                  if (this.bufferByte && this.bufferByte.data.length >= 2048) {
                    subByte = this.bufferByte.data.subarray(0, 2048);
                    this.bufferByte.data = new Uint8Array(this.bufferByte.data.subarray(2048));
                    // self.encoderPcmToAac.encoderPcmWorker.postMessage(subByte);
                    self.encoderPcmWorker.postMessage(subByte)
                  }
                  self.recorderItem.clear()
                }, 10)
                // this.heartbeatTimer = setInterval(this.heartBeatToaken, 1000)
              },
              error: e => {
                console.log(e);
              }
            })
          }

          getUrlRelativePath() {
            // var file = location.href.substring(0, location.href.lastIndexOf('/') - 1)
            var file = location.href.substring(0, location.href.lastIndexOf('/'))
            return file
          }

          // *************双向语音：停止对讲
          closeTalk(cameraId, callback) {
            let camera = {
              cameraId: cameraId // this.camera_id
            }
            let url = 'http://' + this.ip + ':' + this.port + '/api/scms/iv/cmsproxy/voiceIntercom/closeIntercom'
            axios.post(url, camera,
              {
                headers: {
                  'X-Auth-Token': this.token,
                  'X-Session-ID': this.sessionId
                }
              }).then(res => {
                if (res.headers['x-auth-token'] != undefined) { // token更新为刷新token
                  console.log('token更新：', res.headers['x-auth-token'])
                  this.token = res.headers['x-auth-token'];
                }
                if(res.data.code==200){
                  this.socket.close()
                  this.bufferByte = null
                  this.encoderPcmWorker.postMessage("RELEASE_ENCODER")
                  clearInterval(this.voiceTimer)
                  this.recorderItem = this.recorderItem || new Record() // 泄露
                  this.recorderItem.stopReceive()
                  callback("停止对讲功能")
                }
            }).catch(err => {
              callback("对讲功能停止失败")
            });
          }

          // *************截图
          screenShot(videoId) {
            let pvideo = $("#" + videoId)[0];
            pvideo && pvideo.screenShot && pvideo.screenShot()
          }


          // *************视频码流切换
          // mainStream：true主码流，false子码流
           // *************
          streamChange(videoId, mainStream) {
            let pvideo = $("#" + videoId)[0];
            let streamValue = mainStream?0:1 // 0为主流,1为子码流
            pvideo && pvideo.streameTypeChange && pvideo.streameTypeChange(streamValue)
          }

          // *************音频控制
          switchVoice(videoId, openVoce) {
            let pvideo = $("#" + videoId)[0];
            pvideo.muted = !openVoce
            pvideo && pvideo.switchAudioMute && pvideo.switchAudioMute(openVoce)
          }

          // *************暂停
          pause(videoId, isPause) {
            let pvideo = $("#" + videoId)[0];
            if (pvideo && pvideo.controlStream && pvideo.rtspPlayerOpts) {
              if (isPause) { // 将暂停
                pvideo.playState = 'Pause' // 暂停
                if (pvideo.rtspPlayer) {
                  pvideo.rtspPlayer.isNotSeeking() // 触发状态事件回调
                }
                pvideo.pause()
              } else { // 将播放
                pvideo.playState = 'Play' // 暂停后播放
                pvideo.play()
                pvideo.rtspPlayer.pauseToPlay()
              }
            }
          }

          // *************倍速播放
          // 快放：value：1、2、4、8
          // 慢放：value:  1、1/2、1/4、1/8
          // *************
          rate(videoId, rateValue) {
            let pvideo = $("#" + videoId)[0];
            if (pvideo && pvideo.controlStream && pvideo.rtspPlayerOpts) {
              pvideo.playbackRate = rateValue;
            }
          }

          // *************进度跳播

          seek(videoId, percentValue, stime, etime) {
            var pvideo = $("#" + videoId)[0];
            var startTimeUnix = this.getUnixTime(stime)
            var endTimeUnix = this.getUnixTime(etime)
            console.log('----totalTime:', endTimeUnix - startTimeUnix)
            var value = (endTimeUnix - startTimeUnix)*Number(percentValue)
            if (pvideo && pvideo.controlStream && pvideo.rtspPlayerOpts && pvideo.rtspPlayer) {
              pvideo.rtspPlayer.seekToPlay()
              let paramRate = {
                "streamMark": pvideo.rtspPlayerOpts.streamMark, //开流时，返回的媒体唯一标识
                "operation": "range",
                "vaule": value
              };
              pvideo.controlStream(paramRate);
            }
          }

          // *************整体全屏
          videoFullScreen(screenId, videoId) {
            var el = $("#" + screenId)[0];
            if(el) {
              if (el.requestFullscreen) {
                el.requestFullscreen();
              } else if (el.mozRequestFullScreen) {
                el.mozRequestFullScreen();
              } else if (el.webkitRequestFullscreen) {
                el.webkitRequestFullscreen();
              } else if (el.msRequestFullscreen) {
                el.msRequestFullscreen();
              }
            }
            // setTimeout(() => {
            //   zoomSizeChange(screenId, videoId)
            // }, 1000)
          }

          // *************退出整体全屏
          exitVideoFullscreen(screenId, videoId) {
            if (document.fullscreenElement || document.webkitFullscreenElement) {
              if (document.exitFullscreen) {
                document.exitFullscreen();
              } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
              } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
              } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
              }
            }
            // setTimeout(() => {
            //   zoomSizeChange(screenId, videoId)
            // }, 1000)
          }


          // PTZ控制方向
          // num: 操作ID： 上21，下22，左23，右24，左上25，右上26，左下27，右下28。镜头拉近11，镜头拉远12，焦距变大13，焦距变小14，变亮15，变暗16
          // isOpen:是否打开.0开启、1停止操作
          // 控制速度，范围 0-100
          // 转预置位：num:39, isOpen:预置位ID
          ptzControl(cameraId, num, isOpen, controlSpeed, callback) {
            if(!cameraId || !num) {
              return
            }
            num = Number(num)
            isOpen = Number(isOpen)
            controlSpeed = Number(controlSpeed)
            let params = {
              "cameraId": cameraId,
              "nopId": num,
              "npara1": isOpen,
              "npara2": controlSpeed || 50,
              "npara3": 0,
              "npara4": 0
            }
            let url = 'http://' + this.ip + ':' + this.port + '/api/scms/iv/cmsproxy/ptz/control'                    
            axios.post(url, params,
              {
                headers: {
                  'X-Auth-Token': this.token,
                  'X-Session-ID': this.sessionId
                }
              })
              .then(res => {
                if (res.headers['x-auth-token'] != undefined) { // token更新为刷新token
                  console.log('token更新：', res.headers['x-auth-token'])
                  this.token = res.headers['x-auth-token'];
                }
                callback(res.data)
              })
              .catch(err => {
                console.info(err);
              });
          }

          // *******************PTZ权限申请
          //  type:1:申请控制  3：锁定控制   4：取消控制
          ptzControlApply(cameraId,type, callback) {
            if(!cameraId || !type) {
              return
            }
            let url = 'http://' + this.ip + ':' + this.port + '/api/scms/iv/cmsproxy/ptz/controlApply'
            let params = {
              "cameraId": cameraId,
              "controlType": type // 控制类型
            }                    
            axios.post(url, params,
              {
                headers: {
                  'X-Auth-Token': this.token,
                  'X-Session-ID': this.sessionId
                }
              })
              .then(res => {
                if (res.headers['x-auth-token'] != undefined) { // token更新为刷新token
                  console.log('token更新：', res.headers['x-auth-token'])
                  this.token = res.headers['x-auth-token'];
                }
                callback(res.data)
              })
              .catch(err => {
                console.info(err);
              });
          }

          // 内部方法调用
          playVideo(opts, callback) {
            let videoId = opts.videoId
            let rtspUrl = opts.rtspUrl
            // let $video = $("#" + videoId);
            // $video.find("source").attr("src", rtspUrl);
            // $video.attr("src", '');
            // let $videoParent = $video.parent();
            let mvideo = $("#" + videoId)[0];
            if(!mvideo) {
              callback("视频组件获取失败")
              console.log("[playVideo]视频组件获取失败")
              return
            }
            if (!rtspUrl || rtspUrl === '') {
              mvideo.src = ""
              callback("[playVideo]视频流为空")
              return;
            }
            mvideo.src = rtspUrl
            mvideo.playState = 'Play';
            let rtspPlayer = this.playRtspV(videoId, opts);
            if(rtspPlayer) {
              rtspPlayer.streamMark = opts.streamMark
              mvideo.videoId = videoId
              mvideo.cameraId = opts.cameraId
              mvideo.rtspPlayer = rtspPlayer;
              mvideo.rtspPlayerOpts = opts;
              callback({
                "code": 200,
                "message": "[playVideo]视频组件创建成功!"
              })
            } else {
              callback("[playVideo]播放器创建异常")
              return
            }
            var self = this
            mvideo.stopFn = async function (videoId) {
              mvideo.playState = 'Stop'
              var player = mvideo.rtspPlayer
              if (mvideo.rtspPlayerOpts && mvideo.rtspPlayerOpts.isH265Url) {
                if (player.streamMark) {
                  self.destroyStream(player.streamMark)
                }
                try {
                  player && player.destroy();
                  mvideo.rtspPlayer = null
                } catch (e) {
                  console.log(e);
                }
                // delete videoPlayerList[videoId];
              }
              var videoCom = document.getElementById(videoId);
              if(videoCom) {
                videoCom.src = "";
                videoCom.talkingSupport = false
                var errorId = videoCom.errorId
                if (errorId) {
                  document.getElementById(errorId).innerHTML = '' // 已停止
                }
                if(videoCom["codeingMonitor"]) {
                  clearInterval(videoCom["codeingMonitor"]);
                }
              }
            }
          
            mvideo.ondblclick = function () { // 双击退出和打开全屏
              let fullscreen = self.isFullscreen();
              if (fullscreen) {
                mvideo.setAttribute("data-fullscreen", 0);
                // $videoParent.removeClass("video-rtsp-fullscreen");
                if (document.webkitCancelFullScreen) {
                  document.webkitCancelFullScreen(); // 退出全屏
                } else if (document.mozCancelFullScreen) {
                  document.mozCancelFullScreen(); // 退出全屏
                } else {
                  document.exitFullscreen();
                }
              } else { // 全屏
                mvideo.setAttribute("data-fullscreen", 1);
                let fdom = mvideo;
                // if ($videoParent.length > 0) {
                //   fdom = $videoParent[0];
                // }
                if (fdom.webkitRequestFullScreen) {
                  fdom.webkitRequestFullScreen();//
                } else if (fdom.mozRequestFullScreen) {
                  fdom.mozRequestFullScreen();
                } else {
                  fdom.requestFullscreen();
                }
              }
            };
            // if (mvideo.isRecord) {
            //   addRecordEvents($videoParent, mvideo);
            // }
            // 流控制--快慢播放、暂停、继续播放
            mvideo.controlStream = function (param) {
              let player = mvideo.rtspPlayer
              if(!player) {
                return
              }
              let url = 'http://' + self.ip + ':' + self.port + '/api/scms/iv/cmsproxy/rtsp/controlStream'
              axios.post(url, param,
                {
                  headers: {
                    'X-Auth-Token': self.token,
                    'X-Session-ID': self.sessionId
                  }
                })
                .then(res => {
                  if (res.headers['x-auth-token'] != undefined) { // token更新为刷新token
                    console.log('token更新：', res.headers['x-auth-token'])
                    this.token = res.headers['x-auth-token'];
                  }
                  if (res.data.code === 200) {
                    switch(mvideo.playState) {
                      case 'Pause':
                        // $($('#'+videoId+'Play')[0]).attr("title", '播放')
                        // $($('#'+videoId+'Play')[0]).removeClass('iconzanting').addClass('iconvideo_play')
                        break;
                      case 'Play':
                        // $($('#'+videoId+'Play')[0]).attr("title", '暂停')
                        // $($('#'+videoId+'Play')[0]).removeClass('iconvideo_play').addClass('iconzanting')
                        player.pauseToPlay();
                        break;
                      case 'Seek':
                        player.seekToPlay()
                        $("#" + videoId)[0].playState = 'Play'
                      default:
                        break
                    }
                  } else {
                    // self.$message({
                    //   type: "error",
                    //   message: res.data.message
                    // });
                  }
                })
                .catch(err => {
                  console.info(err);
                });
            }
            // 主码流子码流切换
            mvideo.streameTypeChange = function (val) {
              let player = mvideo.rtspPlayer
              if(player) {
                if (player && player.isH265Url) {
                  self.destroyStream(player.streamMark)
                }
                player.destroy(false);
                player = null;
              }
              mvideo.src = "";
              let param = {
                videoId: mvideo.videoId,
                errorId: mvideo.errorId,
                cameraId: mvideo.cameraId,
                stream: Number(val)
              }
              self.play(param)
            }
            // 拖放进度播放
            mvideo.seekPlay = function (val) {
              if(mvideo.rtspPlayer) {
                mvideo.rtspPlayer.isSeeking(val);
              }
            }
            // 视频截图
            mvideo.screenShot = function () {
              var date = new Date();
              var datestr = moment(date).format("YYYYMMDDHHmmss");
              var picname = datestr + ".png";
              self.savePic(picname, mvideo.videoId)
            }
          // 录像功能
            mvideo.recordVideo = function (videoId, startRecord) {
              // let videoId = mvideo.videoId
              if(startRecord) {
                self.saveRecord(videoId) // 开始录像
              } else {
                self.stopRecord(videoId) // 结束录像
              }
            }
              // 声音控制
          // val:true--声音开启，false--声音关闭。
            mvideo.switchAudioMute = function (val) {
              if(mvideo.rtspPlayer) {
                mvideo.rtspPlayer.switchAudioMute(val);
              }
            }
            // 全屏/非全屏切换
            mvideo.screenChange = function (fullscreen) {
              let beforeScreen = !fullscreen
              if (beforeScreen) {
                mvideo.setAttribute("data-fullscreen", 0);
                // $videoParent.removeClass("video-rtsp-fullscreen");
                if (document.webkitCancelFullScreen) {
                  document.webkitCancelFullScreen(); // 退出全屏
                } else if (document.mozCancelFullScreen) {
                  document.mozCancelFullScreen(); // 退出全屏
                } else {
                  document.exitFullscreen();
                }
              } else { // 全屏
                mvideo.setAttribute("data-fullscreen", 1);
                let fdom = mvideo;
                // if ($videoParent.length > 0) {
                //   fdom = $videoParent[0];
                // }
                if (fdom.webkitRequestFullScreen) {
                  fdom.webkitRequestFullScreen();//
                } else if (fdom.mozRequestFullScreen) {
                  fdom.mozRequestFullScreen();
                } else {
                  fdom.requestFullscreen();
                }
              }
            }
            // return mvideo;
          }
          

          // 内部方法调用
          playRtspV(videoId, opts) { // 调用控件播放
            let self = this
            let errHandler = function (currentProxy, err) {
              if(document.getElementById(errorId)) {
                document.getElementById(errorId).innerHTML = err.message || ""
              }
            };
            let stuHandler = function (currentProxy, message) {
              var audioSwitch = true
              let messageInfo = "";
              var videoCom = document.getElementById(videoId);
              // console.log("***********" + currentProxy)
              // console.log(videoCom.rtspPlayerOpts.rtspUrl)
              if(!videoCom) {
                return
              }
              let errorId = videoCom.errorId
              let replay = videoCom.replay
              if (message === 9000001) {
                messageInfo = '正在请求视频...'
              } else if (message === 9000002) {
                messageInfo = '视频请求失败'
              } else if (message === 9000003) {
                messageInfo = '视频中断正在尝试断线重连...'
                self.reconnectWS(videoId, replay, audioSwitch)
              } else if (message === 9000004) {
                messageInfo = '视频中断正在尝试断线重连...'
                self.reconnectWS(videoId, replay, audioSwitch)
              } else if (message === 9000005) {
                if(videoCom) {
                  videoCom.talkingSupport = true
                }
              } else if (message === 9000006) {
                console.log('9000006 STATUS_NO_CONTAIN_AUDIO');
              } else if (message === 9000007) {
                console.log('9000007 STATUS_CONTAIN_AUDIO');
              }  else if (message === 9000008) {
                debugger
                messageInfo = '正在请求h265'
                return;
              }else if (message === 9000009) { // 暂停 STATUS_H265_REPLAY_PAUSE
                console.log("pause")
                let pvideo = $("#" + videoId)[0]
                let paramPaly = {
                  "streamMark": pvideo.rtspPlayer.streamMark,
                  "operation": "pause",
                  "vaule": "1"
                };
                pvideo.controlStream(paramPaly)
                messageInfo = '暂停'
              }else if (message === 9000010) { // 继续播放 STATUS_H265_REPLAY_PLAY
                console.log('play')
                let pvideo = $("#" + videoId)[0]
                let paramPaly = {
                  "streamMark": pvideo.rtspPlayer.streamMark,
                  "operation": "pause",
                  "vaule": "0"
                };
                pvideo.controlStream(paramPaly);
              }else if (message === 9000011) {     // 跳播 STATUS_H265_REPLAY_SEEKING
                // debugger
              }else if (message === 9000012) {      // 倍速播 STATUS_H265_REPLAY_RATE
                console.log("rate")
                let pvideo = $("#" + videoId)[0]
                let paramPaly = {
                  "streamMark": pvideo.rtspPlayer.streamMark,
                  "operation": "scale", //pause/scale/range
                  "vaule": pvideo.playbackRate
                };
                pvideo.controlStream(paramPaly);
              }else if (message === 9000013) { // 播放完成 STATUS_FINISH_H265VIDEO
                if($("#" + videoId)[0] && $("#" + videoId)[0].stopFn) {
                  $("#" + videoId)[0].stopFn(videoId)
                  messageInfo = "播放完成";
                }
              } else if(message === 9000014){
                // messageInfo = "视频播放错误,正在尝试断线重连"
                messageInfo = "视频播放错误!"
                self.reconnectWS(videoId, replay, audioSwitch, 'playerror')

              } else {
                messageInfo = "正在接收数据: " + message.toFixed(2) + "kbps";
                if( videoCom["codeingMonitor"] ) {
                  clearInterval(videoCom["codeingMonitor"]);
                }
              }

              if(document.getElementById(errorId)) {
                document.getElementById(errorId).innerHTML = messageInfo || ""
              }
          
              // let html5Player = document.getElementById(videoId);
              // if (!html5Player) {
              //   let player = videoPlayerList[videoId];
              //   player && player.destroy();
              //   delete videoPlayerList[videoId];
              // }
            };

            var videoCom = document.getElementById(videoId);
            videoCom.errHandler = errHandler
            videoCom.stuHandler = stuHandler

            let playerOptions = {
              socket: opts.rtspWebSocketUrl,
              isH265Url: opts.isH265Url,
              redirectNativeMediaErrors: true,
              bufferDuration: 10,
              statuHandler: stuHandler,
              errorHandler: errHandler,
              audioSwitchValue: opts.audioValue || false,
              audio: "audio_0",
              playCanvas: "playCanvas",
              // TODO ws传递参数 _连接
              newUrlReturn: opts.cameraId +'_'+opts.startTime+'_'+opts.endTime
            };
            if (opts) {
              if (opts.isRecord) {
                playerOptions.proxyTransport = 'true';
              }
              Object.assign(playerOptions, opts);
            }
            var player = window.Streamedian.player(videoId, playerOptions);
            if(player) {
              player.cameraId = opts.cameraId
              player.rtspWebSocketUrl = opts.rtspWebSocketUrl
              player.isH265Url = opts.isH265Url
              return player;
            } else {
              callback("[playRtspV]视频组件生成异常")
              return null
            }
          }

          getlogs(param, callback) {
            let url = 'http://' + this.ip + ':' + this.port + "/api/scms/iv/cmsproxy/operationlog/queryLogs"
            axios.post(url, param,
              {
                headers: {
                  'X-Auth-Token': this.token,
                  'X-Session-ID': this.sessionId
                }
              })
              .then(res => {
                if (res.headers['x-auth-token'] != undefined) { // token更新为刷新token
                  console.log('token更新：', res.headers['x-auth-token'])
                  this.token = res.headers['x-auth-token'];
                }
              callback(res.data)
          })
          .catch(err => {
              console.info(err);
              callback(err)
          });
          }


          // 销毁流
          destroyStream(streamMark) {
            let param = {
              "streamMark": streamMark
            }
            let url = 'http://' + this.ip + ':' + this.port + '/api/scms/iv/cmsproxy/rtsp/closeStream'
            axios.post(url, param,
              {
                headers: {
                  'X-Auth-Token': this.token,
                  'X-Session-ID': this.sessionId
                }
              })
              .then(res => {
                if (res.headers['x-auth-token'] != undefined) { // token更新为刷新token
                  console.log('token更新：', res.headers['x-auth-token'])
                  this.token = res.headers['x-auth-token'];
                }
          })
          .catch(err => {
              console.info(err);
          });
          }
          isFullscreen() {
            return document.fullscreenElement ||
              document.msFullscreenElement ||
              document.mozFullScreenElement ||
              document.webkitFullscreenElement || false;
          }


          finishCapturing(e) {
            var videoData = [e.data];
            var blob = new Blob(videoData, {'type': 'video/webm;'});
            var url = window.URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
          
            var date = new Date();
            var datestr = moment(date).format("YYYYMMDDHHmmss");
            var recodename = datestr + ".mp4";
            a.download = recodename;
          
            document.body.appendChild(a);
            a.click();
            let timeout = setTimeout(function () {
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
              clearTimeout(timeout);
            }, 1000);
          }

          savePic(fileName, videoId) {
            let isWaterMarkOpen = true
            var fileType = "png"; // 如果文件名中没有带后缀，默认使用png
            var video = document.getElementById(videoId);
            var canvas = window.canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            // canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height); // 图片大小和视频分辨率一致
            var ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height); // 图片大小和视频分辨率一致
            if (isWaterMarkOpen) {
              ctx.rotate(-20 * Math.PI / 180) // 逆时针旋转π/9
              ctx.font = '30px Vedana' // 设置字体
              ctx.fillStyle = 'rgba(200, 200, 200, 0.50)' // 设置字体的颜色
              ctx.textAlign = 'left' // 文本对齐方式
              ctx.textBaseline = 'Middle' // 文本基线
              // 水印密度
              for (let i = 0; i < canvas.height / 240; i++) {
                for (let j = 0; j < canvas.width / 100; j++) {
                  let str = ["视频zv"];
                  ctx.fillText(str, i * 400, j * 200, canvas.width)
                }
              }
            }
            var strDataURL = canvas.toDataURL("image/" + fileType); // canvas中video中取一帧图片并转成dataURL
            var arr = strDataURL.split(',');
            var mime = arr[0].match(/:(.*?);/)[1];
            var bstr = atob(arr[1]);
            var n = bstr.length;
            var u8arr = new Uint8Array(n);
            while (n--) {
              u8arr[n] = bstr.charCodeAt(n);
            }
            var blob = new Blob([u8arr], {
              type: mime
            });
            var url = window.URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            let timeout = setTimeout(function () {
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
              clearTimeout(timeout);
            }, 1000);
          }

          getUnixTime(dateStr) {
            let newstr = dateStr.replace(/-/g, "/");
            let date = new Date(newstr);
            let timestr = date.getTime().toString();
            return timestr.substr(0, 10);
          };

          // 播放异常重连
        // 播放异常重连
        reconnectWS(videoId, replay, audioSwitch, playError){
          let self = this
          var videoCom = document.getElementById(videoId);

          if(videoCom && videoCom.rtspPlayer) {      
            if(videoCom["codeingMonitor"]) {
              clearInterval(videoCom["codeingMonitor"]);
            }        
            videoCom.rtspPlayer.isLockReconnected = true
            console.log('-----reconnect');
            videoCom.rtspPlayer.destroy(true).then(() => {
              // self.destroyStream(videoCom.rtspPlayer.streamMark)
              console.log('-----reconnect-playError',playError);
              if(playError) {
                const videoPromise = self.getAddress(videoId,replay,audioSwitch)
                videoDom.prom = videoPromise
              } else {
                videoCom["codeingMonitor"] = setInterval(function () {
                  // const videoPromise = self.getAddress(videoId, replay, audioSwitch);
                  const videoPromise = self.getAddressModify(videoId, replay, audioSwitch);
                  videoCom.prom = videoPromise
                }, 45000)
              }

            })
          }
        }

              // modify 重连
              getAddressModify(videoId, replay, audioSwitch){
                console.log('=====', videoId);
                const controller = new AbortController();
    
                var videoCom = document.getElementById(videoId);
                if(replay && videoCom.playState !== "Play") {
                  console.log('非播放状态异常，不处理！')
                  return
                }
                if(!videoCom || !videoCom.rtspPlayerOpts) {
                  return
                }
                var cameraId = videoCom.rtspPlayerOpts.cameraId
                var streamType = videoCom.rtspPlayerOpts.streamType || 0
                var that = this
  
                console.log('=====videoCom.rtspPlayerOpts',videoCom.rtspPlayerOpts)
                const promise = new Promise((resolve, reject) => {
    
                    // 在处理视频播放请求结果前，先检查 Promise 的状态，处理在视频接口返回前进行了停止操作
                    // if (promise && promise.status === 'rejected') {
                    //   console.log("zvvideo.js   取消视频请求操作")
                    //   return;
                    // }
    
                    if(replay){
                        let rtspUrl = "";
                      if (!res.data || !res.data.data) {
                        console.log("未配置转码！");
                      } else {
                        videoCom.rtspPlayerOpts.rtspWebSocketUrl = "ws:" + res.data.data.ip + ":" + res.data.data.port + "/ws"
                        videoCom.rtspPlayerOpts.isH265Url = res.data.data.wsUrl
                      }
                      videoCom.rtspPlayerOpts.rtspUrl = res.data.data.rtspUrl;
                      videoCom.rtspPlayerOpts.streamMark = res.data.data.streamMark
                      return this.playVideo(videoCom.rtspPlayerOpts, function(e) {
                        
      
                      });
      
                    }else {
                      var vid = videoCom.rtspPlayerOpts.videoId

                      const paramsStr = window.location.search
                      const obj = new URLSearchParams(paramsStr)
                      let starttime = obj.get('starttime') || ''// list
                      let endtime = obj.get('endtime') || '' // list
                      var cameraIndexCode  = '3200000001';     //获取输入的监控点编号值，必填
                          // var params = {
                          //     cameraId: cameraIndexCode, // 必填
                          //     videoId: videoId, // 必填
                          //     startTime: starttime,
                          //     endTime: endtime,
                          // }
                          var vid = videoCom.rtspPlayerOpts.videoId
                          let playerOptions = {
                              socket: videoCom.rtspPlayerOpts.rtspWebSocketUrl,
                              isH265Url:videoCom.rtspPlayerOpts.wsUrl,
                              redirectNativeMediaErrors: true,
                              bufferDuration: 10,
                              statuHandler: videoCom.stuHandler,
                              errorHandler: videoCom.errHandler,
                              audioSwitchValue: videoCom.rtspPlayerOpts.audioValue || false,
                              audio: "audio_0",
                              playCanvas: "playCanvas"
                            };
                          videoCom.rtspPlayer = window.Streamedian.player(vid, playerOptions);
                    }
                })	
    
                promise.abort = () => {
                  controller.abort(); // 取消异步操作
                  promise.status = 'rejected'; // 修改 Promise 对象的状态
                };
               
                return promise;
              }

          // replay:true 录像回放
          getAddress(videoId, replay, audioSwitch){
            const controller = new AbortController();

            var videoCom = document.getElementById(videoId);
            if(replay && videoCom.playState !== "Play") {
              console.log('非播放状态异常，不处理！')
              return
            }
            if(!videoCom || !videoCom.rtspPlayerOpts) {
              return
            }
            var cameraId = videoCom.rtspPlayerOpts.cameraId
            var streamType = videoCom.rtspPlayerOpts.streamType || 0
            let url = 'http://' + this.ip + ':' + this.port + '/api/scms/iv/cmsproxy/rtsp/realTimeStreamUrl?clientFlag=1&cameraId=' + cameraId + '&streamType=' + streamType + '&isWsUsed=true&mediaType=MediaServer'                
            if(replay && videoCom.rtspPlayerOpts) { // 回放
              // debugger
              // isRecord
              var diff = videoCom.currentTime
              console.log('暂停继续播放diff', diff)
              var startTime= Number(videoCom.rtspPlayerOpts.startTimeUnix) + Math.round(diff) // 从断线处续播
              var endTime = videoCom.rtspPlayerOpts.endTimeUnix // videoCom.endTime || 
              var storeId = videoCom.rtspPlayerOpts.storeId // videoCom.storeId || 
              url ='http://' + this.ip + ':' + this.port +  `/api/scms/iv/cmsproxy/rtsp/historicalVideoUrl?cameraId=${cameraId}&startTime=${startTime}&endTime=${endTime}&storeId=${storeId}&forward=0&isWsUsed=true&mediaType=MediaServer`;
            }

            const promise = new Promise((resolve, reject) => {
              axios.get(url, {
                headers: {
                    'X-Auth-Token': this.token,
                    'X-Session-ID': this.sessionId
                  }
                }
              ).then(res => {
                if (res.headers['x-auth-token'] != undefined) { // token更新为刷新token
                  console.log('token更新：', res.headers['x-auth-token'])
                  this.token = res.headers['x-auth-token'];
                }

                // 在处理视频播放请求结果前，先检查 Promise 的状态，处理在视频接口返回前进行了停止操作
                if (promise.status === 'rejected') {
                  console.log("zvvideo.js   取消视频请求操作")
                  return;
                }

                if(replay){
                    let rtspUrl = "";
                  if (!res.data || !res.data.data) {
                    console.log("未配置转码！");
                  } else {
                    videoCom.rtspPlayerOpts.rtspWebSocketUrl = "ws:" + res.data.data.ip + ":" + res.data.data.port + "/ws"
                    videoCom.rtspPlayerOpts.isH265Url = res.data.data.wsUrl
                  }
                  videoCom.rtspPlayerOpts.rtspUrl = res.data.data.rtspUrl;
                  videoCom.rtspPlayerOpts.streamMark = res.data.data.streamMark
                  return this.playVideo(videoCom.rtspPlayerOpts, function(e) {
                    
  
                  });
  
                }else {
                  var vid = videoCom.rtspPlayerOpts.videoId
                  videoCom.src = res.data.data.rtspUrl
                  videoCom.rtspPlayerOpts.rtspUrl = res.data.data.rtspUrl
                  videoCom.rtspPlayerOpts.audioSwitchValue = audioSwitch
                  videoCom.rtspPlayerOpts.isH265Url = res.data.data.wsUrl
                  videoCom.rtspPlayerOpts.streamMark = res.data.data.streamMark
                  let playerOptions = {
                    socket: videoCom.rtspPlayerOpts.rtspWebSocketUrl,
                    isH265Url:res.data.data.wsUrl,
                    redirectNativeMediaErrors: true,
                    bufferDuration: 10,
                    statuHandler: videoCom.stuHandler,
                    errorHandler: videoCom.errHandler,
                    audioSwitchValue: videoCom.rtspPlayerOpts.audioValue || false,
                    audio: "audio_0",
                    playCanvas: "playCanvas"
                  };
                  videoCom.rtspPlayer = window.Streamedian.player(vid, playerOptions);
                  videoCom.rtspPlayer.cameraId = videoCom.rtspPlayerOpts.cameraId
                  videoCom.rtspPlayer.isH265Url = videoCom.rtspPlayerOpts.isH265Url
                  videoCom.rtspPlayer.streamMark = res.data.data.streamMark
                }
              })
              .catch(err => {
                reject(err);
              });
            })	

            promise.abort = () => {
              controller.abort(); // 取消异步操作
              promise.status = 'rejected'; // 修改 Promise 对象的状态
            };
           
            return promise;
          }

          PlayRtspVideoHistory(params, callback) { // 获取rtspUrl并播放
            let videoId = params.videoId;
            let cameraId = params.cameraId;
            let storeId = params.storeId;
            let startTime = params.startTimeUnix;
            let endTime = params.endTimeUnix;
            let reconnectTime = params.reconnectTime || 0;
            let playbackRate = params.playbackRate || 1;
            var forward = params.forward || 0;
            if (!reconnectTime) {
              reconnectTime = 0;
            }
            let pvideo = $("#" + videoId)[0];
            if(!pvideo) {
              callback("视频组件获取失败！")
              return
            }
            pvideo.rtspPlayerOpts = params
            pvideo.replay = true
            let player = pvideo.rtspPlayer
            try {
              player && player.destroy();
            } catch (e) {
              console.log(e);
            }
            startTime = parseInt(startTime) + parseInt(reconnectTime)
            let url ='http://' + this.ip + ':' + this.port +  `/api/scms/iv/cmsproxy/rtsp/historicalVideoUrl?cameraId=${cameraId}&startTime=${startTime}&endTime=${endTime}&storeId=${storeId}&forward=${forward}&isWsUsed=true&mediaType=MediaServer`;
            let self=this
            axios.get(url,{
              headers: {
                'X-Auth-Token': this.token,
                'X-Session-ID': this.sessionId
              }
            }).then((res) => {
              if (res.headers['x-auth-token'] != undefined) { // token更新为刷新token
                console.log('token更新：', res.headers['x-auth-token'])
                this.token = res.headers['x-auth-token'];
              }
              let rtspUrl = "";
              if (!res.data || !res.data.data) {
                console.log("未配置转码！");
                callback("未配置转码！")
                // $videoParent.addClass("video-empty-rtsp-wrap")
                // 销毁播放器
              } else {
                rtspUrl = res.data.data.rtspUrl;
                params.rtspWebSocketUrl = "ws:" + res.data.data.ip + ":" + res.data.data.port + "/ws"
                params.isH265Url = res.data.data.wsUrl
              }
              params.videoId = videoId
              params.rtspUrl = rtspUrl
              params.streamMark = res.data.data.streamMark
              params.isRecord = true
              return this.playVideo(params, callback);
            })
              .catch(err => {
                document.getElementById(errorId).innerHTML = messageInfo || ""
                // 播放状态、文字修改
                // document.getElementById(videoId + 'error').innerHTML = '视频请求失败！'
                // $($('#'+videoId+'Play')[0]).removeClass('iconzanting').addClass('iconvideo_play')
                // $($('#'+videoId+'Play')[0]).attr("title", '播放')
                // console.log(err);
              });
          }

///////////////////////////////


        }


        window.zvvideo = {
            player() {
                return new ZVPlayer();
            }
        }
    }());
