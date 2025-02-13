const { ipcRenderer } = require('electron');
const CryptoStorage = require('../../utils/storage');

// Navigation function
function navigate(page) {
    ipcRenderer.send('navigate', page);
}

// Update crypto selector
function updateCryptoSelector() {
    const cryptos = CryptoStorage.getAllCryptos();
    const select = document.getElementById('dashboardCryptoSelect');
    
    select.innerHTML = '<option value="">Select a Crypto</option>' + 
        cryptos.map(crypto => 
            `<option value="${crypto.id}">${crypto.name}</option>`
        ).join('');
}

// Load dashboard data
function loadDashboardData(crypto) {
    // Update overview stats
    updateOverviewStats(crypto);

    // Show loading state
    ['redditContent', 'twitterContent', 'youtubeContent'].forEach(id => {
        document.getElementById(id).innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading data...</p>
            </div>
        `;
    });

    // Load Reddit data
    setTimeout(() => {
        document.getElementById('redditContent').innerHTML = `
            <div class="data-item">
                <div class="title">Active Users</div>
                <div class="details">1,234 users currently active in r/${crypto.subreddit}</div>
            </div>
            <div class="data-item">
                <div class="title">Recent Posts</div>
                <div class="details">156 new posts in the last 24 hours</div>
            </div>
            <div class="data-item">
                <div class="title">Top Post</div>
                <div class="details">"${crypto.name} breaks new record!" - 3.2k upvotes</div>
            </div>
        `;
    }, 1000);

    // Load Twitter data
    setTimeout(() => {
        document.getElementById('twitterContent').innerHTML = `
            <div class="data-item">
                <div class="title">Trending Status</div>
                <div class="details">${crypto.twitterHashtag} mentioned 2.3k times today</div>
            </div>
            <div class="data-item">
                <div class="title">Engagement</div>
                <div class="details">15% increase in engagement rate</div>
            </div>
            <div class="data-item">
                <div class="title">Influential Mentions</div>
                <div class="details">5 verified accounts discussed ${crypto.name}</div>
            </div>
        `;
    }, 1500);

    // Load YouTube data
    setTimeout(() => {
        document.getElementById('youtubeContent').innerHTML = `
            <div class="data-item">
                <div class="title">Recent Videos</div>
                <div class="details">45 new videos about ${crypto.name}</div>
            </div>
            <div class="data-item">
                <div class="title">Total Views</div>
                <div class="details">125k views across all new videos</div>
            </div>
            <div class="data-item">
                <div class="title">Top Video</div>
                <div class="details">"${crypto.name} Analysis" - 25k views</div>
            </div>
        `;
    }, 2000);
}

// Update overview stats
function updateOverviewStats(crypto) {
    // Simulate some calculations
    const totalMentions = Math.floor(Math.random() * 5000) + 1000;
    const engagementRate = (Math.random() * 20 + 5).toFixed(1);
    const sentimentScore = (Math.random() * 5).toFixed(1);

    document.getElementById('totalMentions').textContent = totalMentions.toLocaleString();
    document.getElementById('engagementRate').textContent = `${engagementRate}%`;
    document.getElementById('sentimentScore').textContent = sentimentScore;
}

// Event Listeners
document.getElementById('dashboardCryptoSelect').addEventListener('change', (e) => {
    const cryptoId = e.target.value;
    if (cryptoId) {
        const selectedCrypto = CryptoStorage.getCryptoById(cryptoId);
        if (selectedCrypto) {
            loadDashboardData(selectedCrypto);
        }
    }
});

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    updateCryptoSelector();
});