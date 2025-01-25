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

  // Calculate container and cell dimensions
  const containerWidth = 800; // Fixed width
  const weekCount = 53; // Standard year view
  const cellSize = Math.floor((containerWidth - 50) / weekCount); // Subtract padding and labels space
  const cellSpacing = 1;
  const totalCellWidth = cellSize + cellSpacing;

  // Month label calculation
  const getMonthLabels = () => {
    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let currentMonth = null;
    
    weeks.forEach((week, weekIndex) => {
      if (week.contributionDays.length > 0) {
        const date = new Date(week.contributionDays[0].date);
        const month = date.getMonth();
        
        if (currentMonth !== month) {
          months.push({
            name: monthNames[month],
            weekIndex
          });
          currentMonth = month;
        }
      }
    });
    
    return months;
  };

  // Change the weekdays array and display format
  const weekDays = ['Sun', 'Tue', 'Thu', 'Sat'];
  const weekDayIndices = [0, 2, 4, 6]; // Corresponding indices for the days we want to show
  
  const monthLabels = getMonthLabels();

  return (
    <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"> {/* Reduced overall padding */}
      <div className="flex items-center justify-between mb-4 pl-2">
        <div className="flex items-center">
          <Calendar className="mr-2" />
          <h2 className="text-lg font-semibold">GitHub Activity</h2>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Total Contributions: {contributions.totalContributions}
        </div>
      </div>

      <div className="flex flex-col mt-4"> {/* Reduced top margin */}
        {/* Month labels */}
        <div className="relative h-6 ml-4 mb-2"> {/* Reduced left margin */}
          {monthLabels.map((month, index) => (
            <div
              key={index}
              className="absolute text-xs text-gray-500"
              style={{
                left: `${month.weekIndex * totalCellWidth}px`,
                top: 0
              }}
            >
              {month.name}
            </div>
          ))}
        </div>

        <div className="flex pl-1"> {/* Reduced left padding */}
          {/* Updated weekday labels with reduced margin */}
          <div className="flex flex-col justify-between mr-1 w-8"> {/* Reduced width */}
            {weekDays.map((day, idx) => (
              <div 
                key={day} 
                className="text-xs text-gray-500 h-[10px] flex items-center justify-end pr-1" // Added justify-end and pr-1
                style={{ 
                  height: cellSize,
                  marginTop: idx === 0 ? 0 : `${cellSize * (weekDayIndices[idx] - weekDayIndices[idx-1] - 1)}px`
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Contribution grid */}
          <div className="flex gap-[1px]" style={{ width: containerWidth - 30 }}> {/* Adjusted width calculation */}
            {weeks.slice(-53).map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[1px]">
                {Array(7).fill().map((_, dayIndex) => {
                  const day = week.contributionDays[dayIndex];
                  return (
                    <div 
                      key={dayIndex}
                      style={{ 
                        width: cellSize,
                        height: cellSize
                      }}
                    >
                      <div 
                        data-tooltip-id="contribution-tooltip"
                        data-tooltip-content={day ? 
                          `${new Date(day.date).toLocaleDateString()}: ${day.contributionCount} contributions` :
                          'No contributions'
                        }
                        className={`w-full h-full rounded cursor-pointer transition-colors ${
                          !day ? 'bg-gray-100 dark:bg-gray-700' :
                          day.contributionCount > 8 ? 'bg-green-700 dark:bg-green-600' : 
                          day.contributionCount > 5 ? 'bg-green-500 dark:bg-green-500' : 
                          day.contributionCount > 2 ? 'bg-green-300 dark:bg-green-400' : 
                          'bg-gray-200 dark:bg-gray-600'
                        }`}
                      />
                    </div>
                  );
                })}
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

      <div className="mt-8 border-t dark:border-gray-700 pt-4">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {/* Pull Requests */}
          {githubData.recentActivity?.pullRequestContributions.nodes.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Recent Pull Requests</h4>
              <div className="space-y-2">
                {githubData.recentActivity.pullRequestContributions.nodes.map((contribution, idx) => (
                  <a
                    key={idx}
                    href={contribution.pullRequest.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <div className="text-sm font-medium">{contribution.pullRequest.title}</div>
                    <div className="text-xs text-gray-500">
                      {contribution.pullRequest.repository.name} • 
                      {new Date(contribution.pullRequest.createdAt).toLocaleDateString()}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Issues */}
          {githubData.recentActivity?.issueContributions.nodes.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Recent Issues</h4>
              <div className="space-y-2">
                {githubData.recentActivity.issueContributions.nodes.map((contribution, idx) => (
                  <a
                    key={idx}
                    href={contribution.issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <div className="text-sm font-medium">{contribution.issue.title}</div>
                    <div className="text-xs text-gray-500">
                      {contribution.issue.repository.name} • 
                      {new Date(contribution.issue.createdAt).toLocaleDateString()}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Recent Commits */}
          {githubData.recentActivity?.commitContributionsByRepository.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Recent Commits</h4>
              <div className="space-y-2">
                {githubData.recentActivity.commitContributionsByRepository.map((repo, idx) => (
                  <a
                    key={idx}
                    href={repo.repository.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <div className="text-sm font-medium">{repo.repository.name}</div>
                    <div className="text-xs text-gray-500">
                      {repo.contributions.totalCount} commits in the last week
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GitHubContributionsGraph;