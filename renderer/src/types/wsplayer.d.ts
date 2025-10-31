// wsplayer 类型定义
declare global {
  interface Window {
    zvvideo?: {
      player: () => {
        play: (opts: any, callback?: (result: any) => void) => void
        stop: (videoId: string) => void
        pause?: () => void
        resume?: () => void
      }
    }
    Streamedian?: {
      player: (videoId: string, options: any) => any
    }
  }
}

export {}
