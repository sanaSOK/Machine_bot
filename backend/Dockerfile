# --- Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for nest build)
RUN npm ci

# Copy source files
COPY . .

# Build NestJS application
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package files and install production-only dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built dist directory from builder stage
COPY --from=builder /app/dist ./dist

# Create uploads directory for persistent attendance photos
RUN mkdir -p /app/uploads

EXPOSE 3000

CMD ["node", "dist/main.js"]
