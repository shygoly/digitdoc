// REST API 类型定义

export interface DialogData {
  id: string
  interlocutor: string
  session_time: string
  dialogue_content: string
  emotion: string
  action: string
}

export interface Doctor {
  id: string
  name: string
  rank: string
  department: string
  headerpic?: string
}

export interface HealthDataParams {
  idcardNo: string
  startTime: string
  endTime: string
  tableName: string
}

export interface HealthDataResponse {
  data: Array<{
    [key: string]: string | number
    createdDate: string
  }>
}

export interface UserParams {
  processing_state: number // 1 = 已处理, 2 = 未处理
  status: number // 0 = 已处理, 1 = 分诊中, 2 = 待确认
}

export interface User {
  id: string
  name: string
  sex: string
  age: string
  status: string
  processing_state: string
  summary1?: string
  summary2?: string
  result?: string
  [key: string]: any
}

// Socket.io 事件类型
export interface CaseContent {
  content: string
  [key: string]: any
}

export interface TriageData {
  department?: string
  level?: string
  reason?: string
  [key: string]: any
}

export interface AssistantContent {
  text?: string
  audioUrl?: string
  [key: string]: any
}

export interface UserContent {
  text?: string
  asr_content?: string
  [key: string]: any
}

export interface FaceDetectData {
  name?: string
  id?: string
  match?: boolean
  [key: string]: any
}
