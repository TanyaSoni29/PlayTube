import { asyncHandler } from "../utils/asyncHandler";
import  {ApiError } from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefreshToken = async(userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
   await user.save({validateBeforeSave: false});

   return {refreshToken, accessToken}


  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens.")
  }
}


const registerUser = asyncHandler( async(req, res) => {
  const {fullName, email, username, password} = req.body;

  if(!fullName || !username || !password || !email) {
    throw new ApiError(401, "All fields are required.")
  }

  const existedUser = await User.findOne({ $or : [{email},  {username}]})

  if(existedUser) {
    throw new ApiError(409, "User with this Email or Username is already exist.")
  }

  const avatarLocalPath = req.files?.avatar[0].path;
  let coverImageLocalPath;

  if(req.files && Array.isArray(req.files?.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files?.coverImage[0].path;
  }

  if(!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required.")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if(!avatar) {
    throw new ApiError(400, "Avatar is required.");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),

  });

  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  if (!createdUser){
    throw new ApiError(500, "Something went wrong while registering user.")
  }

  return res.status(201).json(new ApiResponse(200, createdUser, "User register successfully."))

})

const loginUser = asyncHandler( async (req, res) => {
    const {email, password, username} = req.body;

    if (!email || !password || !username) {
        throw new ApiError(401, "Email and Password are required.");
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User doesn't exist.")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid ){
        throw new ApiError(401, "Password Doesnot Match.");
    }
    
    const {refreshToken , accessToken} = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json( new ApiResponse(200, {
       user: loggedInUser,
        accessToken,
        refreshToken
    }, "User logged in Successfully."))
})


export {registerUser,
    loginUser
}