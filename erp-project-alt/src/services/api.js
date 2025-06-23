import axios from 'axios'
const BASE_URL = import.meta.env.VITE_BASE_URL;

const api = axios.create({
  baseURL: `${BASE_URL}`, // <-- Change to your real backend URL
  headers: {
    'Content-Type': 'application/json',
  },
})

export default api
