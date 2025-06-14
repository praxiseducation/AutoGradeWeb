'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApi } from '@/hooks/useApi';
import apiClient from '@/lib/api-client';
import CSVUploader from '@/components/CSVUploader';
import CreatePeriodDialog from '@/components/CreatePeriodDialog';

interface Period {
  _id: string;
  periodNumber: number;
  name: string;
  studentCount: number;
}

export default function RosterPage() {
  const router = useRouter();
  const [showUploader, setShowUploader] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  
  const { data: periods, loading, error, refetch } = useApi<Period[]>('/api/periods');

  const handleUploadClick = (periodId: string) => {
    setSelectedPeriod(periodId);
    setShowUploader(true);
  };

  const handleUploadSuccess = () => {
    setShowUploader(false);
    setSelectedPeriod('');
    refetch();
  };

  const handleCreateSuccess = () => {
    setShowCreateDialog(false);
    refetch();
  };

  const deletePeriod = async (periodId: string, periodName: string) => {
    if (!confirm(`Are you sure you want to delete ${periodName}? This will also remove all students in this period.`)) {
      return;
    }

    try {
      await apiClient.delete(`/api/periods/${periodId}`);
      refetch();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete period');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button 
            onClick={() => router.push('/autograde')}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold">Manage Class Rosters</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Modals */}
        {showUploader && (
          <CSVUploader
            periodId={selectedPeriod}
            onSuccess={handleUploadSuccess}
            onCancel={() => setShowUploader(false)}
          />
        )}

        {showCreateDialog && (
          <CreatePeriodDialog
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateDialog(false)}
          />
        )}

        {/* Periods List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold">Class Periods</h2>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Period
            </button>
          </div>
          <div className="divide-y">
            {loading ? (
              <div className="px-6 py-8 text-center">Loading...</div>
            ) : error ? (
              <div className="px-6 py-8 text-center text-red-600">Error: {error}</div>
            ) : periods?.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                <p className="mb-4">No periods created yet.</p>
                <button
                  onClick={() => setShowCreateDialog(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Your First Period
                </button>
              </div>
            ) : (
              periods?.map((period) => (
                <div key={period._id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-lg">{period.name}</h3>
                      <p className="text-sm text-gray-600">
                        {period.studentCount} {period.studentCount === 1 ? 'student' : 'students'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => handleUploadClick(period._id)}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm"
                      >
                        Upload CSV
                      </button>
                      <button 
                        onClick={() => router.push(`/autograde/roster/${period._id}`)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
                      >
                        View Students
                      </button>
                      <button 
                        onClick={() => deletePeriod(period._id, period.name)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Getting Started</h3>
          <ol className="list-decimal list-inside text-blue-800 text-sm space-y-2">
            <li>Create periods for each of your classes (e.g., Period 1, Period 2)</li>
            <li>Upload a CSV file with student information for each period</li>
            <li>The system will automatically detect student IDs and names from your CSV</li>
            <li>You can then generate grade sheets for assignments</li>
          </ol>
        </div>

        {/* CSV Format Help */}
        <div className="mt-4 bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-2">CSV File Format</h3>
          <p className="text-gray-700 text-sm mb-3">
            Your CSV file should have columns for:
          </p>
          <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
            <li><strong>Student ID</strong> - Unique identifier (required)</li>
            <li><strong>Name</strong> - Either "First Name" & "Last Name" or single "Name" column</li>
            <li><strong>Email</strong> - Student email (optional)</li>
          </ul>
          <div className="mt-3 bg-white p-3 rounded border border-gray-200">
            <p className="text-xs font-mono text-gray-600">
              Example:<br/>
              Student ID,First Name,Last Name,Email<br/>
              12345,John,Smith,john.smith@school.edu<br/>
              12346,Jane,Doe,jane.doe@school.edu
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
