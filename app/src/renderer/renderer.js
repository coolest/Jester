// Store cryptos in localStorage
const STORAGE_KEY = 'cryptos';
const MAX_CRYPTOS = 10;

// Navigation
document.addEventListener('DOMContentLoaded', () => {
    // Set up navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = link.dataset.page;
            
            // Update active states
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Show correct page
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            document.getElementById(`${targetPage}-page`).classList.add('active');
        });
    });

    // Load initial data
    loadCryptos();
    updateCryptoSelectors();
});

// Load saved cryptos from localStorage
function loadCryptos() {
    const cryptos = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    renderCryptoList(cryptos);
}

// Save crypto to localStorage
function saveCrypto(crypto) {
    const cryptos = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    if (cryptos.length >= MAX_CRYPTOS) {
        alert(`Maximum limit of ${MAX_CRYPTOS} cryptos reached. Please delete some entries.`);
        return false;
    }
    
    const newCrypto = {
        id: Date.now().toString(),
        ...crypto
    };
    
    cryptos.push(newCrypto);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cryptos));
    
    // Update UI
    renderCryptoList(cryptos);
    updateCryptoSelectors();
    
    // Navigate to dashboard
    const dashboardLink = document.querySelector('[data-page="dashboard"]');
    dashboardLink.click();
    
    // Load dashboard data for the new crypto
    document.getElementById('dashboardCryptoSelect').value = newCrypto.id;
    loadDashboardData(newCrypto);
    
    return true;
}

// Delete crypto from localStorage
function deleteCrypto(id) {
    const cryptos = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const updatedCryptos = cryptos.filter(crypto => crypto.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCryptos));
    renderCryptoList(updatedCryptos);
    updateCryptoSelectors();
}

// Render the list of cryptos
function renderCryptoList(cryptos) {
    const cryptoEntriesDiv = document.getElementById('cryptoEntries');
    document.getElementById('cryptoCount').textContent = cryptos.length;
    
    cryptoEntriesDiv.innerHTML = '';
    cryptos.forEach(crypto => {
        const cryptoElement = document.createElement('div');
        cryptoElement.className = 'crypto-entry';
        cryptoElement.innerHTML = `
        <h3><i class="fas fa-coins"></i> ${crypto.name}</h3>
        <p><i class="fab fa-reddit"></i> <strong>Subreddit:</strong> r/${crypto.subreddit}</p>
        <p><i class="fab fa-twitter"></i> <strong>Twitter Hashtag:</strong> ${crypto.twitterHashtag}</p>
        <p><i class="fab fa-youtube"></i> <strong>YouTube Query:</strong> ${crypto.youtubeQuery}</p>
        <button class="btn-delete" onclick="deleteCrypto('${crypto.id}')">
            <i class="fas fa-trash"></i> Delete
        </button>
    `;
    cryptoEntriesDiv.appendChild(cryptoElement);
});
}

// Update crypto selectors in dashboard and compare pages
function updateCryptoSelectors() {
const cryptos = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
const dashboardSelect = document.getElementById('dashboardCryptoSelect');
const crypto1Select = document.getElementById('crypto1');
const crypto2Select = document.getElementById('crypto2');

// Create options HTML
const options = cryptos.map(crypto => 
    `<option value="${crypto.id}">${crypto.name}</option>`
).join('');

// Update all selectors
[dashboardSelect, crypto1Select, crypto2Select].forEach(select => {
    const currentValue = select.value;
    select.innerHTML = '<option value="">Select Crypto</option>' + options;
    if (currentValue && cryptos.some(c => c.id === currentValue)) {
        select.value = currentValue;
    }
});
}

// Load dashboard data for selected crypto
function loadDashboardData(crypto) {
// Reddit content
document.getElementById('redditContent').innerHTML = `
    <div class="dashboard-data">
        <h4>Latest from r/${crypto.subreddit}</h4>
        <div class="data-placeholder">
            <p><i class="fas fa-spinner fa-spin"></i> Loading Reddit data...</p>
            <p>Monitoring subreddit: r/${crypto.subreddit}</p>
        </div>
    </div>
`;

// Twitter content
document.getElementById('twitterContent').innerHTML = `
    <div class="dashboard-data">
        <h4>Recent Twitter Activity</h4>
        <div class="data-placeholder">
            <p><i class="fas fa-spinner fa-spin"></i> Loading Twitter data...</p>
            <p>Tracking hashtag: ${crypto.twitterHashtag}</p>
        </div>
    </div>
`;

// YouTube content
document.getElementById('youtubeContent').innerHTML = `
    <div class="dashboard-data">
        <h4>YouTube Coverage</h4>
        <div class="data-placeholder">
            <p><i class="fas fa-spinner fa-spin"></i> Loading YouTube data...</p>
            <p>Searching for: ${crypto.youtubeQuery}</p>
        </div>
    </div>
`;

// Here you would typically make API calls to fetch real data
// For now, we'll simulate loading with timeouts
setTimeout(() => {
    document.getElementById('redditContent').innerHTML = `
        <div class="dashboard-data">
            <h4>Latest from r/${crypto.subreddit}</h4>
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-value">1.2k</span>
                    <span class="stat-label">Active Users</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">156</span>
                    <span class="stat-label">New Posts Today</span>
                </div>
            </div>
        </div>
    `;
}, 1500);

setTimeout(() => {
    document.getElementById('twitterContent').innerHTML = `
        <div class="dashboard-data">
            <h4>Recent Twitter Activity</h4>
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-value">2.3k</span>
                    <span class="stat-label">Mentions Today</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">+15%</span>
                    <span class="stat-label">Engagement Rate</span>
                </div>
            </div>
        </div>
    `;
}, 2000);

setTimeout(() => {
    document.getElementById('youtubeContent').innerHTML = `
        <div class="dashboard-data">
            <h4>YouTube Coverage</h4>
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-value">45</span>
                    <span class="stat-label">New Videos</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">125k</span>
                    <span class="stat-label">Total Views</span>
                </div>
            </div>
        </div>
    `;
}, 2500);
}

// Compare two cryptos
function compareCryptos(crypto1, crypto2) {
const comparisonData = {
    reddit: {
        crypto1: { posts: 156, users: 1200 },
        crypto2: { posts: 89, users: 800 }
    },
    twitter: {
        crypto1: { mentions: 2300, engagement: 15 },
        crypto2: { mentions: 1800, engagement: 12 }
    },
    youtube: {
        crypto1: { videos: 45, views: 125000 },
        crypto2: { videos: 38, views: 98000 }
    }
};

// Reddit comparison
document.getElementById('redditComparison').innerHTML = `
    <div class="comparison-data">
        <div class="comparison-row">
            <div class="crypto-column">
                <h4>${crypto1.name}</h4>
                <p>${comparisonData.reddit.crypto1.posts} Posts</p>
                <p>${comparisonData.reddit.crypto1.users} Users</p>
            </div>
            <div class="crypto-column">
                <h4>${crypto2.name}</h4>
                <p>${comparisonData.reddit.crypto2.posts} Posts</p>
                <p>${comparisonData.reddit.crypto2.users} Users</p>
            </div>
        </div>
    </div>
`;

// Twitter comparison
document.getElementById('twitterComparison').innerHTML = `
    <div class="comparison-data">
        <div class="comparison-row">
            <div class="crypto-column">
                <h4>${crypto1.name}</h4>
                <p>${comparisonData.twitter.crypto1.mentions} Mentions</p>
                <p>${comparisonData.twitter.crypto1.engagement}% Engagement</p>
            </div>
            <div class="crypto-column">
                <h4>${crypto2.name}</h4>
                <p>${comparisonData.twitter.crypto2.mentions} Mentions</p>
                <p>${comparisonData.twitter.crypto2.engagement}% Engagement</p>
            </div>
        </div>
    </div>
`;

// YouTube comparison
document.getElementById('youtubeComparison').innerHTML = `
    <div class="comparison-data">
        <div class="comparison-row">
            <div class="crypto-column">
                <h4>${crypto1.name}</h4>
                <p>${comparisonData.youtube.crypto1.videos} Videos</p>
                <p>${comparisonData.youtube.crypto1.views} Views</p>
            </div>
            <div class="crypto-column">
                <h4>${crypto2.name}</h4>
                <p>${comparisonData.youtube.crypto2.videos} Videos</p>
                <p>${comparisonData.youtube.crypto2.views} Views</p>
            </div>
        </div>
    </div>
`;
}

// Event Listeners
document.getElementById('addCryptoForm').addEventListener('submit', (e) => {
e.preventDefault();

const crypto = {
    name: document.getElementById('cryptoName').value,
    subreddit: document.getElementById('subreddit').value,
    twitterHashtag: document.getElementById('twitterHashtag').value,
    youtubeQuery: document.getElementById('youtubeQuery').value
};

if (saveCrypto(crypto)) {
    e.target.reset();
}
});

// Dashboard crypto selector
document.getElementById('dashboardCryptoSelect').addEventListener('change', (e) => {
const cryptoId = e.target.value;
if (cryptoId) {
    const cryptos = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const selectedCrypto = cryptos.find(c => c.id === cryptoId);
    if (selectedCrypto) {
        loadDashboardData(selectedCrypto);
    }
}
});

// Compare button
document.getElementById('compareButton').addEventListener('click', () => {
const crypto1Id = document.getElementById('crypto1').value;
const crypto2Id = document.getElementById('crypto2').value;

if (!crypto1Id || !crypto2Id) {
    alert('Please select two cryptos to compare');
    return;
}

if (crypto1Id === crypto2Id) {
    alert('Please select different cryptos to compare');
    return;
}

const cryptos = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
const crypto1 = cryptos.find(c => c.id === crypto1Id);
const crypto2 = cryptos.find(c => c.id === crypto2Id);

compareCryptos(crypto1, crypto2);
});

// Storage verification
function verifyStorage() {
const storageInfo = document.getElementById('storageInfo');
const cryptos = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

storageInfo.innerHTML = `
    <h3>Storage Status:</h3>
    <p>Number of stored cryptos: ${cryptos.length}</p>
    <p>Storage data:</p>
    <pre>${JSON.stringify(cryptos, null, 2)}</pre>
`;

storageInfo.classList.add('visible');
}