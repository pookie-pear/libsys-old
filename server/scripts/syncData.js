const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { searchImage, uploadToImgBB } = require('../utils/imageService');

const MONGO_URI = process.env.MONGO_URI;

// Define Schemas (matching server/index.js)
const mediaSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: { type: String, required: true },
    image: String,
    genres: [String],
    rating: Number,
    review: String,
    category: { type: String, default: 'completed' },
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

const Media = mongoose.model('Media', mediaSchema);

const borrowerSchema = new mongoose.Schema({
    id: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userEmail: String,
    name: String,
    dueDate: String,
    checkoutDate: { type: String, default: () => new Date().toISOString() }
});

const irlBookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    image: String,
    genre: String,
    totalCopies: { type: Number, default: 1 },
    borrowers: [borrowerSchema],
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

const IrlBook = mongoose.model('IrlBook', irlBookSchema);

// Cache to reuse images for same titles
const imageCache = {};

async function sync() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Sync library.json (Media)
        const libraryPath = path.join(__dirname, '../../data/library.json');
        if (fs.existsSync(libraryPath)) {
            const libraryData = JSON.parse(fs.readFileSync(libraryPath, 'utf8'));
            console.log(`Syncing ${libraryData.length} media items...`);

            for (const item of libraryData) {
                let existing = await Media.findOne({ title: { $regex: new RegExp(`^${item.title}$`, 'i') } });
                
                let imageUrl = item.image || (existing ? existing.image : null);

                if (!imageUrl) {
                    if (imageCache[item.title.toLowerCase()]) {
                        imageUrl = imageCache[item.title.toLowerCase()];
                        console.log(`Reusing cached image for: ${item.title}`);
                    } else {
                        console.log(`Searching image for: ${item.title}...`);
                        const searched = await searchImage(item.title, item.type);
                        if (searched) {
                            imageUrl = await uploadToImgBB(searched, item.title);
                            imageCache[item.title.toLowerCase()] = imageUrl;
                        }
                    }
                }

                const updateData = {
                    ...item,
                    image: imageUrl,
                    updatedAt: new Date().toISOString()
                };
                delete updateData.id; // Use MongoDB _id

                await Media.findOneAndUpdate(
                    { title: { $regex: new RegExp(`^${item.title}$`, 'i') } },
                    updateData,
                    { upsert: true, new: true }
                );
            }
        }

        // 2. Sync irl_library.json (IrlBooks)
        const irlPath = path.join(__dirname, '../../data/irl_library.json');
        if (fs.existsSync(irlPath)) {
            const irlData = JSON.parse(fs.readFileSync(irlPath, 'utf8'));
            console.log(`Syncing ${irlData.length} IRL books...`);

            for (const item of irlData) {
                let existing = await IrlBook.findOne({ title: { $regex: new RegExp(`^${item.title}$`, 'i') } });
                
                let imageUrl = item.image || (existing ? existing.image : null);

                if (!imageUrl) {
                    if (imageCache[item.title.toLowerCase()]) {
                        imageUrl = imageCache[item.title.toLowerCase()];
                        console.log(`Reusing cached image for: ${item.title}`);
                    } else {
                        console.log(`Searching image for: ${item.title}...`);
                        const searched = await searchImage(item.title, 'book');
                        if (searched) {
                            imageUrl = await uploadToImgBB(searched, item.title);
                            imageCache[item.title.toLowerCase()] = imageUrl;
                        }
                    }
                }

                const updateData = {
                    ...item,
                    image: imageUrl,
                    updatedAt: new Date().toISOString()
                };
                delete updateData.id;

                await IrlBook.findOneAndUpdate(
                    { title: { $regex: new RegExp(`^${item.title}$`, 'i') } },
                    updateData,
                    { upsert: true, new: true }
                );
            }
        }

        console.log('Sync completed successfully!');
    } catch (err) {
        console.error('Sync failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}

sync();
