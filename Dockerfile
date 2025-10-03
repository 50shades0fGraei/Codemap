# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the app
COPY . .

# Build the Vite app
RUN npm run build

# Install a simple static server to serve the built files
RUN npm install -g serve

# Expose port 4173 (default Vite preview port)
EXPOSE 4173

# Start the app using serve
CMD ["serve", "-s", "dist"]
