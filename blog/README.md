# Minimalist Personal Blog

A modern, clean personal blog website built with Node.js, Express, SQLite, and vanilla JavaScript. Features a public-facing blog with admin panel for secure post management.

## Features

### Public Pages
- 📖 **Home Page**: Display all blog posts with newest first
- 🔍 **Search**: Search posts by title or content
- 📄 **Post Page**: Full article view with media galleries, videos, and audio
- 🎨 **Responsive Design**: Beautiful on desktop and mobile
- 🌓 **Dark/Light Mode**: Toggle between themes
- ⚡ **Reading Time**: Automatic reading time estimation
- 📱 **Mobile-Friendly**: Optimized for all screen sizes

### Admin Panel
- 🔐 **Secure Login**: Password-protected admin access
- ✍️ **Post Editor**: Create and edit posts with rich content
- 📸 **Media Management**: Upload images, videos, and audio
- 🖱️ **Drag & Drop**: Easy file uploads with drag-and-drop
- 💾 **Auto-Save**: Drafts automatically saved as you type
- 📊 **Post Management**: View, edit, and delete posts
- 📝 **Character Counter**: Track post content length
- 🗑️ **Safe Delete**: Confirmation required before deleting

### Design
- 🎯 **Minimalist Aesthetic**: Inspired by Notion and Medium
- 🎨 **Modern Color Palette**: White, light grey, dark grey
- 🔘 **Rounded Corners**: 12-16px border radius
- ✨ **Soft Shadows**: Subtle depth and elevation
- 🎭 **Smooth Animations**: Transitions and page changes
- 📝 **Inter Font**: Clean, professional typography

### Security
- 🔒 **Bcrypt Hashing**: Secure password storage
- 🔑 **Session Management**: Secure admin sessions
- ✔️ **Input Sanitization**: XSS protection
- 🛡️ **CORS & Helmet**: Security headers included
- 🔐 **Protected Routes**: Admin routes require authentication

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: SQLite
- **Frontend**: HTML, CSS, JavaScript
- **Authentication**: bcrypt, express-session
- **File Uploads**: Multer
- **Template Engine**: EJS
- **Security**: Helmet, express-validator

## Quick Start

### Prerequisites
- Node.js 14 or higher
- npm

### Installation

1. **Clone/Extract the project**
   ```bash
   cd blog
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and change the `SESSION_SECRET` to a random string:
   ```
   SESSION_SECRET=your-random-secret-key-here
   ```

4. **Create admin account**
   ```bash
   npm run setup
   ```
   
   You'll be prompted to enter an admin password. Remember this password!

5. **Start the server**
   ```bash
   npm start
   ```

6. **Access the blog**
   - Public site: http://localhost:3000
   - Admin login: http://localhost:3000/admin/login

### Development

Run with auto-reload on file changes:
```bash
npm run dev
```

## Project Structure

```
blog/
├── public/
│   ├── style.css          # All styling
│   └── script.js          # Frontend functionality
├── views/
│   ├── index.ejs          # Home page
│   ├── post.ejs           # Individual post page
│   ├── admin-login.ejs    # Admin login
│   ├── admin-dashboard.ejs # Admin dashboard
│   ├── post-editor.ejs    # Post editor
│   └── error.ejs          # Error page
├── uploads/               # User uploaded files (auto-created)
├── server.js              # Express server
├── database.js            # Database utilities
├── setup.js               # Admin setup script
├── package.json           # Dependencies
├── database.db            # SQLite database (auto-created)
└── .env                   # Environment variables
```

## Usage

### Creating a Post

1. Go to http://localhost:3000/admin/login
2. Enter your admin password
3. Click "New Post" button
4. Fill in:
   - **Title**: Post title
   - **Content**: Write using Markdown format
   - **Excerpt**: Brief summary (optional)
   - **Media**: Drag and drop or click to upload images, videos, audio
5. Check "Publish Post" to make it live
6. Click "Save Post"

### Editing a Post

1. In admin dashboard, click "Edit" on any post
2. Make changes
3. Click "Save Post"

### Deleting a Post

1. In admin dashboard, click "Delete" on a post
2. Confirm deletion (irreversible)

### Publishing/Unpublishing

- Check "Publish Post" in the sidebar to make visible to public
- Uncheck to save as draft (only visible when logged in)

## Markdown Support

Write posts using Markdown syntax:

```markdown
# Heading 1
## Heading 2
### Heading 3

**Bold text**
*Italic text*
~~Strikethrough~~

- List item 1
- List item 2

1. Numbered item
2. Numbered item

> Blockquote

`inline code`

\`\`\`
code block
\`\`\`

[Link](https://example.com)

![Image](image.jpg)
```

### Important: Markdown is Rendered as HTML

The content editor accepts HTML-formatted content. For Markdown support, you can:

1. Write in Markdown locally and convert to HTML
2. Use an online Markdown to HTML converter
3. Or write HTML directly

## Database

The blog uses SQLite for storage. Key tables:

- **posts**: Blog posts with title, content, metadata
- **admin**: Admin password hash
- **sessions**: User session data

## Deployment

### Render.com

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect your GitHub repository
4. Set environment:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**: Copy from .env
5. Add SESSION_SECRET in Render dashboard
6. Deploy!

### Railway.app

1. Push code to GitHub
2. Create new project on Railway
3. Add GitHub repository
4. Railway auto-detects Node.js and installs dependencies
5. Set environment variables:
   - `PORT=3000`
   - `SESSION_SECRET=your-secret`
   - `NODE_ENV=production`
6. Deploy automatically!

### Vercel (Frontend Only)

For frontend only with separate API:
1. Deploy backend to Render/Railway
2. Create separate frontend project
3. Use API calls to backend
4. Deploy to Vercel

### VPS (DigitalOcean, Linode, AWS, etc.)

1. SSH into your server
2. Install Node.js and npm
3. Clone repository
4. `npm install`
5. `npm run setup` for admin password
6. Install PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start server.js --name blog
   pm2 startup
   pm2 save
   ```
7. Set up reverse proxy with Nginx:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
       }

       location /uploads {
           alias /path/to/blog/uploads;
       }
   }
   ```
8. Enable HTTPS with Certbot

## Security Tips

1. **Change SESSION_SECRET**: Use a long, random string in production
2. **Use HTTPS**: Always use SSL/TLS in production
3. **Strong Admin Password**: Use a complex, unique password
4. **Backup Database**: Regular backups of database.db
5. **Update Dependencies**: Keep npm packages updated
6. **Remove Debugging**: Don't expose sensitive data in logs

## Troubleshooting

### Port Already in Use
```bash
# Change PORT in .env or use different port
PORT=3001 npm start
```

### Database Locked
Delete database.db and run setup again:
```bash
rm database.db
npm run setup
npm start
```

### Forgot Admin Password
```bash
npm run setup
```
Follow prompts to set new password.

### Uploads Not Working
Check uploads folder permissions:
```bash
chmod 755 uploads/
```

### Files Not Showing After Upload
Ensure `/uploads` route is accessible and Multer has write permission to uploads directory.

## Performance

- 📦 Compression enabled (gzip)
- ⚡ Caching headers set
- 📱 Lazy loading for images
- 🎯 Optimized CSS and JS
- 🗜️ Media files stored on disk

## SEO

- 📋 Semantic HTML
- 🔍 Meta tags for each post
- 📱 Mobile responsive
- ⚡ Fast page loads
- 🔗 Clean, readable URLs

## API Endpoints

### Public
- `GET /` - Home page
- `GET /post/:slug` - Individual post
- `GET /search?q=query` - Search posts

### Admin (Protected)
- `GET /admin/login` - Login page
- `POST /admin/login` - Login handler
- `GET /admin` - Dashboard
- `GET /admin/post/new` - New post editor
- `GET /admin/post/:id` - Edit post page
- `GET /admin/api/post/:id` - Get post data (JSON)
- `POST /admin/post` - Create/update post
- `DELETE /admin/post/:id` - Delete post
- `POST /admin/upload` - Upload file
- `DELETE /admin/upload/:filename` - Delete file
- `GET /admin/logout` - Logout

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## License

MIT License - Feel free to use this project for personal or commercial purposes.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review error messages in browser console
3. Check server logs
4. Verify database and file permissions

## Future Enhancements

- [ ] Comments system
- [ ] Tags/Categories
- [ ] Analytics
- [ ] Email notifications
- [ ] Social media sharing
- [ ] RSS feed
- [ ] Advanced search filters
- [ ] Post scheduling
- [ ] Multi-user support

---

**Enjoy your minimalist blog! 🎉**
