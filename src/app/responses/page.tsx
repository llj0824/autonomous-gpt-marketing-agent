'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ResponsesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responses, setResponses] = useState<any[]>([]);

  useEffect(() => {
    async function fetchResponses() {
      try {
        const response = await fetch('/api/responses');
        
        if (!response.ok) {
          if (response.status === 404) {
            setResponses([]);
            return;
          }
          throw new Error('Failed to fetch responses');
        }
        
        const data = await response.json();
        setResponses(data.responses || []);
      } catch (err: any) {
        setError(err.message || 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchResponses();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Response History</h1>
          <Link 
            href="/"
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Home
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading responses...</div>
          </div>
        ) : error ? (
          <div className="bg-red-50 rounded-md p-4">
            <div className="text-red-700">{error}</div>
          </div>
        ) : responses.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No responses yet</h3>
            <p className="text-gray-500">Run the marketing agent to generate responses.</p>
            <div className="mt-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Response History</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {responses.length} {responses.length === 1 ? 'response' : 'responses'} generated
              </p>
            </div>
            
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(responses[0] || {}).map((header) => (
                        <th 
                          key={header}
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {responses.map((response, index) => (
                      <tr key={index}>
                        {Object.values(response).map((value: any, valIndex) => (
                          <td key={valIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}