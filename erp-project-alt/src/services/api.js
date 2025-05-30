import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:7000/api/', // <-- Change to your real backend URL
  headers: {
    'Content-Type': 'application/json',
  },
})

export default api
