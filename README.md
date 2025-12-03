# Video Streaming Application

A full-stack video streaming platform with role-based access control, real-time processing, and multi-tenant support.

## 🚀 Features

- **User Authentication & Authorization**: JWT-based authentication with role-based access control (Admin, Creator, Viewer)
- **Video Upload & Processing**: Upload videos with automatic thumbnail generation using FFmpeg
- **Real-time Updates**: Socket.io integration for live video processing status updates
- **Video Streaming**: Efficient video streaming with HTTP range requests
- **Multi-tenant Support**: Tenant isolation for secure data segregation
- **Responsive UI**: Modern React frontend with Tailwind CSS

## 🛠️ Tech Stack

### Backend
- Node.js 22.11.0
- Express 4.21.2
- MongoDB (Mongoose 8.9.0)
- Socket.io 4.8.1
- JWT Authentication
- FFmpeg for video thumbnail extraction
- Multer for file uploads

### Frontend
- React 19.2.0
- Vite 7.2.4
- Tailwind CSS 3.4.18
- Socket.io-client 4.8.1
- React Router DOM 7.9.6

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

- **Admin**: Full access to all features, user management
- **Creator**: Upload and manage own videos
- **Viewer**: View and stream available videos

## 📁 Project Structure

```
Streaming-Application/
├── Backend/
│   ├── src/
│   │   ├── server.js           # Main server file
│   │   ├── middleware/
│   │   │   └── auth.js         # JWT authentication
│   │   ├── models/
│   │   │   └── User.js         # User & Video schemas
│   │   └── routes/
│   │       └── authRoutes.js   # Auth & video routes
│   ├── uploads/                # Video storage
│   ├── package.json
│   └── nixpacks.toml          # Railway deployment config
├── Frontend/
│   ├── src/
│   │   ├── App.jsx            # Main app component
│   │   ├── apiClient.js       # API configuration
│   │   ├── auth/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   └── pages/
│   │       ├── LoginPage.jsx
│   │       ├── RegisterPage.jsx
│   │       └── DashboardPage.jsx
│   ├── package.json
│   └── vite.config.js
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

### Video Upload
- Multi-part form data upload
- Automatic thumbnail generation at 2-second mark
- Real-time upload progress
- FFmpeg integration for video processing

### Real-time Processing
- Socket.io event-driven updates
- Live thumbnail generation status
- Instant UI updates on video processing

### Streaming
- HTTP range request support
- Efficient video buffering
- Responsive video player

### Security
- JWT-based authentication
- Role-based access control (RBAC)
- Protected routes
- Tenant isolation
- CORS configuration

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
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/validate` - Validate JWT token

### Videos
- `POST /api/videos/upload` - Upload video (Creator/Admin)
- `GET /api/videos` - Get all videos
- `GET /api/videos/:id` - Get video details
- `GET /api/videos/:id/stream` - Stream video
- `DELETE /api/videos/:id` - Delete video (Owner/Admin)

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
