const axios = require('axios');
const FormData = require('form-data');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

// User agents to rotate
const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
];

const getRandomUA = () => userAgents[Math.floor(Math.random() * userAgents.length)];
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Searches for an image URL based on title and type
 * @param {string} title 
 * @param {string} type 
 * @returns {Promise<string|null>}
 */
async function searchImage(title, type) {
    // List of search engines/proxies to try in order
    const engines = [
        async (q) => {
            const url = `https://www.bing.com/images/search?q=${encodeURIComponent(q)}&form=HDRSC2&first=1`;
            const { data } = await axios.get(url, { headers: { 'User-Agent': getRandomUA() } });
            const matches = data.match(/murl&quot;:&quot;(https?:\/\/[^&]+)&quot;/g);
            return matches ? matches[0].match(/https?:\/\/[^&]+/)[0] : null;
        },
        async (q) => {
            const url = `https://duckduckgo.com/i.js?q=${encodeURIComponent(q)}&o=json`;
            const { data } = await axios.get(url, { headers: { 'User-Agent': getRandomUA() } });
            return data.results && data.results.length > 0 ? data.results[0].image : null;
        }
    ];

    const query = `${title} ${type} official poster`;
    
    for (const engine of engines) {
        try {
            const result = await engine(query);
            if (result) return result;
            await sleep(1000 + Math.random() * 2000); // Random delay between retries
        } catch (error) {
            console.error(`Search engine error: ${error.message}`);
        }
    }
    return null;
}

/**
 * Uploads an image from URL to ImgBB
 * @param {string} imageUrl 
 * @param {string} title 
 * @returns {Promise<string|null>}
 */
async function uploadToImgBB(imageSource, title) {
    if (!IMGBB_API_KEY) {
        console.warn('IMGBB_API_KEY not found in .env');
        return typeof imageSource === 'string' ? imageSource : null;
    }

    try {
        let base64Image;
        if (Buffer.isBuffer(imageSource)) {
            base64Image = imageSource.toString('base64');
        } else if (typeof imageSource === 'string') {
            // It's a URL
            const imageRes = await axios.get(imageSource, { responseType: 'arraybuffer' });
            base64Image = Buffer.from(imageRes.data, 'binary').toString('base64');
        } else {
            throw new Error('Invalid image source provided to uploadToImgBB');
        }

        const form = new FormData();
        form.append('image', base64Image);
        form.append('name', title.replace(/[^a-z0-9]/gi, '_').toLowerCase());

        const res = await axios.post(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, form, {
            headers: form.getHeaders()
        });

        console.log(`DEBUG: ImgBB Response for ${title}:`, res.data.success ? 'Success' : 'Failed');

        if (res.data && res.data.data && res.data.data.url) {
            return res.data.data.url;
        }
        return typeof imageSource === 'string' ? imageSource : null;
    } catch (error) {
        console.error('Error uploading to ImgBB:', error.message);
        return typeof imageSource === 'string' ? imageSource : null;
    }
}

module.exports = {
    searchImage,
    uploadToImgBB
};
