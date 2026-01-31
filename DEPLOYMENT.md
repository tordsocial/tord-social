# Standalone Deployment Guide for toRd

This guide explains how to deploy toRd to a cPanel hosting environment with Node.js support.

## Quick Start

1. Download `tord-standalone.zip` from your project
2. Upload and extract to your cPanel hosting
3. Configure environment variables
4. Start the Node.js app

## Prerequisites

- Node.js 18 or higher on your cPanel hosting
- PostgreSQL database (you can use a free service like Neon, Supabase, or your host's PostgreSQL)
- cPanel with Node.js App Setup feature

## What's in the ZIP

```
tord-standalone/
├── dist/
│   ├── index.cjs          # Backend server (this is the startup file)
│   └── public/            # Frontend static files
├── shared/
│   └── schema.ts          # Database schema
├── uploads/               # Directory for file uploads
├── package.json
├── package-lock.json
└── drizzle.config.ts
```

## Step-by-Step cPanel Deployment

### Step 1: Get a PostgreSQL Database

If your host doesn't provide PostgreSQL, use a free cloud database:
- **Neon** (https://neon.tech) - Free tier available
- **Supabase** (https://supabase.com) - Free tier available
- **ElephantSQL** (https://elephantsql.com) - Free tier available

Copy your database connection string. It looks like:
```
postgresql://username:password@hostname:5432/database_name
```

### Step 2: Upload to cPanel

1. Login to your cPanel
2. Go to **File Manager**
3. Navigate to where you want to install (e.g., `/home/yourusername/tord.social/`)
4. Upload `tord-standalone.zip`
5. Right-click and **Extract** the ZIP file

### Step 3: Setup Node.js App in cPanel

1. Go to **cPanel > Setup Node.js App**
2. Click **Create Application**
3. Configure:
   - **Node.js version**: 18 or higher
   - **Application mode**: Production
   - **Application root**: `/home/yourusername/tord.social` (where you extracted files)
   - **Application URL**: Your domain (e.g., tord.social)
   - **Application startup file**: `dist/index.cjs`

4. Click **Create**

### Step 4: Add Environment Variables

In the same Node.js App settings page:

1. Scroll to **Environment Variables**
2. Add these variables:

| Name | Value |
|------|-------|
| DATABASE_URL | `postgresql://user:pass@host:5432/db` |
| NODE_ENV | `production` |
| DEEPSEEK_API_KEY | Your DeepSeek API key (optional, for AI chat) |

3. Click **Save**

### Step 5: Install Dependencies

1. In cPanel Node.js App page, click **Run NPM Install**
2. Or use SSH/Terminal:
```bash
cd /home/yourusername/tord.social
source /home/yourusername/nodevenv/tord.social/18/bin/activate
npm install --production
```

### Step 6: Setup Database Tables

Using SSH/Terminal:
```bash
cd /home/yourusername/tord.social
source /home/yourusername/nodevenv/tord.social/18/bin/activate
npm run db:push
```

Or run this once manually in your database:
- Connect to your PostgreSQL database
- The app will create tables automatically on first run

### Step 7: Start the Application

1. In cPanel Node.js App page, click **Restart**
2. Visit your domain to see the app running!

## Important Notes

### File Uploads
- Profile pictures and other uploads are saved in the `uploads/` folder
- Make sure this folder has write permissions (755)
- Back up this folder regularly

### Admin Panel
- Access at: `https://yourdomain.com/admin`
- Default login: **username:** `admin`, **password:** `1`
- Change this in `dist/index.cjs` for security (search for `ADMIN_PASSWORD`)

### Custom Domain Setup
1. In cPanel, go to **Domains** or **Addon Domains**
2. Point your domain to the app directory
3. Enable SSL via **SSL/TLS** settings (use free Let's Encrypt)

## Troubleshooting

### "Application Error" or 503
- Wait 30 seconds for app to start
- Check Node.js App logs in cPanel
- Verify DATABASE_URL is correct

### Database connection fails
- Check if PostgreSQL is running
- Verify connection string format
- Make sure database exists

### File uploads not working
- Check `uploads/` folder exists
- Set permissions: `chmod 755 uploads`

### Pages load but no data
- Run `npm run db:push` to create tables
- Check DATABASE_URL environment variable

## Security Recommendations

1. Change admin password in the code before deploying
2. Enable HTTPS/SSL on your domain
3. Regularly backup your database and uploads folder
4. Keep Node.js version updated

## Support

For issues:
1. Check cPanel error logs
2. Check Node.js App logs
3. Verify all environment variables are set
