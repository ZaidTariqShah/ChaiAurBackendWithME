import { v2 as cloudinary } from "cloudinary";
export const deleteImage = async (publicId) => {
   if (!publicId) return;
   try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
   } catch (error) {
      console.error("Cloudinary Delete Error:", error);
      return null;
   }
};
