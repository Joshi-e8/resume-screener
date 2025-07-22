import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const commonHeaders = {
  "Content-Type": "application/json",
  "time-zone": timeZone,
}

// Default instance (unauthorized)
export default axios.create({
  baseURL: BASE_URL,
  headers: {...commonHeaders, "x-channel": "unauthorized"}
});

// Client-side instance (with auth)
export const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: commonHeaders,
});

// Server-side instance
export const axiosServer = axios.create({
  baseURL: BASE_URL,
  headers: commonHeaders,
});
