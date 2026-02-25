# nginx Configuration

This directory contains nginx configuration templates for self-hosting Ode.

## Files

- **bot-map.conf**: Bot detection maps (must be placed at http level)
- **site.conf**: Server block template

## Setup

### 1. Install the bot detection map

Copy `bot-map.conf` to your nginx conf.d directory:

```bash
sudo cp bot-map.conf /etc/nginx/conf.d/bot-map.conf
```

### 2. Configure the site

Copy `site.conf` and edit it:

```bash
sudo cp site.conf /etc/nginx/sites-available/your-domain.com
```

Replace in the file:
- `your-domain.com` with your actual domain
- `PORT` with the port your Ode container is running on (e.g., `8080`)
- `YOUR_PROJECT_NAME` with your project name (for 502 error page)

### 3. Enable and reload

```bash
sudo ln -s /etc/nginx/sites-available/your-domain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## What this does

- Proxies requests to your Ode container
- Handles SPA routing (404 → index.html)
- Serves RSS feed at `/feed.xml` and `/feed/`
- Serves sitemap at `/sitemap.xml` and `/sitemap/`
- Serves pre-rendered meta pages to bots for social card previews (WhatsApp, LinkedIn, Twitter, etc.)

## Serving generated files directly (optional)

For better performance with bot detection, you can serve the generated files directly from disk instead of proxying through the container. This is useful if you want nginx to serve the meta pages without going through the app.

### Option A: Host from /var/www (recommended)

Create a symlink or copy the generated directory:

```bash
sudo mkdir -p /var/www/your-project
sudo ln -s /path/to/your/public/generated /var/www/your-project/generated
```

Then update the `/generated/` location in your site config:

```nginx
location /generated/ {
    alias /var/www/your-project/generated/;
}
```

### Option B: Fix permissions on home directory

If your app runs from a home directory (e.g., `/home/user/...`), nginx needs read access:

```bash
chmod +x /home/user
chmod -R +r /home/user/your-project/public/generated
```

Then use an alias:

```nginx
location /generated/ {
    alias /home/user/your-project/public/generated/;
}
```

