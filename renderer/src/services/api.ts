import axios, { AxiosInstance } from 'axios'
import type {
  DialogData,
  Doctor,
  HealthDataParams,
  HealthDataResponse,
  UserParams,
  User,
} from '../types/api'

// 默认 API 基础地址
const DEFAULT_API_BASE = 'http://218.206.102.135:8099/ExtExportAPI'

class ApiService {
  private client: AxiosInstance

  constructor(baseURL: string = DEFAULT_API_BASE) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data)
        return config
      },
      (error) => {
        console.error('[API Request Error]', error)
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[API Response] ${response.config.url}`, response.data)
        return response
      },
      (error) => {
        console.error('[API Response Error]', error.response?.data || error.message)
        return Promise.reject(error)
      }
    )
  }

  // 更新基础 URL
  setBaseURL(baseURL: string) {
    this.client.defaults.baseURL = baseURL
  }

  // 获取医患对话数据
  async getDialogData(id: number): Promise<DialogData[]> {
    try {
      const response = await this.client.post<DialogData[]>('/GetDialogData', { id })
      return response.data
    } catch (error: any) {
      throw new Error(`获取对话数据失败: ${error.response?.data?.message || error.message}`)
    }
  }

  // 获取所有医生信息
  async getAllDoctors(): Promise<Doctor[]> {
    try {
      const response = await this.client.post<Doctor[]>('/GetAllDoctors')
      return response.data
    } catch (error: any) {
      throw new Error(`获取医生列表失败: ${error.response?.data?.message || error.message}`)
    }
  }

  // 获取患者体测数据
  async queryHealthData(params: HealthDataParams): Promise<HealthDataResponse> {
    try {
      const response = await this.client.post<HealthDataResponse>('/QueryHealthData', params)
      return response.data
    } catch (error: any) {
      throw new Error(`查询体测数据失败: ${error.response?.data?.message || error.message}`)
    }
  }

  // 获取患者信息
  async getAllUsers(params: UserParams): Promise<User[]> {
    try {
      const response = await this.client.post<User[]>('/GetAllUsers', params)
      return response.data
    } catch (error: any) {
      throw new Error(`获取患者列表失败: ${error.response?.data?.message || error.message}`)
    }
  }
}

// 导出单例
export const apiService = new ApiService()
export default apiService
