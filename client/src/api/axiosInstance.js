import axios from 'axios';

// Create an Axios instance with a predefined base URL.
// This points to the backend server you showed me earlier.
const axiosInstance = axios.create({
  baseURL: 'http://localhost:4000/api', // Your backend server URL
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;