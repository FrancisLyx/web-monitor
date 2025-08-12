import request, { type ResponseData } from '@/utils/request'

export const firstAPI = (): Promise<ResponseData<string>> => request.get('/')
