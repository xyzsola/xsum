// Background script for ETM: Explain To Me extension
// Handles AI API calls and message passing

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'summarize') {
        handleSummarizeRequest(request, sendResponse);
        return true; // Keep message channel open for async response
    }
});

async function handleSummarizeRequest(request, sendResponse) {
    try {
        const { content, url } = request;
        
        if (!content || content.trim() === '') {
            throw new Error('Tidak ada konten untuk diringkas');
        }
        
        // Get user settings
        const settings = await getSettings();
        
        if (!settings.apiKey) {
            throw new Error('API key belum dikonfigurasi. Silakan buka pengaturan untuk mengatur API key.');
        }
        
        let summary;
        if (settings.aiModel === 'gemini') {
            summary = await summarizeWithGemini(content, settings.apiKey);
        } else {
            summary = await summarizeWithOpenAI(content, settings.apiKey);
        }
        
        sendResponse({ success: true, summary: summary });
        
    } catch (error) {
        console.error('Error in background script:', error);
        sendResponse({ success: false, error: error.message });
    }
}

async function summarizeWithOpenAI(content, apiKey) {
    const prompt = createSummaryPrompt(content);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'Anda adalah asisten AI yang membantu meringkas konten dari X/Twitter dalam bahasa Indonesia. Berikan ringkasan yang jelas dan terstruktur.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 500,
            temperature: 0.7
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API Error: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content.trim();
}

async function summarizeWithGemini(content, apiKey) {
    const prompt = createSummaryPrompt(content);
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: `Anda adalah asisten AI yang membantu meringkas konten dari X/Twitter dalam bahasa Indonesia. Berikan ringkasan yang jelas dan terstruktur.\n\n${prompt}`
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 500
            }
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API Error: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
        throw new Error('Tidak ada respons dari Gemini API');
    }
    
    return data.candidates[0].content.parts[0].text.trim();
}

function createSummaryPrompt(content) {
    return `Silakan ringkas konten X/Twitter berikut ini dalam format yang telah ditentukan:

Konten:
${content}

Format ringkasan yang diinginkan:
Ringkasan:
[Isi ringkasan informasi dari konten di X/Twitter]

Point penting:
- [Point penting 1]
- [Point penting 2]
- [Point penting 3]

Instruksi:
1. Buat ringkasan yang jelas dan mudah dipahami dalam bahasa Indonesia
2. Identifikasi 3-5 point penting dari konten tersebut
3. Fokus pada informasi yang paling relevan dan menarik
4. Jika konten berupa thread atau multiple tweets, rangkum keseluruhan konteks
5. Jika konten berupa profil, ringkas informasi tentang user dan aktivitas mereka
6. Batasi ringkasan tidak lebih dari 500 huruf`;
}

async function getSettings() {
    const defaultSettings = {
        aiModel: 'openai', // 'openai' or 'gemini'
        apiKey: '',
        theme: 'light' // 'light' or 'dark'
    };
    
    try {
        const result = await chrome.storage.sync.get(['aiModel', 'apiKey', 'theme']);
        return { ...defaultSettings, ...result };
    } catch (error) {
        console.error('Error getting settings:', error);
        return defaultSettings;
    }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // Set default settings on first install
        chrome.storage.sync.set({
            aiModel: 'openai',
            theme: 'light'
        });
        
        // Open options page on first install
        chrome.runtime.openOptionsPage();
    }
});

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
    // Open side panel when extension icon is clicked
    try {
        await chrome.sidePanel.open({ tabId: tab.id });
        console.log('Side panel opened for tab:', tab.url);
    } catch (error) {
        console.error('Failed to open side panel:', error);
        // Fallback to popup if side panel fails
        console.log('Extension icon clicked on tab:', tab.url);
    }
});

// Utility function to validate API keys
async function validateApiKey(apiKey, model) {
    try {
        if (model === 'openai') {
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });
            return response.ok;
        } else if (model === 'gemini') {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            return response.ok;
        }
        return false;
    } catch (error) {
        console.error('API key validation error:', error);
        return false;
    }
}

// Export validation function for use in options page
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { validateApiKey };
}