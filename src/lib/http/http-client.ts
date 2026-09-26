import axios from 'axios';

import { API_BASE_URL } from '@/config/api';

/** Longer than the backend's slow-send test chat (6 s) so it still succeeds. */
export const REQUEST_TIMEOUT_MS = 15_000;

/** Shared Axios instance. Every feature talks to the backend through it. */
export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});
