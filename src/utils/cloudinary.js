import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
   cloud_name: "dqvikjh5y",
   api_key: "676584961472157",
   api_secret: "-tW_tBZAyNHSADyX9ZgXpJoR_WI",
});

const uploadOnCloudinary = async (localFilePath) => {
   try {
      if (!localFilePath) return null;
      //upload the file on cloudinary
      const response = await cloudinary.uploader.upload(localFilePath, {
         resource_type: "auto",
      });
      //file has been uploaded successfully
      console.log("file is uploaded on cloudinary", response.url);
      fs.unlinkSync(localFilePath); // Remove the locally saved file
      return response; // for the user
   } catch (error) {
      fs.unlinkSync(localFilePath); // Remove the locally saved file
      return null;
   }
};

export { uploadOnCloudinary };
