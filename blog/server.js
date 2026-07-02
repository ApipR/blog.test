require('dotenv').config();
const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const multer = require('multer');
const helmet = require('helmet');
const compression = require('compression');
const { body, validationResult } = require('express-validator');
const { initDatabase, runQuery, getRow, getAllRows, getDb } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(compression());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|webm|ogg|mp3|wav|m4a/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Session store
class SqliteSessionStore extends session.Store {
  constructor(db) {
    super();
    this.db = db;
  }

  get(sid, callback) {
    this.db.get(
      'SELECT sess FROM sessions WHERE sid = ? AND expire > ?',
      [sid, Date.now()],
      (err, row) => {
        if (err) return callback(err);
        if (!row) return callback(null, null);
        try {
          callback(null, JSON.parse(row.sess));
        } catch (e) {
          callback(e);
        }
      }
    );
  }

  set(sid, sess, callback) {
    const expire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    this.db.run(
      'INSERT OR REPLACE INTO sessions (sid, sess, expire) VALUES (?, ?, ?)',
      [sid, JSON.stringify(sess), expire],
      callback
    );
  }

  destroy(sid, callback) {
    this.db.run('DELETE FROM sessions WHERE sid = ?', [sid], callback);
  }

  clear(callback) {
    this.db.run('DELETE FROM sessions WHERE expire < ?', [Date.now()], callback);
  }
}

const db = getDb();

// Session middleware
app.use(session({
  store: new SqliteSessionStore(db),
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

// Utility functions
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

const calculateReadingTime = (text) => {
  const wordsPerMinute = 200;
  const wordCount = text.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
};

const sanitizeInput = (input) => {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.loggedIn) {
    next();
  } else {
    res.redirect('/admin/login');
  }
};

// ============= PUBLIC ROUTES =============

// Home page
app.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await getRow('SELECT COUNT(*) as count FROM posts WHERE published = 1');
    const total = countResult.count;
    const pages = Math.ceil(total / limit);

    // Get posts
    const posts = await getAllRows(
      'SELECT * FROM posts WHERE published = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    // Parse JSON fields
    posts.forEach(post => {
      post.images = post.images ? JSON.parse(post.images) : [];
      post.readingTime = calculateReadingTime(post.content);
    });

    res.render('index', {
      posts,
      currentPage: page,
      pages,
      total,
      darkMode: req.query.darkMode === 'true'
    });
  } catch (error) {
    console.error('Error loading home page:', error);
    res.status(500).render('error', { message: 'Error loading posts' });
  }
});

// Search
app.get('/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    if (!query || query.length < 2) {
      return res.json({ posts: [] });
    }

    const searchTerm = `%${query}%`;
    const posts = await getAllRows(
      `SELECT * FROM posts 
       WHERE published = 1 AND (title LIKE ? OR content LIKE ? OR excerpt LIKE ?)
       ORDER BY created_at DESC
       LIMIT 20`,
      [searchTerm, searchTerm, searchTerm]
    );

    posts.forEach(post => {
      post.images = post.images ? JSON.parse(post.images) : [];
      post.readingTime = calculateReadingTime(post.content);
    });

    res.json({ posts });
  } catch (error) {
    console.error('Error searching posts:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Individual post
app.get('/post/:slug', async (req, res) => {
  try {
    const post = await getRow('SELECT * FROM posts WHERE slug = ? AND published = 1', [req.params.slug]);
    
    if (!post) {
      return res.status(404).render('error', { message: 'Post not found' });
    }

    post.images = post.images ? JSON.parse(post.images) : [];
    post.videos = post.videos ? JSON.parse(post.videos) : [];
    post.audio = post.audio ? JSON.parse(post.audio) : [];
    post.readingTime = calculateReadingTime(post.content);

    // Get related posts
    const relatedPosts = await getAllRows(
      `SELECT * FROM posts 
       WHERE published = 1 AND id != ?
       ORDER BY created_at DESC
       LIMIT 3`,
      [post.id]
    );

    relatedPosts.forEach(p => {
      p.images = p.images ? JSON.parse(p.images) : [];
      p.readingTime = calculateReadingTime(p.content);
    });

    res.render('post', { post, relatedPosts });
  } catch (error) {
    console.error('Error loading post:', error);
    res.status(500).render('error', { message: 'Error loading post' });
  }
});

// ============= ADMIN ROUTES =============

// Login page
app.get('/admin/login', (req, res) => {
  if (req.session && req.session.loggedIn) {
    return res.redirect('/admin');
  }
  res.render('admin-login', { error: null });
});

// Login handler
app.post('/admin/login', [
  body('password').trim().notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('admin-login', { error: 'Invalid input' });
  }

  try {
    const admin = await getRow('SELECT * FROM admin WHERE id = 1');
    
    if (!admin) {
      return res.render('admin-login', { error: 'Admin account not configured' });
    }

    const passwordMatch = await bcrypt.compare(req.body.password, admin.password_hash);
    
    if (passwordMatch) {
      req.session.loggedIn = true;
      res.redirect('/admin');
    } else {
      res.render('admin-login', { error: 'Incorrect password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.render('admin-login', { error: 'Login error' });
  }
});

// Logout
app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// Admin dashboard
app.get('/admin', requireAuth, async (req, res) => {
  try {
    const posts = await getAllRows(
      'SELECT id, title, slug, created_at, published FROM posts ORDER BY created_at DESC'
    );

    res.render('admin-dashboard', { posts });
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
    res.status(500).render('error', { message: 'Error loading dashboard' });
  }
});

// Post editor (new or edit)
app.get('/admin/post/new', requireAuth, (req, res) => {
  res.render('post-editor');
});

app.get('/admin/post/:id', requireAuth, async (req, res) => {
  if (req.params.id === 'new') {
    return res.render('post-editor');
  }
  // For rendering the editor page
  res.render('post-editor');
});

// Get post data for editing (API endpoint)
app.get('/admin/api/post/:id', requireAuth, async (req, res) => {
  try {
    const post = await getRow('SELECT * FROM posts WHERE id = ?', [req.params.id]);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    post.images = post.images ? JSON.parse(post.images) : [];
    post.videos = post.videos ? JSON.parse(post.videos) : [];
    post.audio = post.audio ? JSON.parse(post.audio) : [];

    res.json(post);
  } catch (error) {
    console.error('Error loading post:', error);
    res.status(500).json({ error: 'Error loading post' });
  }
});

// Create or update post
app.post('/admin/post', requireAuth, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('excerpt').trim().optional(),
  body('published').optional().isBoolean()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id, title, content, excerpt, images, videos, audio, published } = req.body;
    
    if (id) {
      // Update
      await runQuery(
        `UPDATE posts SET title = ?, content = ?, excerpt = ?, images = ?, videos = ?, audio = ?, published = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [title, content, excerpt || '', images || '[]', videos || '[]', audio || '[]', published ? 1 : 0, id]
      );
      res.json({ success: true, id, message: 'Post updated' });
    } else {
      // Create
      const slug = generateSlug(title);
      const result = await runQuery(
        `INSERT INTO posts (title, slug, content, excerpt, images, videos, audio, published)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, slug, content, excerpt || '', images || '[]', videos || '[]', audio || '[]', published ? 1 : 0]
      );
      res.json({ success: true, id: result.lastID, slug, message: 'Post created' });
    }
  } catch (error) {
    console.error('Error saving post:', error);
    res.status(500).json({ error: 'Error saving post' });
  }
});

// Delete post
app.delete('/admin/post/:id', requireAuth, async (req, res) => {
  try {
    await runQuery('DELETE FROM posts WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Error deleting post' });
  }
});

// Upload files
app.post('/admin/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  const fileType = req.file.mimetype.split('/')[0]; // 'image', 'video', 'audio'

  res.json({
    success: true,
    url: fileUrl,
    filename: req.file.filename,
    type: fileType
  });
});

// Delete uploaded file
app.delete('/admin/upload/:filename', requireAuth, (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(uploadsDir, filename);
    
    // Security: ensure the file is in uploads directory
    if (!filepath.startsWith(uploadsDir)) {
      return res.status(400).json({ error: 'Invalid file' });
    }

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      res.json({ success: true, message: 'File deleted' });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Error deleting file' });
  }
});

// ============= ERROR HANDLING =============

app.use((req, res) => {
  res.status(404).render('error', { message: 'Page not found' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).render('error', { message: 'Internal server error' });
});

// ============= START SERVER =============

const startServer = async () => {
  try {
    await initDatabase();
    console.log('✓ Database initialized');

    app.listen(PORT, () => {
      console.log(`\n✓ Blog server running on http://localhost:${PORT}`);
      console.log(`✓ Admin login: http://localhost:${PORT}/admin/login`);
      console.log('\nTo set up your admin password, run: npm run setup\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
