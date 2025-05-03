// Phishing detection patterns and rules
const phishingPatterns = {
    // Common phishing indicators
    suspiciousKeywords: [
        'login',
        'password',
        'account',
        'verify',
        'secure',
        'bank',
        'paypal',
        'amazon',
        'ebay',
        'apple',
        'microsoft'
    ],
    // Common phishing TLDs
    suspiciousTLDs: [
        '.tk',
        '.ml',
        '.ga',
        '.cf',
        '.gq',
        '.xyz',
        '.top',
        '.club',
        '.online'
    ]
};

// Initialize storage with default settings
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({
        enabled: true,
        strictMode: false,
        whitelist: [],
        blacklist: []
    });
});

// Listen for web requests
chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        return checkUrl(details.url);
    },
    { urls: ["<all_urls>"] },
    ["blocking"]
);

// URL checking function
function checkUrl(url) {
    const urlObj = new URL(url);
    
    // Check against whitelist
    chrome.storage.sync.get(['whitelist'], (result) => {
        if (result.whitelist.includes(urlObj.hostname)) {
            return { cancel: false };
        }
    });

    // Check against blacklist
    chrome.storage.sync.get(['blacklist'], (result) => {
        if (result.blacklist.includes(urlObj.hostname)) {
            return { cancel: true };
        }
    });

    // Check for suspicious patterns
    const isSuspicious = checkSuspiciousPatterns(url);
    
    if (isSuspicious) {
        // Notify the user
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {
                type: 'PHISHING_WARNING',
                url: url
            });
        });
        
        // Block the request if in strict mode
        chrome.storage.sync.get(['strictMode'], (result) => {
            if (result.strictMode) {
                return { cancel: true };
            }
        });
    }

    return { cancel: false };
}

// Check for suspicious patterns in URL
function checkSuspiciousPatterns(url) {
    const urlObj = new URL(url);
    
    // Check for suspicious TLDs
    if (phishingPatterns.suspiciousTLDs.some(tld => urlObj.hostname.endsWith(tld))) {
        return true;
    }

    // Check for suspicious keywords in URL
    if (phishingPatterns.suspiciousKeywords.some(keyword => 
        urlObj.hostname.includes(keyword) || urlObj.pathname.includes(keyword))) {
        return true;
    }

    // Check for IP address in URL
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(urlObj.hostname)) {
        return true;
    }

    return false;
}

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'CHECK_URL') {
        const result = checkUrl(request.url);
        sendResponse(result);
    }
}); 