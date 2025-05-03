// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
    // Load settings
    chrome.storage.sync.get(['enabled', 'strictMode', 'linksChecked', 'threatsBlocked'], (result) => {
        document.getElementById('extension-enabled').checked = result.enabled;
        document.getElementById('strict-mode').checked = result.strictMode;
        document.getElementById('links-checked').textContent = result.linksChecked || 0;
        document.getElementById('threats-blocked').textContent = result.threatsBlocked || 0;
    });

    // Add event listeners
    document.getElementById('extension-enabled').addEventListener('change', (e) => {
        chrome.storage.sync.set({ enabled: e.target.checked });
        updateStatusIndicator(e.target.checked);
    });

    document.getElementById('strict-mode').addEventListener('change', (e) => {
        chrome.storage.sync.set({ strictMode: e.target.checked });
    });

    document.getElementById('whitelist-current').addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentUrl = new URL(tabs[0].url);
            chrome.storage.sync.get(['whitelist'], (result) => {
                const whitelist = result.whitelist || [];
                if (!whitelist.includes(currentUrl.hostname)) {
                    whitelist.push(currentUrl.hostname);
                    chrome.storage.sync.set({ whitelist });
                    showNotification('Site added to whitelist');
                }
            });
        });
    });

    document.getElementById('view-settings').addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });
});

// Update status indicator
function updateStatusIndicator(enabled) {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    
    if (enabled) {
        statusDot.style.backgroundColor = 'var(--success-color)';
        statusText.textContent = 'Active';
    } else {
        statusDot.style.backgroundColor = 'var(--danger-color)';
        statusText.textContent = 'Disabled';
    }
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: var(--primary-color);
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 14px;
        z-index: 1000;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Listen for updates from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'UPDATE_STATS') {
        document.getElementById('links-checked').textContent = request.linksChecked;
        document.getElementById('threats-blocked').textContent = request.threatsBlocked;
    }
});

// Sound effects
const sounds = {
    click: new Audio('sounds/click.mp3'),
    success: new Audio('sounds/success.mp3'),
    warning: new Audio('sounds/warning.mp3'),
    error: new Audio('sounds/error.mp3')
};

// Initialize theme
document.documentElement.setAttribute('data-theme', 
    localStorage.getItem('theme') || 'light'
);

// Theme toggle
document.getElementById('themeToggle').addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    playSound('click');
});

// Sound toggle
const soundToggle = document.getElementById('soundToggle');
const soundIndicator = document.querySelector('.sound-indicator');

soundToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
        soundIndicator.classList.add('active');
        setTimeout(() => soundIndicator.classList.remove('active'), 500);
    }
});

// Play sound with visual indicator
function playSound(type) {
    if (soundToggle.checked && sounds[type]) {
        sounds[type].play();
        soundIndicator.classList.add('active');
        setTimeout(() => soundIndicator.classList.remove('active'), 500);
    }
}

// Live counter animation
function animateCounter(element, target) {
    let current = parseInt(element.textContent);
    const increment = target > current ? 1 : -1;
    const duration = 1000; // 1 second
    const steps = 20;
    const stepDuration = duration / steps;
    const stepValue = (target - current) / steps;

    let step = 0;
    const interval = setInterval(() => {
        current += stepValue;
        element.textContent = Math.round(current);
        step++;
        
        if (step >= steps) {
            element.textContent = target;
            clearInterval(interval);
        }
    }, stepDuration);
}

// Update counters
function updateCounters(linksChecked, threatsBlocked) {
    const linksElement = document.getElementById('linksChecked');
    const threatsElement = document.getElementById('threatsBlocked');
    
    animateCounter(linksElement, linksChecked);
    animateCounter(threatsElement, threatsBlocked);
    
    if (threatsBlocked > 0) {
        playSound('warning');
    }
}

// Card hover effect
document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    });
});

// Initialize with current stats
chrome.storage.local.get(['linksChecked', 'threatsBlocked'], (result) => {
    updateCounters(
        result.linksChecked || 0,
        result.threatsBlocked || 0
    );
});

// Listen for updates
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'statsUpdate') {
        updateCounters(message.linksChecked, message.threatsBlocked);
    }
});

// Protection toggle
document.getElementById('protectionToggle').addEventListener('change', (e) => {
    chrome.runtime.sendMessage({
        type: 'toggleProtection',
        enabled: e.target.checked
    });
    playSound(e.target.checked ? 'success' : 'warning');
});

// Scan now button
document.getElementById('scan-now').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'scanNow' });
    playSound('click');
});

// View settings button
document.getElementById('view-settings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
    playSound('click');
});

// Add mouse tracking for status indicator
document.querySelector('.status-indicator').addEventListener('mousemove', (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
}); 