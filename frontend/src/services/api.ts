import axios from 'axios';

let rawUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';

// Intelligent Extractor: Cleans any accidental brackets or markdown copies
const match = rawUrl.match(/https?:\/\/[^\s\)\"\'\]]+/);
if (match) {
  rawUrl = match[0];
} else {
  rawUrl = rawUrl.split('(')[0].trim().replace(/[\[\]]/g, '');
  if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
    rawUrl = `https://${rawUrl}`;
  }
}
rawUrl = rawUrl.replace(/\/+$/, '');

export const API_BASE_URL = rawUrl;

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('league_jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getErrorMessage = (err: any, fallback: string = 'An error occurred'): string => {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  if (typeof err.response?.data?.error === 'string') return err.response.data.error;
  if (typeof err.response?.data?.message === 'string') return err.response.data.message;
  if (typeof err.message === 'string') return err.message;
  return fallback;
};
