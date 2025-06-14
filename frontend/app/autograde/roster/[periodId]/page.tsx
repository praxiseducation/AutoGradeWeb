'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useApi } from '@/hooks/useApi';
import apiClient from '@/lib/api-client';

interface Student {
  _id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email?: string;
}

interface Period {
  _id: string;
  name: string;
  studentCount: number;
}

export default function StudentManagementPage() {
  const router = useRouter();
  const params = useParams();
  const periodId = params?.periodId as string;
  
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  
  const { data: period, loading: periodLoading } = useApi<Period>(`/api/periods/${periodId}`);
  const { data: students, loading: studentsLoading, refetch: refetchStudents } = useApi<Student[]>(`/api/students/period/${periodId}`);
  const { data: allPeriods } = useApi<Period[]>('/api/periods');

  const toggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const toggleAll = () => {
    if (selectedStudents.size === students?.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students?.map(s => s._id) || []));
    }
  };

  const deleteSelected = async () => {
    if (!confirm(`Delete ${selectedStudents.size} student(s)?`)) return;
    
    try {
      for (const studentId of Array.from(selectedStudents)) {
        await apiClient.delete(`/api/students/${studentId}`);
      }
      setSelectedStudents(new Set());
      refetchStudents();
    } catch (error) {
      alert('Failed to delete students');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button 
            onClick={() => router.push('/autograde/roster')}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Periods
          </button>
          <h1 className="text-2xl font-bold">
            {period?.name || 'Loading...'} - Student Management
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Action Bar */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {selectedStudents.size > 0 && (
                <>
                  <span className="text-sm text-gray-600">
                    {selectedStudents.size} selected
                  </span>
                  <button
                    onClick={deleteSelected}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm"
                  >
                    Delete Selected
                  </button>
                  <button
                    onClick={() => setShowMoveDialog(true)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
                  >
                    Move to Period
                  </button>
                </>
              )}
            </div>
            <button
              onClick={() => setShowAddDialog(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Student
            </button>
          </div>
        </div>

        {/* Student List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedStudents.size === students?.length && students?.length > 0}
                    onChange={toggleAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {studentsLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">Loading...</td>
                </tr>
              ) : students?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No students in this period yet.
                  </td>
                </tr>
              ) : (
                students?.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedStudents.has(student._id)}
                        onChange={() => toggleStudent(student._id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.studentId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.firstName} {student.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setEditingStudent(student)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Delete this student?')) {
                            await apiClient.delete(`/api/students/${student._id}`);
                            refetchStudents();
                          }
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add Student Dialog */}
        {showAddDialog && (
          <AddStudentDialog
            periodId={periodId}
            onSuccess={() => {
              setShowAddDialog(false);
              refetchStudents();
            }}
            onCancel={() => setShowAddDialog(false)}
          />
        )}

        {/* Edit Student Dialog */}
        {editingStudent && (
          <EditStudentDialog
            student={editingStudent}
            onSuccess={() => {
              setEditingStudent(null);
              refetchStudents();
            }}
            onCancel={() => setEditingStudent(null)}
          />
        )}

        {/* Move Students Dialog */}
        {showMoveDialog && (
          <MoveStudentsDialog
            selectedStudents={Array.from(selectedStudents)}
            currentPeriodId={periodId}
            periods={allPeriods?.filter(p => p._id !== periodId) || []}
            onSuccess={() => {
              setShowMoveDialog(false);
              setSelectedStudents(new Set());
              refetchStudents();
            }}
            onCancel={() => setShowMoveDialog(false)}
          />
        )}
      </div>
    </div>
  );
}

// Add Student Dialog Component
function AddStudentDialog({ periodId, onSuccess, onCancel }: any) {
  const [formData, setFormData] = useState({
    studentId: '',
    firstName: '',
    lastName: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await apiClient.post('/api/students', {
        ...formData,
        periodId
      });
      onSuccess();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-4">Add New Student</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.studentId}
              onChange={(e) => setFormData({...formData, studentId: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email (Optional)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-4 py-2 rounded-md font-medium ${
                loading
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? 'Adding...' : 'Add Student'}
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

// Edit Student Dialog Component
function EditStudentDialog({ student, onSuccess, onCancel }: any) {
  const [formData, setFormData] = useState({
    firstName: student.firstName,
    lastName: student.lastName,
    email: student.email || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await apiClient.put(`/api/students/${student._id}`, formData);
      onSuccess();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-4">Edit Student</h2>
        <p className="text-sm text-gray-600 mb-4">Student ID: {student.studentId}</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-4 py-2 rounded-md font-medium ${
                loading
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? 'Saving...' : 'Save Changes'}
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

// Move Students Dialog Component
function MoveStudentsDialog({ selectedStudents, currentPeriodId, periods, onSuccess, onCancel }: any) {
  const [targetPeriodId, setTargetPeriodId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMove = async () => {
    if (!targetPeriodId) {
      alert('Please select a target period');
      return;
    }
    
    setLoading(true);
    try {
      await apiClient.post('/api/students/move', {
        studentIds: selectedStudents,
        fromPeriodId: currentPeriodId,
        toPeriodId: targetPeriodId
      });
      onSuccess();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to move students');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-4">Move Students</h2>
        <p className="text-sm text-gray-600 mb-4">
          Moving {selectedStudents.length} student(s) to another period.
        </p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Target Period
          </label>
          <select
            value={targetPeriodId}
            onChange={(e) => setTargetPeriodId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a period...</option>
            {periods.map((period: any) => (
              <option key={period._id} value={period._id}>
                {period.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleMove}
            disabled={loading || !targetPeriodId}
            className={`flex-1 px-4 py-2 rounded-md font-medium ${
              loading || !targetPeriodId
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? 'Moving...' : 'Move Students'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
