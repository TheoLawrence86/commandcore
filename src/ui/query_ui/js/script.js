// CommandCore Query UI JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const domainSelector = document.getElementById('domain-selector');
    const queryInput = document.getElementById('query-input');
    const submitButton = document.getElementById('submit-button');
    const loadingIndicator = document.getElementById('loading-indicator');
    const chatWindow = document.getElementById('chat-window');
    const chatHistory = document.getElementById('chat-history');
    const clearChatBtn = document.getElementById('clear-chat-btn');
    const developerSettingsBtn = document.getElementById('developer-settings-btn');
    
    // Templates
    const userMessageTemplate = document.getElementById('user-message-template');
    const assistantMessageTemplate = document.getElementById('assistant-message-template');

    // Session state
    let currentQuery = '';
    let currentResponse = '';
    let sessionHistory = [];
    let streamingController = null;

    // Event Listeners
    submitButton.addEventListener('click', handleSubmit);
    queryInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSubmit();
        }
    });
    
    if (clearChatBtn) {
        clearChatBtn.addEventListener('click', clearChat);
    }
    
    if (developerSettingsBtn) {
        developerSettingsBtn.addEventListener('click', toggleDeveloperSettings);
    }

    // Auto-resize textarea as user types
    queryInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    // Functions
    async function handleSubmit() {
        console.log('Submit button clicked');
        const query = queryInput.value.trim();
        const domain = domainSelector.value;

        if (!query) {
            showNotification('Please enter a query', 'error');
            return;
        }

        // Save current query
        currentQuery = query;
        console.log('Query:', query);
        console.log('Domain:', domain);
        
        // Add user message to chat
        addUserMessage(query);
        
        // Clear input and reset height
        queryInput.value = '';
        queryInput.style.height = 'auto';
        
        showLoading();

        try {
            // Use streaming response
            await streamResponse(query, domain);
        } catch (error) {
            console.error('Error submitting query:', error);
            hideLoading();
            showNotification('An error occurred while processing your query. Please try again.', 'error');
        }
    }

    function showLoading() {
        loadingIndicator.classList.remove('hidden');
        submitButton.disabled = true;
    }

    function hideLoading() {
        loadingIndicator.classList.add('hidden');
        submitButton.disabled = false;
    }

    async function streamResponse(query, domain) {
        console.log('Starting streamResponse function');
        // Cancel any ongoing streaming
        if (streamingController) {
            streamingController.abort();
        }
        
        // Create new abort controller
        streamingController = new AbortController();
        
        const requestBody = {
            query: query
        };

        if (domain && domain !== 'All Domains') {
            requestBody.domain = domain;
        }

        console.log('Request body:', JSON.stringify(requestBody));
        console.log('Sending request to: /api/orchestrator/v1/query');

        try {
            console.log('Sending fetch request...');
            let response;
            try {
                response = await fetch('/api/orchestrator/v1/query', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody),
                    signal: streamingController.signal
                });
                
                console.log('Response status:', response.status);
                console.log('Response headers:', [...response.headers.entries()]);
            } catch (fetchError) {
                console.error('Fetch error:', fetchError);
                throw new Error(`Fetch error: ${fetchError.message}`);
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`HTTP error ${response.status}: ${errorText}`);
            }

            console.log('Parsing response JSON...');
            let data;
            try {
                data = await response.json();
                console.log('Response data:', data);
            } catch (jsonError) {
                console.error('JSON parsing error:', jsonError);
                const responseText = await response.text();
                console.error('Raw response:', responseText);
                throw new Error(`JSON parsing error: ${jsonError.message}`);
            }
            
            // Add assistant message with response and citations
            addAssistantMessage(data.response, data.sources);
            
            // Set current response
            currentResponse = data.response;
            
            hideLoading();
            
            // Add to session history
            sessionHistory.push({
                query: query,
                response: data.response,
                sources: data.sources,
                timestamp: new Date().toISOString()
            });
            
            // Scroll to bottom of chat
            scrollToBottom();
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Request was aborted');
            } else {
                console.error('Error fetching response:', error);
                addErrorMessage(error.message);
                hideLoading();
            }
        }
    }
    
    function addUserMessage(text) {
        if (!userMessageTemplate) return;
        
        const clone = document.importNode(userMessageTemplate.content, true);
        const messageText = clone.querySelector('.message-text');
        messageText.textContent = text;
        
        chatHistory.appendChild(clone);
        scrollToBottom();
    }
    
    function addAssistantMessage(text, sources = []) {
        if (!assistantMessageTemplate) return;
        
        const clone = document.importNode(assistantMessageTemplate.content, true);
        const messageText = clone.querySelector('.message-text');
        const messageCitations = clone.querySelector('.message-citations');
        
        // Process text to add inline citations
        let processedText = text;
        const citationRegex = /\[(\d+)\]/g;
        const matches = [...text.matchAll(citationRegex)];
        
        if (matches.length > 0) {
            // Create citations section
            const citationsHTML = sources.map((source, index) => {
                return `
                <div class="citation-item">
                    <span class="citation-number">[${index + 1}]</span>
                    <span class="citation-text">${source.title} - ${source.author}, ${source.publication_date}</span>
                </div>`;
            }).join('');
            
            messageCitations.innerHTML = citationsHTML;
            
            // Convert markdown to HTML with syntax highlighting
            processedText = convertMarkdown(processedText);
        } else {
            // If no citations, just convert markdown
            processedText = convertMarkdown(text);
            messageCitations.classList.add('hidden');
        }
        
        messageText.innerHTML = processedText;
        
        // Add follow-up questions if appropriate
        const followUpQuestions = clone.querySelector('.follow-up-questions');
        if (followUpQuestions) {
            // Generate follow-up questions based on the context
            const suggestedQuestions = generateFollowUpQuestions(text);
            if (suggestedQuestions.length > 0) {
                const questionsHTML = suggestedQuestions.map(q => {
                    return `<div class="follow-up-question" onclick="document.getElementById('query-input').value = this.textContent; document.getElementById('query-input').focus();">${q}</div>`;
                }).join('');
                followUpQuestions.innerHTML = questionsHTML;
            } else {
                followUpQuestions.classList.add('hidden');
            }
        }
        
        // Add event listeners for action buttons
        const copyButton = clone.querySelector('.message-actions button[title="Copy response"]');
        if (copyButton) {
            copyButton.addEventListener('click', () => {
                copyToClipboard(text);
                showNotification('Response copied to clipboard', 'success');
            });
        }
        
        chatHistory.appendChild(clone);
        scrollToBottom();
        
        // Add syntax highlighting to code blocks
        addSyntaxHighlightingToCodeBlocks();
    }
    
    function addErrorMessage(errorText) {
        if (!assistantMessageTemplate) return;
        
        const clone = document.importNode(assistantMessageTemplate.content, true);
        const messageText = clone.querySelector('.message-text');
        const messageCitations = clone.querySelector('.message-citations');
        const messageActions = clone.querySelector('.message-actions');
        const followUpQuestions = clone.querySelector('.follow-up-questions');
        
        messageText.innerHTML = `<p class="error-message">Error: ${errorText}</p>`;
        messageCitations.classList.add('hidden');
        messageActions.classList.add('hidden');
        followUpQuestions.classList.add('hidden');
        
        chatHistory.appendChild(clone);
        scrollToBottom();
    }
    
    function convertMarkdown(text) {
        // Convert citations to superscript
        text = text.replace(/\[(\d+)\]/g, '<sup>$1</sup>');
        
        // Convert headers
        text = text.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        text = text.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        text = text.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        
        // Convert bold and italic
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Convert lists
        text = text.replace(/^\s*\d+\.\s+(.*$)/gm, '<li>$1</li>');
        text = text.replace(/^\s*\-\s+(.*$)/gm, '<li>$1</li>');
        text = text.replace(/<\/li>\n<li>/g, '</li><li>');
        text = text.replace(/<li>(.*?)<\/li>/g, '<ul><li>$1</li></ul>');
        text = text.replace(/<\/ul>\n<ul>/g, '');
        
        // Convert code blocks
        text = text.replace(/```(\w+)?\n([\s\S]*?)\n```/g, function(match, language, code) {
            const lang = language || 'plaintext';
            return `<pre><code class="language-${lang}">${code}</code></pre>`;
        });
        
        // Convert inline code
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Convert paragraphs
        text = text.replace(/\n\n/g, '</p><p>');
        text = '<p>' + text + '</p>';
        text = text.replace(/<p><\/p>/g, '');
        
        return text;
    }
    
    function generateFollowUpQuestions(text) {
        // Simple heuristic to generate follow-up questions based on the content
        const questions = [];
        
        // Check for mentions of specific topics and suggest related questions
        if (text.toLowerCase().includes('atak')) {
            questions.push('What hardware requirements does ATAK have?');
            questions.push('How do I configure ATAK for team use?');
        }
        
        if (text.toLowerCase().includes('server')) {
            questions.push('What are the recommended security practices for server setup?');
            questions.push('How do I monitor server performance?');
        }
        
        if (text.toLowerCase().includes('rag') || text.toLowerCase().includes('pipeline')) {
            questions.push('How does the vector database work in the RAG pipeline?');
            questions.push('What embedding models are supported?');
        }
        
        // Limit to 3 questions maximum
        return questions.slice(0, 3);
    }
    
    function scrollToBottom() {
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }
    
    function clearChat() {
        // Clear chat history
        chatHistory.innerHTML = '';
        sessionHistory = [];
        
        // Show welcome message again
        const welcomeMessage = document.querySelector('.system-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'flex';
        }
        
        showNotification('Chat history cleared', 'success');
    }
    
    function toggleDeveloperSettings() {
        // This would show a modal with developer settings
        showNotification('Developer settings not implemented yet', 'info');
    }
    
    function copyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
    
    function addSyntaxHighlightingToCodeBlocks() {
        // Apply Prism.js syntax highlighting to code blocks
        if (window.Prism) {
            Prism.highlightAllUnder(chatHistory);
        }
    }
    
    function showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        if (!notification) return;
        
        notification.textContent = message;
        notification.className = 'notification show ' + type;
        
        setTimeout(() => {
            notification.className = 'notification';
        }, 3000);
    }
});
