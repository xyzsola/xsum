// Side Panel JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const summaryBtn = document.getElementById('summaryBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const closeBtn = document.getElementById('closeBtn');
    const newSummaryBtn = document.getElementById('newSummaryBtn');
    const copyBtn = document.getElementById('copyBtn');
    const retryBtn = document.getElementById('retryBtn');
    
    const initialView = document.getElementById('initialView');
    const resultView = document.getElementById('resultView');
    const errorView = document.getElementById('errorView');
    const summaryResult = document.getElementById('summaryResult');
    const errorMessage = document.getElementById('errorMessage');
    
    const btnText = summaryBtn.querySelector('.btn-text');
    const loadingSpinner = summaryBtn.querySelector('.loading-spinner');

    // Event Listeners
    summaryBtn.addEventListener('click', handleSummarize);
    settingsBtn.addEventListener('click', openSettings);
    closeBtn.addEventListener('click', showInitialView);
    newSummaryBtn.addEventListener('click', showInitialView);
    copyBtn.addEventListener('click', copySummary);
    retryBtn.addEventListener('click', handleSummarize);

    async function handleSummarize() {
        try {
            setLoadingState(true);
            hideAllViews();
            showView(initialView);

            // Get active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url.includes('twitter.com') && !tab.url.includes('x.com')) {
                throw new Error('Halaman ini bukan X/Twitter. Silakan buka halaman X/Twitter terlebih dahulu.');
            }

            // Send message to background script
            const response = await chrome.runtime.sendMessage({
                action: 'summarize',
                tabId: tab.id
            });

            if (response.success) {
                displaySummary(response.summary);
            } else {
                throw new Error(response.error || 'Terjadi kesalahan saat membuat ringkasan');
            }
        } catch (error) {
            console.error('Error:', error);
            showError(error.message);
        } finally {
            setLoadingState(false);
        }
    }

    function setLoadingState(isLoading) {
        summaryBtn.disabled = isLoading;
        if (isLoading) {
            btnText.style.display = 'none';
            loadingSpinner.style.display = 'inline';
        } else {
            btnText.style.display = 'inline';
            loadingSpinner.style.display = 'none';
        }
    }

    function hideAllViews() {
        initialView.style.display = 'none';
        resultView.style.display = 'none';
        errorView.style.display = 'none';
    }

    function showView(view) {
        view.style.display = 'block';
    }

    function showInitialView() {
        hideAllViews();
        showView(initialView);
    }

    function displaySummary(summary) {
        summaryResult.innerHTML = formatSummary(summary);
        hideAllViews();
        showView(resultView);
    }

    function showError(message) {
        errorMessage.textContent = message;
        hideAllViews();
        showView(errorView);
    }

    function formatSummary(summary) {
        // Split summary into sections
        const lines = summary.split('\n').filter(line => line.trim());
        let formattedHtml = '';
        let currentSection = '';
        let inList = false;

        for (let line of lines) {
            line = line.trim();
            
            if (line.includes('Ringkasan:')) {
                if (inList) {
                    formattedHtml += '</ul>';
                    inList = false;
                }
                formattedHtml += '<div class="summary-section"><h4>Ringkasan</h4>';
                currentSection = 'summary';
            } else if (line.includes('Point penting:')) {
                if (inList) {
                    formattedHtml += '</ul>';
                    inList = false;
                }
                if (currentSection) formattedHtml += '</div>';
                formattedHtml += '<div class="summary-section"><h4>Point Penting</h4><ul>';
                currentSection = 'points';
                inList = true;
            } else if (line.startsWith('- ')) {
                if (!inList) {
                    formattedHtml += '<ul>';
                    inList = true;
                }
                formattedHtml += `<li>${line.substring(2)}</li>`;
            } else if (line.length > 0) {
                if (inList) {
                    formattedHtml += '</ul>';
                    inList = false;
                }
                if (currentSection === 'summary') {
                    formattedHtml += `<p>${line}</p>`;
                } else {
                    formattedHtml += `<p>${line}</p>`;
                }
            }
        }

        if (inList) {
            formattedHtml += '</ul>';
        }
        if (currentSection) {
            formattedHtml += '</div>';
        }

        return formattedHtml || `<div class="summary-section"><p>${summary}</p></div>`;
    }

    async function copySummary() {
        try {
            const summaryText = summaryResult.innerText;
            await navigator.clipboard.writeText(summaryText);
            
            // Show feedback
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✅ Tersalin!';
            copyBtn.style.background = '#00ba7c';
            copyBtn.style.color = 'white';
            copyBtn.style.borderColor = '#00ba7c';
            
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.background = '#ffffff';
                copyBtn.style.color = '#1d9bf0';
                copyBtn.style.borderColor = '#1d9bf0';
            }, 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = summaryResult.innerText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            copyBtn.textContent = '✅ Tersalin!';
            setTimeout(() => {
                copyBtn.textContent = '📋 Salin';
            }, 2000);
        }
    }

    function openSettings() {
        chrome.runtime.openOptionsPage();
    }
});