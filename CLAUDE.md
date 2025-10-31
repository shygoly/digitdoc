# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**digitDoc** is a digital healthcare system (数字人医生系统) that provides video streaming, monitoring, and interactive communication capabilities. The project includes:

1. **Documentation & Specifications** - Product requirements, interface specifications, and design documents
2. **Video Player Component (wsplayer)** - A browser-based video streaming player supporting real-time and historical video playback

This is primarily a **documentation and component library project** rather than a full application codebase.

## Project Structure

```
digitDoc/
├── README.md                           # Project overview with product screenshots
├── 接口.md                             # Interface specifications (currently empty placeholder)
├── CLAUDE.md                           # This file
├── 数字人医生产品介绍.pdf              # Product introduction document
├── 数字人医生前端设计需求书v1.0.docx  # Frontend design requirements v1.0
├── 数字人医生系统接口.docx              # System interface specifications
├── wsplayer.zip                        # Video player component (source included as wsplayer_extracted/)
├── images/                             # Product screenshots
│   └── page_01.png - page_17.png      # 17 pages of product documentation images
└── .claude/
    └── settings.local.json             # Claude Code permissions (unzip allowed)
```

## Key Components

### 1. Video Player Component (zvvideo.js)

Located in `wsplayer_extracted/` (from wsplayer.zip), this is a **self-contained HTML5 video player library**.

**Architecture:**
- **ZVPlayer Class** - Main player controller managing video playback, authentication, and stream control
- **Dependencies** - jQuery, axios, moment.js, mp4box, streamedian (H264/H265 codec library), recorder.js
- **Client-Server Model** - Communicates with a VCMS (Video Content Management System) backend via HTTP/WebSocket

**Key Features:**
- **Real-time video streaming** - RTSP/WebSocket-based video playback
- **Historical playback** - Recorded video playback with time range selection
- **Bidirectional audio** - Two-way voice communication via WebSocket
- **PTZ Control** - Pan-tilt-zoom camera control
- **Stream Control** - Pause, play, seek, playback rate, stream switching (main/sub)
- **Recording** - Screen capture and video recording
- **Authentication** - VCMS token-based authentication with automatic token refresh
- **Error Handling** - Automatic reconnection on stream failure with exponential backoff

**Main Methods:**

**Authentication & Session:**
- `vcmsAuth(ip, port, user, password, callback)` - Authenticate and get token/sessionId
- `vcmsLogout(callback)` - Logout and clear credentials
- `heartbeat()` - Send periodic heartbeat to keep session alive

**Video Playback:**
- `play(params, callback)` - Play real-time video stream
- `playBack(params, callback)` - Play historical recording with time range
- `stop(videoId)` - Stop current playback
- `destroyPlayer(videoId)` - Clean up player resources

**Stream Control:**
- `pause(videoId, isPause)` - Pause/resume playback
- `rate(videoId, rateValue)` - Set playback speed (1, 2, 4, 8, 1/2, 1/4, 1/8)
- `seek(videoId, percentValue, stime, etime)` - Jump to position in stream
- `streamChange(videoId, mainStream)` - Switch between main/sub stream

**Audio & Recording:**
- `switchVoice(videoId, openVoice)` - Mute/unmute audio
- `openTalk(cameraId, callback)` - Start bidirectional audio
- `closeTalk(cameraId, callback)` - End bidirectional audio
- `recordVideo(videoId, state)` - Start/stop video recording
- `screenShot(videoId)` - Capture screenshot with watermark

**PTZ Control:**
- `ptzControl(cameraId, num, isOpen, controlSpeed, callback)` - Control camera movement/zoom
- `ptzControlApply(cameraId, type, callback)` - Request/lock/release PTZ control

**Advanced Features:**
- `reconnectWS(videoId, replay, audioSwitch)` - Auto-reconnection handler
- `getAddressModify(videoId, replay, audioSwitch)` - Modified reconnection logic
- `PlayRtspVideoHistory(params, callback)` - Internal method for historical video playback

### 2. HTML Interface (index.html)

A minimal web interface providing:
- Video canvas element for rendering
- Audio element for audio playback
- Play/stop icon buttons
- Status display area for messages and bitrate info

## API Integration

The ZVPlayer communicates with a VCMS backend system using the following endpoints:

### Authentication
- `POST /api/scms/iv/cmsproxy/login` - User authentication
- `POST /api/scms/iv/cmsproxy/loginOut` - Logout
- `GET /api/scms/iv/cmsproxy/heartbeat` - Session keep-alive

### Video Streaming
- `GET /api/scms/iv/cmsproxy/rtsp/realTimeStreamUrl` - Get real-time stream URL
- `GET /api/scms/iv/cmsproxy/rtsp/historicalVideoUrl` - Get recorded stream URL
- `POST /api/scms/iv/cmsproxy/rtsp/controlStream` - Control playback (pause/play/rate/seek)
- `POST /api/scms/iv/cmsproxy/rtsp/closeStream` - Close active stream

### Audio Communication
- `POST /api/scms/iv/cmsproxy/voiceIntercom/startIntercom` - Start two-way audio
- `POST /api/scms/iv/cmsproxy/voiceIntercom/closeIntercom` - End two-way audio
- WebSocket for bidirectional PCM audio data transmission

### Camera Control
- `POST /api/scms/iv/cmsproxy/ptz/control` - Execute PTZ movement
- `POST /api/scms/iv/cmsproxy/ptz/controlApply` - Request/manage PTZ permissions

### Logs
- `POST /api/scms/iv/cmsproxy/operationlog/queryLogs` - Fetch operation logs

## Token Management

- **Authentication Headers**: `X-Auth-Token` and `X-Session-ID`
- **Token Refresh**: Server can issue new token in response headers; client automatically updates
- **Error Handling**: Failed API calls due to expired tokens should trigger re-authentication

## Known Issues & Notes

1. **Incomplete Reconnection Logic** - `getAddressModify()` method (lines 1192-1268) has incomplete implementation with missing variable references (`res`, `videoDom`)
2. **Memory Leaks** - Potential memory leaks in voice communication (line 482: "泄露" comment indicates awareness of leak)
3. **Hardcoded Values** - Global `baseWsIp` variable used but not defined in zvvideo.js
4. **Browser Compatibility** - Uses older APIs like `navigator.getUserMedia` and requires polyfills for fullscreen/audio APIs
5. **Commented Code** - Extensive commented code blocks for testing and alternative implementations

## Development Notes

### Setting Up the Video Player

To integrate the ZVPlayer in a web application:

```javascript
// Create player instance
const player = window.zvvideo.player();

// Authenticate
player.vcmsAuth('192.168.1.100', 8080, 'user', 'password', (result) => {
  if (result.code === 200) {
    // Use token for subsequent calls
  }
});

// Play real-time video
player.play({
  videoId: 'videoElement',
  cameraId: 'camera123',
  stream: 0, // 0 = main stream, 1 = sub stream
  errorId: 'errorElement'
}, (callback) => {
  console.log(callback);
});
```

### Testing

The project includes test components in `wsplayer_extracted/index.html` with basic UI for:
- Testing video playback
- Audio playback controls
- Status monitoring

### Audio Recording

The bidirectional audio uses:
- Web Audio API for PCM recording
- Web Workers for AAC encoding (`libAacEncoder/encoderPcmToAac.js`)
- WebSocket for real-time audio transmission

## Documentation Files

- **数字人医生产品介绍.pdf** - Complete product overview with features and capabilities (17 pages)
- **数字人医生前端设计需求书v1.0.docx** - Detailed frontend requirements and UI design specifications
- **数字人医生系统接口.docx** - API interface documentation
- **接口.md** - Placeholder for markdown version of interfaces (empty)
- **images/page_01.png through page_17.png** - Product documentation screenshots

## Building and Deployment

The wsplayer component is a **client-side only library**. No build step is required - include directly in HTML:

```html
<script src="lib/jquery-1.12.4.min.js"></script>
<script src="lib/axios.min.js"></script>
<script src="lib/moment.js"></script>
<script src="lib/mp4box.all.min.js"></script>
<script src="lib/streamedianAACH264H265.min.js"></script>
<script src="lib/js_md5.js"></script>
<script src="lib/FileSaver.js"></script>
<script src="lib/recorder.js"></script>
<script src="lib/record-sdk.js"></script>
<script src="zvvideo.js"></script>
<script src="lib/pcm-player.min.js"></script>
```

## Common Tasks

### Add New API Endpoint

1. Add endpoint URL to appropriate section in zvvideo.js
2. Use axios.post/get with token headers
3. Handle token refresh in response
4. Add error callback

### Debug Video Playback Issues

1. Check browser console for status messages (stuHandler callback)
2. Verify VCMS backend connectivity and token validity
3. Check WebSocket URL configuration (baseWsIp)
4. Monitor network requests for 401/403 auth failures

### Extend Audio Capabilities

1. Modify `startTalking()` method for different audio codec
2. Update Worker script path for encoder
3. Adjust buffer sizes in `voiceTimer` interval (currently 10ms)

## Important Files Reference

- **Main Component**: `/Users/mac/Sync/project/digitDoc/wsplayer_extracted/zvvideo.js` (1443 lines)
- **HTML Interface**: `/Users/mac/Sync/project/digitDoc/wsplayer_extracted/index.html` (1139 lines)
- **Documentation**: All `.md`, `.pdf`, and `.docx` files in project root
