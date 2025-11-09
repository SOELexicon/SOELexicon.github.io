// GitHub API utilities
class GitHubAPI {
    constructor() {
        this.baseURL = 'https://api.github.com';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Parse GitHub repository URL to extract owner and repo name
     */
    parseRepoURL(url) {
        const regex = /github\.com\/([^\/]+)\/([^\/]+)/;
        const match = url.match(regex);
        if (!match) {
            throw new Error('Invalid GitHub repository URL');
        }
        return {
            owner: match[1],
            repo: match[2].replace(/\.git$/, '')
        };
    }

    /**
     * Get cached data if available and not expired
     */
    getCached(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    /**
     * Set cache data
     */
    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Make API request with error handling
     */
    async request(endpoint) {
        const cacheKey = endpoint;
        const cached = this.getCached(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }

            const data = await response.json();
            this.setCache(cacheKey, data);
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    /**
     * Get repository information
     */
    async getRepository(owner, repo) {
        return this.request(`/repos/${owner}/${repo}`);
    }

    /**
     * Get workflows for a repository
     */
    async getWorkflows(owner, repo) {
        return this.request(`/repos/${owner}/${repo}/actions/workflows`);
    }

    /**
     * Get workflow runs for a specific workflow
     */
    async getWorkflowRuns(owner, repo, workflowId, perPage = 5) {
        return this.request(`/repos/${owner}/${repo}/actions/workflows/${workflowId}/runs?per_page=${perPage}`);
    }

    /**
     * Get recent workflow runs for a repository
     */
    async getRecentWorkflowRuns(owner, repo, perPage = 10) {
        return this.request(`/repos/${owner}/${repo}/actions/runs?per_page=${perPage}`);
    }

    /**
     * Format date to readable string
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString();
    }

    /**
     * Get status class for workflow conclusion
     */
    getStatusClass(conclusion, status) {
        if (status === 'in_progress' || status === 'queued') {
            return status;
        }
        
        switch (conclusion) {
            case 'success':
                return 'success';
            case 'failure':
                return 'failure';
            case 'cancelled':
                return 'cancelled';
            default:
                return status || 'queued';
        }
    }

    /**
     * Get display text for status
     */
    getStatusText(conclusion, status) {
        if (status === 'in_progress') return 'In Progress';
        if (status === 'queued') return 'Queued';
        
        switch (conclusion) {
            case 'success':
                return 'Success';
            case 'failure':
                return 'Failure';
            case 'cancelled':
                return 'Cancelled';
            default:
                return status || 'Unknown';
        }
    }
}

// Export for use in other scripts
const githubAPI = new GitHubAPI();
