import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000/api", // prefix all routes with /api
  headers: { "Content-Type": "application/json" }
});

export default api;
