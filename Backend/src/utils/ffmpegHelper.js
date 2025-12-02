import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Extract video metadata using ffprobe
 * Note: This requires ffmpeg/ffprobe to be installed on the system
 * Install: https://ffmpeg.org/download.html
 * 
 * For production, you can:
 * 1. Install ffmpeg in your Docker container
 * 2. Use cloud services (AWS MediaConvert, Azure Media Services)
 * 3. Use a dedicated video processing library
 */

/**
 * Check if ffprobe is available
 */
export async function isFfprobeAvailable() {
  try {
    await execAsync("ffprobe -version");
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Extract video duration in seconds
 * @param {string} filePath - Absolute path to video file
 * @returns {Promise<number>} Duration in seconds
 */
export async function getVideoDuration(filePath) {
  try {
    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
    const { stdout } = await execAsync(command);
    const duration = parseFloat(stdout.trim());
    return isNaN(duration) ? 0 : Math.floor(duration);
  } catch (error) {
    console.error("Error extracting video duration:", error.message);
    return 0;
  }
}

/**
 * Extract full video metadata
 * @param {string} filePath - Absolute path to video file
 * @returns {Promise<object>} Video metadata
 */
export async function getVideoMetadata(filePath) {
  try {
    const command = `ffprobe -v error -show_format -show_streams -of json "${filePath}"`;
    const { stdout } = await execAsync(command);
    const data = JSON.parse(stdout);
    
    const videoStream = data.streams.find(s => s.codec_type === "video");
    const audioStream = data.streams.find(s => s.codec_type === "audio");
    
    return {
      duration: parseFloat(data.format.duration) || 0,
      bitrate: parseInt(data.format.bit_rate) || 0,
      size: parseInt(data.format.size) || 0,
      video: videoStream ? {
        codec: videoStream.codec_name,
        width: videoStream.width,
        height: videoStream.height,
        fps: eval(videoStream.r_frame_rate) || 0, // e.g., "30/1" -> 30
        bitrate: parseInt(videoStream.bit_rate) || 0,
      } : null,
      audio: audioStream ? {
        codec: audioStream.codec_name,
        channels: audioStream.channels,
        sampleRate: audioStream.sample_rate,
        bitrate: parseInt(audioStream.bit_rate) || 0,
      } : null,
    };
  } catch (error) {
    console.error("Error extracting video metadata:", error.message);
    return null;
  }
}

/**
 * Generate video thumbnail
 * @param {string} inputPath - Absolute path to video file
 * @param {string} outputPath - Absolute path for thumbnail output
 * @param {number} timestamp - Timestamp in seconds to capture (default: 1)
 * @returns {Promise<boolean>} Success status
 */
export async function generateThumbnail(inputPath, outputPath, timestamp = 1) {
  try {
    const command = `ffmpeg -ss ${timestamp} -i "${inputPath}" -vframes 1 -q:v 2 "${outputPath}" -y`;
    await execAsync(command);
    return true;
  } catch (error) {
    console.error("Error generating thumbnail:", error.message);
    return false;
  }
}
