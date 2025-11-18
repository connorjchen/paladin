import axios from 'axios'

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL as string

if (!BACKEND_API_URL) {
  throw new Error('Missing backend API URL')
}

export const axiosClient = axios.create({
  baseURL: BACKEND_API_URL,
})
