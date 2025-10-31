import { useState, useEffect, useRef } from 'react'
import apiService from '../services/api'
import socketService from '../services/socket'
import type {
  DialogData,
  Doctor,
  HealthDataParams,
  HealthDataResponse,
  UserParams,
  User,
  CaseContent,
  TriageData,
  AssistantContent,
  UserContent,
  FaceDetectData,
} from '../types/api'
import './ApiTestPage.css'

interface LogEntry {
  time: string
  type: 'api' | 'socket' | 'video' | 'dialogue'
  event: string
  data: any
  status?: 'success' | 'error' | 'info'
}

export default function ApiTestPage() {
  // 服务器配置
  const [apiBaseUrl, setApiBaseUrl] = useState('http://218.206.102.135:8099/ExtExportAPI')
  const [socketUrl, setSocketUrl] = useState('http://218.206.102.135:3000')
  const [socketConnected, setSocketConnected] = useState(false)

  // REST API 测试状态
  const [restLoading, setRestLoading] = useState<string | null>(null)
  const [restResults, setRestResults] = useState<Record<string, any>>({})
  const [restErrors, setRestErrors] = useState<Record<string, string>>({})

  // Socket.io 测试状态
  const [socketLogs, setSocketLogs] = useState<any[]>([])

  // 数字人视频播放
  const [rtspUrl, setRtspUrl] = useState('rtsp://localhost:8554/test')
  const [wsUrl, setWsUrl] = useState('ws://localhost:8554/ws')
  const [videoStatus, setVideoStatus] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoPlayerRef = useRef<any>(null)

  // 对话测试
  const [dialogueHistory, setDialogueHistory] = useState<Array<{ role: 'user' | 'assistant', text: string, time: string }>>([])
  const [userInput, setUserInput] = useState('')
  const [dialogueStatus, setDialogueStatus] = useState<'idle' | 'waiting' | 'chatting'>('idle')
  const [currentAssistantContent, setCurrentAssistantContent] = useState<string>('')

  // 日志
  const [logs, setLogs] = useState<LogEntry[]>([])

  // 添加日志
  const addLog = (type: LogEntry['type'], event: string, data: any, status?: LogEntry['status']) => {
    const entry: LogEntry = {
      time: new Date().toLocaleTimeString(),
      type,
      event,
      data,
      status,
    }
    setLogs((prev) => [...prev.slice(-99), entry])
  }

  // 初始化 Socket.io 监听器
  useEffect(() => {
    if (!socketService.isConnected) return

    // 监听所有相关事件
    const handlers: Array<[string, (data: any) => void]> = [
      ['case_content1', (data: CaseContent) => {
        addLog('socket', 'case_content1', data, 'success')
        setSocketLogs((prev) => [...prev, { event: 'case_content1', data, time: new Date() }])
      }],
      ['case_content2', (data: CaseContent) => {
        addLog('socket', 'case_content2', data, 'success')
        setSocketLogs((prev) => [...prev, { event: 'case_content2', data, time: new Date() }])
      }],
      ['case_content3', (data: CaseContent) => {
        addLog('socket', 'case_content3', data, 'success')
        setSocketLogs((prev) => [...prev, { event: 'case_content3', data, time: new Date() }])
      }],
      ['case_content4', (data: CaseContent) => {
        addLog('socket', 'case_content4', data, 'success')
        setSocketLogs((prev) => [...prev, { event: 'case_content4', data, time: new Date() }])
      }],
      ['case_content5', (data: CaseContent) => {
        addLog('socket', 'case_content5', data, 'success')
        setSocketLogs((prev) => [...prev, { event: 'case_content5', data, time: new Date() }])
      }],
      ['case_content6', (data: CaseContent) => {
        addLog('socket', 'case_content6', data, 'success')
        setSocketLogs((prev) => [...prev, { event: 'case_content6', data, time: new Date() }])
      }],
      ['send_triage', (data: TriageData) => {
        addLog('socket', 'send_triage', data, 'success')
        setSocketLogs((prev) => [...prev, { event: 'send_triage', data, time: new Date() }])
      }],
      ['user_content', (data: UserContent) => {
        addLog('socket', 'user_content', data, 'success')
        setDialogueHistory((prev) => [...prev, {
          role: 'user',
          text: data.text || data.asr_content || JSON.stringify(data),
          time: new Date().toLocaleTimeString(),
        }])
      }],
      ['assistant_content', (data: AssistantContent) => {
        addLog('socket', 'assistant_content', data, 'success')
        const text = data.text || JSON.stringify(data)
        setCurrentAssistantContent(text)
        setDialogueHistory((prev) => [...prev, {
          role: 'assistant',
          text,
          time: new Date().toLocaleTimeString(),
        }])
        setDialogueStatus('chatting')
        // TODO: 如果包含音频 URL，可以在这里播放
      }],
      ['face_detect', (data: FaceDetectData) => {
        addLog('socket', 'face_detect', data, 'success')
        setSocketLogs((prev) => [...prev, { event: 'face_detect', data, time: new Date() }])
      }],
    ]

    handlers.forEach(([event, handler]) => {
      socketService.on(event, handler)
    })

    return () => {
      handlers.forEach(([event, handler]) => {
        socketService.off(event, handler)
      })
    }
  }, [socketConnected])

  // REST API 测试函数
  const testGetDialogData = async () => {
    const dialogId = prompt('请输入对话 ID:', '12345')
    if (!dialogId) return

    setRestLoading('getDialogData')
    setRestErrors({ ...restErrors, getDialogData: '' })
    try {
      const result = await apiService.getDialogData(Number(dialogId))
      setRestResults({ ...restResults, getDialogData: result })
      addLog('api', 'GetDialogData', result, 'success')
    } catch (error: any) {
      const errMsg = error.message || '未知错误'
      setRestErrors({ ...restErrors, getDialogData: errMsg })
      addLog('api', 'GetDialogData', error, 'error')
    } finally {
      setRestLoading(null)
    }
  }

  const testGetAllDoctors = async () => {
    setRestLoading('getAllDoctors')
    setRestErrors({ ...restErrors, getAllDoctors: '' })
    try {
      const result = await apiService.getAllDoctors()
      setRestResults({ ...restResults, getAllDoctors: result })
      addLog('api', 'GetAllDoctors', result, 'success')
    } catch (error: any) {
      const errMsg = error.message || '未知错误'
      setRestErrors({ ...restErrors, getAllDoctors: errMsg })
      addLog('api', 'GetAllDoctors', error, 'error')
    } finally {
      setRestLoading(null)
    }
  }

  const testQueryHealthData = async () => {
    const idcardNo = prompt('请输入身份证号:', '320101199001011234') || '320101199001011234'
    const startTime = prompt('请输入开始时间 (YYYY-MM-DD):', '2023-01-01') || '2023-01-01'
    const endTime = prompt('请输入结束时间 (YYYY-MM-DD):', '2023-12-31') || '2023-12-31'
    const tableName = prompt('请输入表名 (temptable/ecgtable等):', 'temptable') || 'temptable'

    setRestLoading('queryHealthData')
    setRestErrors({ ...restErrors, queryHealthData: '' })
    try {
      const result = await apiService.queryHealthData({
        idcardNo,
        startTime,
        endTime,
        tableName,
      })
      setRestResults({ ...restResults, queryHealthData: result })
      addLog('api', 'QueryHealthData', result, 'success')
    } catch (error: any) {
      const errMsg = error.message || '未知错误'
      setRestErrors({ ...restErrors, queryHealthData: errMsg })
      addLog('api', 'QueryHealthData', error, 'error')
    } finally {
      setRestLoading(null)
    }
  }

  const testGetAllUsers = async () => {
    const processing_state = prompt('请输入处理状态 (1=已处理, 2=未处理):', '1') || '1'
    const status = prompt('请输入状态 (0=已处理, 1=分诊中, 2=待确认):', '0') || '0'

    setRestLoading('getAllUsers')
    setRestErrors({ ...restErrors, getAllUsers: '' })
    try {
      const result = await apiService.getAllUsers({
        processing_state: Number(processing_state),
        status: Number(status),
      })
      setRestResults({ ...restResults, getAllUsers: result })
      addLog('api', 'GetAllUsers', result, 'success')
    } catch (error: any) {
      const errMsg = error.message || '未知错误'
      setRestErrors({ ...restErrors, getAllUsers: errMsg })
      addLog('api', 'GetAllUsers', error, 'error')
    } finally {
      setRestLoading(null)
    }
  }

  // Socket.io 连接管理
  const handleSocketConnect = async () => {
    try {
      await socketService.connect(socketUrl)
      setSocketConnected(true)
      addLog('socket', 'connect', { url: socketUrl }, 'success')
    } catch (error: any) {
      addLog('socket', 'connect', error, 'error')
      alert(`连接失败: ${error.message}`)
    }
  }

  const handleSocketDisconnect = () => {
    socketService.disconnect()
    setSocketConnected(false)
    addLog('socket', 'disconnect', {}, 'info')
  }

  // Socket.io 事件发送
  const emitSocketEvent = (event: string, data?: any) => {
    try {
      socketService.emit(event, data)
      addLog('socket', `emit:${event}`, data || {}, 'info')
    } catch (error: any) {
      addLog('socket', `emit:${event}`, error, 'error')
      alert(`发送失败: ${error.message}`)
    }
  }

  // 加载 wsplayer 脚本
  useEffect(() => {
    const loadWsPlayer = async () => {
      if ((window as any).zvvideo && (window as any).Streamedian) {
        return // 已加载
      }

      try {
        // 动态加载 wsplayer 脚本（必须按顺序：jQuery -> Streamedian -> zvvideo）
        if (!(window as any).jQuery && !(window as any).$) {
          const jqueryScript = document.createElement('script')
          jqueryScript.src = '/lib/jquery-1.12.4.min.js'
          await new Promise((resolve, reject) => {
            jqueryScript.onload = resolve
            jqueryScript.onerror = reject
            document.head.appendChild(jqueryScript)
          })
        }

        if (!(window as any).Streamedian) {
          const streamedianScript = document.createElement('script')
          streamedianScript.src = '/lib/streamedianAACH264H265.min.js'
          await new Promise((resolve, reject) => {
            streamedianScript.onload = resolve
            streamedianScript.onerror = reject
            document.head.appendChild(streamedianScript)
          })
        }

        if (!(window as any).zvvideo) {
          const zvvideoScript = document.createElement('script')
          zvvideoScript.src = '/zvvideo.js'
          await new Promise((resolve, reject) => {
            zvvideoScript.onload = resolve
            zvvideoScript.onerror = reject
            document.head.appendChild(zvvideoScript)
          })
        }

        addLog('video', 'script_loaded', {}, 'success')
      } catch (error: any) {
        addLog('video', 'script_load_error', error, 'error')
        console.error('Failed to load wsplayer scripts:', error)
      }
    }

    loadWsPlayer()
  }, [])

  // 数字人视频播放
  const handleVideoPlay = () => {
    if (!canvasRef.current) {
      alert('Canvas 未准备好')
      return
    }

    setVideoStatus('loading')
    addLog('video', 'play', { rtspUrl, wsUrl }, 'info')

    // 检查是否已加载 wsplayer
    if (!(window as any).zvvideo) {
      setVideoStatus('error')
      addLog('video', 'error', 'wsplayer 未加载，请检查脚本引入', 'error')
      alert('wsplayer 未加载，请刷新页面重试')
      return
    }

    try {
      // 设置全局变量（zvvideo.js 需要的配置）
      // 从 wsUrl 中提取 IP 和端口，格式: ws://host:port
      const wsMatch = wsUrl.match(/^wss?:\/\/([^\/]+)/)
      if (wsMatch) {
        (window as any).baseWsIp = wsMatch[1]
      } else {
        (window as any).baseWsIp = 'localhost:8554'
      }
      
      // 设置 timeSession（用于音频会话 ID）
      (window as any).timeSession = new Date().getTime()

      // 使用 wsplayer API 播放视频
      const player = (window as any).zvvideo?.player()
      if (!player) {
        throw new Error('无法创建播放器实例')
      }

      const videoId = 'digitdoc-video-canvas'
      const errorId = `${videoId}_error`
      
      // 确保错误显示元素存在
      let errorEl = document.getElementById(errorId)
      if (!errorEl) {
        errorEl = document.createElement('div')
        errorEl.id = errorId
        errorEl.style.display = 'none'
        errorEl.style.color = 'red'
        errorEl.style.padding = '10px'
        canvasRef.current?.parentElement?.appendChild(errorEl)
      }
      
      // 注意：zvvideo.js 需要 video 元素，Streamedian 会渲染到 playCanvas
      const opts: any = {
        videoId, // video 元素的 ID
        cameraId: 'test_camera',
        rtspUrl: rtspUrl,
        rtspWebSocketUrl: wsUrl,
        isH265Url: wsUrl,
        streamMark: 'test_stream',
        errorId, // 错误显示元素的 ID（必须在 opts 中，zvvideo.js 会使用）
        playCanvas: 'playCanvas', // Streamedian 渲染的 canvas ID
        audio: 'audio_0', // 音频元素 ID（可选）
      }

      player.play(opts, (result: any) => {
        if (result?.code === 200 || result === 200 || result === 'success' || result?.message?.includes('成功')) {
          setVideoStatus('playing')
          videoPlayerRef.current = player
          addLog('video', 'playing', { videoId, rtspUrl, wsUrl }, 'success')
        } else {
          setVideoStatus('error')
          addLog('video', 'play_error', result, 'error')
          const errorMsg = typeof result === 'string' ? result : result?.message || JSON.stringify(result)
          alert(`播放失败: ${errorMsg}`)
        }
      })
    } catch (error: any) {
      setVideoStatus('error')
      addLog('video', 'error', error, 'error')
      alert(`播放错误: ${error.message}`)
    }
  }

  const handleVideoStop = () => {
    try {
      if (videoPlayerRef.current) {
        const videoId = 'digitdoc-video-canvas'
        videoPlayerRef.current.stop?.(videoId)
        videoPlayerRef.current = null
      }
      setVideoStatus('idle')
      addLog('video', 'stop', {}, 'info')
    } catch (error: any) {
      addLog('video', 'stop_error', error, 'error')
      setVideoStatus('idle')
    }
  }

  // 对话测试
  const handleStartChat = () => {
    if (!socketConnected) {
      alert('请先连接 Socket.io')
      return
    }
    setDialogueStatus('waiting')
    setDialogueHistory([])
    emitSocketEvent('chat_start', {})
    addLog('dialogue', 'chat_start', {}, 'info')
  }

  const handleSendUserMessage = () => {
    if (!socketConnected) {
      alert('请先连接 Socket.io')
      return
    }
    if (!userInput.trim()) {
      alert('请输入消息')
      return
    }

    emitSocketEvent('user_content', { text: userInput })
    setDialogueHistory((prev) => [...prev, {
      role: 'user',
      text: userInput,
      time: new Date().toLocaleTimeString(),
    }])
    setUserInput('')
    setDialogueStatus('waiting')
    addLog('dialogue', 'user_message', { text: userInput }, 'info')
  }

  const handleEndChat = () => {
    setDialogueStatus('idle')
    emitSocketEvent('chat_end', {})
    addLog('dialogue', 'chat_end', {}, 'info')
  }

  // 开始完整对话流程
  const handleStartFullDialogue = async () => {
    // 1. 连接 Socket.io
    if (!socketConnected) {
      await handleSocketConnect()
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    // 2. 启动视频播放
    handleVideoPlay()

    // 3. 开始对话
    handleStartChat()
  }

  return (
    <div className="api-test-page">
      <h1>数字人医生系统 - 接口测试页面</h1>

      {/* 服务器配置 */}
      <section className="config-section">
        <h2>服务器配置</h2>
        <div className="config-row">
          <label>
            REST API 地址:
            <input
              type="text"
              value={apiBaseUrl}
              onChange={(e) => {
                setApiBaseUrl(e.target.value)
                apiService.setBaseURL(e.target.value)
              }}
              style={{ width: '400px', marginLeft: '10px' }}
            />
          </label>
        </div>
        <div className="config-row">
          <label>
            Socket.io 地址:
            <select
              value={socketUrl}
              onChange={(e) => {
                setSocketUrl(e.target.value)
                socketService.setUrl(e.target.value)
              }}
              style={{ marginLeft: '10px' }}
            >
              <option value="http://218.206.102.135:3000">患者端 (3000)</option>
              <option value="http://218.206.102.135:8099">管理端 (8099)</option>
              <option value="http://218.206.102.131:8081">医生端 (8081)</option>
            </select>
            <input
              type="text"
              value={socketUrl}
              onChange={(e) => setSocketUrl(e.target.value)}
              style={{ width: '300px', marginLeft: '10px' }}
              placeholder="或输入自定义地址"
            />
          </label>
        </div>
      </section>

      {/* REST API 测试 */}
      <section className="test-section">
        <h2>REST API 测试</h2>
        <div className="api-cards">
          <div className="api-card">
            <h3>获取医患对话数据</h3>
            <p>POST /ExtExportAPI/GetDialogData</p>
            <button onClick={testGetDialogData} disabled={restLoading === 'getDialogData'}>
              {restLoading === 'getDialogData' ? '测试中...' : '测试'}
            </button>
            {restErrors.getDialogData && (
              <div className="error">{restErrors.getDialogData}</div>
            )}
            {restResults.getDialogData && (
              <pre className="result">{JSON.stringify(restResults.getDialogData, null, 2)}</pre>
            )}
          </div>

          <div className="api-card">
            <h3>获取所有医生信息</h3>
            <p>POST /ExtExportAPI/GetAllDoctors</p>
            <button onClick={testGetAllDoctors} disabled={restLoading === 'getAllDoctors'}>
              {restLoading === 'getAllDoctors' ? '测试中...' : '测试'}
            </button>
            {restErrors.getAllDoctors && (
              <div className="error">{restErrors.getAllDoctors}</div>
            )}
            {restResults.getAllDoctors && (
              <pre className="result">{JSON.stringify(restResults.getAllDoctors, null, 2)}</pre>
            )}
          </div>

          <div className="api-card">
            <h3>查询体测数据</h3>
            <p>POST /ExtExportAPI/QueryHealthData</p>
            <button onClick={testQueryHealthData} disabled={restLoading === 'queryHealthData'}>
              {restLoading === 'queryHealthData' ? '测试中...' : '测试'}
            </button>
            {restErrors.queryHealthData && (
              <div className="error">{restErrors.queryHealthData}</div>
            )}
            {restResults.queryHealthData && (
              <pre className="result">{JSON.stringify(restResults.queryHealthData, null, 2)}</pre>
            )}
          </div>

          <div className="api-card">
            <h3>获取患者信息</h3>
            <p>POST /ExtExportAPI/GetAllUsers</p>
            <button onClick={testGetAllUsers} disabled={restLoading === 'getAllUsers'}>
              {restLoading === 'getAllUsers' ? '测试中...' : '测试'}
            </button>
            {restErrors.getAllUsers && (
              <div className="error">{restErrors.getAllUsers}</div>
            )}
            {restResults.getAllUsers && (
              <pre className="result">{JSON.stringify(restResults.getAllUsers, null, 2)}</pre>
            )}
          </div>
        </div>
      </section>

      {/* Socket.io 测试 */}
      <section className="test-section">
        <h2>Socket.io 测试</h2>
        <div className="socket-controls">
          <div className="socket-status">
            状态: <span className={socketConnected ? 'connected' : 'disconnected'}>
              {socketConnected ? `已连接 (${socketService.socketId})` : '未连接'}
            </span>
          </div>
          <div className="socket-buttons">
            <button onClick={handleSocketConnect} disabled={socketConnected}>
              连接
            </button>
            <button onClick={handleSocketDisconnect} disabled={!socketConnected}>
              断开
            </button>
          </div>
        </div>

        <div className="socket-events">
          <h3>发送事件</h3>
          <div className="event-buttons">
            <button onClick={() => emitSocketEvent('case1')}>case1 (主诉)</button>
            <button onClick={() => emitSocketEvent('case2')}>case2 (现病史)</button>
            <button onClick={() => emitSocketEvent('case3')}>case3 (既往史)</button>
            <button onClick={() => emitSocketEvent('case4')}>case4 (个人史)</button>
            <button onClick={() => emitSocketEvent('case5')}>case5 (家族史)</button>
            <button onClick={() => emitSocketEvent('case6')}>case6 (处理建议)</button>
            <button onClick={() => emitSocketEvent('triage')}>triage (分诊)</button>
          </div>
        </div>

        <div className="socket-logs">
          <h3>事件日志</h3>
          <div className="log-container">
            {socketLogs.map((log, idx) => (
              <div key={idx} className="log-entry">
                <span className="log-time">{log.time.toLocaleTimeString()}</span>
                <span className="log-event">{log.event}</span>
                <pre className="log-data">{JSON.stringify(log.data, null, 2)}</pre>
              </div>
            ))}
            {socketLogs.length === 0 && <div className="log-empty">暂无日志</div>}
          </div>
        </div>
      </section>

      {/* 数字人测试 */}
      <section className="test-section">
        <h2>数字人测试</h2>

        {/* 视频播放模块 */}
        <div className="video-section">
          <h3>视频播放</h3>
          <div className="video-controls">
            <label>
              RTSP 地址:
              <input
                type="text"
                value={rtspUrl}
                onChange={(e) => setRtspUrl(e.target.value)}
                style={{ width: '300px', marginLeft: '10px' }}
              />
            </label>
            <label style={{ marginLeft: '20px' }}>
              WebSocket 地址:
              <input
                type="text"
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                style={{ width: '300px', marginLeft: '10px' }}
              />
            </label>
          </div>
          <div className="video-buttons">
            <button onClick={handleVideoPlay} disabled={videoStatus === 'playing' || videoStatus === 'loading'}>
              {videoStatus === 'loading' ? '加载中...' : videoStatus === 'playing' ? '播放中' : '开始播放'}
            </button>
            <button onClick={handleVideoStop} disabled={videoStatus !== 'playing'}>
              停止播放
            </button>
          </div>
          <div className="video-status">
            状态: <span className={`status-${videoStatus}`}>
              {videoStatus === 'idle' ? '空闲' : videoStatus === 'loading' ? '加载中' : videoStatus === 'playing' ? '播放中' : '错误'}
            </span>
          </div>
          <div className="video-canvas-container">
            {/* wsplayer 需要 video 元素，但实际渲染通过 Streamedian 到 canvas */}
            <video
              ref={canvasRef as any}
              id="digitdoc-video-canvas"
              width={1280}
              height={720}
              className="video-canvas"
              style={{ width: '100%', height: 'auto', background: '#000' }}
            />
            <canvas id="playCanvas" width={1280} height={720} style={{ display: 'none' }}></canvas>
            <div id="digitdoc-video-canvas_error" style={{ display: 'none', color: 'red', padding: '10px' }}></div>
          </div>
        </div>

        {/* 对话测试模块 */}
        <div className="dialogue-section">
          <h3>对话测试</h3>
          <div className="dialogue-controls">
            <button onClick={handleStartFullDialogue}>开始完整对话</button>
            <button onClick={handleStartChat} disabled={!socketConnected || dialogueStatus !== 'idle'}>
              开始对话
            </button>
            <button onClick={handleEndChat} disabled={dialogueStatus === 'idle'}>
              结束对话
            </button>
          </div>
          <div className="dialogue-status">
            状态: <span className={`status-${dialogueStatus}`}>
              {dialogueStatus === 'idle' ? '空闲' : dialogueStatus === 'waiting' ? '等待回复' : '对话中'}
            </span>
          </div>
          <div className="dialogue-input">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendUserMessage()}
              placeholder="输入用户消息（模拟语音输入）"
              style={{ width: '500px', padding: '8px' }}
            />
            <button onClick={handleSendUserMessage} disabled={!socketConnected || !userInput.trim()}>
              发送消息
            </button>
          </div>
          <div className="dialogue-history">
            <h4>对话历史</h4>
            <div className="history-list">
              {dialogueHistory.map((msg, idx) => (
                <div key={idx} className={`history-item ${msg.role}`}>
                  <span className="history-time">{msg.time}</span>
                  <span className="history-role">{msg.role === 'user' ? '患者' : '医生'}:</span>
                  <span className="history-text">{msg.text}</span>
                </div>
              ))}
              {currentAssistantContent && dialogueStatus === 'chatting' && (
                <div className="history-item assistant current">
                  <span className="history-role">医生:</span>
                  <span className="history-text">{currentAssistantContent}</span>
                </div>
              )}
              {dialogueHistory.length === 0 && !currentAssistantContent && (
                <div className="history-empty">暂无对话</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 日志面板 */}
      <section className="test-section">
        <h2>完整日志</h2>
        <div className="log-container">
          {logs.map((log, idx) => (
            <div key={idx} className={`log-entry log-${log.type} ${log.status || ''}`}>
              <span className="log-time">{log.time}</span>
              <span className="log-type">[{log.type}]</span>
              <span className="log-event">{log.event}</span>
              <pre className="log-data">{JSON.stringify(log.data, null, 2)}</pre>
            </div>
          ))}
          {logs.length === 0 && <div className="log-empty">暂无日志</div>}
        </div>
      </section>
    </div>
  )
}
