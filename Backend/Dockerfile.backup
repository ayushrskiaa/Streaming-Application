FROM node:22-alpine

# Install FFmpeg for video thumbnail generation
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY . .

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
