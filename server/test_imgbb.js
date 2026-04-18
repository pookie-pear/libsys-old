const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

async function testUpload() {
    console.log('Using API Key:', IMGBB_API_KEY ? 'Present' : 'Missing');
    if (!IMGBB_API_KEY) return;

    try {
        const filePath = path.join(__dirname, '../test2.jpg');
        if (!fs.existsSync(filePath)) {
            console.error('File not found:', filePath);
            return;
        }

        const image = fs.readFileSync(filePath);
        const form = new FormData();
        form.append('image', image.toString('base64'));
        form.append('name', 'test_sample_image');

        console.log('Uploading to ImgBB...');
        const res = await axios.post(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, form, {
            headers: form.getHeaders()
        });

        console.log('Response Status:', res.status);
        console.log('Response Data:', JSON.stringify(res.data, null, 2));

        if (res.data && res.data.success) {
            console.log('\nSUCCESS!');
            console.log('Image URL:', res.data.data.url);
            console.log('Delete URL:', res.data.data.delete_url);
        } else {
            console.log('\nUpload failed but received response.');
        }
    } catch (error) {
        console.error('\nERROR during upload:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Message:', error.message);
        }
    }
}

testUpload();
