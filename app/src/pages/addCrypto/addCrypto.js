document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    const form = document.getElementById('addCryptoForm');
    const cryptoList = document.getElementById('cryptoEntries');
    const cryptoCount = document.getElementById('cryptoCount');

    // Load initial cryptos
    loadCryptos();

    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        console.log('Form submitted');

        const crypto = {
            name: document.getElementById('cryptoName').value,
            subreddit: document.getElementById('subreddit').value,
            twitterHashtag: document.getElementById('twitterHashtag').value,
            youtubeQuery: document.getElementById('youtubeQuery').value,
            id: Date.now().toString()
        };

        console.log('New crypto:', crypto);

        // Get existing cryptos
        let cryptos = JSON.parse(localStorage.getItem('cryptos') || '[]');
        
        // Add new crypto
        cryptos.push(crypto);
        
        // Save to localStorage
        localStorage.setItem('cryptos', JSON.stringify(cryptos));
        
        // Reset form
        form.reset();
        
        // Reload crypto list
        loadCryptos();
    });
});

function loadCryptos() {
    console.log('Loading cryptos');
    const cryptoList = document.getElementById('cryptoEntries');
    const cryptoCount = document.getElementById('cryptoCount');
    const cryptos = JSON.parse(localStorage.getItem('cryptos') || '[]');
    
    // Update count
    cryptoCount.textContent = cryptos.length;
    
    // Clear existing list
    cryptoList.innerHTML = '';
    
    // Add each crypto to the list
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
        cryptoList.appendChild(cryptoElement);
    });
}

function deleteCrypto(id) {
    console.log('Deleting crypto:', id);
    let cryptos = JSON.parse(localStorage.getItem('cryptos') || '[]');
    cryptos = cryptos.filter(crypto => crypto.id !== id);
    localStorage.setItem('cryptos', JSON.stringify(cryptos));
    loadCryptos();
}

function verifyStorage() {
    console.log('Verifying storage');
    const storageInfo = document.getElementById('storageInfo');
    const cryptos = JSON.parse(localStorage.getItem('cryptos') || '[]');
    
    storageInfo.innerHTML = `
        <h3>Storage Status:</h3>
        <p>Number of stored cryptos: ${cryptos.length}</p>
        <p>Storage data:</p>
        <pre>${JSON.stringify(cryptos, null, 2)}</pre>
    `;
    
    storageInfo.classList.add('visible');
}