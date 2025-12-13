import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
   api_key: process.env.CLOUDINARY_API_KEY,
   api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
   try {
      if (!localFilePath) return null;
      //upload the file on cloudinary
      const response = await cloudinary.uploader.upload(localFilePath, {
         resource_type: "auto",
         timeout: 60000, 
      });
      //file has been uploaded successfully
      console.log("file is uploaded on cloudinary", response.url);
      fs.unlinkSync(localFilePath); // Remove the locally saved file
      return response; // for the user
   } catch (error) {
      console.error("Cloudinary Upload Error:", error);
      console.log("FALLBACK: Using local file due to upload failure.");
      // fs.unlinkSync(localFilePath); // KEEP the file for local fallback
      
      // Construct local URL
      const path = await import("path");
      const filename = path.default.basename(localFilePath);
      const localUrl = `/temp/${filename}`;
      
      return { url: localUrl };
   }
};

export { uploadOnCloudinary };
