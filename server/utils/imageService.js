const axios = require('axios');
const FormData = require('form-data');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

/**
 * Searches for an image URL based on title and type
 * @param {string} title 
 * @param {string} type 
 * @returns {Promise<string|null>}
 */
async function searchImage(title, type) {
    try {
        const query = encodeURIComponent(`${title} ${type} poster`);
        // Use a more public/reliable search result page but parse it more carefully
        const url = `https://www.bing.com/images/search?q=${query}&form=HDRSC2&first=1`;
        
        console.log(`DEBUG: Searching image for ${title} via Bing`);
        
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        // Bing image search results often contain links in 'murl' fields inside 'm' attributes
        const matches = data.match(/murl&quot;:&quot;(https?:\/\/[^&]+)&quot;/g);
        
        if (matches && matches.length > 0) {
            // Extract the URL from the match
            const firstResult = matches[0].match(/https?:\/\/[^&]+/)[0];
            console.log(`DEBUG: Found image result for ${title}: ${firstResult}`);
            return firstResult;
        }

        console.log(`DEBUG: No images found for ${title} using Bing`);
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
