import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);
export async function isFFmpegAvailable() {
  try {
    const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";
    
    await execAsync(`"${ffmpegPath}" -version`, { timeout: 5000 });
    return true;
  } catch (error) {
    const commonPaths = [
      "C:\\ffmpeg\\bin\\ffmpeg.exe",
      "C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe",
    ];
    
    for (const path of commonPaths) {
      try {
        await execAsync(`"${path}" -version`, { timeout: 5000 });
        process.env.FFMPEG_PATH = path;
        return true;
      } catch (err) {}
    }
    
    return false;
  }
}
export async function generateVideoThumbnail(videoPath, outputPath, timestamp = 2) {
  try {
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";
    const command = `"${ffmpegPath}" -ss ${timestamp} -i "${videoPath}" -vframes 1 -vf "scale=320:-1" -q:v 2 "${outputPath}" -y`;
    
    await execAsync(command, { timeout: 30000 });
    
    return fs.existsSync(outputPath);
  } catch (error) {
    console.error("Error generating video thumbnail:", error.message);
    return false;
  }
}
export async function generateThumbnailDataUrl(videoPath, videoId) {
  try {
    const thumbnailDir = path.join(path.dirname(videoPath), "thumbnails");
    const thumbnailPath = path.join(thumbnailDir, `${videoId}.jpg`);

    const success = await generateVideoThumbnail(videoPath, thumbnailPath, 2);
    
    if (success && fs.existsSync(thumbnailPath)) {
      const imageBuffer = fs.readFileSync(thumbnailPath);
      const base64Image = imageBuffer.toString('base64');
      return `data:image/jpeg;base64,${base64Image}`;
    }
    
    return null;
  } catch (error) {
    console.error("Error generating thumbnail data URL:", error.message);
    return null;
  }
}
export async function getVideoDuration(videoPath) {
  try {
    const ffprobePath = process.env.FFMPEG_PATH ? 
      process.env.FFMPEG_PATH.replace('ffmpeg.exe', 'ffprobe.exe') : 
      "ffprobe";
    
    const command = `"${ffprobePath}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`;
    const { stdout } = await execAsync(command, { timeout: 10000 });
    const duration = parseFloat(stdout.trim());
    return isNaN(duration) ? 0 : Math.floor(duration);
  } catch (error) {
    console.error("Error getting video duration:", error.message);
    return 0;
  }
}
