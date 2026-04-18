const { uploadToImgBB } = require('./utils/imageService');
const fs = require('fs');
const path = require('path');

async function runTest() {
    console.log('--- Starting Sample Upload Test ---');
    const filePath = path.join(__dirname, '../test2.jpg');
    
    if (!fs.existsSync(filePath)) {
        console.error('Test image test2.jpg not found in root directory.');
        return;
    }

    const imageBuffer = fs.readFileSync(filePath);
    console.log(`Read test2.jpg (${imageBuffer.length} bytes). Uploading...`);

    const result = await uploadToImgBB(imageBuffer, 'test2_sample');
    
    if (result && result.startsWith('http')) {
        console.log('\n--- SUCCESS ---');
        console.log('Uploaded Image URL:', result);
    } else {
        console.log('\n--- FAILED ---');
        console.log('Result was not a URL:', result);
    }
}

runTest();
