import axios from 'axios'
import type { AxiosInstance } from 'axios'

// FC后端地址配置
// 开发环境：可以使用本地地址或FC地址
// 生产环境：使用FC地址
// 注意：FC函数的HTTP触发器地址是固定的，不会因重新部署而改变
const DEFAULT_FC_URL = 'https://seele-backend-rxdelkqjxi.cn-hangzhou.fcapp.run'

// 强制使用绝对URL，防止被环境变量覆盖为相对路径
let API_BASE_URL = DEFAULT_FC_URL
const envUrl = import.meta.env.VITE_API_BASE_URL
if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '' && envUrl.startsWith('http')) {
  // 只接受以 http 开头的绝对URL
  API_BASE_URL = envUrl.trim()
} else {
  // 确保使用默认的FC地址（绝对URL）
  API_BASE_URL = DEFAULT_FC_URL
}

// 如果配置了环境变量 VITE_API_BASE_URL 且为有效的绝对URL，则使用环境变量
// 否则使用默认的FC地址（强制绝对URL）

console.log('[API Config] Base URL:', API_BASE_URL)
console.log('[API Config] Environment Variable:', import.meta.env.VITE_API_BASE_URL)

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
    // 调试信息：显示完整的请求URL
    const fullUrl = config.baseURL + (config.url || '')
    console.log('[API Request]', config.method?.toUpperCase(), fullUrl)
    console.log('[API Config]', {
      baseURL: config.baseURL,
      url: config.url,
      fullUrl: fullUrl
    })
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
