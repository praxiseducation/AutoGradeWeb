'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useApi } from '@/hooks/useApi';

interface Period {
  _id: string;
  name: string;
  studentCount: number;
}

export default function AutoGradeDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const { data: periods } = useApi<Period[]>('/api/periods');
  
  // Calculate stats
  const stats = {
    totalStudents: periods?.reduce((sum, p) => sum + p.studentCount, 0) || 0,
    totalAssignments: 0, // Will be updated when we connect assignments
    recentScans: 0,
    periods: periods || []
  };

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/login');
  }, [session, status, router]);

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">AutoGrade Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">{session?.user?.email}</span>
              <button 
                onClick={() => router.push('/api/auth/signout')}
                className="text-red-600 hover:text-red-800"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">Total Students</h3>
            <p className="text-3xl font-bold">{stats.totalStudents}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">Assignments</h3>
            <p className="text-3xl font-bold">{stats.totalAssignments}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">Recent Scans</h3>
            <p className="text-3xl font-bold">{stats.recentScans}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">Class Periods</h3>
            <p className="text-3xl font-bold">{stats.periods.length}</p>
          </div>
        </div>

        {/* Quick Actions - same as before */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <button
            onClick={() => router.push('/autograde/roster')}
            className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition-shadow text-center"
          >
            <div className="text-blue-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Manage Rosters</h3>
            <p className="text-gray-600 text-sm">Upload and manage student lists</p>
          </button>

          <button
            onClick={() => router.push('/autograde/generate')}
            className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition-shadow text-center"
          >
            <div className="text-green-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Generate Sheets</h3>
            <p className="text-gray-600 text-sm">Create printable grade sheets</p>
          </button>

          <button
            onClick={() => router.push('/autograde/scan')}
            className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition-shadow text-center"
          >
            <div className="text-purple-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Scan & Process</h3>
            <p className="text-gray-600 text-sm">Upload and process scanned sheets</p>
          </button>

          <button
            onClick={() => router.push('/autograde/results')}
            className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition-shadow text-center"
          >
            <div className="text-orange-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">View Results</h3>
            <p className="text-gray-600 text-sm">See processed grades and export</p>
          </button>
        </div>
      </div>
    </div>
  );
}
