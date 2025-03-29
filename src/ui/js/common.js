// CommandCore Common JavaScript Functions

document.addEventListener('DOMContentLoaded', function() {
    // Set active nav link based on current page
    setActiveNavLink();
});

/**
 * Sets the active navigation link based on the current page URL
 */
function setActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        // Check if current path includes the link's href
        if (currentPath === '/' && href === '/index.html') {
            link.classList.add('active');
        } else if (currentPath.includes(href) && href !== '/index.html') {
            link.classList.add('active');
        }
    });
}

/**
 * Format timestamps to a more human-readable format
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted date and time
 */
function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleString();
}

/**
 * Format markdown content to HTML
 * @param {string} text - Markdown text
 * @returns {string} HTML formatted content
 */
function formatMarkdown(text) {
    if (!text) return '';
    
    // Format code blocks
    let formatted = text.replace(/```(\w*)([\s\S]*?)```/g, function(match, language, code) {
        return `<pre><code class="language-${language}">${code.trim()}</code></pre>`;
    });
    
    // Format inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Format bold
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Format italic
    formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Format links
    formatted = formatted.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // Format headers
    formatted = formatted.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    formatted = formatted.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    formatted = formatted.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    
    // Format lists
    formatted = formatted.replace(/^\s*\d+\.\s+(.*$)/gm, '<li>$1</li>');
    formatted = formatted.replace(/^\s*[\-\*]\s+(.*$)/gm, '<li>$1</li>');
    
    // Wrap lists
    formatted = formatted.replace(/<\/li>\n<li>/g, '</li><li>');
    formatted = formatted.replace(/<li>(.+?)<\/li>/g, '<ul><li>$1</li></ul>');
    formatted = formatted.replace(/<\/ul>\s*<ul>/g, '');
    
    // Replace newlines with <br> or paragraphs
    formatted = formatted.replace(/\n\n/g, '</p><p>');
    formatted = formatted.replace(/\n/g, '<br>');
    
    // Wrap in paragraph if not already wrapped
    if (!formatted.startsWith('<p>')) {
        formatted = `<p>${formatted}</p>`;
    }
    
    return formatted;
}

/**
 * Add syntax highlighting to code blocks
 * This should be called after the markdown has been rendered
 */
function highlightCodeBlocks() {
    // Check if Prism is loaded
    if (typeof Prism !== 'undefined') {
        Prism.highlightAll();
    }
}

/**
 * Copies text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy text: ', err);
        return false;
    }
}

/**
 * Show a notification message
 * @param {string} message - Message to display
 * @param {string} type - Message type (success, error, info)
 * @param {number} duration - Duration in milliseconds
 */
function showNotification(message, type = 'info', duration = 3000) {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Set notification content and type
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    // Show notification
    notification.classList.add('show');
    
    // Hide notification after duration
    setTimeout(() => {
        notification.classList.remove('show');
    }, duration);
}
