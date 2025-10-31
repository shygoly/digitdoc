import { io, Socket } from 'socket.io-client'

// 默认 Socket.io 服务器地址
const DEFAULT_SOCKET_URL = 'http://218.206.102.135:3000'

class SocketService {
  private socket: Socket | null = null
  private url: string = DEFAULT_SOCKET_URL
  private listeners: Map<string, Set<(data: any) => void>> = new Map()
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5

  // 连接 Socket.io
  connect(url?: string): Promise<Socket> {
    if (this.socket?.connected) {
      return Promise.resolve(this.socket)
    }

    if (url) {
      this.url = url
    }

    return new Promise((resolve, reject) => {
      // 如果已有连接但未连接，先断开
      if (this.socket) {
        this.socket.disconnect()
      }

      this.socket = io(this.url, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        transports: ['websocket', 'polling'],
      })

      this.socket.on('connect', () => {
        console.log('[Socket] 连接成功:', this.socket?.id)
        this.reconnectAttempts = 0
        resolve(this.socket!)
      })

      this.socket.on('connect_error', (error) => {
        console.error('[Socket] 连接错误:', error)
        reject(error)
      })

      this.socket.on('disconnect', (reason) => {
        console.log('[Socket] 断开连接:', reason)
      })

      this.socket.on('reconnect', (attemptNumber) => {
        console.log('[Socket] 重新连接成功，尝试次数:', attemptNumber)
        this.reconnectAttempts = attemptNumber
      })

      this.socket.on('reconnect_attempt', (attemptNumber) => {
        console.log('[Socket] 重连尝试:', attemptNumber)
      })

      this.socket.on('reconnect_failed', () => {
        console.error('[Socket] 重连失败，已达到最大尝试次数')
      })

      // 重新注册所有监听器
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach((callback) => {
          this.socket?.on(event, callback)
        })
      })
    })
  }

  // 断开连接
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.listeners.clear()
      console.log('[Socket] 已断开连接')
    }
  }

  // 发送事件
  emit(event: string, data?: any) {
    if (!this.socket?.connected) {
      throw new Error('Socket 未连接，请先调用 connect()')
    }
    console.log('[Socket] 发送事件:', event, data)
    this.socket.emit(event, data)
  }

  // 监听事件
  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)

    if (this.socket) {
      this.socket.on(event, callback)
    }
  }

  // 取消监听事件
  off(event: string, callback?: (data: any) => void) {
    if (callback) {
      this.listeners.get(event)?.delete(callback)
      this.socket?.off(event, callback)
    } else {
      this.listeners.delete(event)
      this.socket?.off(event)
    }
  }

  // 获取连接状态
  get isConnected(): boolean {
    return this.socket?.connected || false
  }

  // 获取 Socket ID
  get socketId(): string | undefined {
    return this.socket?.id
  }

  // 获取当前 URL
  get currentUrl(): string {
    return this.url
  }

  // 设置 URL（不立即连接，需要调用 connect）
  setUrl(url: string) {
    this.url = url
  }
}

// 导出单例
export const socketService = new SocketService()
export default socketService
