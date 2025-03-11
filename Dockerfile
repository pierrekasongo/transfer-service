# Use official Node.js LTS image
FROM node:18-alpine AS builder

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy the entire application
COPY . .

# Build the application
RUN npm run build

# ---- Production Image ----
FROM node:18-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy built files and dependencies from builder
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package.json ./package.json

# Expose the application's port
EXPOSE ${PORT}

# Start the NestJS application
CMD ["node", "dist/main.js"]
