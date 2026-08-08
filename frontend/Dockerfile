# Stage 1: Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and build for production
COPY . .
RUN npm run build

# Stage 2: Production stage using lightweight Nginx
FROM nginx:alpine AS runner

# Copy static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx server configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
