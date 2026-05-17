# ==============================================================================
# UniThread - SvelteKit Frontend Dockerfile
# ==============================================================================

FROM node:20-alpine

WORKDIR /app

# Copy package management files first for efficient caching
COPY package*.json ./

# Install npm dependencies (including devDependencies needed by Vite)
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose SvelteKit default port (port 3000 is used inside the container)
EXPOSE 3000

# Set environment variables for Vite/SvelteKit to listen on all interfaces
ENV HOST=0.0.0.0 \
    PORT=3000

# Run the SvelteKit development server with host and port arguments
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
