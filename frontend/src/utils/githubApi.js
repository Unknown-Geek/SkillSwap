const GITHUB_API_URL = 'https://api.github.com';

export const fetchGitHubProfile = async (username) => {
  const query = `
    query ($username: String!) {
      user(login: $username) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
              }
            }
          }
          pullRequestContributions {
            totalCount
          }
          issueContributions {
            totalCount
          }
        }
        repositories(first: 100, orderBy: {field: UPDATED_AT, direction: DESC}) {
          totalCount
          nodes {
            name
            description
            stargazerCount
            primaryLanguage {
              name
            }
          }
        }
        recentActivity: contributionsCollection {
          commitContributionsByRepository(maxRepositories: 5) {
            repository {
              name
              url
            }
            contributions(first: 5) {
              totalCount
              nodes {
                occurredAt
                commitCount
              }
            }
          }
          pullRequestContributions(first: 5) {
            nodes {
              pullRequest {
                title
                url
                createdAt
                repository {
                  name
                }
              }
            }
          }
          issueContributions(first: 5) {
            nodes {
              issue {
                title
                url
                createdAt
                repository {
                  name
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables: { username } }),
    });

    if (!response.ok) {
      throw new Error('GitHub API request failed');
    }

    const data = await response.json();
    return data.data.user;
  } catch (error) {
    console.error('Error fetching GitHub data:', error);
    throw error;
  }
};
