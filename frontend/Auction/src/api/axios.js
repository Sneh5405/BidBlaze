import axios from 'axios'
import useAuthStore from '../store/authStore'

const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true
})

// intercept response to handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        // Attempt to call refresh endpoint
        await axios.post('http://localhost:5000/auth/refresh', {}, { withCredentials: true })
        // Retry original request
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh token expired/invalid — log out on frontend
        useAuthStore.getState().logout()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api