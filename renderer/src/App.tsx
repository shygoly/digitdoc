import { useState } from 'react'
import ApiTestPage from './pages/ApiTestPage'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'test'>('test')

  return (
    <div className="app">
      {currentPage === 'test' ? (
        <ApiTestPage />
      ) : (
        <div className="card">
          <h1>数字人医生系统</h1>
          <p>开发环境已配置 HTTPS，WebSocket 使用 wss:// 协议</p>
          <p>RTSP 测试流: rtsp://localhost:8554/test</p>
          <button onClick={() => setCurrentPage('test')}>
            前往接口测试页面
          </button>
        </div>
      )}
    </div>
  )
}

export default App
