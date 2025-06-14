import axios from 'axios';
import { getSession } from 'next-auth/react';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.growwithpraxis.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(async (config) => {
  try {
    const session = await getSession();
    // For now, send a simple bearer token
    // In production, you'd want to properly integrate NextAuth with your backend
    if (session) {
      config.headers.Authorization = `Bearer ${session.user?.email || 'test-token'}`;
    }
  } catch (error) {
    console.error('Error getting session:', error);
  }
  return config;
});

// Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
