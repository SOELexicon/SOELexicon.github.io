// Admin interface functionality
class RepoManager {
    constructor() {
        this.storageKey = 'github-repos';
        this.init();
    }

    init() {
        this.loadRepoList();
        this.setupEventListeners();
    }

    /**
     * Get repositories from localStorage
     */
    getRepos() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Save repositories to localStorage
     */
    saveRepos(repos) {
        localStorage.setItem(this.storageKey, JSON.stringify(repos));
    }

    /**
     * Add a repository
     */
    async addRepo(url) {
        try {
            const { owner, repo } = githubAPI.parseRepoURL(url);
            const repos = this.getRepos();

            // Check if already exists
            if (repos.some(r => r.owner === owner && r.repo === repo)) {
                throw new Error('Repository already exists in the list');
            }

            // Validate repository exists by fetching it
            const repoData = await githubAPI.getRepository(owner, repo);

            // Add to list
            repos.push({
                owner,
                repo,
                url: repoData.html_url,
                description: repoData.description,
                addedAt: new Date().toISOString()
            });

            this.saveRepos(repos);
            return { success: true, message: 'Repository added successfully!' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    /**
     * Remove a repository
     */
    removeRepo(owner, repo) {
        const repos = this.getRepos();
        const filtered = repos.filter(r => !(r.owner === owner && r.repo === repo));
        this.saveRepos(filtered);
        this.loadRepoList();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const form = document.getElementById('add-repo-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const urlInput = document.getElementById('repo-url');
                const messageDiv = document.getElementById('add-repo-message');
                const url = urlInput.value.trim();

                if (!url) {
                    this.showMessage('Please enter a repository URL', 'error');
                    return;
                }

                // Show loading state
                messageDiv.className = 'message';
                messageDiv.textContent = 'Adding repository...';
                messageDiv.style.display = 'block';

                const result = await this.addRepo(url);
                
                if (result.success) {
                    this.showMessage(result.message, 'success');
                    urlInput.value = '';
                    this.loadRepoList();
                } else {
                    this.showMessage(result.message, 'error');
                }
            });
        }
    }

    /**
     * Show message to user
     */
    showMessage(message, type) {
        const messageDiv = document.getElementById('add-repo-message');
        if (messageDiv) {
            messageDiv.className = `message ${type}`;
            messageDiv.textContent = message;
            messageDiv.style.display = 'block';

            if (type === 'success') {
                setTimeout(() => {
                    messageDiv.style.display = 'none';
                }, 5000);
            }
        }
    }

    /**
     * Load and display repository list
     */
    loadRepoList() {
        const container = document.getElementById('repo-list-container');
        if (!container) return;

        const repos = this.getRepos();

        if (repos.length === 0) {
            container.innerHTML = '<p class="no-repos">No repositories configured yet. Add one above!</p>';
            return;
        }

        container.innerHTML = repos.map(repo => `
            <div class="repo-list-item">
                <div class="repo-list-item-info">
                    <h4>${repo.owner}/${repo.repo}</h4>
                    <p>${repo.description || 'No description'}</p>
                </div>
                <button 
                    class="remove-btn" 
                    onclick="repoManager.removeRepo('${repo.owner}', '${repo.repo}')"
                >
                    Remove
                </button>
            </div>
        `).join('');
    }
}

// Initialize repo manager
const repoManager = new RepoManager();
