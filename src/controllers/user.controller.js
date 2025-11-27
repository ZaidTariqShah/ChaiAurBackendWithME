import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const cookieOptions = {
   httpOnly: true, // cannot modify the cookies from frontend
   secure: true, // only send the cookie on https
   sameSite: "None", // to allow cross-site cookies
};

const generateAccessAndRefreshTokens = async (userId) => {
   try {
      const user = await User.findById(userId);
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();

      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });

      return { accessToken, refreshToken };
   } catch (error) {
      throw new ApiError(
         500,
         "Something went wrong while generating refresh and access tokens"
      );
   }
};

const registerUser = asyncHandler(async (req, res) => {
   // get user data from the frontend ✅
   // validation - not empty ✅
   // check if user already exists: username,email ✅
   // check for images, check for avatar ✅
   // upload them to cloudinary, avatar ✅
   // create user object - create entry in db ✅
   // remove password and refresh token field from response
   // check for user creation
   // return response

   const { fullName, email, username, password } = req.body;
   if (
      [fullName, email, username, password].some(
         (field) => field?.trim() === ""
      )
   ) {
      throw new ApiError(400, "All fields are required");
   }
   const existedUser = await User.findOne({
      $or: [{ username }, { email }],
   });

   if (existedUser) {
      throw new ApiError(
         409,
         "User already exists with this username or email"
      );
   }

   const avatarLocalPath = req.files?.avatar?.[0]?.path; // multer puts the avatar files in an array by default;
   // const coverImageLocalPath = req.files?.coverImage[0]?.path;

   let coverImageLocalPath;
   if (
      req.files &&
      Array.isArray(req.files.coverImage) &&
      req.files.coverImage.length > 0
   ) {
      coverImageLocalPath = req.files.coverImage[0].path;
   }

   if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar image is required");
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);
   if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar image is required");
   }

   const user = await User.create({
      fullName,
      avatar: avatar.url, //url comes from cloudinary response
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase(),
   });

   const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
   );
   if (!createdUser) {
      throw new ApiError(
         500,
         "Something went wrong, While registering the user"
      );
   }

   return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
   // req.body --> username, password
   // username or email (exists or not) (username or email based login)
   // find the user if he exists or not
   // password check for correct
   // access and refresh token generate
   // send token through cookies (secure)

   const { email, username, password } = req.body;
   if (!(email || username)) {
      throw new ApiError(400, "username or email is required");
   }
   const user = await User.findOne({
      $or: [{ username }, { email }],
   });

   if (!user) {
      throw new ApiError(404, "User does not exist");
   }

   const isPasswordValid = await user.isPasswordCorrect(password);
   if (!isPasswordValid) {
      throw new ApiError(401, "Invalid user credentials");
   }

   const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
   );

   const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
   );

   return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json(
         new ApiResponse(
            200,
            { user: loggedInUser, accessToken, refreshToken }, // refresh code is sensitive, so we should not send it in response body
            "User logged In Successfully"
         )
      );
});

const logoutUser = asyncHandler(async (req, res) => {
   await User.findByIdAndUpdate(
      req.user._id,
      {
         $set: { refreshToken: undefined },
      },
      { new: true } //gives the updated document otherwise it gives old document
   );

   return res
      .status(200)
      .clearCookie("accessToken", cookieOptions)
      .clearCookie("refreshToken", cookieOptions)
      .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
   const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken; // for mobile apps
   if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request");
   }
   try {
      const decodedToken = jwt.verify(
         incomingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET
      );
      const user = await User.findById(decodedToken?._id);
      if (!user) {
         throw new ApiError(401, "Invalid refresh token");
      }

      if (incomingRefreshToken !== user.refreshToken) {
         throw new ApiError(401, "Refresh token is expired");
      }

      const { accessToken, refreshToken } =
         await generateAccessAndRefreshTokens(user._id);
      return res
         .status(200)
         .cookie("accessToken", accessToken, cookieOptions)
         .cookie("refreshToken", refreshToken, cookieOptions)
         .json(
            new ApiResponse(
               200,
               { accessToken, refreshToken },
               "Access token refreshed"
            )
         );
   } catch (error) {
      throw new ApiError(401, error?.message || "Invalid refresh token");
   }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
   const { oldPassword, newPassword, confirmPassword } = req.body;
   if (!(newPassword === confirmPassword)) {
      throw new ApiError(400, "New Password and Confirm Password do not match");
   }
   const user = await User.findById(req.user?._id);
   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
   if (!isPasswordCorrect) {
      throw new ApiError(400, "Invalid Password");
   }

   user.password = newPassword;
   await user.save({ validateBeforeSave: false });
   return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
   return res
      .status(200)
      .json(
         new ApiResponse(200, req.user, "Current user fetched successfully")
      );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
   const { fullName, email, username } = req.body;
   if (!fullName || !email) {
      throw new ApiError(400, "All fields are required");
   }
   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: { fullName, email },
      },
      { new: true }
   ).select("-password -refreshToken");

   return res
      .status(200)
      .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
   const avatarLocalPath = req.file?.path;
   if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is missing");
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath);
   if (!avatar?.url) {
      throw new ApiError(400, "Error while uploading avatar");
   }

   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: { avatar: avatar.url },
      },
      { new: true }
   ).select("-password -refreshToken");

   res.status(200).json(
      new ApiResponse(200, { user }, "Avatar updated successfully")
   );
});
const updateUserCoverImage = asyncHandler(async (req, res) => {
   const coverImageLocalPath = req.file?.path;
   if (!coverImageLocalPath) {
      throw new ApiError(400, "Cover image file is missing");
   }

   const coverImage = await uploadOnCloudinary(coverImageLocalPath);
   if (!coverImage?.url) {
      throw new ApiError(400, "Error while uploading Cover image");
   }

   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: { coverImage: coverImage.url },
      },
      { new: true }
   ).select("-password -refreshToken");

   res.status(200).json(
      new ApiResponse(200, { user }, "Cover image updated successfully")
   );
});

export {
   registerUser,
   loginUser,
   logoutUser,
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentUser,
   updateAccountDetails,
   updateUserAvatar,
   updateUserCoverImage,
};
