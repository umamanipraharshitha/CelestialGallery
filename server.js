// server.js
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises; // Use promise-based fs
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
// const csrf = require('csurf');
// const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// === Environment Validation ===
if (!process.env.MONGO_URI) {
  console.error('MONGO_URI environment variable required');
  process.exit(1);
}

// === Security Middleware ===
app.use(helmet());
app.use(mongoSanitize());

// === Rate Limiting (uncomment for production) ===
// const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
// app.use(limiter);

// === Static Files & Parsing ===
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// === Session Configuration ===
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// === Multer for file uploads ===
const storage = multer.diskStorage({
  destination: './public/uploads',
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// === MongoDB Models ===
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String
});
const User = mongoose.model('User', userSchema);

const imageSchema = new mongoose.Schema({
  filename: String,
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploaderName: String,
  title: String,
  description: String,
  likes: { type: Number, default: 0 },
  reports: { type: Number, default: 0 },
  reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});
const Image = mongoose.model('Image', imageSchema);

// === Authentication Middleware ===
function requireLogin(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  next();
}

// === Routes ===

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Registration
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'register.html'));
});
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.send('Username and password required');
  const hash = await bcrypt.hash(password, 10);
  try {
    await User.create({ username, password: hash });
    res.redirect('/login');
  } catch (err) {
    res.send('Username already taken');
  }
});

// Login
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.send('Invalid credentials');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.send('Invalid credentials');
    req.session.userId = user._id;
    req.session.username = user.username;
    res.redirect('/');
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Upload image (with title and description)
app.post('/upload', requireLogin, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');
  try {
    await Image.create({
      filename: req.file.filename,
      uploader: req.session.userId,
      uploaderName: req.session.username,
      title: req.body.title,
      description: req.body.description
    });
    res.redirect('/my-uploads');
  } catch (err) {
    res.status(500).send('Upload failed');
  }
});

// API: Get all images and user info
app.get('/api/images', async (req, res) => {
  try {
    const images = await Image.find().sort({ _id: -1 });
    res.json({ images, userId: req.session.userId || null });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// API: Get my uploads
app.get('/api/my-uploads', requireLogin, async (req, res) => {
  try {
    const images = await Image.find({ uploader: req.session.userId }).sort({ _id: -1 });
    res.json(images);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Like
app.post('/like/:id', requireLogin, async (req, res) => {
  try {
    await Image.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } });
    res.sendStatus(200);
  } catch (err) {
    res.status(500).send('Like failed');
  }
});

// Report (only once per user)
app.post('/report/:id', requireLogin, async (req, res) => {
  try {
    const img = await Image.findById(req.params.id);
    if (!img) return res.sendStatus(404);
    if (img.reportedBy.includes(req.session.userId)) {
      return res.status(400).send('You have already reported this image.');
    }
    img.reports += 1;
    img.reportedBy.push(req.session.userId);
    if (img.reports > 5) {
      await Image.findByIdAndDelete(img._id);
      const filePath = path.join(__dirname, 'public', 'uploads', img.filename);
      await fs.unlink(filePath).catch(err => console.error('File delete error:', err));
      return res.sendStatus(200);
    }
    await img.save();
    res.sendStatus(200);
  } catch (err) {
    res.status(500).send('Report failed');
  }
});

// Delete (only owner)
app.post('/delete/:id', requireLogin, async (req, res) => {
  try {
    const img = await Image.findById(req.params.id);
    if (!img) return res.sendStatus(404);
    if (img.uploader.toString() !== req.session.userId) return res.sendStatus(403);
    await Image.findByIdAndDelete(img._id);
    const filePath = path.join(__dirname, 'public', 'uploads', img.filename);
    await fs.unlink(filePath).catch(err => console.error('File delete error:', err));
    res.sendStatus(200);
  } catch (err) {
    res.status(500).send('Delete failed');
  }
});

// My uploads page
app.get('/my-uploads', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'my_uploads.html'));
});

// === MongoDB Connection and Server Start ===
mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
  .then(() => {
    console.log('Connected to MongoDB');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
