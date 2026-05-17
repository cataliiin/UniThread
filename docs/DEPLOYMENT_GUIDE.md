# Deployment Guide - DigitalOcean & GitHub Actions CI/CD

This guide provides a step-by-step roadmap to deploy the **UniThread** full-stack application on a **DigitalOcean Droplet (VPS)** with a fully automated **GitHub Actions** Continuous Deployment (CD) pipeline.

With this setup, every time you push code or merge a Pull Request into the `main` branch, your application will build and deploy live in under 2 minutes!

---

## 🏗️ Architecture Overview

* **Droplet (VPS)**: A lightweight, cost-efficient Ubuntu server with Docker pre-installed.
* **Orchestration**: Runs the entire multi-service stack (`db`, `minio`, `backend`, `frontend`, `nginx`) in production mode.
* **CI/CD Gateway**: GitHub Actions secure SSH connection to pull files, inject production credentials, and trigger builds.
* **SSL Gateway**: Cloudflare Proxy provides free SSL termination, DDoS protection, and CDN caching.

---

## Step 1: Create the DigitalOcean Droplet

To save time and avoid installing Docker manually, use the official pre-configured marketplace image:

1. Log into your **DigitalOcean Console**.
2. Click **Create** -> **Droplets**.
3. Under **Choose an image**, select the **Marketplace** tab and search for **"Docker on Ubuntu"**.
4. Choose the CPU Options: **Basic** (Shared CPU) -> **Regular SSD** ($4 to $6/month is more than enough for development and demo stages).
5. Choose a datacenter region close to your users (e.g., Frankfurt/London for Europe).
6. Under **Authentication**, select **SSH Key** (highly recommended) and follow the prompts to add your public SSH key, or select **Password** and write a secure password.
7. Click **Create Droplet** and wait for it to provision. Note the **Public IP Address** (e.g., `123.45.67.89`).

---

## Step 2: Configure SSH Security Keys

GitHub Actions needs a secure private key to connect to your Droplet via SSH.

1. **Generate a dedicated SSH Key Pair** on your local machine:
   ```bash
   ssh-keygen -t ed25519 -C "unithread-deploy"
   ```
   *This creates two files: a private key (`id_ed25519`) and a public key (`id_ed25519.pub`).*

2. **Add the Public Key to the Droplet**:
   Connect to your Droplet via terminal:
   ```bash
   ssh root@your_droplet_ip
   ```
   Append the content of your local `id_ed25519.pub` into the file `/root/.ssh/authorized_keys` inside the Droplet.

---

## Step 3: Add GitHub Secrets to your Repository

To keep credentials secure, we pass them as GitHub Secrets. 

Go to your repository on GitHub: **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**.

Create the following **6 Secrets**:

### 1. `DO_HOST`
* **Value**: Your Droplet's public IP address (e.g., `123.45.67.89`).

### 2. `DO_USERNAME`
* **Value**: `root`

### 3. `DO_SSH_KEY`
* **Value**: Paste the **entire content** of your private SSH key (`id_ed25519`) generated in Step 2.

### 4. `PROD_ENV` (Root Production Configuration)
* **Value**:
  ```ini
  BACKEND_PORT=8000
  FRONTEND_PORT=3000
  MINIO_PORT=9000
  MINIO_CONSOLE_PORT=9001
  DB_PORT=5432
  NGINX_PORT=80

  MINIO_ROOT_USER=unithread_admin
  MINIO_ROOT_PASSWORD=YOUR_SECURE_RANDOM_MINIO_PASSWORD

  POSTGRES_USER=unithread_db_user
  POSTGRES_PASSWORD=YOUR_SECURE_RANDOM_DB_PASSWORD
  POSTGRES_DB=unithread
  ```

### 5. `BACKEND_PROD_ENV` (Backend Production Configuration)
* **Value**:
  ```ini
  PROJECT_NAME="UniThread"
  PROJECT_DESCRIPTION="A community and academic collaborative space."
  DEBUG=False
  JWT_SECRET_KEY=YOUR_SECURE_RANDOM_JWT_SECRET_KEY

  DATABASE_URL="postgresql+asyncpg://unithread_db_user:YOUR_SECURE_RANDOM_DB_PASSWORD@db:5432/unithread"

  MINIO_ENDPOINT="minio:9000"
  MINIO_ACCESS_KEY="unithread_admin"
  MINIO_SECRET_KEY="YOUR_SECURE_RANDOM_MINIO_PASSWORD"
  MINIO_PUBLIC_URL="https://yourdomain.com/storage"

  BACKEND_CORS_ORIGINS='["https://yourdomain.com"]'
  HEALTH_CHECK_INTERVAL=10
  ```

### 6. `FRONTEND_PROD_ENV` (Frontend Production Configuration)
* **Value**:
  ```ini
  PUBLIC_API_URL=https://yourdomain.com/api
  VITE_STORAGE_URL=https://yourdomain.com/storage
  ```

*(Make sure to replace `yourdomain.com` with your actual custom domain or your Droplet IP if not using a domain!)*

---

## Step 4: Run the First Deploy!

Everything is configured! Just commit your changes and push to GitHub:

```bash
git add .
git commit -m "feat(infra): configure digitalocean deploy flow"
git push origin main
```

1. Go to your GitHub Repository webpage.
2. Click on the **Actions** tab.
3. You will see the **Deploy to DigitalOcean** workflow running!
4. Once completed (green checkmark), your app will be live and running securely on DigitalOcean!

---

## 🛠️ Maintenance & Useful Commands

If you need to log into the Droplet to check logs or status manually:

* **View running containers**:
  ```bash
  docker compose --profile production ps
  ```
* **Read live backend/frontend logs**:
  ```bash
  cd /var/www/unithread
  docker compose --profile production logs -f backend
  docker compose --profile production logs -f frontend
  ```
* **Restart the production stack**:
  ```bash
  docker compose --profile production restart
  ```
