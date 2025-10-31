var quarterWidth
var quarterHeight
var xdiv = 0
var ydiv = 0
var preWidth
var preHeight


;(function ($) {
  'use strict'

  function zoomSizeChange (outDom, indexDom) {
    let videoString = indexDom
    let quarterString = outDom
    let mapImage = document.getElementById(videoString)
    let quarterDiv = document.getElementById(quarterString)
    if(quarterDiv) {
      quarterWidth = quarterDiv.clientWidth
      quarterHeight = quarterDiv.clientHeight
      preWidth = quarterWidth;
      preHeight = quarterHeight;
      mapImage.style.width = quarterWidth + 'px'
      mapImage.style.height = quarterHeight + 'px'
      mapImage.style.top = 0 + 'px'
      mapImage.style.left = 0 + 'px'
      let video = document.querySelector('video');
      video.style.zoom = "zoom" + "100%"
      xdiv = 0
      ydiv = 0
    }
};



  if (typeof define === 'function' && define.amd) {
    define(function () {
      return zoomSizeChange
    })
  } else if (typeof module === 'object' && module.exports) {
    module.exports = zoomSizeChange
  } else {
    $.zoomSizeChange = zoomSizeChange
  }
})(this)