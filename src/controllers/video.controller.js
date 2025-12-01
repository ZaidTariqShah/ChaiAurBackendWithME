import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const uploadVideo = asyncHandler(async (req, res) => {
   const videoFile = req.file?.path;
   if (!videoFile) {
      throw new ApiError(400, "Video file is required");
   }

   const upload = await uploadOnCloudinary(videoFile);
   if (!upload?.url) {
      throw new ApiError(500, "Failed to get video URL from Cloudinary");
   }

   const savedVideo = await Video.create({
      videoFile: upload.url,
   });
   res.status(200).json(
      new ApiResponse(200, savedVideo, "video uploaded successfully")
   );
});
export { uploadVideo };
