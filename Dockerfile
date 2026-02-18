# =====================
# Stage 1: Build
# =====================
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first (layer cache optimization)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# =====================
# Stage 2: Production
# =====================
FROM nginx:stable-alpine AS production

# Install openssl for self-signed cert fallback (development only)
RUN apk add --no-cache openssl

# Copy custom nginx config (HTTPS + HTTP redirect)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Create directory for SSL certificates
# In production, mount your IONOS/Let's Encrypt certs here via Docker volume or bind mount:
#   docker run -v /path/to/certs:/etc/nginx/ssl ...
RUN mkdir -p /etc/nginx/ssl

# Generate a self-signed certificate as fallback for local testing.
# In production this directory should be overridden with real certificates.
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/privkey.pem \
    -out /etc/nginx/ssl/fullchain.pem \
    -subj "/C=ES/ST=Madrid/L=Madrid/O=WeatherPWA/CN=localhost"

# Expose HTTP and HTTPS ports
EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
