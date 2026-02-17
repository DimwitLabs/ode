# Setting Up a Content Repository for Ode

Ode separates **code** and **content** so you can keep your writing clean, portable, and easy to deploy. This guide explains how to create a *content-only* repository and connect it to an Ode deployment.

## 1. What This Repository Contains

> [!NOTE]
> For theming and visual customization, see [THEMING.md](https://github.com/DeepanshKhurana/ode/blob/main/THEMING.md)

Your content repo mirrors the `public/` directory structure:

```
config.yaml
content/
  intro.md
  pieces/
  pages/
favicon.ico (optional)
```

Example `content/pieces/example.md`:

```markdown
---
title: "Example Piece"
slug: "example-piece"
date: 2025-01-01
collections: ["essays"]
---

Your writing here.
```

> [!NOTE]
> The `description` key in frontmatter is optional. If provided, it will be used as the RSS feed description for this piece or page. If not, a default will be generated automatically with the syntax: A piece from `siteTitle` | (first line of your piece)

## 2. Clone the Content Repo on Your Server

Choose a directory for your site content:

```bash
cd /srv
git clone git@github.com:YOUR_USER/YOUR_CONTENT_REPO.git my-ode-site
```

This directory will be mounted into the Ode container.

## 3. Connect Content to Ode With Docker Compose

Create a `docker-compose.yml` and mount the content repository using an **absolute path**:

```yaml
services:
  ode:
    image: ghcr.io/deepanshkhurana/ode:latest
    ports:
      - "8080:4173"
    restart: unless-stopped
    volumes:
      - /srv/my-ode-site:/app/public
```

[!NOTE]
Use an absolute path for the volume mount. Relative paths may not work correctly with tools like Portainer.

Start the container:

```bash
docker compose up -d
```

The container will build and serve your site. Restart to rebuild after content changes:

```bash
docker compose restart ode
```

## 4. (Optional) Auto-Deploy Content via GitHub Actions

Add this file in your **content repo** at `.github/workflows/deploy.yml`:

```yaml
name: Deploy Ode content

on:
  push:
    branches: ["main"]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Update content on server
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_KEY }}
          port: ${{ secrets.SSH_PORT }}
          script: |
            cd /srv/my-ode-site
            git pull
            docker restart YOUR_CONTAINER_NAME
```

## 5. GitHub Secrets (Required)

Add these in your **content repo** under:

**Settings → Secrets and variables → Actions**

| Secret | Description |
|--------|-------------|
| `SSH_HOST` | Server IP or domain |
| `SSH_USER` | User with SSH + Docker access |
| `SSH_KEY` | Private SSH key |
| `SSH_PORT` | SSH port (usually 22) |

Ensure the *public* key is added to `~/.ssh/authorized_keys` on your server.

## 6. Alternative: Portainer Webhook

If using Portainer, you can use a webhook instead of SSH:

1. In Portainer, go to your container → **Webhooks**
2. Enable and copy the webhook URL
3. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Ode content

on:
  push:
    branches: ["main"]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Pull content and restart
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_KEY }}
          port: ${{ secrets.SSH_PORT }}
          script: |
            cd /srv/my-ode-site
            git pull

      - name: Trigger Portainer Webhook
        run: curl -X POST "${{ secrets.PORTAINER_WEBHOOK_URL }}"
```

Add `PORTAINER_WEBHOOK_URL` to your repo secrets.

## 7. Deployment Flow

1. You push new content  
2. GitHub Action runs  
3. Server pulls latest content  
4. Container restarts  
5. Site rebuilds with new content  

## 8. Manual Commands (For Debugging)

```bash
# Pull latest content
cd /srv/my-ode-site
git pull

# Restart container
docker restart YOUR_CONTAINER_NAME

# Check logs
docker logs YOUR_CONTAINER_NAME --tail 50
```

## Summary

- Keep content in a separate repo mirroring `public/` structure
- Mount the entire repo to `/app/public` in the container
- Use GitHub Actions for auto-deploy on push
- Restart the container to rebuild with new content  
