'use client';

import { useState } from 'react';
import apiClient from '@/lib/api-client';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CreatePeriodDialog({ onSuccess, onCancel }: Props) {
  const [name, setName] = useState('');
  const [periodNumber, setPeriodNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const num = parseInt(periodNumber);
    if (!num || num < 1 || num > 10) {
      setError('Period number must be between 1 and 10');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/api/periods', { 
        name: name || `Period ${num}`,
        periodNumber: num 
      });
      onSuccess();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create period');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-4">Create New Period</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Period Number <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={periodNumber}
              onChange={(e) => setPeriodNumber(e.target.value)}
              min="1"
              max="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 1"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Period Name (Optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Period 1 - Math"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave blank to use default "Period X" format
            </p>
          </div>
          
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={loading || !periodNumber}
              className={`flex-1 px-4 py-2 rounded-md font-medium ${
                loading || !periodNumber
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? 'Creating...' : 'Create Period'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
