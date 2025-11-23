import multer from "multer";
//Multer handles file uploads in Express and saves the uploaded file
// to your server so you can use it (like sending it to Cloudinary).

const storage = multer.diskStorage({
   destination: function (req, file, cb) {
      cb(null, "./public/temp");
   },
   filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname);
   },
});
export const upload = multer({ storage });
