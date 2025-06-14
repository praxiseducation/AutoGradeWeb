'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';

export default function TestPage() {
  const [apiStatus, setApiStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testAPI();
  }, []);

  const testAPI = async () => {
    try {
      const response = await apiClient.get('/health');
      setApiStatus(response.data);
    } catch (error) {
      setApiStatus({ error: 'Failed to connect to API' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-4">API Connection Test</h1>
      
      {loading ? (
        <p>Testing API connection...</p>
      ) : (
        <div className="bg-white p-4 rounded shadow">
          <pre>{JSON.stringify(apiStatus, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
