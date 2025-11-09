// Dashboard functionality
class Dashboard {
    constructor() {
        this.init();
    }

    async init() {
        const repos = this.getRepos();
        const loadingDiv = document.getElementById('loading');
        const noReposDiv = document.getElementById('no-repos');
        const container = document.getElementById('repositories');

        if (repos.length === 0) {
            loadingDiv.style.display = 'none';
            noReposDiv.style.display = 'block';
            return;
        }

        try {
            await this.loadRepositories(repos);
            loadingDiv.style.display = 'none';
        } catch (error) {
            console.error('Error loading repositories:', error);
            loadingDiv.textContent = 'Error loading repositories. Please try again later.';
        }
    }

    /**
     * Get repositories from localStorage
     */
    getRepos() {
        const stored = localStorage.getItem('github-repos');
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Load all repositories
     */
    async loadRepositories(repos) {
        const container = document.getElementById('repositories');
        container.innerHTML = '';

        for (const repo of repos) {
            try {
                const card = await this.createRepoCard(repo);
                container.appendChild(card);
            } catch (error) {
                console.error(`Error loading ${repo.owner}/${repo.repo}:`, error);
                const errorCard = this.createErrorCard(repo, error.message);
                container.appendChild(errorCard);
            }
        }
    }

    /**
     * Create repository card element
     */
    async createRepoCard(repo) {
        const card = document.createElement('div');
        card.className = 'repo-card';

        // Fetch repository data
        const repoData = await githubAPI.getRepository(repo.owner, repo.repo);
        
        // Create card header
        const header = `
            <h2>
                <a href="${repoData.html_url}" target="_blank">
                    ${repo.owner}/${repo.repo}
                </a>
            </h2>
            <div class="repo-meta">
                <span>⭐ ${repoData.stargazers_count}</span>
                <span>🔀 ${repoData.forks_count}</span>
                ${repoData.language ? `<span>📝 ${repoData.language}</span>` : ''}
            </div>
            ${repoData.description ? `<p class="repo-description">${repoData.description}</p>` : ''}
        `;

        card.innerHTML = header;

        // Load workflows
        try {
            const workflowsSection = await this.createWorkflowsSection(repo.owner, repo.repo);
            card.appendChild(workflowsSection);
        } catch (error) {
            console.error(`Error loading workflows for ${repo.owner}/${repo.repo}:`, error);
        }

        return card;
    }

    /**
     * Create workflows section
     */
    async createWorkflowsSection(owner, repo) {
        const section = document.createElement('div');
        section.className = 'workflows';

        const workflowsData = await githubAPI.getWorkflows(owner, repo);

        if (!workflowsData.workflows || workflowsData.workflows.length === 0) {
            section.innerHTML = '<p style="color: #586069; font-size: 0.875rem;">No workflows configured</p>';
            return section;
        }

        section.innerHTML = '<h3>GitHub Actions Workflows</h3>';

        // Get recent runs for each workflow
        for (const workflow of workflowsData.workflows.slice(0, 5)) { // Limit to 5 workflows
            try {
                const workflowDiv = await this.createWorkflowItem(owner, repo, workflow);
                section.appendChild(workflowDiv);
            } catch (error) {
                console.error(`Error loading workflow ${workflow.name}:`, error);
            }
        }

        return section;
    }

    /**
     * Create workflow item with recent runs
     */
    async createWorkflowItem(owner, repo, workflow) {
        const div = document.createElement('div');
        div.className = 'workflow-item';

        const workflowName = document.createElement('div');
        workflowName.className = 'workflow-name';
        workflowName.textContent = workflow.name;
        div.appendChild(workflowName);

        // Get recent runs
        try {
            const runsData = await githubAPI.getWorkflowRuns(owner, repo, workflow.id, 3);
            
            if (runsData.workflow_runs && runsData.workflow_runs.length > 0) {
                const runsDiv = document.createElement('div');
                runsDiv.className = 'workflow-runs';

                runsData.workflow_runs.forEach(run => {
                    const runDiv = document.createElement('div');
                    runDiv.className = 'workflow-run';
                    
                    const statusClass = githubAPI.getStatusClass(run.conclusion, run.status);
                    const statusText = githubAPI.getStatusText(run.conclusion, run.status);
                    
                    runDiv.innerHTML = `
                        <div>
                            <a href="${run.html_url}" target="_blank">
                                #${run.run_number} - ${run.event}
                            </a>
                            <div style="font-size: 0.75rem; color: #586069;">
                                ${githubAPI.formatDate(run.created_at)}
                            </div>
                        </div>
                        <span class="status ${statusClass}">${statusText}</span>
                    `;
                    
                    runsDiv.appendChild(runDiv);
                });

                div.appendChild(runsDiv);
            } else {
                const noRuns = document.createElement('p');
                noRuns.style.cssText = 'font-size: 0.875rem; color: #586069; margin-top: 0.5rem;';
                noRuns.textContent = 'No recent runs';
                div.appendChild(noRuns);
            }
        } catch (error) {
            console.error(`Error loading runs for workflow ${workflow.name}:`, error);
        }

        return div;
    }

    /**
     * Create error card for failed repository
     */
    createErrorCard(repo, errorMessage) {
        const card = document.createElement('div');
        card.className = 'repo-card';
        card.style.borderLeft = '4px solid #d73a49';
        
        card.innerHTML = `
            <h2>${repo.owner}/${repo.repo}</h2>
            <p style="color: #d73a49;">Error: ${errorMessage}</p>
            <p style="font-size: 0.875rem; color: #586069;">
                This repository may be private, deleted, or you may have hit the API rate limit.
            </p>
        `;

        return card;
    }
}

// Initialize dashboard
const dashboard = new Dashboard();
