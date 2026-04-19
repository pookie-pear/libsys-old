const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { searchImage, uploadToImgBB } = require('../utils/imageService');

const MONGO_URI = process.env.MONGO_URI;

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

const seriesList = [
    "daredevil,born again", "peacemaker", "alien:earth", "evangelion", "attack on titan", "berserk",
    "cyberpunk edgerunners", "loki", "agents of shield", "what if", "breaking bad", "better call saul",
    "star wars", "mandalorian", "walking dead", "fear the walking dead", "the last of us", "love,death+robots",
    "narcos:mexico", "watchmen", "watchmen(toon)", "arcane", "common side effects", "secret level",
    "game of thrones", "lord of the rings", "Chernobyl", "fallout", "Warhammer", "scp", "mr robot",
    "the boys", "punisher", "halo", "moon knight", "stranger things", "3 body problem", "pantheon",
    "topgun Inside RAF", "reacher", "family guy", "dexter", "star trek", "chainsaw man", "dark", "aris",
    "ergo proxy", "nana", "devilman Crybaby", "texhnolyze", "haibane renmei", "angels egg", "paranoia agent",
    "kaiba", "after the rain", "millennium actress", "rose of versailles", "Shawshank redemption", "parasite",
    "future diary", "Tokyo ghoul"
];

const moviesList = [
    "tumbbad", "eye in the sky", "enemy", "prisoners", "demolition", "12 strong", "13 hours", "mute",
    "train dreams", "stalker (1979)", "unbreakable", "split", "glass", "the divide", "the revenant",
    "joker", "logan", "john wick", "john wick: chapter 2", "john wick: chapter 3 - parabellum", "john wick: chapter 4",
    "Dunkirk", "rise of the planet of the apes", "dawn of the planet of the apes", "war for the planet of the apes", "kingdom of the planet of the apes",
    "mad max", "mad max: fury road", "furiosa: a mad max saga", "ex machina", "den of thieves",
    "sicario", "sicario: day of the soldado", "American sniper", "the bourne identity", "the bourne supremacy", "the bourne ultimatum", "the bourne legacy", "jason bourne",
    "upgrade", "train to busan", "chappie", "f1", "interstellar",
    "sinners", "ford v ferrari", "Gran Turismo", "Babylon", "taken", "taken 2", "taken 3",
    "the fast and the furious", "2 fast 2 furious", "the fast and the furious: tokyo drift", "fast & furious", "fast five", "fast & furious 6", "furious 7", "the fate of the furious", "f9", "fast x",
    "hobbs & shaw", "the mechanic", "mechanic: resurrection", "transporter", "transporter 2", "transporter 3",
    "terminator", "terminator 2: judgment day", "terminator 3: rise of the machines", "terminator salvation", "terminator genisys", "terminator: dark fate",
    "ghost in the shell"
];

const gamesList = [
    "fallout", "starfield", "skyrim", "the crew", "nfs", "burnout", "test drive unlimited", "assassins creed",
    "gta", "bully", "rdr", "Warhammer", "cod", "battlefield", "ace combat", "cs", "apex legends", "halo",
    "warthunder", "brawl stars", "rust", "tf2", "life is strange", "crysis", "far cry", "hitman", "hulk",
    "spider-man", "arma", "forza", "tlou", "assetto corsa", "moto gp", "richard burns rally", "half life",
    "black mesa", "foxhole", "modern combat", "kenshi", "cyberpunk 2077", "transformers", "project zomboid",
    "no mans sky", "state of decay", "the witcher", "spec ops", "tom clancy", "prototype", "mass effect",
    "metro", "kingdom come deliverance", "astroneer", "jump space", "schedule 1", "content warning",
    "repo", "kerbal space program", "misery", "journey", "six days in Fallujah", "rv there yet", "stalker",
    "terminator", "sekiro", "dying light", "7dtd", "gmod", "the finals", "scp", "mafia", "Detroit become human",
    "resident evil", "valheim", "Microsoft flight sim", "beamng drive", "plants vs zombies", "the long dark",
    "hell let loose", "plague inc", "red orchestra", "phasmophobia", "pacify", "company of heroes", "galactic ruler"
];

const booksList = [
    { title: "Neuromancer", author: "William Gibson", genre: "Sci-Fi" },
    { title: "Snow Crash", author: "Neal Stephenson", genre: "Sci-Fi" },
    { title: "Roadside Picnic", author: "Arkady and Boris Strugatsky", genre: "Sci-Fi" },
    { title: "The Road", author: "Cormac McCarthy", genre: "Post-Apocalyptic" },
    { title: "Metro 2033", author: "Dmitry Glukhovsky", genre: "Post-Apocalyptic" },
    { title: "Do Androids Dream of Electric Sheep?", author: "Philip K. Dick", genre: "Sci-Fi" },
    { title: "Brave New World", author: "Aldous Huxley", genre: "Dystopian" },
    { title: "1984", author: "George Orwell", genre: "Dystopian" },
    { title: "Fahrenheit 451", author: "Ray Bradbury", genre: "Dystopian" },
    { title: "A Canticle for Leibowitz", author: "Walter M. Miller Jr.", genre: "Post-Apocalyptic" },
    { title: "The Man in the High Castle", author: "Philip K. Dick", genre: "Sci-Fi" },
    { title: "Hyperion", author: "Dan Simmons", genre: "Sci-Fi" },
    { title: "Foundation", author: "Isaac Asimov", genre: "Sci-Fi" },
    { title: "The Stars My Destination", author: "Alfred Bester", genre: "Sci-Fi" },
    { title: "Children of Men", author: "P.D. James", genre: "Dystopian" },
    { title: "Blindness", author: "José Saramago", genre: "Dystopian" },
    { title: "Parable of the Sower", author: "Octavia E. Butler", genre: "Post-Apocalyptic" },
    { title: "The Handmaid's Tale", author: "Margaret Atwood", genre: "Dystopian" },
    { title: "I Am Legend", author: "Richard Matheson", genre: "Post-Apocalyptic" },
    { title: "World War Z", author: "Max Brooks", genre: "Post-Apocalyptic" },
    { title: "Station Eleven", author: "Emily St. John Mandel", genre: "Post-Apocalyptic" },
    { title: "The Girl with All the Gifts", author: "M.R. Carey", genre: "Post-Apocalyptic" },
    { title: "Wool", author: "Hugh Howey", genre: "Post-Apocalyptic" },
    { title: "Altered Carbon", author: "Richard K. Morgan", genre: "Sci-Fi" },
    { title: "Leviathan Wakes", author: "James S.A. Corey", genre: "Sci-Fi" },
    { title: "Blindsight", author: "Peter Watts", genre: "Sci-Fi" },
    { title: "Ubik", author: "Philip K. Dick", genre: "Sci-Fi" },
    { title: "Solaris", author: "Stanisław Lem", genre: "Sci-Fi" },
    { title: "The Dark Tower: The Gunslinger", author: "Stephen King", genre: "Dark Fantasy" },
    { title: "Blood Meridian", author: "Cormac McCarthy", genre: "Western/Dark" },
    { title: "The Stand", author: "Stephen King", genre: "Post-Apocalyptic" }
];

const reviews = [
    "its decent to help not think about \"things\" you tryhard not to, has few rare parts that remind but in general decent",
    "doesn't require too much energy to watch, which is perfect right now.",
    "intense enough to drown out other thoughts. a bit heavy sometimes but mostly fine.",
    "keeps the mind occupied. grim enough to fit the mood without being too much.",
    "good quality escapism. it does edge close to reality sometimes but usually stays in its lane.",
    "captivating in a weird way. helps pass the time without letting the mind wander.",
    "pretty good for shutting off the brain, dark atmosphere helps.",
    "a solid distraction. visceral and engaging, makes you forget the real world for a bit."
];

const getRandomReview = () => reviews[Math.floor(Math.random() * reviews.length)];
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fs = require('fs');

const progressFilePath = path.join(__dirname, '../sync-progress.json');

const updateProgress = (current, total, lastItem) => {
    fs.writeFileSync(progressFilePath, JSON.stringify({
        current,
        total,
        lastItem,
        percentage: Math.round((current / total) * 100),
        status: current === total ? 'completed' : 'running',
        updatedAt: new Date().toISOString()
    }, null, 2));
};

async function addBatch() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const allItems = [
            ...seriesList.map(t => ({ title: t, type: 'series' })),
            ...moviesList.map(t => ({ title: t, type: 'movie' })),
            ...gamesList.map(t => ({ title: t, type: 'game' })),
            ...booksList.map(b => ({ title: b.title, type: 'book', author: b.author }))
        ];

        const total = allItems.length;
        console.log(`Starting processing of ${total} items...`);
        updateProgress(0, total, 'Initializing...');

        let current = 0;
        for (const item of allItems) {
            current++;
            // Check both title AND type to allow duplicates like "Fallout" (Game vs Series)
            const existing = await Media.findOne({ 
                title: { $regex: new RegExp(`^${item.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
                type: item.type,
                author: item.author || ''
            });
            
            if (existing) {
                console.log(`Skipping existing item: ${item.title} (${item.type})`);
                updateProgress(current, total, `Skipped: ${item.title}`);
                continue;
            }

            console.log(`Processing: ${item.title} (${item.type})...`);
            updateProgress(current, total, `Processing: ${item.title}`);
            
            let imageUrl = '';
            try {
                const searched = await searchImage(item.title, item.type);
                if (searched) {
                    imageUrl = await uploadToImgBB(searched, item.title);
                }
            } catch (err) {
                console.error(`Image processing failed for ${item.title}: ${err.message}`);
            }

            await Media.create({
                title: item.title,
                type: item.type,
                image: imageUrl,
                rating: Math.floor(Math.random() * 4) + 7, // 7-10 range
                review: getRandomReview(),
                category: Math.random() > 0.5 ? 'completed' : 'in_progress',
                genres: [item.type, 'dark', 'distraction'],
                author: item.author || ''
            });

            console.log(`Added: ${item.title}`);
            updateProgress(current, total, `Added: ${item.title}`);
            await sleep(2000 + Math.random() * 3000); // Respectful delay
        }

        console.log('Batch processing completed!');
        updateProgress(total, total, 'Completed');
    } catch (err) {
        console.error('Batch failed:', err);
        fs.writeFileSync(progressFilePath, JSON.stringify({ status: 'failed', error: err.message }, null, 2));
    } finally {
        await mongoose.disconnect();
    }
}

addBatch();
