document.addEventListener('DOMContentLoaded', function() {
    const summaryBtn = document.getElementById('summaryBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const closeBtn = document.getElementById('closeBtn');
    const newSummaryBtn = document.getElementById('newSummaryBtn');
    const retryBtn = document.getElementById('retryBtn');
    
    const initialView = document.getElementById('initialView');
    const resultView = document.getElementById('resultView');
    const errorView = document.getElementById('errorView');
    const summaryResult = document.getElementById('summaryResult');
    const errorMessage = document.getElementById('errorMessage');
    
    const btnText = document.querySelector('.btn-text');
    const loadingSpinner = document.querySelector('.loading-spinner');

    // Load theme preference
    loadTheme();

    // Event listeners
    summaryBtn.addEventListener('click', createSummary);
    settingsBtn.addEventListener('click', openSettings);
    closeBtn.addEventListener('click', showInitialView);
    newSummaryBtn.addEventListener('click', showInitialView);
    retryBtn.addEventListener('click', createSummary);

    async function createSummary() {
        try {
            showLoading(true);
            hideError();
            
            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Check if we're on X/Twitter
            if (!tab.url.includes('twitter.com') && !tab.url.includes('x.com')) {
                throw new Error('Extension ini hanya bekerja di halaman X/Twitter');
            }
            
            // Inject content script and get page content
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: extractTwitterContent
            });
            
            const pageContent = results[0].result;
            
            if (!pageContent || pageContent.trim() === '') {
                throw new Error('Tidak dapat mengekstrak konten dari halaman ini');
            }
            
            // Send content to background script for AI processing
            const response = await chrome.runtime.sendMessage({
                action: 'summarize',
                content: pageContent,
                url: tab.url
            });
            
            if (response.error) {
                throw new Error(response.error);
            }
            
            displaySummary(response.summary);
            
        } catch (error) {
            console.error('Error creating summary:', error);
            showError(error.message);
        } finally {
            showLoading(false);
        }
    }

    function showLoading(isLoading) {
        if (isLoading) {
            btnText.style.display = 'none';
            loadingSpinner.style.display = 'inline';
            summaryBtn.disabled = true;
        } else {
            btnText.style.display = 'inline';
            loadingSpinner.style.display = 'none';
            summaryBtn.disabled = false;
        }
    }

    function displaySummary(summary) {
        summaryResult.innerHTML = formatSummary(summary);
        showResultView();
    }

    function formatSummary(summary) {
        // Format summary according to the template in the brief
        const lines = summary.split('\n');
        let formattedSummary = '';
        let currentSection = '';
        
        for (let line of lines) {
            line = line.trim();
            if (line === '') continue;
            
            if (line.toLowerCase().includes('ringkasan') && line.includes(':')) {
                formattedSummary += `<div class="summary-section"><h4>Ringkasan:</h4>`;
                currentSection = 'summary';
            } else if (line.toLowerCase().includes('point penting') && line.includes(':')) {
                if (currentSection === 'summary') formattedSummary += '</div>';
                formattedSummary += `<div class="summary-section"><h4>Point Penting:</h4><ul>`;
                currentSection = 'points';
            } else if (line.startsWith('-') && currentSection === 'points') {
                formattedSummary += `<li>${line.substring(1).trim()}</li>`;
            } else if (currentSection === 'summary') {
                formattedSummary += `<p>${line}</p>`;
            } else {
                formattedSummary += `<p>${line}</p>`;
            }
        }
        
        if (currentSection === 'points') formattedSummary += '</ul></div>';
        if (currentSection === 'summary') formattedSummary += '</div>';
        
        return formattedSummary || `<div class="summary-section"><p>${summary}</p></div>`;
    }

    function showResultView() {
        initialView.style.display = 'none';
        errorView.style.display = 'none';
        resultView.style.display = 'block';
    }

    function showInitialView() {
        resultView.style.display = 'none';
        errorView.style.display = 'none';
        initialView.style.display = 'block';
    }

    function showError(message) {
        errorMessage.textContent = message;
        initialView.style.display = 'none';
        resultView.style.display = 'none';
        errorView.style.display = 'block';
    }

    function hideError() {
        errorView.style.display = 'none';
    }

    function openSettings() {
        chrome.runtime.openOptionsPage();
    }

    async function loadTheme() {
        const result = await chrome.storage.sync.get(['theme']);
        const theme = result.theme || 'light';
        document.body.setAttribute('data-theme', theme);
    }
});

// Function to be injected into the page to extract Twitter content
function extractTwitterContent() {
    let content = '';
    
    // Try to get tweet content from various selectors
    const tweetSelectors = [
        '[data-testid="tweetText"]',
        '[data-testid="tweet"]',
        'article[data-testid="tweet"]',
        '.tweet-text',
        '.js-tweet-text'
    ];
    
    const userInfoSelectors = [
        '[data-testid="UserName"]',
        '[data-testid="UserScreenName"]',
        '.username',
        '.screen-name'
    ];
    
    // Get user information
    let userInfo = '';
    for (const selector of userInfoSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            userInfo += Array.from(elements).map(el => el.textContent.trim()).join(' ') + ' ';
            break;
        }
    }
    
    // Get tweet content
    let tweets = [];
    for (const selector of tweetSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            tweets = Array.from(elements).map(el => el.textContent.trim()).filter(text => text.length > 0);
            break;
        }
    }
    
    // If no tweets found, try to get general page content
    if (tweets.length === 0) {
        const mainContent = document.querySelector('main') || document.querySelector('[role="main"]') || document.body;
        const textContent = mainContent.textContent.trim();
        if (textContent) {
            tweets = [textContent.substring(0, 2000)]; // Limit content length
        }
    }
    
    // Combine user info and tweets
    if (userInfo) {
        content += `User: ${userInfo}\n\n`;
    }
    
    if (tweets.length > 0) {
        content += `Tweets/Content:\n${tweets.slice(0, 10).join('\n\n')}`;
    }
    
    return content || 'Tidak dapat mengekstrak konten dari halaman ini';
}