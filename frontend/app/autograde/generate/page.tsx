'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GeneratePage() {
  const router = useRouter();
  const [selectedPeriods, setSelectedPeriods] = useState<number[]>([]);
  const [assignmentName, setAssignmentName] = useState('');
  const [gradingScale, setGradingScale] = useState(['10', '8.5', '7.5', '6.5', '5']);
  const [includeStatus, setIncludeStatus] = useState(true);
  
  const periods = [
    { id: 1, name: 'Period 1', students: 25 },
    { id: 2, name: 'Period 2', students: 28 },
    { id: 3, name: 'Period 3', students: 22 },
    { id: 4, name: 'Period 4', students: 30 },
    { id: 5, name: 'Period 5', students: 26 },
    { id: 6, name: 'Period 6', students: 24 },
  ];

  const togglePeriod = (periodId: number) => {
    setSelectedPeriods(prev => 
      prev.includes(periodId) 
        ? prev.filter(id => id !== periodId)
        : [...prev, periodId]
    );
  };

  const handleGenerate = () => {
    // TODO: Call API to generate sheets
    alert(`Generating sheets for ${selectedPeriods.length} periods...`);
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
          <h1 className="text-2xl font-bold">Generate Grade Sheets</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Assignment Name */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Assignment Details</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Name
                </label>
                <input
                  type="text"
                  value={assignmentName}
                  onChange={(e) => setAssignmentName(e.target.value)}
                  placeholder="e.g., Quiz 5 - Algebra"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Grading Scale */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Grading Scale</h2>
              <div className="space-y-3">
                {gradingScale.map((score, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <span className="text-sm font-medium w-16">Score {index + 1}:</span>
                    <input
                      type="text"
                      value={score}
                      onChange={(e) => {
                        const newScale = [...gradingScale];
                        newScale[index] = e.target.value;
                        setGradingScale(newScale);
                      }}
                      className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeStatus}
                    onChange={(e) => setIncludeStatus(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Include status options (Missing, Absent, Exempt)</span>
                </label>
              </div>
            </div>

            {/* Select Periods */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Select Class Periods</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {periods.map((period) => (
                  <label
                    key={period.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedPeriods.includes(period.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPeriods.includes(period.id)}
                      onChange={() => togglePeriod(period.id)}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <p className="font-medium">{period.name}</p>
                      <p className="text-sm text-gray-600">{period.students} students</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <h2 className="text-lg font-semibold mb-4">Preview</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">Assignment:</span>
                  <p className="text-gray-600">{assignmentName || 'Not specified'}</p>
                </div>
                <div>
                  <span className="font-medium">Selected Periods:</span>
                  <p className="text-gray-600">
                    {selectedPeriods.length === 0 
                      ? 'None selected' 
                      : `${selectedPeriods.length} period(s)`}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Total Students:</span>
                  <p className="text-gray-600">
                    {periods
                      .filter(p => selectedPeriods.includes(p.id))
                      .reduce((sum, p) => sum + p.students, 0)} students
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleGenerate}
                disabled={!assignmentName || selectedPeriods.length === 0}
                className={`w-full mt-6 py-2 px-4 rounded-md font-medium ${
                  assignmentName && selectedPeriods.length > 0
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Generate Grade Sheets
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
