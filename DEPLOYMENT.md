# Production Deployment Guide

This guide explains how to deploy the **Bullish Clash** application on your server with IP `192.168.43.131`.

## Prerequisites

- **Docker** and **Docker Compose** installed on the server.
- The project files must be present on the server.

## 1. Environment Configuration

Create a `.env` file in the root directory of the project (where `docker-compose.yml` is located).

```bash
touch .env
```

Paste the following configuration into the `.env` file. This configuration is tailored for your IP address.

```env
# --- General Settings ---
NODE_ENV=production
TZ=Asia/Kathmandu

# --- Database ---
DB_USER=postgres
DB_PASSWORD=secure_password_please_change
DB_NAME=bullish_clash

# --- JWT Auth (Change these for production!) ---
JWT_SECRET=production_secret_key_change_this_immediately
JWT_EXPIRES_IN=7d

# --- Network Configuration (Your IP: 192.168.43.131) ---
# The URL where the frontend communicates with the API
API_URL=http://192.168.43.131/api
# The WebSocket URL for real-time features
WS_URL=http://192.168.43.131
# Allowed origins for CORS (the frontend URL)
CORS_ORIGIN=http://192.168.43.131

# --- Docker Internal Ports (Optional overrides) ---
# PORT=4000
```

## 2. Start the Application

Run the following command to build the images and start the containers in detached mode.

```bash
docker-compose up -d --build
```

## 3. Verify Deployment

Wait a few moments for the database and services to initialize.

- **Frontend**: Access [http://192.168.43.131](http://192.168.43.131) in your browser.
- **Backend API**: Check health at [http://192.168.43.131/health](http://192.168.43.131/health) (should return `healthy`).
- **API Docs**: Access Swagger docs at [http://192.168.43.131/docs](http://192.168.43.131/docs).

## 4. Management Commands

- **Stop containers**:
  ```bash
  docker-compose down
  ```
- **View logs**:
  ```bash
  docker-compose logs -f
  ```
- **View specific logs** (e.g., api):
  ```bash
  docker-compose logs -f api
  ```

## 5. Troubleshooting

- **Database Connection Error**: If the API fails to connect to the DB on first run, it might be because the database is initializing. The service is configured to restart automatically, so give it a minute.
- **CORS Issues**: Ensure `CORS_ORIGIN` matches exactly the URL you are using to access the site in the browser.
- **WebSocket Connection Failed**: Ensure your firewall allows traffic on port 80 (and 443 if you enable SSL later). Nginx proxies WebSocket connections via port 80.
