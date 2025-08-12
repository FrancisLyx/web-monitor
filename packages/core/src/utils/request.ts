import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

export interface RequestConfig extends AxiosRequestConfig {
	showError?: boolean
	showLoading?: boolean
	timeout?: number
}

export interface ResponseData<T = unknown> {
	code: number
	data: T
	message: string
	success: boolean
}

class RequestService {
	private instance: AxiosInstance

	constructor(config?: AxiosRequestConfig) {
		this.instance = axios.create({
			baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
			timeout: 10000,
			headers: {
				'Content-Type': 'application/json;charset=utf-8',
				'Cache-Control': 'no-cache',
				'Pragma': 'no-cache'
			},
			...config
		})

		this.setupInterceptors()
	}

	private setupInterceptors(): void {
		this.instance.interceptors.request.use(
			(config) => {
				const token = localStorage.getItem('token')
				if (token) {
					config.headers.Authorization = `Bearer ${token}`
				}
				return config
			},
			(error: AxiosError) => Promise.reject(error)
		)

		this.instance.interceptors.response.use(
			(response: AxiosResponse) => {
				const { data, status } = response

				// 如果HTTP状态码是成功的，直接返回数据
				if (status >= 200 && status < 300) {
					// 如果有标准的响应格式，检查业务状态码
					if (typeof data === 'object' && data !== null) {
						if (data.code !== undefined) {
							// 有业务状态码的情况
							if (data.code === 200 || data.success) {
								return data
							} else {
								const error = new Error(data.message || 'Request failed')
								return Promise.reject(error)
							}
						}
					}
					// 没有标准格式或者是其他成功响应，直接返回
					return data
				}

				// HTTP状态码不是成功的
				const error = new Error(data?.message || 'Request failed')
				return Promise.reject(error)
			},
			(error: AxiosError) => {
				let errorMessage = 'Network error'

				if (error.response) {
					const { status, data } = error.response
					switch (status) {
						case 401:
							errorMessage = 'Unauthorized, please login again'
							localStorage.removeItem('token')
							window.location.href = '/login'
							break
						case 403:
							errorMessage = 'Access denied'
							break
						case 404:
							errorMessage = 'Resource not found'
							break
						case 500:
							errorMessage = 'Server error'
							break
						default:
							errorMessage =
								(data as { message?: string })?.message || `Error ${status}`
					}
				} else if (error.request) {
					errorMessage = 'Network connection failed'
				}

				return Promise.reject(new Error(errorMessage))
			}
		)
	}

	public get<T = unknown>(url: string, config?: RequestConfig): Promise<ResponseData<T>> {
		return this.instance.get(url, config)
	}

	public post<T = unknown>(
		url: string,
		data?: unknown,
		config?: RequestConfig
	): Promise<ResponseData<T>> {
		return this.instance.post(url, data, config)
	}

	public put<T = unknown>(
		url: string,
		data?: unknown,
		config?: RequestConfig
	): Promise<ResponseData<T>> {
		return this.instance.put(url, data, config)
	}

	public delete<T = unknown>(url: string, config?: RequestConfig): Promise<ResponseData<T>> {
		return this.instance.delete(url, config)
	}

	public patch<T = unknown>(
		url: string,
		data?: unknown,
		config?: RequestConfig
	): Promise<ResponseData<T>> {
		return this.instance.patch(url, data, config)
	}

	public upload<T = unknown>(
		url: string,
		file: File,
		config?: RequestConfig
	): Promise<ResponseData<T>> {
		const formData = new FormData()
		formData.append('file', file)

		return this.instance.post(url, formData, {
			...config,
			headers: {
				'Content-Type': 'multipart/form-data',
				...config?.headers
			}
		})
	}

	public getInstance(): AxiosInstance {
		return this.instance
	}
}

const request = new RequestService()

export { request }
export default request
