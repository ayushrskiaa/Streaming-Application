import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";
import { apiRequest } from "../apiClient";

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { videoUpdates } = useSocket();
  
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState(null);

  // Fetch videos
  const fetchVideos = async () => {
    try {
      setLoading(true);
      const data = await apiRequest("/videos");
      setVideos(data.videos);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  // Update videos when socket sends updates
  useEffect(() => {
    if (videoUpdates.length > 0) {
      const latestUpdate = videoUpdates[videoUpdates.length - 1];
      setVideos((prev) =>
        prev.map((v) =>
          v.id === latestUpdate.videoId
            ? {
                ...v,
                status: latestUpdate.status,
                processingProgress: latestUpdate.progress,
                sensitivityStatus: latestUpdate.sensitivityStatus,
              }
            : v
        )
      );
    }
  }, [videoUpdates]);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ["video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo", "video/x-matroska", "video/webm"];
      if (!validTypes.includes(file.type)) {
        setError("Invalid file type. Please upload a video file (MP4, MOV, AVI, MKV, WebM)");
        return;
      }
      // Validate file size (500MB)
      if (file.size > 500 * 1024 * 1024) {
        setError("File too large. Maximum size is 500MB");
        return;
      }
      setVideoFile(file);
      setError(null);
    }
  };

  // Handle upload
  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!videoFile || !title) {
      setError("Please provide a title and select a video file");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("video", videoFile);
      formData.append("title", title);
      formData.append("description", description);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 201) {
          const data = JSON.parse(xhr.responseText);
          setVideos((prev) => [data.video, ...prev]);
          setTitle("");
          setDescription("");
          setVideoFile(null);
          setUploadProgress(0);
          document.getElementById("videoInput").value = "";
        } else {
          const error = JSON.parse(xhr.responseText);
          setError(error.message || "Upload failed");
        }
        setUploading(false);
      });

      xhr.addEventListener("error", () => {
        setError("Network error during upload");
        setUploading(false);
      });

      const token = localStorage.getItem("token");
      xhr.open("POST", `${import.meta.env.VITE_API_URL}/videos/upload`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
    } catch (err) {
      setError(err.message);
      setUploading(false);
    }
  };

  // Handle delete
  const handleDelete = async (videoId) => {
    if (!confirm("Are you sure you want to delete this video?")) return;

    try {
      await apiRequest(`/videos/${videoId}`, { method: "DELETE" });
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
    } catch (err) {
      setError(err.message);
    }
  };

  // Filter videos
  const filteredVideos = videos.filter((v) => {
    if (filter === "all") return true;
    if (filter === "processing") return v.status === "processing" || v.status === "pending";
    if (filter === "completed") return v.status === "completed";
    if (filter === "safe") return v.sensitivityStatus === "safe";
    if (filter === "flagged") return v.sensitivityStatus === "flagged";
    return true;
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      processing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      completed: "bg-green-500/10 text-green-400 border-green-500/20",
      failed: "bg-red-500/10 text-red-400 border-red-500/20",
    };
    return badges[status] || badges.pending;
  };

  const getSensitivityBadge = (sensitivity) => {
    const badges = {
      safe: "bg-green-500/10 text-green-400 border-green-500/20",
      flagged: "bg-red-500/10 text-red-400 border-red-500/20",
      unknown: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    };
    return badges[sensitivity] || badges.unknown;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Video Processing Dashboard</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Welcome, <span className="font-medium text-slate-100">{user?.name}</span>{" "}
              <span className="text-slate-500">({user?.role})</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`} />
              <span className="text-xs text-slate-400">{isConnected ? "Connected" : "Disconnected"}</span>
            </div> */}
            <button
              onClick={handleLogout}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="px-6 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Upload Section */}
          {(user?.role === "editor" || user?.role === "admin") && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <h2 className="text-lg font-semibold text-white">Upload Video</h2>
              <p className="mt-1 text-sm text-slate-400">
                Upload a video for sensitivity analysis and streaming
              </p>

              <form onSubmit={handleUpload} className="mt-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-200">Title *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      disabled={uploading}
                      placeholder="Enter video title"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40 disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-200">Description</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={uploading}
                      placeholder="Optional description"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-200">Video File *</label>
                  <input
                    id="videoInput"
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 file:mr-4 file:rounded file:border-0 file:bg-sky-500/10 file:px-3 file:py-1 file:text-xs file:font-medium file:text-sky-400 hover:file:bg-sky-500/20 disabled:opacity-50"
                  />
                  {videoFile && (
                    <p className="text-xs text-slate-400 mt-1">
                      Selected: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Uploading...</span>
                      <span className="font-medium text-sky-400">{uploadProgress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {error && <p className="text-sm text-rose-400">{error}</p>}

                <button
                  type="submit"
                  disabled={uploading || !videoFile || !title}
                  className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:from-sky-400 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? "Uploading..." : "Upload Video"}
                </button>
              </form>
            </div>
          )}

          {/* Video Library */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Video Library</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilter("all")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    filter === "all"
                      ? "bg-sky-500/20 text-sky-400"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter("processing")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    filter === "processing"
                      ? "bg-sky-500/20 text-sky-400"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  Processing
                </button>
                <button
                  onClick={() => setFilter("completed")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    filter === "completed"
                      ? "bg-sky-500/20 text-sky-400"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setFilter("safe")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    filter === "safe"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  Safe
                </button>
                <button
                  onClick={() => setFilter("flagged")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    filter === "flagged"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  Flagged
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400">Loading videos...</div>
            ) : filteredVideos.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                {filter === "all" ? "No videos uploaded yet" : `No ${filter} videos found`}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredVideos.map((video) => (
                  <div
                    key={video.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 transition hover:border-slate-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-100">{video.title}</h3>
                        {video.description && (
                          <p className="mt-1 text-sm text-slate-400">{video.description}</p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(video.status)}`}>
                            {video.status}
                          </span>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getSensitivityBadge(video.sensitivityStatus)}`}>
                            {video.sensitivityStatus}
                          </span>
                          <span className="text-xs text-slate-500">
                            {video.sizeMB} MB
                          </span>
                          {video.duration > 0 && (
                            <span className="text-xs text-slate-500">
                              {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, "0")}
                            </span>
                          )}
                          <span className="text-xs text-slate-500">
                            {video.views} views
                          </span>
                        </div>
                        {(video.status === "processing" || video.status === "pending") && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">Processing...</span>
                              <span className="font-medium text-sky-400">{video.processingProgress}%</span>
                            </div>
                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800">
                              <div
                                className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-500"
                                style={{ width: `${video.processingProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex items-center gap-2">
                        {video.status === "completed" && (
                          <a
                            href={`${import.meta.env.VITE_API_URL}/stream/${video.id}?token=${localStorage.getItem("token")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-400 transition hover:bg-sky-500/20"
                          >
                            Play
                          </a>
                        )}
                        {(user?.role === "editor" || user?.role === "admin") && (
                          <button
                            onClick={() => handleDelete(video.id)}
                            className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


