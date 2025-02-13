const { ipcRenderer } = require('electron');
const CryptoStorage = require('../../utils/storage');

// Navigation function
function navigate(page) {
    ipcRenderer.send('navigate', page);
}

// Update crypto selectors
function updateCryptoSelectors() {
    const cryptos = CryptoStorage.getAllCryptos();
    const selectors = ['crypto1', 'crypto2'];
    
    const options = '<option value="">Select a Crypto</option>' + 
        cryptos.map(crypto => 
            `<option value="${crypto.id}">${crypto.name}</option>`
        ).join('');
    
    selectors.forEach(selectorId => {
        document.getElementById(selectorId).innerHTML = options;
    });
}

// Generate comparison data (simulated)
function generateComparisonData(crypto1, crypto2) {
    const data = {
        reddit: {
            crypto1: {
                users: Math.floor(Math.random() * 5000) + 1000,
                posts: Math.floor(Math.random() * 200) + 50
            },
            crypto2: {
                users: Math.floor(Math.random() * 5000) + 1000,
                posts: Math.floor(Math.random() * 200) + 50
            }
        },
        twitter: {
            crypto1: {
                mentions: Math.floor(Math.random() * 3000) + 500,
                engagement: (Math.random() * 15 + 5).toFixed(1)
            },
            crypto2: {
                mentions: Math.floor(Math.random() * 3000) + 500,
                engagement: (Math.random() * 15 + 5).toFixed(1)
            }
        },
        youtube: {
            crypto1: {
                videos: Math.floor(Math.random() * 50) + 10,
                views: Math.floor(Math.random() * 100000) + 10000
            },
            crypto2: {
                videos: Math.floor(Math.random() * 50) + 10,
                views: Math.floor(Math.random() * 100000) + 10000
            }
        }
    };

    // Determine winners for each category
    data.reddit.winner = data.reddit.crypto1.users + data.reddit.crypto1.posts > 
                        data.reddit.crypto2.users + data.reddit.crypto2.posts ? 
                        crypto1.name : crypto2.name;

    data.twitter.winner = data.twitter.crypto1.mentions * parseFloat(data.twitter.crypto1.engagement) >
                         data.twitter.crypto2.mentions * parseFloat(data.twitter.crypto2.engagement) ?
                         crypto1.name : crypto2.name;

    data.youtube.winner = data.youtube.crypto1.videos * data.youtube.crypto1.views >
                         data.youtube.crypto2.videos * data.youtube.crypto2.views ?
                         crypto1.name : crypto2.name;

    // Calculate overall scores
    const score1 = calculateOverallScore(data, 'crypto1');
    const score2 = calculateOverallScore(data, 'crypto2');

    data.overall = {
        crypto1: {
            score: score1,
            trend: score1 > 7 ? 'Rising 📈' : score1 > 4 ? 'Stable ⟷' : 'Declining 📉'
        },
        crypto2: {
            score: score2,
            trend: score2 > 7 ? 'Rising 📈' : score2 > 4 ? 'Stable ⟷' : 'Declining 📉'
        },
        winner: score1 > score2 ? crypto1.name : crypto2.name
    };

    return data;
}

// Calculate overall score
function calculateOverallScore(data, cryptoKey) {
    let score = 0;
    
    // Reddit score (max 3 points)
    const redditTotal = data.reddit[cryptoKey].users + data.reddit[cryptoKey].posts;
    score += (redditTotal / 6000) * 3;

    // Twitter score (max 4 points)
    const twitterScore = (data.twitter[cryptoKey].mentions / 3500) * 2 +
                        (parseFloat(data.twitter[cryptoKey].engagement) / 20) * 2;
    score += twitterScore;

    // YouTube score (max 3 points)
    const youtubeScore = (data.youtube[cryptoKey].videos / 60) * 1.5 +
                        (data.youtube[cryptoKey].views / 110000) * 1.5;
    score += youtubeScore;

    return Math.min(10, Math.max(0, score)).toFixed(1);
}

// Compare cryptos
function compareCryptos(crypto1, crypto2) {
    // Show loading state
    ['redditComparison', 'twitterComparison', 'youtubeComparison', 'overallComparison'].forEach(id => {
        document.getElementById(id).innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Analyzing data...</p>
            </div>
        `;
    });

    // Generate comparison data
    const data = generateComparisonData(crypto1, crypto2);

    // Update Reddit comparison
    document.getElementById('redditComparison').innerHTML = `
        <div class="comparison-row">
            <div class="crypto-column ${data.reddit.winner === crypto1.name ? 'winner' : ''}">
                <h4>${crypto1.name}</h4>
                <div class="metric-label">Active Users</div>
                <div class="metric-value">${data.reddit.crypto1.users.toLocaleString()}</div>
                <div class="metric-label">Posts Today</div>
                <div class="metric-value">${data.reddit.crypto1.posts}</div>
            </div>
            <div class="crypto-column ${data.reddit.winner === crypto2.name ? 'winner' : ''}">
                <h4>${crypto2.name}</h4>
                <div class="metric-label">Active Users</div>
                <div class="metric-value">${data.reddit.crypto2.users.toLocaleString()}</div>
                <div class="metric-label">Posts Today</div>
                <div class="metric-value">${data.reddit.crypto2.posts}</div>
            </div>
        </div>
    `;

    // Update Twitter comparison
    document.getElementById('twitterComparison').innerHTML = `
        <div class="comparison-row">
            <div class="crypto-column ${data.twitter.winner === crypto1.name ? 'winner' : ''}">
                <h4>${crypto1.name}</h4>
                <div class="metric-label">Mentions</div>
                <div class="metric-value">${data.twitter.crypto1.mentions.toLocaleString()}</div>
                <div class="metric-label">Engagement</div>
                <div class="metric-value">${data.twitter.crypto1.engagement}%</div>
            </div>
            <div class="crypto-column ${data.twitter.winner === crypto2.name ? 'winner' : ''}">
                <h4>${crypto2.name}</h4>
                <div class="metric-label">Mentions</div>
                <div class="metric-value">${data.twitter.crypto2.mentions.toLocaleString()}</div>
                <div class="metric-label">Engagement</div>
                <div class="metric-value">${data.twitter.crypto2.engagement}%</div>
            </div>
        </div>
    `;

    // Update YouTube comparison
    document.getElementById('youtubeComparison').innerHTML = `
        <div class="comparison-row">
            <div class="crypto-column ${data.youtube.winner === crypto1.name ? 'winner' : ''}">
                <h4>${crypto1.name}</h4>
                <div class="metric-label">New Videos</div>
                <div class="metric-value">${data.youtube.crypto1.videos}</div>
                <div class="metric-label">Total Views</div>
                <div class="metric-value">${data.youtube.crypto1.views.toLocaleString()}</div>
            </div>
            <div class="crypto-column ${data.youtube.winner === crypto2.name ? 'winner' : ''}">
                <h4>${crypto2.name}</h4>
                <div class="metric-label">New Videos</div>
                <div class="metric-value">${data.youtube.crypto2.videos}</div>
                <div class="metric-label">Total Views</div>
                <div class="metric-value">${data.youtube.crypto2.views.toLocaleString()}</div>
            </div>
        </div>
    `;

    // Update overall comparison
    document.getElementById('overallComparison').innerHTML = `
        <div class="comparison-row">
            <div class="crypto-column ${data.overall.winner === crypto1.name ? 'winner' : ''}">
                <h4>${crypto1.name}</h4>
                <div class="metric-label">Overall Score</div>
                <div class="metric-value">${data.overall.crypto1.score}/10</div>
                <div class="metric-label">Trend</div>
                <div class="metric-value">${data.overall.crypto1.trend}</div>
            </div>
            <div class="crypto-column ${data.overall.winner === crypto2.name ? 'winner' : ''}">
                <h4>${crypto2.name}</h4>
                <div class="metric-label">Overall Score</div>
                <div class="metric-value">${data.overall.crypto2.score}/10</div>
                <div class="metric-label">Trend</div>
                <div class="metric-value">${data.overall.crypto2.trend}</div>
            </div>
        </div>
    `;
}

// Event Listeners
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
    
    const crypto1 = CryptoStorage.getCryptoById(crypto1Id);
    const crypto2 = CryptoStorage.getCryptoById(crypto2Id);
    
    compareCryptos(crypto1, crypto2);
});

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    updateCryptoSelectors();
});