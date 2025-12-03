FROM node:22-alpine

# Install FFmpeg for video thumbnail generation
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Copy Backend package files
COPY Backend/package*.json ./

# Install dependencies
RUN npm install --production

# Copy Backend application files
COPY Backend/ ./

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
