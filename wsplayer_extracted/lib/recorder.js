var reco = null
function Recorder(MediaStream) {
  var sampleBits = 16;// 输出采样数位 8, 16
    var sampleRate = 16000;// 输出采样�?
    var inputSampleRate = 48000;
    this.context = new AudioContext();
    this.audioInput = this.context.createMediaStreamSource(MediaStream);
    this.recorder = this.context.createScriptProcessor(4096, 1, 1);
    this.srartime3 = 0;
    this.audioData = {
      size: 0, // 录音文件长度
      buffer: [], // 录音缓存
      inputSampleRate: inputSampleRate, // 输入采样�?
      inputSampleBits: 16, // 输入采样数位 8, 16
      outputSampleRate: sampleRate,
      outputSampleBits: sampleBits,
      clear: function () {
        this.buffer = [];
        this.size = 0;
      },
      input: function (data) {
        this.buffer.push(new Float32Array(data));
        this.size += data.length;
      },
      compress: function () { // 合并压缩
        // 合并
        var data = new Float32Array(this.size);
        var offset = 0;
        for (var i = 0; i < this.buffer.length; i++) {
          data.set(this.buffer[i], offset);
          offset += this.buffer[i].length;
        }
        // 压缩
        // var compression = this.inputSampleRate / this.outputSampleRate;
        var compression = Math.max(Math.floor(this.inputSampleRate / this.outputSampleRate), 1);
        // console.log("pcmcompression",compression);
        var length = data.length / compression;
        // var length= Math.floor(data.length / compression) * (this.oututSampleBits / 8)
        var result = new Float32Array(length);
        var index = 0;
        var j = 0;
        while (index < length) {
          result[index] = data[j];
          j += compression;
          index++;
        }
        return result;
      },
      encodePCM: function () {
        var bytes = this.compress();
        var offset = 0;
        var dataLength = bytes.length * (sampleBits / 8);
        var buffer = new ArrayBuffer(dataLength);
        var data = new DataView(buffer);

        // 写入采样数据
        if (sampleBits === 8) {
          for (var i = 0; i < bytes.length; i++, offset++) {
            // 范围[-1, 1]
            var s = Math.max(-1, Math.min(1, bytes[i]));
            // 8位采样位划分�?^8=256份，它的范围�?-255;
            // 对于8位的话，负数*128，正�?127，然后整体向上平�?28(+128)，即可得到[0,255]范围的数据�?
            var val = s < 0 ? s * 128 : s * 127;
            val = +val + 128;
            data.setInt8(offset, val);
          }
        } else {
          for (var i = 0; i < bytes.length; i++, offset += 2) {
            var s = Math.max(-1, Math.min(1, bytes[i]));
            // 16位的划分的是2^16=65536份，范围�?32768�?2767
            // 因为我们收集的数据范围在[-1,1]，那么你想转换成16位的话，只需要对负数*32768,对正�?32767,即可得到范围在[-32768,32767]的数据�?
            data.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
          }
        }
        return data;
      }
    };
}

Recorder.prototype.start = function(){
  this.audioInput.connect(this.recorder);
  this.recorder.connect(this.context.destination);

  // 音频采集
  let self = this
  this.recorder.onaudioprocess = function (e) {
    self.audioData.input(e.inputBuffer.getChannelData(0));
  }
}

Recorder.prototype.stop = function(){
  this.recorder.disconnect();
}

Recorder.prototype.getBlob = function(){
  return this.audioData.encodePCM();
}

Recorder.prototype.clear = function(){
  this.audioData.clear();
}

Recorder.checkError = function(e){
  const { name } = e;
    let errorMsg = ''
    switch (name) {
      case 'AbortError': errorMsg = '录音设备无法被使用'; break;
      case 'NotAllowedError': errorMsg = '用户已禁止网页调用录音设备'; break;
      case 'PermissionDeniedError': errorMsg = '用户已禁止网页调用录音设备'; break; // 用户拒绝
      case 'NotFoundError': errorMsg = '录音设备未找到'; break;
      case 'DevicesNotFoundError': errorMsg = '录音设备未找到'; break;
      case 'NotReadableError': errorMsg = '录音设备无法使用'; break;
      case 'NotSupportedError': errorMsg = '不支持录音功能'; break;
      case 'MandatoryUnsatisfiedError': errorMsg = '无法发现指定的硬件设备'; break;
      default: errorMsg = '录音调用错误'; break;
    }
    return { error: errorMsg }
}
Recorder.getRec = function(rec){
  this.reco = rec
}
Recorder.get = function(callback){
  let self = this;
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

    if (!navigator.getUserMedia) {
      alert('浏览器不支持音频输入');
    } else {
      navigator.getUserMedia(
        {audio: true},
        function (MediaStream) {
          let rec = new Recorder(MediaStream)
          // this.reco = rec
          callback(rec)
        }, function (error) {
          // eslint-disable-next-line no-console
          console.log(error)
        }
      )
    }
}
Recorder.innitRecorder = function(rec){
  this.recorder = rec;
}
Recorder.sendWebsocket = function(ws, data){
  let websocket = new WebSocket(ws)
  ws.send(data)
}

if (typeof define === 'function' && define.amd) {
  define(function () {
    return Recorder
  })
} else if (typeof module === 'object' && module.exports) {
  module.exports = Recorder
} else {
  $.Recorder = Recorder
}
// module.exports = Recorder;
