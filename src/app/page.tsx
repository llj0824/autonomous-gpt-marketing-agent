import { Suspense } from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight">
            Autonomous Marketing Agent
          </h1>
          <p className="mt-3 text-xl text-gray-500 sm:mt-4">
            Monitor KOL tweets and generate intelligent marketing responses
          </p>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900">Run Marketing Agent</h2>
            <p className="mt-2 text-sm text-gray-500">
              Click the button below to run the marketing agent. This will collect tweets, analyze them, apply tools, and generate responses.
            </p>
            <div className="mt-5">
              <Link 
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Run Agent & View Dashboard
              </Link>
            </div>
          </div>

          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900">Agent Components</h2>
            <div className="mt-4 space-y-4">
              <div className="border-l-4 border-indigo-400 pl-4">
                <h3 className="text-md font-medium text-gray-900">Tweet Collection</h3>
                <p className="mt-1 text-sm text-gray-500">Fetches tweets from KOLs based on engagement and date filters.</p>
              </div>
              <div className="border-l-4 border-green-400 pl-4">
                <h3 className="text-md font-medium text-gray-900">Decision Engine</h3>
                <p className="mt-1 text-sm text-gray-500">LLM-based analysis to determine tweet relevance and tool selection.</p>
              </div>
              <div className="border-l-4 border-yellow-400 pl-4">
                <h3 className="text-md font-medium text-gray-900">Tool Execution</h3>
                <p className="mt-1 text-sm text-gray-500">Applies five different marketing tools based on content analysis.</p>
              </div>
              <div className="border-l-4 border-red-400 pl-4">
                <h3 className="text-md font-medium text-gray-900">Response Generation</h3>
                <p className="mt-1 text-sm text-gray-500">Creates natural responses incorporating tool outputs.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}