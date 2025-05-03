// Create warning overlay
function createWarningOverlay(url) {
    const overlay = document.createElement('div');
    overlay.className = 'warning-overlay';
    overlay.id = 'phishguard-warning-overlay';

    const warningBox = document.createElement('div');
    warningBox.className = 'warning-box';
    warningBox.innerHTML = `
        <h2 style="color: var(--danger-color); margin-bottom: 1rem; font-size: 1.5rem; font-weight: 700;">⚠️ Phishing Warning</h2>
        <p style="margin-bottom: 1.5rem; color: var(--text-color);">This website (${url}) has been flagged as potentially dangerous. It may be trying to steal your personal information.</p>
        <div style="display: flex; gap: 1rem; justify-content: center;">
            <button id="phishguard-continue" class="action-button" style="background: var(--danger-color);">
                Continue Anyway
            </button>
            <button id="phishguard-back" class="action-button" style="background: var(--success-color);">
                Go Back
            </button>
        </div>
    `;

    overlay.appendChild(warningBox);
    document.body.appendChild(overlay);

    // Add event listeners
    document.getElementById('phishguard-continue').addEventListener('click', () => {
        overlay.remove();
    });

    document.getElementById('phishguard-back').addEventListener('click', () => {
        window.history.back();
        overlay.remove();
    });
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'PHISHING_WARNING') {
        createWarningOverlay(request.url);
    }
});

// Monitor links on the page
function monitorLinks() {
    document.addEventListener('mouseover', (e) => {
        if (e.target.tagName === 'A') {
            const url = e.target.href;
            if (url) {
                chrome.runtime.sendMessage({ type: 'CHECK_URL', url: url });
            }
        }
    });
}

// Start monitoring when the page loads
monitorLinks();

// List of known safe domains
const safeDomains = [
    'google.com',
    'microsoft.com',
    'github.com',
    'example.com'
];

// List of suspicious patterns
const suspiciousPatterns = [
    /[0-9]/g, // Numbers in domain
    /[-_]/g,  // Hyphens and underscores
    /login/i,  // Login-related keywords
    /secure/i, // Security-related keywords
    /verify/i  // Verification-related keywords
];

// Function to check if a domain is safe
function isDomainSafe(domain) {
    return safeDomains.includes(domain);
}

// Function to check for suspicious patterns
function hasSuspiciousPatterns(domain) {
    return suspiciousPatterns.some(pattern => pattern.test(domain));
}

// Check if URL is in blacklist
function isBlacklisted(url) {
    const domain = new URL(url).hostname;
    return new Promise((resolve) => {
        chrome.storage.sync.get(['blacklist'], (result) => {
            const blacklist = result.blacklist || [];
            resolve(blacklist.some(blacklistedDomain => 
                domain.includes(blacklistedDomain) || 
                blacklistedDomain.includes(domain)
            ));
        });
    });
}

// Sound effects
const warningSound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU');
const blockSound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU');

// Function to play sound if enabled
async function playSound(sound) {
    const result = await chrome.storage.sync.get(['soundEffects']);
    if (result.soundEffects !== false) {
        sound.currentTime = 0;
        sound.play().catch(() => {
            // Ignore errors if sound can't play
        });
    }
}

// Show blocking overlay for blacklisted domains
function showBlockingOverlay(url) {
    playSound(blockSound);
    
    const overlay = document.createElement('div');
    overlay.className = 'blocking-overlay';
    overlay.innerHTML = `
        <div class="blocking-content">
            <h2>⚠️ Access Blocked</h2>
            <p>This domain (${url}) has been blacklisted and access is restricted.</p>
            <div class="blocking-actions">
                <button id="blocking-back" class="action-button">Go Back</button>
                <button id="blocking-continue" class="action-button">Continue Anyway</button>
            </div>
        </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .blocking-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        }
        .blocking-content {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            max-width: 500px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .blocking-content h2 {
            color: #d13438;
            margin-bottom: 1rem;
        }
        .blocking-content p {
            margin-bottom: 1.5rem;
            color: #333;
        }
        .blocking-actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
        }
        .blocking-actions button {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
        }
        #blocking-back {
            background: #2d9d2d;
            color: white;
        }
        #blocking-continue {
            background: #d13438;
            color: white;
        }
    `;
    document.head.appendChild(style);

    // Add event listeners
    overlay.querySelector('#blocking-back').addEventListener('click', () => {
        window.history.back();
        overlay.remove();
    });

    overlay.querySelector('#blocking-continue').addEventListener('click', () => {
        overlay.remove();
    });

    document.body.appendChild(overlay);
}

// Main URL checking function
async function checkUrl(url) {
    const [isPhishing, isWhitelisted, isBlacklisted] = await Promise.all([
        isPhishingUrl(url),
        isWhitelistedUrl(url),
        isBlacklisted(url)
    ]);

    if (isBlacklisted) {
        showBlockingOverlay(url);
        return false;
    }

    if (isWhitelisted) {
        return true;
    }

    if (isPhishing) {
        showWarning('This website may be a phishing site. Proceed with caution.');
        return false;
    }

    return true;
}

// Function to analyze URL
async function analyzeUrl(url) {
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace('www.', '');
        
        // Check blacklist first
        const isBlacklistedDomain = await isBlacklisted(url);
        if (isBlacklistedDomain) {
            return {
                safe: false,
                reason: 'Domain is blacklisted'
            };
        }
        
        if (!urlObj.protocol.startsWith('https')) {
            return {
                safe: false,
                reason: 'Unsecure HTTP protocol'
            };
        }
        
        if (isDomainSafe(domain)) {
            return {
                safe: true,
                reason: 'Known safe domain'
            };
        }
        
        if (hasSuspiciousPatterns(domain)) {
            return {
                safe: false,
                reason: 'Suspicious domain patterns detected'
            };
        }
        
        return {
            safe: true,
            reason: 'No suspicious patterns found'
        };
    } catch (e) {
        return {
            safe: false,
            reason: 'Invalid URL format'
        };
    }
}

// Function to handle link clicks
async function handleLinkClick(event) {
    const link = event.target.closest('a');
    if (!link) return;
    
    const url = link.href;
    const analysis = await analyzeUrl(url);
    
    if (!analysis.safe) {
        event.preventDefault();
        showWarning(link, analysis.reason);
    }
}

// Function to show warning
function showWarning(link, reason) {
    playSound(warningSound);
    
    const warning = document.createElement('div');
    warning.style.cssText = `
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        background: #fff;
        padding: 10px;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        z-index: 9999;
        max-width: 250px;
        text-align: center;
        font-size: 13px;
    `;
    
    warning.innerHTML = `
        <h3 style="color: #d13438; margin: 0 0 6px 0; font-size: 14px;">⚠️ Warning</h3>
        <p style="margin: 0 0 8px 0; color: #333; line-height: 1.3;">${reason}</p>
        <div style="display: flex; gap: 6px; justify-content: center;">
            <button onclick="this.parentElement.parentElement.remove()" style="padding: 4px 8px; background: #f3f4f6; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Cancel</button>
            <button onclick="window.location.href='${link.href}'" style="padding: 4px 8px; background: #2d9d2d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Proceed</button>
        </div>
    `;
    
    document.body.appendChild(warning);
}

// Add click event listener to all links
document.addEventListener('click', handleLinkClick);

// Analyze all links on page load
document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('a');
    links.forEach(link => {
        const url = link.href;
        const analysis = analyzeUrl(url);
        
        if (!analysis.safe) {
            link.style.borderBottom = '2px solid #d13438';
            link.title = `⚠️ ${analysis.reason}`;
        }
    });
}); 