const axios = require('axios');
const FormData = require('form-data');

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

/**
 * Searches for an image URL based on title and type
 * @param {string} title 
 * @param {string} type 
 * @returns {Promise<string|null>}
 */
async function searchImage(title, type) {
    try {
        // Using a free/public search proxy or simple scraping if necessary
        // For now, let's use a public search suggestion or a known public API if possible
        // A simple approach is searching via DuckDuckGo's JSON-like search
        const query = encodeURIComponent(`${title} ${type} poster`);
        const url = `https://duckduckgo.com/t.js?q=${query}&l=wt-wt`;
        
        // This is a bit hacky, but DuckDuckGo often returns some info.
        // Alternatively, we can use a more robust free search if available.
        // Let's try to use a simpler method for now.
        
        // Actually, let's try to use Google's search suggestions or similar if possible.
        // For movies, we could use OMDb if we had a key, but we don't.
        
        // Let's use a simpler "Google Image Search" scraper approach for now, 
        // acknowledging it's fragile but might work for a quick tool.
        const searchUrl = `https://www.google.com/search?q=${query}&tbm=isch`;
        const { data } = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        // Very basic regex to find the first image link in Google search results
        // This is fragile but works surprisingly well for posters.
        const matches = data.match(/https?:\/\/[^"']+\.(?:jpg|jpeg|png|gif)/gi);
        if (matches && matches.length > 0) {
            // Filter out tracking/google-owned domains if possible
            const filtered = matches.filter(m => !m.includes('gstatic.com') && !m.includes('google.com'));
            return filtered[0] || matches[0];
        }
        return null;
    } catch (error) {
        console.error('Error searching image:', error.message);
        return null;
    }
}

/**
 * Uploads an image from URL to ImgBB
 * @param {string} imageUrl 
 * @param {string} title 
 * @returns {Promise<string|null>}
 */
async function uploadToImgBB(imageUrl, title) {
    if (!IMGBB_API_KEY) {
        console.warn('IMGBB_API_KEY not found in .env');
        return imageUrl; // Fallback to original URL
    }

    try {
        // Download image first to buffer
        const imageRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(imageRes.data, 'binary');

        const form = new FormData();
        form.append('image', buffer.toString('base64'));
        form.append('name', title.replace(/[^a-z0-9]/gi, '_').toLowerCase());

        const res = await axios.post(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, form, {
            headers: form.getHeaders()
        });

        if (res.data && res.data.data && res.data.data.url) {
            return res.data.data.url;
        }
        return imageUrl;
    } catch (error) {
        console.error('Error uploading to ImgBB:', error.message);
        return imageUrl;
    }
}

module.exports = {
    searchImage,
    uploadToImgBB
};
