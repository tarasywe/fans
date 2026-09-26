import axios from 'axios';

export const API_BASE_URL = 'https://api.fansuite.mock';

/** Shared Axios instance. Every feature talks to the backend through it. */
export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});
