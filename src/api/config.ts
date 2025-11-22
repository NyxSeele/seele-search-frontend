import axios from 'axios'
import type { AxiosInstance } from 'axios'

// FC后端地址配置
// 开发环境：可以使用本地地址或FC地址
// 生产环境：使用FC地址
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://seele-backend-wvwyqdxjct.cn-hangzhou.fcapp.run'

// 如果配置了环境变量 VITE_API_BASE_URL，则使用环境变量
// 否则使用默认的FC地址

console.log('[API Config] Base URL:', API_BASE_URL)

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 增加到 60 秒，因为 B站反爬导致后端重试过久
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    console.log('[API Request]', config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    console.error('[API Request Error]', error)
    return Promise.reject(error)
  },
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    console.log('[API Response]', response.status, response.data)

    // 后端返回的是直接的数组或对象，需要统一格式
    let result = response.data

    // 如果响应是数组，说明后端直接返回了数据，需要包装成 ApiResponse 格式
    if (Array.isArray(result)) {
      console.log('[API Response] Direct array response, wrapping...')
      result = {
        code: 200,
        message: 'success',
        data: result,
      }
    }
    // 如果响应已经是 ApiResponse 格式（有 code 字段），直接返回
    else if (result && typeof result === 'object' && 'code' in result) {
      console.log('[API Response] ApiResponse format detected')
    }
    // 其他情况，包装成 ApiResponse
    else {
      console.log('[API Response] Unknown format, wrapping...')
      result = {
        code: 200,
        message: 'success',
        data: result,
      }
    }

    console.log('[API Response Normalized]', {
      code: result.code,
      message: result.message,
      dataLength: Array.isArray(result.data) ? result.data.length : 'not array',
    })

    return result
  },
  (error) => {
    console.error('[API Error]', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    })
    return Promise.reject(error)
  },
)

export default apiClient
