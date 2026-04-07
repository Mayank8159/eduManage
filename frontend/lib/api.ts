import axios from "axios";

const DEFAULT_PROD_API_URL = "https://edumanage-u1ks.onrender.com/api/v1";
const DEFAULT_DEV_API_URL = "http://localhost:5000/api/v1";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production" ? DEFAULT_PROD_API_URL : DEFAULT_DEV_API_URL);

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
