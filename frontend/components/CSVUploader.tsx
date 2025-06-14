'use client';

import { useState } from 'react';
import apiClient from '@/lib/api-client';

interface CSVPreview {
  headers: string[];
  rows: string[][];
  suggestions: {
    studentId?: number;
    firstName?: number;
    lastName?: number;
    fullName?: number;
    email?: number;
  };
}

interface Props {
  periodId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CSVUploader({ periodId, onSuccess, onCancel }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CSVPreview | null>(null);
  const [mapping, setMapping] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'map' | 'confirm'>('upload');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await apiClient.post('/api/upload/roster/preview', formData);
      setPreview(response.data.preview);
      setMapping(response.data.preview.suggestions);
      setStep('map');
    } catch (error) {
      alert('Failed to parse CSV file');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async () => {
    if (!file || !mapping.studentId === undefined) {
      alert('Please map the Student ID column');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('periodId', periodId);
    formData.append('mapping', JSON.stringify(mapping));

    try {
      const response = await apiClient.post('/api/upload/roster/process', formData);
      alert(`Success! ${response.data.inserted} students added, ${response.data.skipped} duplicates skipped.`);
      onSuccess();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to process roster');
    } finally {
      setLoading(false);
    }
  };

  const updateMapping = (field: string, columnIndex: number | undefined) => {
    setMapping({ ...mapping, [field]: columnIndex });
  };

  if (step === 'upload') {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Upload Student Roster</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="csv-upload"
            disabled={loading}
          />
          <label htmlFor="csv-upload" className="cursor-pointer">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">CSV files only</p>
          </label>
        </div>
        <button
          onClick={onCancel}
          className="mt-4 w-full px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (step === 'map' && preview) {
    return (
      <div className="p-6 max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Map CSV Columns</h3>
        <p className="text-sm text-gray-600 mb-4">
          Please confirm or adjust the column mappings below:
        </p>

        {/* Column Mapping */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student ID Column <span className="text-red-500">*</span>
            </label>
            <select
              value={mapping.studentId ?? ''}
              onChange={(e) => updateMapping('studentId', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select column...</option>
              {preview.headers.map((header, idx) => (
                <option key={idx} value={idx}>
                  {header} (Column {idx + 1})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name Format
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={mapping.fullName !== undefined}
                  onChange={() => {
                    const newMapping = { ...mapping };
                    delete newMapping.firstName;
                    delete newMapping.lastName;
                    setMapping(newMapping);
                  }}
                  className="mr-2"
                />
                <span className="text-sm">Single "Full Name" column</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={mapping.fullName === undefined}
                  onChange={() => {
                    const newMapping = { ...mapping };
                    delete newMapping.fullName;
                    setMapping(newMapping);
                  }}
                  className="mr-2"
                />
                <span className="text-sm">Separate First/Last name columns</span>
              </label>
            </div>
          </div>

          {mapping.fullName !== undefined ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name Column
              </label>
              <select
                value={mapping.fullName ?? ''}
                onChange={(e) => updateMapping('fullName', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select column...</option>
                {preview.headers.map((header, idx) => (
                  <option key={idx} value={idx}>
                    {header} (Column {idx + 1})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name Column
                </label>
                <select
                  value={mapping.firstName ?? ''}
                  onChange={(e) => updateMapping('firstName', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select column...</option>
                  {preview.headers.map((header, idx) => (
                    <option key={idx} value={idx}>
                      {header} (Column {idx + 1})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name Column
                </label>
                <select
                  value={mapping.lastName ?? ''}
                  onChange={(e) => updateMapping('lastName', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select column...</option>
                  {preview.headers.map((header, idx) => (
                    <option key={idx} value={idx}>
                      {header} (Column {idx + 1})
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Column (Optional)
            </label>
            <select
              value={mapping.email ?? ''}
              onChange={(e) => updateMapping('email', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select column...</option>
              {preview.headers.map((header, idx) => (
                <option key={idx} value={idx}>
                  {header} (Column {idx + 1})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Preview Table */}
        <div className="mb-4">
          <h4 className="font-medium mb-2">Preview (First 5 rows)</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {preview.headers.map((header, idx) => (
                    <th key={idx} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {preview.rows.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="px-3 py-2 whitespace-nowrap">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={handleProcess}
            disabled={loading || mapping.studentId === undefined}
            className={`flex-1 px-4 py-2 rounded-md font-medium ${
              loading || mapping.studentId === undefined
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? 'Processing...' : 'Import Students'}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return null;
}
