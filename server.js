const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'auragram_secret_key_2026';
const DB_FILE = path.join(__dirname, 'database.json');

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

function getAvatar(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128&bold=true`;
}

// 4 Verified Working Non-Cartoon Local Videos
const nonCartoonVideos = [
  {
    url: "/videos/reel1.mp4",
    title: "Bioluminescent Deep Oceanic Reefs 🌊",
    cat: "Nature",
    caption: "Crystal clear ocean currents and tranquil aquatic life deep under the sea. Take a breath and relax today."
  },
  {
    url: "/videos/reel2.mp4",
    title: "Botanical Macro Blossom Time-lapse 🌸",
    cat: "Nature",
    caption: "High frame-rate slow motion capture of botanical floral expansion at dawn. Natural geometric perfection."
  },
  {
    url: "/videos/reel3.mp4",
    title: "Epic Cinema Atmospheric 3D Visuals ⚔️",
    cat: "Gaming",
    caption: "Cinematic atmospheric lighting rendered inside high-end rendering pipelines. Unreal engine visuals."
  },
  {
    url: "/videos/reel4.mp4",
    title: "Forest Animated Comedy and Bunny  Adventure 🐠",
    cat: "Funny",
    caption: "When the forest animals get together for a hilarious adventure. A lighthearted animated short film for all ages."
  }
];

// 20 Unique Verified Photos
const uniquePhotos = [
  { url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=900&q=80", title: "Late Night Clean Terminal Architecture 🌙", cat: "Tech", caption: "Deep focus state past midnight. When the logic flows and the code compiles without warnings." },
  { url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=900&q=80", title: "Network Reconnaissance & Protocol Inspection 🛡️", cat: "Tech", caption: "Analyzing network packet flags in Wireshark and hardening firewall rules. Security is an art form." },
  { url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=900&q=80", title: "Tokyo Rainy Night Reflection 🌃", cat: "Visuals", caption: "Neon kanji reflections slicing through rain-slicked asphalt. Cinematic cyberpunk reality." },
  { url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900&q=80", title: "Minimalist Walnut Developer Setup ☕", cat: "Tech", caption: "Clean desk space, clicky tactile mechanical keyboard, and hot pour-over brew. Ready for the day." },
  { url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=900&q=80", title: "Custom Lubricated RGB Mechanical Keyboard ⌨️", cat: "Gaming", caption: "Smooth linear switches with warm amber backlighting. The typing sound profile is pure therapy." },
  { url: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=900&q=80", title: "Water-Cooled RTX Custom Battlestation ⚡", cat: "Gaming", caption: "Hardline acrylic loops with UV coolant. Ready to push raytracing to the absolute maximum." },
  { url: "https://images.unsplash.com/photo-1606318801954-d46846fe3ecd?w=900&q=80", title: "PlayStation DualSense Midnight Controller 🎮", cat: "Gaming", caption: "Adaptive triggers and next-gen haptics. Evening gaming sessions just hit different." },
  { url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&q=80", title: "Swiss Alpine Valley Morning Fog 🏔️", cat: "Nature", caption: "Crisp pine air and towering mountain silhouettes. Nature reminding us how big the world is." },
  { url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=80", title: "Golden Hour Coastline & Tidal Drift 🌅", cat: "Nature", caption: "Warm sand, salty ocean breeze, and endless golden sky. A peaceful moment to pause and breathe." },
  { url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&q=80", title: "Silicon Microchip Die Macro Photography 🔬", cat: "Tech", caption: "Nanometer transistors etched on pure silicon. The computational heart of modern civilization." },
  { url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&q=80", title: "Vintage Kodak Portra 35mm Film Portrait 🎞️", cat: "Social", caption: "Natural warm skin tones and organic chemical film grain that digital filters can never duplicate." },
  { url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&q=80", title: "Seoul Streetwear Minimal Tailoring 🍂", cat: "Social", caption: "Earthy neutral palettes paired with structured oversized coats. Street fashion inspiration." },
  { url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900&q=80", title: "Neural Diffusion Generative Fluid Dynamics 🎨", cat: "AI & Tech", caption: "Color physics rendered via mathematical diffusion shaders. Algorithmic generative aesthetics." },
  { url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=900&q=80", title: "Holographic Crystal Matrix Simulation 🔮", cat: "AI & Tech", caption: "Visualizing high-dimensional spatial geometry in real-time. Where mathematics meets art." },
  { url: "https://images.unsplash.com/photo-1534361960057-19889db9621e?w=900&q=80", title: "Dog Staring at Endless Bug Logs 🐶", cat: "Funny", caption: "When the client says 'just one small change' and the whole production system crashes." },
  { url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=900&q=80", title: "Cyber Arcade Synthwave Atmosphere 🕹️", cat: "Gaming", caption: "Retro neon cabinets and synthwave soundtracks. Reliving the glory days of arcade gaming." },
  { url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=900&q=80", title: "Orbital Earth View at Twilight 🌍", cat: "Nature", caption: "City lights sparkling like stardust across continents from low earth orbit. Humbling perspective." },
  { url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=900&q=80", title: "Norwegian Fjord Reflections at Sunrise 🛶", cat: "Nature", caption: "Glass-smooth waters reflecting emerald cliffs. Absolute silence in the Arctic morning." },
  { url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=900&q=80", title: "Mystical Mist Over Redwood Canopy 🌲", cat: "Nature", caption: "Sunbeams piercing ancient redwood branches. Nature's cathedral at dawn." },
  { url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=900&q=80", title: "Milky Way Galaxy over Desert Dunes 🌌", cat: "Nature", caption: "Underneath billions of distant suns. Night sky photography far away from light pollution." }
];

// Generate Exactly 24 Unique Posts
function generateStrictlyUniqueFeed() {
  const videoAuthors = ['Hardeep Kumar', 'Simran Kaur', 'Kavya Sharma', 'Aman Verma'];
  const photoAuthors = ['CipherOps', 'Elena Vibe', 'Vikram Rajput', 'Rohan Mehra', 'Hardeep Kumar', 'Simran Kaur', 'Kavya Sharma', 'Aman Verma'];

  const posts = [];
  let photoPointer = 0;

  for (let i = 0; i < nonCartoonVideos.length; i++) {
    const vid = nonCartoonVideos[i];
    const authorV = videoAuthors[i];

    // 1. Unique Video Post
    posts.push({
      _id: `post_v_${i + 1}`,
      title: vid.title,
      type: 'video',
      mediaUrl: vid.url,
      content: vid.caption,
      category: vid.cat,
      authorName: authorV,
      authorAvatar: getAvatar(authorV),
      likes: Math.floor(Math.random() * 320) + 40,
      likedBy: [],
      createdAt: new Date(Date.now() - (posts.length * 3600000)).toISOString(),
      comments: [
        { _id: `c_v_${i}_1`, userName: 'Kavya Sharma', text: 'This visual is insane! 🔥', createdAt: new Date().toISOString() },
        { _id: `c_v_${i}_2`, userName: 'Hardeep Kumar', text: 'Smooth playback and clean audio.', createdAt: new Date().toISOString() }
      ]
    });

    // 2. Five Unique Photos
    for (let j = 0; j < 5 && photoPointer < uniquePhotos.length; j++) {
      const pic = uniquePhotos[photoPointer];
      const authorP = photoAuthors[(photoPointer + j) % photoAuthors.length];

      posts.push({
        _id: `post_p_${photoPointer + 1}`,
        title: pic.title,
        type: 'image',
        mediaUrl: pic.url,
        content: pic.caption,
        category: pic.cat,
        authorName: authorP,
        authorAvatar: getAvatar(authorP),
        likes: Math.floor(Math.random() * 280) + 30,
        likedBy: [],
        createdAt: new Date(Date.now() - (posts.length * 3600000)).toISOString(),
        comments: [
          { _id: `c_p_${photoPointer}_1`, userName: 'Aman Verma', text: 'Top tier photography aesthetics!', createdAt: new Date().toISOString() }
        ]
      });
      photoPointer++;
    }
  }

  return posts;
}

if (!fs.existsSync(DB_FILE)) {
  const initialData = {
    users: [],
    posts: generateStrictlyUniqueFeed(),
    supportTickets: []
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
}

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (e) {
    return { users: [], posts: [], supportTickets: [] };
  }
}

function writeData(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(401).json({ message: 'Authorization required' });
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Session expired or invalid' });
  }
};

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields required' });

    const db = readData();
    if (db.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim())) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      _id: 'usr_' + Date.now(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      avatar: getAvatar(name.trim())
    };

    db.users.push(newUser);
    writeData(db);
    res.status(201).json({ message: 'Account created! Please sign in.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = readData();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, avatar: user.avatar },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user._id, name: user.name, avatar: user.avatar } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/posts', (req, res) => {
  const db = readData();
  res.json(db.posts);
});

app.post('/api/posts', authMiddleware, (req, res) => {
  try {
    const { title, content, type, mediaUrl, category } = req.body;
    if (!content) return res.status(400).json({ message: 'Caption is required' });

    const db = readData();
    const isVid = type === 'video';
    const fallbackMedia = isVid ? "/videos/reel1.mp4" : uniquePhotos[0].url;

    const newPost = {
      _id: 'post_' + Date.now(),
      title: title || 'Aura Moment',
      type: isVid ? 'video' : 'image',
      mediaUrl: (mediaUrl && mediaUrl.trim() !== '') ? mediaUrl.trim() : fallbackMedia,
      content: content.trim(),
      category: category || 'Social',
      authorId: req.user.id,
      authorName: req.user.name,
      authorAvatar: req.user.avatar || getAvatar(req.user.name),
      likes: 0,
      likedBy: [],
      createdAt: new Date().toISOString(),
      comments: []
    };

    db.posts.unshift(newPost);
    writeData(db);
    res.status(201).json(newPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts/:id/like', authMiddleware, (req, res) => {
  const db = readData();
  const post = db.posts.find(p => p._id === req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  if (!Array.isArray(post.likedBy)) post.likedBy = [];
  const userId = req.user.id;
  const alreadyLiked = post.likedBy.includes(userId);

  if (alreadyLiked) {
    post.likedBy = post.likedBy.filter(id => id !== userId);
    post.likes = Math.max(0, (post.likes || 1) - 1);
  } else {
    post.likedBy.push(userId);
    post.likes = (post.likes || 0) + 1;
  }

  writeData(db);
  res.json({ likes: post.likes, isLiked: !alreadyLiked });
});

app.post('/api/posts/:id/comments', authMiddleware, (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ message: 'Comment cannot be empty' });

  const db = readData();
  const post = db.posts.find(p => p._id === req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  const newComment = {
    _id: 'c_' + Date.now(),
    userName: req.user.name,
    text: text.trim(),
    createdAt: new Date().toISOString()
  };

  if (!post.comments) post.comments = [];
  post.comments.push(newComment);
  writeData(db);
  res.status(201).json(newComment);
});

app.post('/api/support', (req, res) => {
  const { userEmail, problemDescription, screenshotUrl } = req.body;
  const db = readData();
  const newTicket = {
    _id: 'ticket_' + Date.now(),
    userEmail: userEmail || 'Anonymous',
    problemDescription: problemDescription || '',
    screenshotUrl: screenshotUrl || '',
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  if (!db.supportTickets) db.supportTickets = [];
  db.supportTickets.unshift(newTicket);
  writeData(db);

  res.status(201).json({ message: 'Support ticket sent to Hardeep Kumar (hk3741883@gmail.com)!' });
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`AuraGram Pro running at http://localhost:${PORT}`);
});