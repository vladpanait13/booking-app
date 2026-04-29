# Deployment Guide: From Local Code to "staybooker.com"

## The Big Picture

Right now your app runs on `localhost:3000` — only your machine can see it. To make it available at `staybooker.com`, you need three things:

1. **A server** — A computer that's always on, connected to the internet, running your app 24/7
2. **A domain name** — The "staybooker.com" address that people type
3. **DNS configuration** — The system that connects the domain name to your server's IP address

Think of it like opening a shop:
- The **server** is the building you rent
- The **domain** is the street address
- **DNS** is the postal system that knows how to find your building

---

## Table of Contents

1. [Step 1: Prepare Your App for Production](#step-1-prepare-your-app-for-production)
2. [Step 2: Choose a Hosting Provider](#step-2-choose-a-hosting-provider)
3. [Step 3: Set Up Your Server (VPS Option)](#step-3-set-up-your-server-vps-option)
4. [Step 4: Deploy Your Code to the Server](#step-4-deploy-your-code-to-the-server)
5. [Step 5: Install Dependencies & Run the App](#step-5-install-dependencies--run-the-app)
6. [Step 6: Keep Your App Running Forever (PM2)](#step-6-keep-your-app-running-forever-pm2)
7. [Step 7: Set Up Nginx (Reverse Proxy)](#step-7-set-up-nginx-reverse-proxy)
8. [Step 8: Buy a Domain Name](#step-8-buy-a-domain-name)
9. [Step 9: Point Your Domain to Your Server (DNS)](#step-9-point-your-domain-to-your-server-dns)
10. [Step 10: Set Up HTTPS/SSL (Free with Let's Encrypt)](#step-10-set-up-httpsssl-free-with-lets-encrypt)
11. [Step 11: Final Verification](#step-11-final-verification)
12. [Alternative: Deploy to a Platform (Easier but Less Control)](#alternative-deploy-to-a-platform-easier-but-less-control)
13. [Troubleshooting](#troubleshooting)

---

## Step 1: Prepare Your App for Production

Before deploying, make a few changes to secure your app.

### 1.1 Create a `.env` file (DO NOT commit this to Git)

Create a file called `.env` in your project root:

```env
PORT=3000
JWT_SECRET=generate-a-random-64-character-string-here
NODE_ENV=production
```

To generate a secure JWT secret, run this in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 1.2 Create a `.gitignore` file

Create a `.gitignore` so you don't accidentally push sensitive files:

```gitignore
node_modules/
database.db
.env
uploads/
```

### 1.3 Update your server.js to use environment variables

In `server.js`, the port already reads from `process.env.PORT`. 

In `middleware/auth.js`, the JWT_SECRET already falls back to the env variable:
```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
```

For production, make sure the `JWT_SECRET` environment variable is SET so it doesn't use the insecure default.

### 1.4 Push your code to GitHub

If you haven't already:
```bash
# Initialize a git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - StayBooker booking app"

# Create a repository on GitHub (github.com/new), then:
git remote add origin https://github.com/YOUR_USERNAME/staybooker.git
git branch -M main
git push -u origin main
```

---

## Step 2: Choose a Hosting Provider

You have two main paths:

| Approach | Providers | Cost | Complexity | Best For |
|----------|-----------|------|------------|----------|
| **VPS (Virtual Private Server)** | DigitalOcean, Linode, Vultr, Hetzner | $4-12/month | Medium | Full control, learning |
| **Platform-as-a-Service** | Railway, Render, Fly.io | Free tier → $5+/month | Low | Quick deployment |
| **Cloud Providers** | AWS EC2, Google Cloud, Azure | $5-50+/month | High | Enterprise scale |

**My recommendation for your first deployment: DigitalOcean Droplet ($6/month)**
- Simple interface
- Excellent documentation
- Enough power for this app
- You'll learn real server management

---

## Step 3: Set Up Your Server (VPS Option)

Using **DigitalOcean** as the example (other VPS providers are nearly identical):

### 3.1 Create an Account
1. Go to [digitalocean.com](https://www.digitalocean.com)
2. Sign up (they may give you $200 free credits for new accounts)

### 3.2 Create a Droplet (Virtual Server)
1. Click **"Create" → "Droplets"**
2. Choose settings:
   - **Image:** Ubuntu 22.04 LTS
   - **Plan:** Basic → Regular → $6/month (1 GB RAM, 1 CPU, 25 GB disk)
   - **Region:** Choose closest to your target users (e.g., Frankfurt for Europe, New York for US)
   - **Authentication:** Choose **SSH Key** (more secure) or **Password**
3. Click **"Create Droplet"**

You'll get an **IP address** (e.g., `164.92.105.42`). This is your server's address on the internet.

### 3.3 Connect to Your Server

Open your terminal (PowerShell, Command Prompt, or Git Bash) and connect:

```bash
ssh root@164.92.105.42
```

If using a password, it will prompt you. If using an SSH key, you'll connect automatically.

> **What is SSH?** It's like a remote desktop but text-only. You type commands that execute on the remote server.

### 3.4 Initial Server Setup

Once connected, run these commands on the server:

```bash
# Update the system packages
apt update && apt upgrade -y

# Create a non-root user (never run apps as root in production)
adduser staybooker
usermod -aG sudo staybooker

# Switch to the new user
su - staybooker
```

### 3.5 Install Node.js on the Server

```bash
# Install Node.js 20 LTS (using NodeSource repository)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version   # Should show v20.x.x
npm --version    # Should show 10.x.x
```

---

## Step 4: Deploy Your Code to the Server

### Option A: Clone from GitHub (Recommended)

```bash
# On the server, as user 'staybooker':
cd ~
git clone https://github.com/YOUR_USERNAME/staybooker.git app
cd app
```

### Option B: Upload directly with SCP (if not using GitHub)

From your LOCAL machine (not the server):
```bash
# Copy entire project folder to server
scp -r "c:\Users\panait.v\OneDrive - Procter and Gamble\Desktop\booking web app\*" staybooker@164.92.105.42:~/app/
```

---

## Step 5: Install Dependencies & Run the App

On the server:

```bash
cd ~/app

# Install production dependencies
npm install --production

# Create the .env file on the server
nano .env
```

In nano (text editor), type:
```env
PORT=3000
JWT_SECRET=paste-your-generated-secret-here
NODE_ENV=production
```
Press `Ctrl+X`, then `Y`, then `Enter` to save.

```bash
# Seed the database
npm run seed

# Test that the app starts
node server.js
```

You should see: `🏠 Booking app server running on http://localhost:3000`

Press `Ctrl+C` to stop it (we'll set up proper process management next).

**Quick test:** From your local machine, open a browser and go to `http://164.92.105.42:3000`. You should see your app! (Replace with your actual server IP.)

> **If it doesn't work:** Your server's firewall might be blocking port 3000. Run: `sudo ufw allow 3000`

---

## Step 6: Keep Your App Running Forever (PM2)

When you close your SSH connection, the app would normally stop. **PM2** is a process manager that keeps your app running 24/7, restarts it if it crashes, and starts it on server reboot.

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start your app with PM2
cd ~/app
pm2 start server.js --name "staybooker"

# Check it's running
pm2 status

# View logs
pm2 logs staybooker

# Make PM2 start on server reboot
pm2 startup
# (It will print a command — copy and run that command)
pm2 save
```

**Useful PM2 commands:**
```bash
pm2 restart staybooker   # Restart the app
pm2 stop staybooker      # Stop the app
pm2 logs staybooker      # View live logs
pm2 monit                # Real-time monitoring dashboard
```

---

## Step 7: Set Up Nginx (Reverse Proxy)

Your app runs on port 3000, but websites should be accessible on port 80 (HTTP) and 443 (HTTPS). **Nginx** sits in front of your app and forwards requests.

```
User → staybooker.com:443 → Nginx → localhost:3000 → Your App
```

### 7.1 Install Nginx

```bash
sudo apt install -y nginx
```

### 7.2 Configure Nginx

Create a new configuration file:

```bash
sudo nano /etc/nginx/sites-available/staybooker
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name staybooker.com www.staybooker.com;

    # Proxy all requests to your Node.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve uploaded files efficiently
    location /uploads/ {
        alias /home/staybooker/app/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
        proxy_pass http://localhost:3000;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 7.3 Enable the Configuration

```bash
# Create a symbolic link to enable the site
sudo ln -s /etc/nginx/sites-available/staybooker /etc/nginx/sites-enabled/

# Remove the default site
sudo rm /etc/nginx/sites-enabled/default

# Test the configuration for syntax errors
sudo nginx -t

# If it says "syntax is ok", reload Nginx
sudo systemctl reload nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

### 7.4 Configure the Firewall

```bash
# Allow HTTP and HTTPS traffic
sudo ufw allow 'Nginx Full'

# Allow SSH (so you don't lock yourself out!)
sudo ufw allow OpenSSH

# Enable the firewall
sudo ufw enable

# Check status
sudo ufw status
```

Now your app is accessible at `http://164.92.105.42` (port 80, no need to type :3000).

---

## Step 8: Buy a Domain Name

### 8.1 Choose a Domain Registrar

| Registrar | Price (.com) | Notes |
|-----------|-------------|-------|
| [Namecheap](https://namecheap.com) | ~$9/year | Popular, good UI, free WhoisGuard privacy |
| [Cloudflare Registrar](https://dash.cloudflare.com) | ~$9/year | At-cost pricing (no markup), free DNS/CDN |
| [Google Domains](https://domains.google) | ~$12/year | Clean interface, free privacy |
| [GoDaddy](https://godaddy.com) | ~$12/year | Largest registrar, lots of upsells |

### 8.2 Purchase the Domain

1. Go to your chosen registrar
2. Search for "staybooker.com" (or your preferred domain)
3. Add to cart and purchase
4. Enable **WHOIS Privacy** (hides your personal info from public records)

> **Tip:** If `.com` is taken, consider `.io`, `.co`, `.app`, or `.travel`

---

## Step 9: Point Your Domain to Your Server (DNS)

DNS (Domain Name System) is the internet's phone book. It translates "staybooker.com" into your server's IP address (164.92.105.42).

### 9.1 Configure DNS Records

Go to your domain registrar's DNS management panel and add these records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| **A** | `@` | `164.92.105.42` | 300 |
| **A** | `www` | `164.92.105.42` | 300 |

**Explanation:**
- **A Record** — Maps a domain name to an IPv4 address
- **`@`** — Represents the root domain (staybooker.com)
- **`www`** — The subdomain (www.staybooker.com)
- **TTL 300** — Time-to-live in seconds (how long DNS servers cache this record)

### 9.2 Wait for Propagation

DNS changes take time to spread across the internet. It can take:
- **5 minutes** (if you just registered the domain)
- **Up to 48 hours** (worst case, though usually 15-30 minutes)

### 9.3 Verify DNS is Working

From your local machine:
```bash
# Check if domain points to your IP
nslookup staybooker.com

# Or use ping
ping staybooker.com
```

You should see your server's IP address in the response.

At this point, `http://staybooker.com` should show your app! But it's still HTTP (not secure). Let's fix that.

---

## Step 10: Set Up HTTPS/SSL (Free with Let's Encrypt)

HTTPS encrypts traffic between the user's browser and your server. Without it:
- Browsers show "Not Secure" warnings
- Passwords are sent in plain text
- Google penalizes your search ranking

**Let's Encrypt** provides free SSL certificates. **Certbot** automates the setup.

### 10.1 Install Certbot

On your server:
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 10.2 Get Your Certificate

```bash
sudo certbot --nginx -d staybooker.com -d www.staybooker.com
```

Certbot will:
1. Ask for your email (for renewal notifications)
2. Ask you to agree to terms of service
3. Verify you own the domain (via HTTP challenge)
4. Download and install the SSL certificate
5. Automatically modify your Nginx config for HTTPS
6. Set up HTTP → HTTPS redirect

### 10.3 Verify Auto-Renewal

Certificates expire after 90 days. Certbot sets up a timer to renew them automatically, but let's verify:

```bash
# Test renewal process
sudo certbot renew --dry-run
```

If it says "Congratulations, all simulated renewals succeeded" — you're good.

### 10.4 Test HTTPS

Open your browser and go to `https://staybooker.com`. You should see:
- 🔒 A padlock icon in the address bar
- Your StayBooker application loading correctly
- `http://staybooker.com` automatically redirects to `https://staybooker.com`

---

## Step 11: Final Verification

### Checklist

- [ ] `https://staybooker.com` loads the app
- [ ] `https://www.staybooker.com` loads the app (or redirects to non-www)
- [ ] `http://staybooker.com` redirects to HTTPS
- [ ] Login/Register works
- [ ] Property search works
- [ ] Creating a booking works
- [ ] Browser shows 🔒 padlock (valid SSL)
- [ ] Page refresh on `/trips` or `/property/5` works (not 404)
- [ ] Mobile devices can access the site

### Monitor Your App

```bash
# Check app status
pm2 status

# View error logs
pm2 logs staybooker --err

# Check server resources
htop

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## Alternative: Deploy to a Platform (Easier but Less Control)

If managing a VPS feels overwhelming, these platforms handle the infrastructure for you:

---

### Option A: Railway (Easiest, Recommended for Beginners)

**Cost:** Free tier (500 hours/month), then $5/month  
**Time to deploy:** ~5 minutes

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click **"New Project" → "Deploy from GitHub Repo"**
4. Select your repository
5. Railway auto-detects it's a Node.js app
6. Add environment variables:
   - `JWT_SECRET` = your generated secret
   - `NODE_ENV` = production
7. It deploys automatically and gives you a URL like `staybooker-production.up.railway.app`
8. To add your custom domain:
   - Go to Settings → Domains → Add Custom Domain
   - Enter `staybooker.com`
   - It gives you a CNAME record to add at your registrar
   - Railway handles SSL automatically

---

### Option B: Render

**Cost:** Free tier (spins down after 15 min inactivity), $7/month for always-on  
**Time to deploy:** ~5 minutes

1. Go to [render.com](https://render.com)
2. Sign up → **"New" → "Web Service"**
3. Connect your GitHub repo
4. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment Variables:** Add `JWT_SECRET` and `NODE_ENV`
5. Click "Create Web Service"
6. Custom domain: Settings → Custom Domains → Add your domain

---

### Option C: Fly.io

**Cost:** Free tier (3 shared VMs), then $2-5/month  
**Time to deploy:** ~10 minutes

1. Install Fly CLI: `iwr https://fly.io/install.ps1 -useb | iex` (PowerShell)
2. Sign up: `fly auth signup`
3. In your project directory:
   ```bash
   fly launch
   ```
4. Answer the prompts (app name, region)
5. Set secrets:
   ```bash
   fly secrets set JWT_SECRET=your-secret-here
   fly secrets set NODE_ENV=production
   ```
6. Deploy:
   ```bash
   fly deploy
   ```
7. Custom domain:
   ```bash
   fly certs add staybooker.com
   ```

---

### Platform Comparison for Custom Domains

Regardless of platform, the process for connecting `staybooker.com` is:

1. **Platform gives you a DNS record** (either A record with IP, or CNAME with their hostname)
2. **You add that record at your domain registrar**
3. **Platform provisions SSL automatically**
4. **Wait 5-30 minutes for DNS propagation**

---

## Deploying Updates

After your initial deployment, here's how to push updates:

### On a VPS (DigitalOcean):

```bash
# SSH into your server
ssh staybooker@164.92.105.42

# Go to app directory
cd ~/app

# Pull latest code
git pull origin main

# Install any new dependencies
npm install --production

# Restart the app
pm2 restart staybooker
```

### On Railway/Render/Fly.io:

Just push to GitHub:
```bash
git add .
git commit -m "Update: added new feature"
git push origin main
```
The platform automatically detects the push and redeploys. Zero manual work.

---

## Complete Visual Flow

Here's what happens when someone types `staybooker.com` in their browser:

```
User types: staybooker.com
        │
        ▼
Browser asks DNS: "What's the IP for staybooker.com?"
        │
        ▼
DNS responds: "164.92.105.42"
        │
        ▼
Browser connects to 164.92.105.42:443 (HTTPS)
        │
        ▼
Nginx receives the request
  ├── Terminates SSL (decrypts HTTPS)
  ├── Forwards to localhost:3000
  │
  ▼
Express.js receives request for "/"
  ├── Not an API route
  ├── Not a static file
  ├── Catches with: app.get('*', ...) → sends index.html
  │
  ▼
Browser receives index.html
  ├── Downloads styles.css, api.js, app.js, pages.js
  ├── JavaScript executes
  ├── DOMContentLoaded fires
  ├── checkAuth() → tries to restore login from localStorage
  ├── handleRoute() → sees path is "/" → calls renderHomePage()
  ├── renderHomePage() → calls api.getProperties()
  │
  ▼
Browser sends: GET /api/properties
        │
        ▼
Express → properties router → queryAll → returns JSON
        │
        ▼
Browser receives property data → renders property cards
        │
        ▼
User sees the fully loaded StayBooker homepage! 🎉
```

---

## Cost Summary

### Minimum Viable Deployment:

| Item | Cost | Provider |
|------|------|----------|
| VPS Server | $6/month | DigitalOcean (1GB RAM) |
| Domain Name | $9/year (~$0.75/month) | Namecheap |
| SSL Certificate | Free | Let's Encrypt |
| **Total** | **~$7/month** | |

### Free Option (with limitations):

| Item | Cost | Provider |
|------|------|----------|
| Hosting | Free | Railway / Render free tier |
| Domain Name | $9/year | Namecheap |
| SSL Certificate | Free | Automatic with platform |
| **Total** | **~$0.75/month** | |

---

## Troubleshooting

### "Site can't be reached" after setting up DNS
- DNS propagation takes time (up to 48 hours, usually 15 min)
- Verify with: `nslookup staybooker.com`
- Check your server is running: `pm2 status`
- Check Nginx is running: `sudo systemctl status nginx`

### "502 Bad Gateway" from Nginx
- Your Node.js app isn't running
- Fix: `pm2 restart staybooker` or check logs: `pm2 logs staybooker --err`

### App works on IP but not on domain
- DNS not propagated yet OR Nginx `server_name` doesn't match your domain
- Check Nginx config: `sudo cat /etc/nginx/sites-available/staybooker`

### "ERR_CONNECTION_REFUSED" on port 3000
- Firewall blocking it: `sudo ufw allow 3000` (for testing only)
- After Nginx is set up, users should access port 80/443, not 3000

### HTTPS certificate errors
- Run: `sudo certbot --nginx -d staybooker.com -d www.staybooker.com`
- Make sure port 80 is open: `sudo ufw allow 80`
- Check domain points to your server first

### App crashes on the server
- Check logs: `pm2 logs staybooker --err --lines 50`
- Common issue: missing `.env` file or environment variables
- Check memory: `free -m` (1GB servers can run out with large datasets)

### Database issues after deployment
- Run seed: `cd ~/app && npm run seed`
- Check file permissions: `ls -la database.db`
- Make sure the app user owns the file: `chown staybooker:staybooker database.db`

---

## Security Checklist for Production

Before going live, ensure:

- [ ] `JWT_SECRET` is a long random string (not the default)
- [ ] `.env` file is NOT committed to Git
- [ ] Server firewall (UFW) is enabled
- [ ] Only ports 22 (SSH), 80 (HTTP), 443 (HTTPS) are open
- [ ] SSH login uses key-based auth (disable password login for extra security)
- [ ] HTTPS is working (SSL certificate installed)
- [ ] `node_modules/` is in `.gitignore`
- [ ] Server is regularly updated: `sudo apt update && sudo apt upgrade`

---

*This guide was written for StayBooker v1.0.0. Last updated: April 2026.*
