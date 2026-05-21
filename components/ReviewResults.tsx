'use client';

import { AIReview } from '@/types';

interface ReviewResultsProps {
  review: AIReview;
}

export default function ReviewResults({ review }: ReviewResultsProps) {
  const renderIssues = (items: Array<{issue: string; fix: string}>, title: string, icon: string, colorClass: string) => {
    if (!items || items.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className={`text-lg font-semibold mb-2 flex items-center gap-2 ${colorClass}`}>
          {icon} {title} ({items.length})
        </h3>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-2">
              <p className="text-gray-700 dark:text-gray-300 mb-3">{item.issue}</p>
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 mt-2">
                <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">✅ Fix:</p>
                <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto whitespace-pre-wrap">
                  <code>{item.fix}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">AI Review Results</h2>
      
      {/* Summary */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Summary</h3>
        <p className="text-gray-700 dark:text-gray-300">{review.summary}</p>
      </div>

      {/* Overall Score */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Overall Score</h3>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4">
            <div
              className={`h-4 rounded-full ${
                review.overallScore >= 7
                  ? 'bg-green-500'
                  : review.overallScore >= 5
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${(review.overallScore / 10) * 100}%` }}
            />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            {review.overallScore}/10
          </span>
        </div>
      </div>

      {/* Render all sections with fixes */}
      {renderIssues(review.bugs, 'Bugs', '🐛', 'text-red-600 dark:text-red-400')}
      {renderIssues(review.performanceIssues, 'Performance Issues', '⚡', 'text-yellow-600 dark:text-yellow-400')}
      {renderIssues(review.securityProblems, 'Security Problems', '🔒', 'text-red-600 dark:text-red-400')}
      {renderIssues(review.bestPractices, 'Best Practices', '📋', 'text-blue-600 dark:text-blue-400')}
      {renderIssues(review.architectureSuggestions, 'Architecture Suggestions', '🏗️', 'text-purple-600 dark:text-purple-400')}
    </div>
  );
}
