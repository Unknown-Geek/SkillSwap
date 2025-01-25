import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import { fetchGitHubProfile } from '../../utils/githubApi';

const GitHubContributionsGraph = ({ username }) => {
  const [githubData, setGithubData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await fetchGitHubProfile(username);
        setGithubData(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch GitHub data:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    if (username) {
      fetchData();
    }
  }, [username]);

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="animate-pulse flex space-x-4">
          <div className="h-20 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900 rounded-lg text-red-600 dark:text-red-200">
        Error loading GitHub contributions: {error}
      </div>
    );
  }

  if (!githubData) return null;

  const contributions = githubData.contributionsCollection.contributionCalendar;
  const weeks = contributions.weeks || [];

  // Group days by week day (0-6)
  const daysByWeekday = Array(7).fill().map(() => []);
  weeks.forEach(week => {
    week.contributionDays.forEach((day, index) => {
      daysByWeekday[index].push(day);
    });
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Calendar className="mr-2" />
          <h2 className="text-lg font-semibold">GitHub Activity</h2>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Total Contributions: {contributions.totalContributions}
        </div>
      </div>

      <div className="flex mt-4 gap-1">
        {/* Week day labels */}
        <div className="flex flex-col gap-1 pr-2 text-xs text-gray-500">
          {weekDays.map(day => (
            <div key={day} className="h-4 flex items-center">
              {day}
            </div>
          ))}
        </div>

        {/* Contribution squares */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-1">
            {daysByWeekday.map((days, weekdayIndex) => (
              <div key={weekdayIndex} className="flex flex-col gap-1">
                {days.map(day => (
                  <div key={day.date}>
                    <div 
                      data-tooltip-id="contribution-tooltip"
                      data-tooltip-content={`${new Date(day.date).toLocaleDateString()}: ${day.contributionCount} contributions`}
                      className={`h-4 w-4 rounded cursor-pointer transition-colors ${
                        day.contributionCount > 8 ? 'bg-green-700 dark:bg-green-600' : 
                        day.contributionCount > 5 ? 'bg-green-500 dark:bg-green-500' : 
                        day.contributionCount > 2 ? 'bg-green-300 dark:bg-green-400' : 
                        'bg-gray-200 dark:bg-gray-600'
                      }`}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Tooltip id="contribution-tooltip" />

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="text-sm">
          <span className="text-gray-500 dark:text-gray-400">Pull Requests: </span>
          {githubData.contributionsCollection.pullRequestContributions.totalCount}
        </div>
        <div className="text-sm">
          <span className="text-gray-500 dark:text-gray-400">Issues: </span>
          {githubData.contributionsCollection.issueContributions.totalCount}
        </div>
      </div>
    </div>
  );
};

export default GitHubContributionsGraph;