'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const runAgent = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/run');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run agent');
      }
      
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Marketing Agent Dashboard</h1>
          <Link 
            href="/"
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Home
          </Link>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900">Agent Control</h2>
            <p className="mt-2 text-sm text-gray-500">
              Click the button below to run the marketing agent and see the results.
            </p>
            <div className="mt-5">
              <button
                onClick={runAgent}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
              >
                {isLoading ? 'Running...' : 'Run Agent'}
              </button>
            </div>
            {error && (
              <div className="mt-4 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {data && (
          <div className="space-y-6">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Collected Tweets</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  {data.tweets.length} tweets collected from KOLs.
                </p>
              </div>
              <div className="border-t border-gray-200">
                <ul className="divide-y divide-gray-200">
                  {data.tweets.map((tweet: any, index: number) => (
                    <li key={index} className="px-4 py-4 sm:px-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-500">
                            <span className="font-medium text-white">
                              {tweet.author.username.charAt(0).toUpperCase()}
                            </span>
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            @{tweet.author.username}
                          </p>
                          <p className="text-sm text-gray-500">
                            {tweet.content}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {data.responses && data.responses.length > 0 && (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Generated Responses</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    {data.responses.length} responses generated based on tool outputs.
                  </p>
                </div>
                <div className="border-t border-gray-200">
                  <ul className="divide-y divide-gray-200">
                    {data.responses.map((response: any, index: number) => (
                      <li key={index} className="px-4 py-4 sm:px-6">
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">
                              Response to @{response.tweet.author.username}
                            </h4>
                            <p className="mt-1 text-sm text-gray-900 border-l-4 border-green-400 pl-3 py-2 bg-green-50">
                              {response.content}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">
                              Original tweet: {response.tweet.content}
                            </p>
                            <p className="text-xs text-gray-500">
                              Tool used: {response.tool.name}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}