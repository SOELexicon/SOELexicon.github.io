// Bookmarklet Loader
// Loads bookmarklets from the bookmarklet folder and displays them

async function loadBookmarklets() {
    try {
        const response = await fetch('bookmarklet/bookmarklets.json');
        if (!response.ok) {
            throw new Error('Failed to load bookmarklets.json');
        }
        
        const bookmarklets = await response.json();
        const container = document.getElementById('bookmarklets-container');
        
        if (!container) {
            console.error('Bookmarklets container not found');
            return;
        }
        
        if (bookmarklets.length === 0) {
            container.innerHTML = '<p class="no-bookmarklets">No bookmarklets available yet.</p>';
            return;
        }
        
        container.innerHTML = bookmarklets.map((bookmarklet, index) => {
            return createBookmarkletElement(bookmarklet, index);
        }).join('');
        
        // Add drag event listeners
        attachDragListeners();
        
    } catch (error) {
        console.error('Error loading bookmarklets:', error);
        const container = document.getElementById('bookmarklets-container');
        if (container) {
            container.innerHTML = `<p class="error">Error loading bookmarklets: ${error.message}</p>`;
        }
    }
}

async function getBookmarkletCode(filename) {
    try {
        const response = await fetch(`bookmarklet/${filename}`);
        if (!response.ok) {
            throw new Error(`Failed to load ${filename}`);
        }
        return await response.text();
    } catch (error) {
        console.error(`Error loading bookmarklet ${filename}:`, error);
        return null;
    }
}

function createBookmarkletElement(bookmarklet, index) {
    const id = `bookmarklet-${index}`;
    return `
        <div class="bookmarklet-item" data-index="${index}">
            <div class="bookmarklet-header">
                <span class="bookmarklet-icon">${bookmarklet.icon || '🔖'}</span>
                <h3 class="bookmarklet-name">${escapeHtml(bookmarklet.name)}</h3>
            </div>
            ${bookmarklet.description ? `<p class="bookmarklet-description">${escapeHtml(bookmarklet.description)}</p>` : ''}
            <div class="bookmarklet-actions">
                <a 
                    href="#" 
                    id="${id}" 
                    class="bookmarklet-link" 
                    draggable="true"
                    data-filename="${bookmarklet.file}"
                    title="Drag this to your bookmarks bar or click to test"
                >
                    📌 ${escapeHtml(bookmarklet.name)}
                </a>
                <button class="copy-code-btn" data-filename="${bookmarklet.file}" title="Copy bookmarklet code">
                    📋 Copy Code
                </button>
            </div>
        </div>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function attachDragListeners() {
    const bookmarkletLinks = document.querySelectorAll('.bookmarklet-link');
    
    bookmarkletLinks.forEach(async (link) => {
        const filename = link.getAttribute('data-filename');
        const code = await getBookmarkletCode(filename);
        
        if (!code) {
            link.style.opacity = '0.5';
            link.title = 'Error loading bookmarklet code';
            return;
        }
        
        // Set the href to the bookmarklet code
        link.href = code.trim();
        
        // Handle drag start
        link.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', code.trim());
            e.dataTransfer.setData('text/uri-list', code.trim());
            e.dataTransfer.effectAllowed = 'copy';
            
            // Create a visual feedback
            link.style.opacity = '0.5';
        });
        
        // Handle drag end
        link.addEventListener('dragend', (e) => {
            link.style.opacity = '1';
        });
        
        // Handle click to test
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm(`Test bookmarklet "${link.textContent.trim()}"?`)) {
                try {
                    eval(code);
                } catch (error) {
                    alert(`Error running bookmarklet: ${error.message}`);
                }
            }
        });
    });
    
    // Handle copy code buttons
    const copyButtons = document.querySelectorAll('.copy-code-btn');
    copyButtons.forEach(async (button) => {
        button.addEventListener('click', async () => {
            const filename = button.getAttribute('data-filename');
            const code = await getBookmarkletCode(filename);
            
            if (code) {
                try {
                    await navigator.clipboard.writeText(code.trim());
                    button.textContent = '✓ Copied!';
                    setTimeout(() => {
                        button.textContent = '📋 Copy Code';
                    }, 2000);
                } catch (error) {
                    // Fallback for older browsers
                    const textarea = document.createElement('textarea');
                    textarea.value = code.trim();
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                    button.textContent = '✓ Copied!';
                    setTimeout(() => {
                        button.textContent = '📋 Copy Code';
                    }, 2000);
                }
            }
        });
    });
}

// Load bookmarklets when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadBookmarklets);
} else {
    loadBookmarklets();
}

