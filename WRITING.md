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

> [!NOTE]
> Use an absolute path for the volume mount. Relative paths may not work correctly with tools like Portainer.

Start the container:

```bash
docker compose up -d
```

The container will build and serve your site. Restart to rebuild after content changes:

```bash
docker compose restart ode
```

## 4. GitHub Secrets (Required)

### SSH Key Setup

Generate an SSH key (ed25519 recommended):

```bash
ssh-keygen -t ed25519 -C "ode-deploy"
```

Press enter to accept defaults. When prompted for a passphrase, leave it empty for GitHub Actions.

This creates:

```
~/.ssh/id_ed25519
~/.ssh/id_ed25519.pub
```

### Add the Public Key to the Server

Copy the public key:

```bash
cat ~/.ssh/id_ed25519.pub
```

SSH into your server:

```bash
ssh root@your-server-ip
```

On the server:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
```

Paste the public key on its own line, then:

```bash
chmod 600 ~/.ssh/authorized_keys
```

### Test the SSH Connection

From your local machine:

```bash
ssh -i ~/.ssh/id_ed25519 root@your-server-ip
```

If this works without prompting for a password, SSH is configured correctly. Exit with `Ctrl + D`.

### Add Secrets to GitHub

In your content repo, go to **Settings → Secrets and variables → Actions** and add:

| Secret | Description |
|--------|-------------|
| `SSH_HOST` | Server IP or domain |
| `SSH_USER` | User with SSH + Docker access (e.g. `root`) |
| `SSH_KEY` | Full private key contents (including `-----BEGIN/END-----` lines) |
| `SSH_PORT` | SSH port (usually `22`) |

For `SSH_KEY`, paste the entire private key including:

```
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

## 5. Auto-Deploy Content via GitHub Actions

Add this file in your **content repo** at `.github/workflows/deploy.yml`:

```yaml
name: Deploy content

on:
  push:
    branches: ["main"]

jobs:
  deploy:
    runs-on: ubuntu-latest

    env:
      PROJECT_NAME: your-project
      APP_DIR: your-site
      BACKUP_DIR: your-site.backup
      SERVICE_NAME: ode
      REPO_URL: git@github.com:YOUR_USER/YOUR_CONTENT_REPO.git

    steps:
      - name: Destructive deploy and restart Ode
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_KEY }}
          envs: PROJECT_NAME,APP_DIR,BACKUP_DIR,SERVICE_NAME,REPO_URL
          script: |
            set -e
            echo "⚠️  DESTRUCTIVE DEPLOY: /root/${APP_DIR} will be replaced (previous state kept at /root/${BACKUP_DIR})"
            cd /root
            if [ -d "${APP_DIR}" ]; then
              rm -rf "${BACKUP_DIR}"
              mv "${APP_DIR}" "${BACKUP_DIR}"
            fi
            git clone "${REPO_URL}" "${APP_DIR}"
            cd "${APP_DIR}"
            docker compose -p "${PROJECT_NAME}" up -d --force-recreate "${SERVICE_NAME}"
            docker ps --format "table {{.Names}}\t{{.Status}}" | grep "${PROJECT_NAME}-${SERVICE_NAME}" || true
            STATIC_DIR="/var/www/${PROJECT_NAME}-static"
            [ ! -d "${STATIC_DIR}" ] && mkdir -p "${STATIC_DIR}"
            GENERATED_502="${APP_DIR}/generated/502.html"
            echo "Waiting for 502 page to be generated..."
            for i in {1..60}; do
              if [ -f "${GENERATED_502}" ]; then
                cp "${GENERATED_502}" "${STATIC_DIR}/502.html"
                echo "502 page copied successfully"
                break
              fi
              echo "Build in progress... ($i/60)"
              sleep 2
            done
```

> [!WARNING]
> This workflow is destructive. On every push: the server directory is deleted, fresh-cloned, and only one backup is kept. Ensure all content lives in Git.

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
