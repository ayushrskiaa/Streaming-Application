# Video Streaming Application

A full-stack video streaming platform with role-based access control, real-time processing, and multi-tenant support.

🔗 **Live Demo**: [Frontend](https://streaming-application-delta.vercel.app) | [Backend API](https://streaming-application-production.up.railway.app)

## 🚀 Features

- **User Authentication & Authorization**: JWT-based authentication with role-based access control (Admin, Content Manager, Viewer)
- **Video Upload & Processing**: Upload videos with automatic thumbnail generation using FFmpeg
- **Real-time Updates**: Socket.io integration for live video processing status updates (0% → 100% progress)
- **Video Streaming**: Efficient video streaming with HTTP range requests support
- **Multi-tenant Support**: Complete tenant isolation for secure data segregation between organizations
- **Content Moderation**: Automated safety checks with mock AI moderation (95% safe score)
- **Responsive UI**: Modern React frontend with Tailwind CSS and real-time WebSocket updates
- **Production Ready**: Deployed on Railway (Backend) + Vercel (Frontend) with MongoDB Atlas

## 🛠️ Tech Stack

### Backend
- Node.js 22.11.0
- Express 4.21.2
- MongoDB (Mongoose 8.9.4)
- Socket.io 4.8.1
- JWT Authentication (jsonwebtoken 9.0.2)
- bcryptjs 2.4.3 for password hashing
- FFmpeg 8.0.1 for video thumbnail extraction
- Multer 1.4.5-lts.1 for file uploads
- cookie-parser 1.4.7
- cors 2.8.5

### Frontend
- React 19.0.0
- Vite 6.0.5
- Tailwind CSS 3.4.18
- Socket.io-client 4.8.1
- React Router DOM 7.1.1
- Axios 1.7.9

### Deployment
- **Backend**: Railway (Nixpacks with FFmpeg)
- **Frontend**: Vercel
- **Database**: MongoDB Atlas

## 📋 Prerequisites

- Node.js 22.x or higher
- MongoDB Atlas account or local MongoDB instance
- FFmpeg installed on your system
- npm or yarn package manager

## 🔧 Installation

### 1. Clone the repository
```bash
git clone https://github.com/ayushrskiaa/Streaming-Application.git
cd Streaming-Application
```

### 2. Backend Setup
```bash
cd Backend
npm install
```

Create a `.env` file in the Backend directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
CLIENT_ORIGIN=http://localhost:5173
DEPLOYMENT_ORIGIN=your_deployed_frontend_url
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
FFMPEG_PATH=/usr/bin/ffmpeg
```

### 3. Frontend Setup
```bash
cd Frontend
npm install
```

Create a `.env` file in the Frontend directory:
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## 🚀 Running the Application

### Development Mode

#### Start Backend
```bash
cd Backend
npm run dev
```
Backend will run on `http://localhost:5000`

#### Start Frontend
```bash
cd Frontend
npm run dev
```
Frontend will run on `http://localhost:5173`

### Production Build

#### Backend
```bash
cd Backend
npm start
```

#### Frontend
```bash
cd Frontend
npm run build
npm run preview
```

## 📦 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions for Railway, Render, Vercel, and Netlify.

### Quick Deployment Guide

**Backend (Railway):**
1. Connect GitHub repository
2. Set Root Directory to `Backend`
3. Use Nixpacks builder
4. Add environment variables
5. Deploy

**Frontend (Vercel):**
1. Import GitHub repository
2. Set Root Directory to `Frontend`
3. Framework: Vite
4. Add environment variables
5. Deploy

## 🎯 User Roles

| Feature | Viewer | Content Manager | Admin |
|---------|--------|-----------------|-------|
| View videos | ✅ (own tenant) | ✅ (own tenant) | ✅ (all tenants) |
| Stream videos | ✅ | ✅ | ✅ |
| Upload videos | ❌ | ✅ | ✅ |
| Edit videos | ❌ | ✅ (own tenant) | ✅ (all tenants) |
| Delete videos | ❌ | ✅ (own tenant) | ✅ (all tenants) |
| Manage users | ❌ | ❌ | ✅ |

## 📁 Project Structure

```
Streaming-Application/
├── Backend/
│   ├── src/
│   │   ├── server.js           # Main Express server with Socket.io
│   │   ├── middleware/
│   │   │   └── auth.js         # JWT authentication middleware
│   │   ├── models/
│   │   │   ├── User.js         # User schema with RBAC
│   │   │   └── Video.js        # Video metadata schema
│   │   ├── routes/
│   │   │   ├── authRoutes.js   # Authentication endpoints
│   │   │   └── videoRoutes.js  # Video CRUD endpoints
│   │   └── services/
│   │       ├── videoProcessor.js  # FFmpeg thumbnail generation
│   │       └── mockModerator.js   # Content safety checks
│   ├── uploads/                # Video file storage
│   ├── package.json
│   ├── nixpacks.toml          # Railway FFmpeg configuration
│   ├── Dockerfile.backup      # Docker config (not in use)
│   └── .env.example           # Environment variable template
├── Frontend/
│   ├── src/
│   │   ├── App.jsx            # Main app component with routing
│   │   ├── apiClient.js       # Axios instance with auth
│   │   ├── auth/
│   │   │   ├── AuthContext.jsx      # Global auth state
│   │   │   └── ProtectedRoute.jsx   # Route guard component
│   │   └── pages/
│   │       ├── LoginPage.jsx        # Login form
│   │       ├── RegisterPage.jsx     # Registration form
│   │       └── DashboardPage.jsx    # Main video dashboard
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env.example           # Environment variable template
├── DEPLOYMENT.md              # Comprehensive deployment guide
└── README.md
```

## 🔐 Environment Variables

### Backend Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://...` |
| `CLIENT_ORIGIN` | Frontend URL (dev) | `http://localhost:5173` |
| `DEPLOYMENT_ORIGIN` | Frontend URL (prod) | `https://your-app.vercel.app` |
| `JWT_SECRET` | JWT signing secret | `your_secret_key` |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `FFMPEG_PATH` | FFmpeg binary path | `/usr/bin/ffmpeg` |

### Frontend Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000` |
| `VITE_SOCKET_URL` | Socket.io server URL | `http://localhost:5000` |

## 🎥 Features in Detail

### Video Upload & Processing Pipeline
1. **Upload**: Client uploads video via multipart/form-data
2. **Storage**: Multer saves file to `uploads/` directory with unique filename
3. **Database**: Video metadata stored in MongoDB with tenant isolation
4. **Thumbnail Generation**: FFmpeg extracts frame at 2 seconds → JPEG → base64 data URL
5. **Content Moderation**: Mock AI safety analysis (95% safe score)
6. **Real-time Progress**: Socket.io broadcasts processing status (0% → 20% → 40% → 60% → 80% → 100%)
7. **Ready**: Video available for streaming with thumbnail preview

### Real-time Processing
- Socket.io event-driven architecture
- Live thumbnail generation status updates
- Instant UI updates without page refresh
- Per-tenant Socket.io rooms for data isolation
- Progress tracking: "Starting video analysis..." → "Processing complete!"

### Video Streaming
- HTTP range request support for efficient seeking
- Partial content delivery (206 status code)
- Compatible with HTML5 video player
- Bandwidth-efficient buffering
- Responsive playback controls

### Security & Multi-tenancy
- JWT-based authentication with HTTP-only cookies
- Role-based access control (RBAC) middleware
- Protected routes with tenant verification
- Complete tenant data isolation in database queries
- CORS configuration for production deployment
- Password hashing with bcrypt (10 rounds)
- Input validation on all endpoints

## 🐛 Troubleshooting

### FFmpeg Issues
- Ensure FFmpeg is installed: `ffmpeg -version`
- Set correct `FFMPEG_PATH` in environment variables
- On Windows: Install from [ffmpeg.org](https://ffmpeg.org)
- On Linux: `sudo apt-get install ffmpeg`

### MongoDB Connection
- Verify `MONGO_URI` is correct
- Check MongoDB Atlas network access settings
- Ensure database user has proper permissions

### CORS Errors
- Verify `CLIENT_ORIGIN` and `DEPLOYMENT_ORIGIN` match your frontend URLs
- Check that backend CORS configuration includes your frontend domain

## 📝 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user info

### Videos
- `POST /videos/upload` - Upload video (Content Manager/Admin)
- `GET /videos` - Get all videos (filtered by tenant)
- `GET /videos/:id` - Get video details
- `GET /videos/:id/stream` - Stream video with range support
- `PATCH /videos/:id` - Update video metadata (Owner/Admin)
- `DELETE /videos/:id` - Delete video (Owner/Admin)

### WebSocket Events
- `user:joined` - User connected to tenant room
- `video:progress` - Real-time processing progress (0-100%)
- `video:uploaded` - New video uploaded notification

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📄 License

ISC

## 👤 Author

Ayush Kumar

## 🙏 Acknowledgments

- FFmpeg for video processing
- Socket.io for real-time communication
- MongoDB Atlas for database hosting
- Railway & Vercel for deployment platforms
