import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import { FaGithub, FaExternalLinkAlt } from 'react-icons/fa';
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
      <div className="p-4 bg-red-50 dark:bg-red-900 rounded-lg">
        <div className="text-red-600 dark:text-red-200 font-medium mb-2">
          Failed to load GitHub contributions
        </div>
        <div className="text-sm text-red-500 dark:text-red-300">
          {error}
        </div>
        <div className="mt-2 text-sm text-red-400 dark:text-red-400">
          Please check your GitHub token and username configuration
        </div>
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

  // Updated month label calculation
  const getMonthLabels = () => {
    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let prevMonth = null;
    
    // Add first month manually to ensure it's shown
    if (weeks.length > 0 && weeks[0].contributionDays.length > 0) {
      const firstDate = new Date(weeks[0].contributionDays[0].date);
      const firstMonth = firstDate.getMonth();
      months.push({
        name: monthNames[firstMonth],
        weekIndex: 0
      });
      prevMonth = firstMonth;
    }

    // Process remaining weeks
    weeks.forEach((week, weekIndex) => {
      if (week.contributionDays.length > 0) {
        const date = new Date(week.contributionDays[0].date);
        const month = date.getMonth();
        
        if (prevMonth !== month) {
          months.push({
            name: monthNames[month],
            weekIndex
          });
          prevMonth = month;
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
    <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"> {/* Added mb-20 for extra bottom margin */}
      <div className="flex items-center justify-between mb-4 pl-2">
        <div className="flex items-center">
          <Calendar className="mr-2" />
          <h2 className="text-lg font-semibold">GitHub Activity</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Total Contributions: {contributions.totalContributions}
          </div>
          <a
            href={`https://github.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FaGithub className="w-4 h-4" />
            Visit Profile
            <FaExternalLinkAlt className="w-3 h-3" />
          </a>
        </div>
      </div>

      <div className="flex flex-col mt-6 "> {/* Reduced top margin */}
        {/* Updated month labels container */}
        <div className="relative h-6 ml-11 mb-2 ">
          <div className="absolute inset-0 flex">
            {monthLabels.map((month, index) => (
              <div
                key={index}
                className="text-xs text-gray-500"
                style={{
                  position: 'absolute',
                  left: `${month.weekIndex * totalCellWidth}px`,
                  top: 0,
                  transform: month.weekIndex >= weeks.length - 4 ? 'translateX(-50%)' : 'none', // Adjust for overflow
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                  width: `${totalCellWidth}px`, // Center alignment
                }}
              >
                {month.name}
              </div>
            ))}
          </div>
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

      {/* Updated Recent Activity Section */}
      <div className="mt-8 border-t dark:border-gray-700 pt-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">Recent Activity</span>
          <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 rounded-full">
            Last 30 days
          </span>
        </h3>
        
        <div className="space-y-6">
          {/* Pull Requests and Issues in 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pull Requests Column */}
            <div>
              {githubData.recentActivity?.pullRequestContributions.nodes.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2M8 4v4m0-4h8m-8 0l4 4m-4-4v12" />
                    </svg>
                    Recent Pull Requests
                  </h4>
                  <div className="space-y-2">
                    {githubData.recentActivity.pullRequestContributions.nodes.map((contribution, idx) => (
                      <a
                        key={idx}
                        href={contribution.pullRequest.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-100 dark:border-gray-700"
                      >
                        <div className="text-sm font-medium line-clamp-1">{contribution.pullRequest.title}</div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center">
                          <span className="flex-1">{contribution.pullRequest.repository.name}</span>
                          <span className="text-gray-400">
                            {new Date(contribution.pullRequest.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Issues Column */}
            <div>
              {githubData.recentActivity?.issueContributions.nodes.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Recent Issues
                  </h4>
                  <div className="space-y-2">
                    {githubData.recentActivity.issueContributions.nodes.map((contribution, idx) => (
                      <a
                        key={idx}
                        href={contribution.issue.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-100 dark:border-gray-700"
                      >
                        <div className="text-sm font-medium line-clamp-1">{contribution.issue.title}</div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center">
                          <span className="flex-1">{contribution.issue.repository.name}</span>
                          <span className="text-gray-400">
                            {new Date(contribution.issue.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Commits - Full Width */}
          {githubData.contributionsCollection.commitContributionsByRepository.length > 0 && (
            <div className="w-full">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Recent Commits
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {githubData.contributionsCollection.commitContributionsByRepository.map((repo, idx) => (
                  <a
                    key={idx}
                    href={repo.repository.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-100 dark:border-gray-700"
                  >
                    <div className="text-sm font-medium line-clamp-1">{repo.repository.name}</div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center">
                      <span className="flex-1">
                        {repo.contributions.totalCount} commits
                      </span>
                      <span className="text-gray-400">
                        {repo.contributions.nodes[0]?.occurredAt && 
                          new Date(repo.contributions.nodes[0].occurredAt).toLocaleDateString()}
                      </span>
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