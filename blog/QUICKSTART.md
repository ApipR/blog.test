# Quick Start Guide

Get your blog up and running in 5 minutes!

## Step 1: Install Dependencies
```bash
cd blog
npm install
```

## Step 2: Set Up Admin Password
```bash
npm run setup
```

Follow the prompts and enter your admin password. Remember it!

## Step 3: Start the Server
```bash
npm start
```

You should see:
```
✓ Database initialized
✓ Blog server running on http://localhost:3000
✓ Admin login: http://localhost:3000/admin/login
```

## Step 4: Create Your First Post

1. Open http://localhost:3000/admin/login
2. Enter your admin password
3. Click "New Post"
4. Fill in:
   - **Title**: "Welcome to My Blog"
   - **Content**: Write something nice
   - **Upload some images** (optional)
5. Click "Save Post"

## Step 5: View Your Blog

1. Go to http://localhost:3000
2. Your post appears on the home page!
3. Click to read the full post

## That's It! 🎉

Your blog is live and ready. Now you can:
- ✍️ Write more posts
- 📸 Upload media (images, videos, audio)
- 🌓 Toggle dark mode
- 🔍 Search posts
- 📱 View on mobile

## Common Tasks

### Create a Post
- Admin Login → New Post → Fill in details → Save Post

### Edit a Post
- Admin Login → Dashboard → Click Edit on post → Make changes → Save

### Delete a Post
- Admin Login → Dashboard → Click Delete → Confirm

### Change Admin Password
- Run `npm run setup` again

### Stop the Server
- Press `Ctrl+C` in terminal

## Environment Setup

After first run, you can customize `.env`:
```
PORT=3000              # Change if port is in use
NODE_ENV=development   # Set to 'production' for deployment
SESSION_SECRET=...     # Change to random string
```

## Deployment Ready

This blog is deployment-ready for:
- **Render**: Push to GitHub, connect to Render
- **Railway**: Push to GitHub, connect to Railway
- **VPS**: Copy files, run `npm install && npm start`
- **Vercel**: Deploy frontend separately

See [README.md](./README.md) for detailed deployment instructions.

## Troubleshooting

**Port 3000 already in use?**
```bash
PORT=3001 npm start
```

**Forgot admin password?**
```bash
npm run setup
```

**Need to delete everything and start fresh?**
```bash
rm database.db
npm run setup
npm start
```

## Next Steps

1. Read [README.md](./README.md) for full documentation
2. Customize styling in `public/style.css`
3. Customize text in templates (`views/*.ejs`)
4. Deploy to your favorite platform

Enjoy! 🚀
