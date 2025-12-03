# Video Streaming Application

A comprehensive full-stack video streaming platform with real-time processing updates, role-based access control, and multi-tenant architecture.

## Features

- 🎥 **Video Upload & Management**: Upload videos with metadata, track processing status
- 🖼️ **Real Video Thumbnails**: Automatic thumbnail extraction from uploaded videos using FFmpeg
- ⚡ **Real-time Updates**: Live progress tracking using Socket.io
- 🔒 **Role-Based Access Control**: Three user roles (Viewer, Editor, Admin)
- 🏢 **Multi-tenant Architecture**: Complete tenant isolation
- 📊 **Content Sensitivity Analysis**: Automated video analysis for content moderation
- 🎬 **HTTP Range Request Streaming**: Efficient video playback with seeking support
- 🎨 **Modern UI**: Responsive dashboard built with React and Tailwind CSS

## Tech Stack

### Backend
- **Node.js** (v22.11.0) + **Express** (4.21.2)
- **MongoDB** (Mongoose 8.9.0)
- **Socket.io** (4.8.1) for real-time communication
- **JWT** for authentication
- **Multer** (1.4.5) for file uploads
- **bcryptjs** for password hashing

### Frontend
- **React** (19.2.0) + **Vite** (7.2.6)
- **React Router** (7.9.6)
- **Tailwind CSS** (3.4.18)
- **Socket.io-client** for real-time updates

## Project Structure

```
Pulse_Assignment/
├── Backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── multer.js           # File upload configuration
│   │   ├── middleware/
│   │   │   ├── auth.js             # JWT authentication
│   │   │   └── streamAuth.js       # Stream authentication with query token
│   │   ├── models/
│   │   │   ├── User.js             # User schema with roles & tenantId
│   │   │   └── Video.js            # Video metadata schema
│   │   ├── routes/
│   │   │   ├── authRoutes.js       # Login & registration
│   │   │   ├── videoRoutes.js      # Video CRUD operations
│   │   │   └── streamRoutes.js     # Video streaming with range requests
│   │   ├── services/
│   │   │   └── videoProcessor.js   # Video processing pipeline
│   │   ├── utils/
│   │   │   └── ffmpegHelper.js     # FFmpeg utilities (optional)
│   │   └── server.js               # Express + Socket.io setup
│   ├── uploads/                    # Video storage directory
│   ├── .env                        # Environment variables
│   └── package.json
│
├── Frontend/
│   ├── src/
│   │   ├── auth/
│   │   │   ├── AuthContext.jsx     # Auth state management
│   │   │   └── ProtectedRoute.jsx  # Route protection
│   │   ├── hooks/
│   │   │   ├── useAuth.js          # Auth hook
│   │   │   └── useSocket.js        # Socket.io client hook
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx       # Login UI
│   │   │   ├── RegisterPage.jsx    # Registration with role selection
│   │   │   └── DashboardPage.jsx   # Main dashboard
│   │   ├── apiClient.js            # HTTP client with auth
│   │   ├── App.jsx                 # Root component
│   │   └── main.jsx                # App entry point
│   ├── .env                        # Environment variables
│   └── package.json
│
└── README.md
```

## Installation

### Prerequisites
- Node.js v22+ 
- MongoDB running locally or remote connection
- **FFmpeg** (optional but recommended for real video thumbnails)
  - Windows: Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH
  - Mac: `brew install ffmpeg`
  - Linux: `sudo apt install ffmpeg`
- 500MB+ free disk space for video uploads

### Backend Setup

1. Navigate to Backend directory:
```bash
cd Backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/video-streaming
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

4. Create uploads directory:
```bash
mkdir uploads
mkdir uploads/thumbnails
```

5. **(Optional)** Verify FFmpeg installation:
```bash
ffmpeg -version
```
If FFmpeg is not installed, the app will use placeholder SVG thumbnails instead.

6. Start the server:
```bash
npm start
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to Frontend directory:
```bash
cd Frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

4. Start the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## User Roles & Permissions

### Viewer
- View own uploaded videos
- Cannot upload new videos
- Cannot delete videos
- Limited to personal video library

### Editor
- Upload new videos (up to 500MB)
- View all videos in tenant
- Delete own videos
- Reprocess failed videos (own only)

### Admin
- All Editor permissions
- Delete any video in tenant
- Reprocess any failed video in tenant
- Full tenant management access

## API Documentation

### Authentication

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "editor",
  "tenantId": "company-a"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d5ec49f8d2b40015d7c8a1",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "editor",
    "tenantId": "company-a"
  }
}
```

### Videos

#### Upload Video (Editor/Admin only)
```http
POST /videos/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

title=My Video
description=Optional description
video=<file>
```

#### List Videos
```http
GET /videos?status=completed&sensitivityStatus=safe
Authorization: Bearer <token>
```

Query Parameters:
- `status`: pending | processing | completed | failed
- `sensitivityStatus`: unknown | safe | flagged
- `sort`: -createdAt (default) | createdAt | -size | size

#### Get Single Video
```http
GET /videos/:id
Authorization: Bearer <token>
```

#### Delete Video (Editor/Admin only)
```http
DELETE /videos/:id
Authorization: Bearer <token>
```

#### Reprocess Video (Editor/Admin only)
```http
POST /videos/:id/reprocess
Authorization: Bearer <token>
```

### Streaming

#### Stream Video
```http
GET /stream/:id?token=<jwt-token>
```

Supports HTTP Range Requests (206 Partial Content) for video seeking.

#### Get Video Info
```http
GET /stream/:id/info
Authorization: Bearer <token>
```

## Real-time Events (Socket.io)

### Client → Server

#### Join Rooms
```javascript
socket.emit('join', {
  userId: 'user-id',
  tenantId: 'tenant-id',
  role: 'editor'
});
```

### Server → Client

#### Video Progress Update
```javascript
socket.on('video:progress', (data) => {
  console.log(data);
  // {
  //   videoId: '60d5ec49f8d2b40015d7c8a1',
  //   status: 'processing',
  //   progress: 60,
  //   sensitivityStatus: 'unknown'
  // }
});
```

## Video Processing Pipeline

The application implements a 5-stage processing pipeline:

1. **Upload** (0%) - Video uploaded successfully
2. **Extracting Metadata** (20%) - Duration and format analysis
3. **Content Analysis** (40%) - Frame extraction and analysis
4. **Sensitivity Check** (60%) - Content moderation checks
5. **Generating Thumbnail** (80%) - Real thumbnail extraction from video
6. **Completed** (100%) - Ready for playback

### Thumbnail Generation

The app automatically generates thumbnails from uploaded videos:

- **With FFmpeg**: Extracts a real frame from the video at 2 seconds
  - High quality JPEG thumbnail (320px wide)
  - Stored as base64 data URL
  - No additional file storage needed
  
- **Without FFmpeg**: Falls back to colorful SVG placeholder
  - Unique gradient colors per video
  - Shows video title
  - Instant generation

Each stage emits real-time progress updates via Socket.io to:
- User-specific room: `user:{userId}`
- Tenant-wide room: `tenant:{tenantId}`

## Security Features

- ✅ JWT-based authentication with 7-day expiration
- ✅ Password hashing with bcryptjs
- ✅ Role-based access control on all endpoints
- ✅ Multi-tenant data isolation
- ✅ File type validation (video/* only)
- ✅ File size limit (500MB max)
- ✅ Token-based stream authentication for browser playback

## Development

### Running in Development

Backend (with auto-restart):
```bash
cd Backend
npm install -g nodemon
nodemon src/server.js
```

Frontend (with hot reload):
```bash
cd Frontend
npm run dev
```

### Testing

Test the complete workflow:

1. **Register** three users with different roles (viewer, editor, admin)
2. **Login** as editor and upload a video
3. **Watch** real-time progress updates in the dashboard
4. **Filter** videos by status and sensitivity
5. **Play** completed videos in new tab
6. **Login** as viewer and verify limited access
7. **Login** as admin and test delete permissions

## Deployment

### Backend Deployment

1. Set environment variables on hosting platform
2. Ensure MongoDB connection string is secure
3. Update `CLIENT_ORIGIN` to production frontend URL
4. Set strong `JWT_SECRET`
5. Configure file storage (consider cloud storage for production)

Example for **Railway/Render**:
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/videostreaming
CLIENT_ORIGIN=https://your-frontend.vercel.app
JWT_SECRET=<generate-strong-secret>
```

### Frontend Deployment

1. Update `.env` with production API URL
2. Build for production:
```bash
npm run build
```
3. Deploy `dist` folder to hosting service (Vercel, Netlify, etc.)

Example for **Vercel**:
```env
VITE_API_URL=https://your-backend.railway.app
VITE_SOCKET_URL=https://your-backend.railway.app
```

## Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### MongoDB Connection Failed
- Verify MongoDB is running: `mongosh`
- Check connection string in `.env`
- Ensure network access for MongoDB Atlas (if cloud)

### Socket.io Connection Failed
- Verify `VITE_SOCKET_URL` matches backend URL
- Check CORS settings in `server.js`
- Check browser console for connection errors

### Video Upload Fails
- Check file size (max 500MB)
- Verify file type is video/*
- Ensure `uploads/` directory exists
- Check disk space availability

### Stream Returns 401
- Verify JWT token is valid
- Check token is included in URL query parameter
- Ensure video belongs to user's tenant

## Future Enhancements

- [ ] Cloud storage integration (AWS S3, Azure Blob)
- [ ] Real video transcoding with FFmpeg
- [ ] Multiple quality variants (360p, 720p, 1080p)
- [ ] Thumbnail generation
- [ ] Video compression
- [ ] Advanced content moderation with AI
- [ ] Video analytics and playback statistics
- [ ] Subtitle support
- [ ] Video sharing and permissions
- [ ] Admin dashboard for user management

## License

MIT License - feel free to use this project for learning or commercial purposes.

## Contributors

- Developed as part of video streaming platform assignment
- Built with ❤️ using Node.js, React, and Socket.io

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the API documentation
3. Check browser console for errors
4. Verify environment variables are set correctly
