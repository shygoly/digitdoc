function Record() {
}

Record.prototype.startRecord = async function(param) {
  let self = this;
  try {
    Recorder.get(rec => {
      if (rec.error) return param.error(rec.error);
      self.recorder = rec;
      // self.recorder.start();
      param.success("开始录音");
    })
  } catch (e) {
    param.error("开始录音失败" + e);
  }
};

Record.prototype.startReceive = function(){
  this.recorder.start()
}

Record.prototype.getBlob1 = function(){
  return this.recorder.getBlob();
}

Record.prototype.stopReceive = function(){
  this.recorder.clear()
  this.recorder.stop()
}

Record.prototype.stopRecord = function(param){
  let self = this;
  try {
    let blobData = self.recorder.getBlob();
    param.success(blobData);
  } catch (e) {
    param.error("结束录音失败" + e);
  }
}

Record.prototype.play = function (audio) {
  let self = this;
  try {
    self.recorder.play(audio);
  } catch (e) {
    console.error("录音播放失败" + e);
  }
}

Record.prototype.clear = function () {
  let self = this;
  try {
    self.recorder.clear();
  } catch (e) {
    console.error("清空录音失败" + e);
  }
}

// module.exports = Record

// 类
function NALUH265(data) {
  this.data = data;
}

NALUH265.prototype.appendData = function(idata){
  this.data = this.appendByteArray(this.data, idata);
}

NALUH265.prototype.appendByteArray = function(buffer1, buffer2){
    let tmp = new Uint8Array((buffer1.byteLength | 0) + (buffer2.byteLength | 0));
    tmp.set(buffer1, 0);
    tmp.set(buffer2, buffer1.byteLength | 0);
    return tmp;
}

// module.exports  = {Record, NALUH265};

if (typeof define === 'function' && define.amd) {
  define(function () {
    return {
      Record:Record,
      NALUH265:NALUH265
    }
  })
} else if (typeof module === 'object' && module.exports) {
  module.exports =  {
    Record:Record,
    NALUH265:NALUH265
  }
} else {
  $.Record = Record;
  $.NALUH265 = NALUH265;
}