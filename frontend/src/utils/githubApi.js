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
          pullRequestContributions(first: 100) {
            totalCount
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
          issueContributions(first: 100) {
            totalCount
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
          commitContributionsByRepository {
            repository {
              name
              url
            }
            contributions(first: 10) {
              totalCount
              nodes {
                occurredAt
                commitCount
              }
            }
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
      throw new Error(`GitHub API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Check for GraphQL errors
    if (data.errors) {
      console.error('GraphQL Errors:', data.errors);
      throw new Error(data.errors[0].message);
    }

    // Validate response data structure
    if (!data?.data?.user) {
      console.error('Invalid response structure:', data);
      throw new Error('Invalid response from GitHub API');
    }

    return data.data.user;
  } catch (error) {
    console.error('Error fetching GitHub data:', error);
    console.error('Username:', username);
    console.error('Token exists:', !!import.meta.env.VITE_GITHUB_TOKEN);
    throw new Error(`Failed to fetch GitHub data: ${error.message}`);
  }
};
