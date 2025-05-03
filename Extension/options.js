// Initialize options page
document.addEventListener('DOMContentLoaded', () => {
    // Load settings
    loadSettings();

    // Add event listeners for toggles
    document.querySelectorAll('.switch input').forEach(toggle => {
        toggle.addEventListener('change', (e) => {
            const settingId = e.target.id;
            const value = e.target.checked;
            chrome.storage.sync.set({ [settingId]: value });
        });
    });

    // Add event listeners for whitelist
    const whitelistInput = document.getElementById('whitelistInput');
    const addWhitelistBtn = document.getElementById('addWhitelist');
    const whitelistList = document.getElementById('whitelistList');

    addWhitelistBtn.addEventListener('click', () => addToList('whitelist'));
    whitelistInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addToList('whitelist');
    });

    // Add event listeners for blacklist
    const blacklistInput = document.getElementById('blacklistInput');
    const addBlacklistBtn = document.getElementById('addBlacklist');
    const blacklistList = document.getElementById('blacklistList');

    addBlacklistBtn.addEventListener('click', () => addToList('blacklist'));
    blacklistInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addToList('blacklist');
    });

    // Save settings button
    document.getElementById('saveSettings').addEventListener('click', saveSettings);

    // Reset settings button
    document.getElementById('resetSettings').addEventListener('click', resetSettings);
});

// Load settings from storage
function loadSettings() {
    chrome.storage.sync.get(null, (result) => {
        // Load toggle states
        document.querySelectorAll('.switch input').forEach(toggle => {
            const settingId = toggle.id;
            toggle.checked = result[settingId] !== false;
        });

        // Load whitelist
        if (result.whitelist) {
            const whitelistList = document.getElementById('whitelistList');
            whitelistList.innerHTML = '';
            result.whitelist.forEach(domain => {
                addListItem(whitelistList, domain, 'whitelist');
            });
        }

        // Load blacklist
        if (result.blacklist) {
            const blacklistList = document.getElementById('blacklistList');
            blacklistList.innerHTML = '';
            result.blacklist.forEach(domain => {
                addListItem(blacklistList, domain, 'blacklist');
            });
        }
    });
}

// Add domain to list
function addToList(listType) {
    const input = document.getElementById(`${listType}Input`);
    const list = document.getElementById(`${listType}List`);
    const domain = input.value.trim();

    if (domain) {
        chrome.storage.sync.get([listType], (result) => {
            const listArray = result[listType] || [];
            if (!listArray.includes(domain)) {
                listArray.push(domain);
                chrome.storage.sync.set({ [listType]: listArray }, () => {
                    addListItem(list, domain, listType);
                    input.value = '';
                });
            }
        });
    }
}

// Add item to list UI
function addListItem(list, domain, listType) {
    const item = document.createElement('div');
    item.className = `${listType}-item`;
    item.innerHTML = `
        <span>${domain}</span>
        <button class="remove-btn" data-domain="${domain}">×</button>
    `;
    list.appendChild(item);

    // Add remove event listener
    const removeBtn = item.querySelector('.remove-btn');
    removeBtn.addEventListener('click', () => {
        chrome.storage.sync.get([listType], (result) => {
            const listArray = result[listType] || [];
            const index = listArray.indexOf(domain);
            if (index > -1) {
                listArray.splice(index, 1);
                chrome.storage.sync.set({ [listType]: listArray }, () => {
                    item.remove();
                });
            }
        });
    });
}

// Save all settings
function saveSettings() {
    const settings = {};
    
    // Get all toggle states
    document.querySelectorAll('.switch input').forEach(toggle => {
        settings[toggle.id] = toggle.checked;
    });

    // Save to storage
    chrome.storage.sync.set(settings, () => {
        // Show success message
        const saveBtn = document.getElementById('saveSettings');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Saved!';
        setTimeout(() => {
            saveBtn.textContent = originalText;
        }, 2000);
    });
}

// Reset settings to default
function resetSettings() {
    const defaultSettings = {
        realTimeProtection: true,
        strictMode: false,
        soundEffects: true,
        showNotifications: true,
        notificationSound: true,
        autoScanDownloads: true,
        deepUrlAnalysis: false,
        whitelist: [],
        blacklist: []
    };

    chrome.storage.sync.set(defaultSettings, () => {
        loadSettings();
        // Show success message
        const resetBtn = document.getElementById('resetSettings');
        const originalText = resetBtn.textContent;
        resetBtn.textContent = 'Reset!';
        setTimeout(() => {
            resetBtn.textContent = originalText;
        }, 2000);
    });
}