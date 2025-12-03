# Deployment Guide

## Prerequisites
- MongoDB Atlas account (free tier works)
- Backend hosting platform account
- Vercel account for frontend

## Backend Deployment

### Option 1: Railway (Recommended - Supports FFmpeg)

1. **Create Railway Account**: Go to [railway.app](https://railway.app)

2. **Deploy from GitHub**:
   - Connect your GitHub repository
   - Select the `Backend` folder as root
   - Railway will auto-detect Node.js

3. **Environment Variables**:
   ```
   PORT=5000
   MONGO_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/
   CLIENT_ORIGIN=http://localhost:5173
   DEPLOYMENT_ORIGIN=https://your-app.vercel.app
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=7d
   FFMPEG_PATH=/usr/bin/ffmpeg
   ```

4. **Install FFmpeg** (Railway):
   - Create `nixpacks.toml` in Backend folder:
   ```toml
   [phases.setup]
   nixPkgs = ["ffmpeg"]
   ```

5. **Get Railway URL**: Copy your Railway app URL (e.g., `https://your-app.up.railway.app`)

### Option 2: Render

1. **Create Render Account**: Go to [render.com](https://render.com)

2. **New Web Service**:
   - Connect GitHub repository
   - Root Directory: `Backend`
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Environment Variables**: Same as Railway above, but set:
   ```
   FFMPEG_PATH=/usr/bin/ffmpeg
   ```

4. **Docker Deployment** (For FFmpeg support):
   - Create `Dockerfile` in Backend:
   ```dockerfile
   FROM node:22-alpine
   
   # Install FFmpeg
   RUN apk add --no-cache ffmpeg
   
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   
   EXPOSE 5000
   CMD ["npm", "start"]
   ```

### Option 3: Without FFmpeg (Serverless - Vercel/Netlify Functions)

**Note**: Real video thumbnails won't work. Uses SVG placeholders instead.

Update `Backend/src/services/videoProcessor.js`:
- The code already has fallback logic
- Just don't set `FFMPEG_PATH` environment variable
- SVG placeholders will be used automatically

## Frontend Deployment (Vercel)

1. **Create Vercel Account**: Go to [vercel.com](https://vercel.com)

2. **Import Project**:
   - Connect GitHub repository
   - Root Directory: `Frontend`
   - Framework Preset: Vite

3. **Environment Variables**:
   ```
   VITE_API_URL=https://your-backend.up.railway.app
   VITE_SOCKET_URL=https://your-backend.up.railway.app
   ```

4. **Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. **Deploy**: Click Deploy and wait

## MongoDB Atlas Setup

1. **Create Cluster**:
   - Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Create free M0 cluster
   - Choose region closest to your backend

2. **Database Access**:
   - Create database user with password
   - Note: username and password

3. **Network Access**:
   - Add IP: `0.0.0.0/0` (Allow from anywhere)
   - Or whitelist your backend hosting IPs

4. **Get Connection String**:
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<username>` and `<password>` with your credentials
   - Use this as `MONGO_URI`

## Post-Deployment Checklist

### Backend
- [ ] Environment variables set correctly
- [ ] MongoDB connection working
- [ ] FFmpeg available (if using real thumbnails)
- [ ] CORS origins include frontend URL
- [ ] Health check endpoint accessible: `https://your-backend.com/`

### Frontend
- [ ] Environment variables set with backend URL
- [ ] Can register/login successfully
- [ ] WebSocket connection established (check browser console)
- [ ] Video upload works
- [ ] Real-time progress updates working

### Testing
- [ ] Register users with different roles (viewer, editor, admin)
- [ ] Upload video and verify processing
- [ ] Check thumbnails (real or SVG fallback)
- [ ] Test video streaming
- [ ] Verify RBAC (viewers can't upload/delete)
- [ ] Test multi-tenant isolation with different tenantIds

## Troubleshooting

### WebSocket Connection Failed
**Problem**: `WebSocket connection to 'ws://localhost:5000' failed`

**Solutions**:
1. Update `VITE_SOCKET_URL` in Vercel to your backend URL
2. Ensure backend CORS includes `DEPLOYMENT_ORIGIN`
3. Check if backend supports WebSocket (Railway/Render do, Vercel Functions don't)

### FFmpeg Not Found
**Problem**: Thumbnails are SVG placeholders in production

**Solutions**:
1. Use Railway or Render (not Vercel/Netlify for backend)
2. Add FFmpeg to your deployment:
   - Railway: Use `nixpacks.toml`
   - Render: Use Docker with `FROM node:22-alpine` and `RUN apk add ffmpeg`
3. Or accept SVG placeholders (they still work!)

### MongoDB Connection Timeout
**Problem**: `MongooseServerSelectionError`

**Solutions**:
1. Check `MONGO_URI` is correct
2. Ensure MongoDB Atlas allows connections from `0.0.0.0/0`
3. Check username/password are URL-encoded
4. Verify cluster is running (not paused)

### CORS Errors
**Problem**: `Access-Control-Allow-Origin` errors

**Solutions**:
1. Add frontend URL to `DEPLOYMENT_ORIGIN` in backend
2. Ensure `CLIENT_ORIGIN` includes localhost for dev
3. Check both Socket.io and Express CORS configs

### Video Upload Fails
**Problem**: 413 Payload Too Large or timeout

**Solutions**:
1. Check hosting platform file size limits
2. Railway: 500MB default (configurable)
3. Render: May need to increase timeout in `render.yaml`
4. Consider using cloud storage (AWS S3, Cloudinary) for large files

## Production URLs

After deployment, update this section with your URLs:

```
Backend: https://your-backend.up.railway.app
Frontend: https://your-app.vercel.app
MongoDB: mongodb+srv://cluster.mongodb.net/
```

## Environment Variables Summary

### Backend
```env
PORT=5000
MONGO_URI=mongodb+srv://...
CLIENT_ORIGIN=http://localhost:5173
DEPLOYMENT_ORIGIN=https://your-app.vercel.app
JWT_SECRET=super-secret-key
JWT_EXPIRES_IN=7d
FFMPEG_PATH=/usr/bin/ffmpeg  # Optional, for real thumbnails
```

### Frontend
```env
VITE_API_URL=https://your-backend.up.railway.app
VITE_SOCKET_URL=https://your-backend.up.railway.app
```

## Cost Estimates

- **MongoDB Atlas**: Free (M0 cluster, 512MB storage)
- **Railway**: $5/month (500GB bandwidth, 8GB RAM)
- **Render**: Free tier available (spins down after inactivity)
- **Vercel**: Free (hobby plan, 100GB bandwidth)

**Total**: $0-5/month depending on usage
