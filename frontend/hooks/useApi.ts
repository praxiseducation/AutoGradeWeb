import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { useRouter } from 'next/navigation';

export function useApi<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!url) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(url);
        setData(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'An error occurred');
        if (err.response?.status === 401) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url, router]);

  const refetch = async () => {
    if (!url) return;
    setLoading(true);
    try {
      const response = await apiClient.get(url);
      setData(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
}
