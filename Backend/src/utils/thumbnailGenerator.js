import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);

/**
 * Check if FFmpeg is available
 */
export async function isFFmpegAvailable() {
  try {
    // Try FFmpeg from environment variable first
    const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";
    
    await execAsync(`"${ffmpegPath}" -version`, { timeout: 5000 });
    return true;
  } catch (error) {
    // Try common Windows locations
    const commonPaths = [
      "C:\\ffmpeg\\bin\\ffmpeg.exe",
      "C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe",
    ];
    
    for (const path of commonPaths) {
      try {
        await execAsync(`"${path}" -version`, { timeout: 5000 });
        // Set it for future use
        process.env.FFMPEG_PATH = path;
        return true;
      } catch (err) {
        // Continue to next path
      }
    }
    
    return false;
  }
}

/**
 * Generate thumbnail from video file
 * @param {string} videoPath - Absolute path to video file
 * @param {string} outputPath - Absolute path for thumbnail output
 * @param {number} timestamp - Timestamp in seconds to capture (default: 2)
 * @returns {Promise<boolean>} Success status
 */
export async function generateVideoThumbnail(videoPath, outputPath, timestamp = 2) {
  try {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Get FFmpeg path
    const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";

    // Generate thumbnail using FFmpeg
    const command = `"${ffmpegPath}" -ss ${timestamp} -i "${videoPath}" -vframes 1 -vf "scale=320:-1" -q:v 2 "${outputPath}" -y`;
    
    await execAsync(command, { timeout: 30000 });
    
    return fs.existsSync(outputPath);
  } catch (error) {
    console.error("Error generating video thumbnail:", error.message);
    return false;
  }
}

/**
 * Generate thumbnail and convert to base64 data URL
 * @param {string} videoPath - Absolute path to video file
 * @param {string} videoId - Video ID for filename
 * @returns {Promise<string|null>} Base64 data URL or null
 */
export async function generateThumbnailDataUrl(videoPath, videoId) {
  try {
    const thumbnailDir = path.join(path.dirname(videoPath), "thumbnails");
    const thumbnailPath = path.join(thumbnailDir, `${videoId}.jpg`);

    const success = await generateVideoThumbnail(videoPath, thumbnailPath, 2);
    
    if (success && fs.existsSync(thumbnailPath)) {
      const imageBuffer = fs.readFileSync(thumbnailPath);
      const base64Image = imageBuffer.toString('base64');
      
      // Clean up the thumbnail file (optional - keep if you want to serve directly)
      // fs.unlinkSync(thumbnailPath);
      
      return `data:image/jpeg;base64,${base64Image}`;
    }
    
    return null;
  } catch (error) {
    console.error("Error generating thumbnail data URL:", error.message);
    return null;
  }
}

/**
 * Get video duration using FFprobe
 * @param {string} videoPath - Absolute path to video file
 * @returns {Promise<number>} Duration in seconds
 */
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
