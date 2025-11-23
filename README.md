📦 File Upload System (Multer + Cloudinary)

This backend uses Multer and Cloudinary to handle file uploads in a clean and secure way.

🚦 What Multer Does

Multer is an Express middleware for handling file uploads.

It reads the uploaded file from the client’s request.

It saves the file temporarily on the server (./public/temp).

After saving, Multer provides the file’s full path through:

req.file.path


This file path is later used to upload the file to Cloudinary.

☁️ What Cloudinary Does

Cloudinary is a cloud storage service for images and videos.

It takes the file from req.file.path.

It uploads the file to your Cloudinary account.

It returns a secure URL (response.secure_url), which you can store in your database and display on the frontend.

🔄 Upload Flow

User uploads a file from frontend.

Multer saves the file temporarily on the server.

Cloudinary uploads the saved file using its path.

The server deletes the temporary file.

The final Cloudinary URL is returned to the user.