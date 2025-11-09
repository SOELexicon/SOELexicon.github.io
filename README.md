# SOELexicon GitHub Pages Dashboard

A GitHub Pages site with an admin interface for managing and monitoring GitHub repositories, including GitHub Actions workflows and their results.

## Features

### Dashboard (index.html)
- **Repository Overview**: Displays configured repositories with key statistics
  - Stars, forks, and primary language
  - Repository description
- **GitHub Actions Monitoring**: 
  - Lists all workflows for each repository
  - Shows recent workflow runs with status (Success, Failure, In Progress, etc.)
  - Displays run numbers, trigger events, and timestamps
  - Direct links to workflow runs on GitHub
- **Responsive Design**: Works on desktop and mobile devices

### Admin Interface (admin.html)
- **Add Repositories**: 
  - Add any public GitHub repository by URL
  - Validates repository exists before adding
  - Example: `https://github.com/SOELexicon/clickup_framework`
- **Manage Repositories**:
  - View all configured repositories
  - Remove repositories from the dashboard
- **Local Storage**: All configuration stored in browser localStorage

## Usage

1. **Deploy to GitHub Pages**: 
   - Enable GitHub Pages in your repository settings
   - Set source to the main/master branch
   - Access your site at `https://[username].github.io/[repository]`

2. **Add Repositories**:
   - Navigate to the Admin page
   - Enter a GitHub repository URL (e.g., `https://github.com/username/repository`)
   - Click "Add Repository"
   - The repository will be validated and added to your dashboard

3. **View Dashboard**:
   - Return to the Dashboard page
   - See all your repositories with their workflows and recent runs
   - Click on repository names or workflow runs to view on GitHub

## Technical Details

- **No Backend Required**: Pure client-side application using HTML, CSS, and JavaScript
- **GitHub API**: Uses the public GitHub REST API (no authentication required for public repos)
- **Caching**: API responses cached for 5 minutes to reduce API calls
- **Rate Limits**: GitHub API allows 60 requests/hour for unauthenticated requests
- **Data Storage**: Repository list stored in browser localStorage

## Files

- `index.html` - Main dashboard page
- `admin.html` - Admin interface for managing repositories
- `styles.css` - Styling for all pages
- `github-api.js` - GitHub API integration and utilities
- `dashboard.js` - Dashboard functionality
- `admin.js` - Admin interface functionality

## API Rate Limits

The GitHub API has rate limits:
- **Unauthenticated**: 60 requests/hour
- **Authenticated**: 5,000 requests/hour (requires GitHub token)

To avoid rate limits, the app:
- Caches API responses for 5 minutes
- Limits the number of workflows shown per repository
- Shows helpful error messages if rate limited

## Browser Compatibility

Works in all modern browsers:
- Chrome, Firefox, Safari, Edge
- Requires JavaScript enabled
- Requires localStorage support

## Screenshots

### Empty Dashboard
![Empty Dashboard](https://github.com/user-attachments/assets/3526df9d-5fab-48c4-96bd-b55b676b118c)

### Admin Interface
![Admin Interface](https://github.com/user-attachments/assets/3a478625-344a-4756-b898-fa29841aeb16)

### Configured Repository
![Admin with Repository](https://github.com/user-attachments/assets/b0d9ea25-a8bc-4280-a634-9e9cbff3cc02)

## Development

To test locally:
1. Clone the repository
2. Start a local web server: `python3 -m http.server 8080`
3. Open `http://localhost:8080` in your browser

**Note**: When testing locally, browser security restrictions may block GitHub API calls. The site works properly when deployed to GitHub Pages.