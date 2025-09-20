// Content script for xsum extension
// This script runs on X/Twitter pages to extract content

(function() {
    'use strict';
    
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'extractContent') {
            try {
                const content = extractTwitterContent();
                sendResponse({ success: true, content: content });
            } catch (error) {
                sendResponse({ success: false, error: error.message });
            }
        }
        return true; // Keep message channel open for async response
    });
    
    function extractTwitterContent() {
        let extractedContent = {
            userInfo: '',
            tweets: [],
            profileInfo: '',
            url: window.location.href
        };
        
        // Extract user information
        extractedContent.userInfo = extractUserInfo();
        
        // Extract tweets/posts
        extractedContent.tweets = extractTweets();
        
        // Extract profile information if on profile page
        if (window.location.pathname.includes('/') && !window.location.pathname.includes('/status/')) {
            extractedContent.profileInfo = extractProfileInfo();
        }
        
        return extractedContent;
    }
    
    function extractUserInfo() {
        const userSelectors = [
            '[data-testid="UserName"]',
            '[data-testid="UserScreenName"]',
            '.css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-qvutc0',
            'h2[role="heading"] span',
            '.username',
            '.screen-name'
        ];
        
        let userInfo = '';
        
        for (const selector of userSelectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                const texts = Array.from(elements)
                    .map(el => el.textContent.trim())
                    .filter(text => text && text !== '@' && !text.includes('·'));
                
                if (texts.length > 0) {
                    userInfo = texts.slice(0, 2).join(' ');
                    break;
                }
            }
        }
        
        return userInfo;
    }
    
    function extractTweets() {
        const tweetSelectors = [
            '[data-testid="tweetText"]',
            '[data-testid="tweet"] [lang]',
            'article[data-testid="tweet"] [lang]',
            '.tweet-text',
            '.js-tweet-text',
            '[data-testid="cellInnerDiv"] [lang]'
        ];
        
        let tweets = [];
        
        for (const selector of tweetSelectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                tweets = Array.from(elements)
                    .map(el => el.textContent.trim())
                    .filter(text => text.length > 10) // Filter out very short texts
                    .slice(0, 20); // Limit to 20 tweets
                
                if (tweets.length > 0) break;
            }
        }
        
        // If no tweets found with specific selectors, try broader approach
        if (tweets.length === 0) {
            const articles = document.querySelectorAll('article[data-testid="tweet"]');
            tweets = Array.from(articles)
                .map(article => {
                    const textElements = article.querySelectorAll('[lang], [data-testid="tweetText"]');
                    return Array.from(textElements)
                        .map(el => el.textContent.trim())
                        .filter(text => text.length > 10)
                        .join(' ');
                })
                .filter(text => text.length > 0)
                .slice(0, 15);
        }
        
        return tweets;
    }
    
    function extractProfileInfo() {
        const profileSelectors = {
            bio: [
                '[data-testid="UserDescription"]',
                '.profile-description',
                '.bio'
            ],
            stats: [
                '[data-testid="UserFollowingCount"]',
                '[data-testid="UserFollowersCount"]',
                '.profile-stats'
            ],
            location: [
                '[data-testid="UserLocation"]',
                '.profile-location'
            ],
            website: [
                '[data-testid="UserUrl"]',
                '.profile-website'
            ]
        };
        
        let profileInfo = {};
        
        for (const [key, selectors] of Object.entries(profileSelectors)) {
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    profileInfo[key] = element.textContent.trim();
                    break;
                }
            }
        }
        
        return profileInfo;
    }
    
    // Helper function to clean and format extracted text
    function cleanText(text) {
        return text
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
            .trim();
    }
    
    // Function to check if we're on a valid X/Twitter page
    function isValidTwitterPage() {
        const hostname = window.location.hostname;
        return hostname === 'twitter.com' || hostname === 'x.com' || hostname.endsWith('.twitter.com') || hostname.endsWith('.x.com');
    }
    
    // Initialize content script
    if (isValidTwitterPage()) {
        console.log('xsum content script loaded');
        
        // Add a small indicator that the extension is active (optional)
        const indicator = document.createElement('div');
        indicator.id = 'x-summary-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 8px;
            height: 8px;
            background: #1DA1F2;
            border-radius: 50%;
            z-index: 10000;
            opacity: 0.7;
            pointer-events: none;
        `;
        document.body.appendChild(indicator);
        
        // Remove indicator after 3 seconds
        setTimeout(() => {
            const elem = document.getElementById('x-summary-indicator');
            if (elem) elem.remove();
        }, 3000);
    }
})();