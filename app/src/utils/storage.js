const STORAGE_KEY = 'cryptos';
const MAX_CRYPTOS = 10;

const CryptoStorage = {
    getAllCryptos() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch (error) {
            console.error('Error reading from storage:', error);
            return [];
        }
    },

    saveCrypto(crypto) {
        try {
            const cryptos = this.getAllCryptos();
            
            if (cryptos.length >= MAX_CRYPTOS) {
                throw new Error(`Maximum limit of ${MAX_CRYPTOS} cryptos reached`);
            }
            
            const newCrypto = {
                id: Date.now().toString(),
                ...crypto
            };
            
            cryptos.push(newCrypto);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cryptos));
            return newCrypto;
        } catch (error) {
            console.error('Error saving crypto:', error);
            throw error;
        }
    },

    deleteCrypto(id) {
        try {
            const cryptos = this.getAllCryptos();
            const updatedCryptos = cryptos.filter(crypto => crypto.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCryptos));
            return updatedCryptos;
        } catch (error) {
            console.error('Error deleting crypto:', error);
            throw error;
        }
    },

    getCryptoById(id) {
        try {
            const cryptos = this.getAllCryptos();
            return cryptos.find(crypto => crypto.id === id);
        } catch (error) {
            console.error('Error getting crypto by id:', error);
            return null;
        }
    }
};

module.exports = CryptoStorage;