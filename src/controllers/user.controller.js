import { asyncHandler } from "../utils/asyncHandler";
import  {ApiError } from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

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

const logOutUser = asyncHandler( async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $unset: {
            refreshToken: 1
        }
    },{new : true})

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "User LoggedOut Successfully."))
    
})

const refreshAccessToken = asyncHandler( async (req, res) => {

const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken ;

if(!incomingRefreshToken) {
  throw new ApiError(401, "Unauthorized User.")
}

try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = User.findById(decodedToken._id);

    if(!user) {
      throw new ApiError(401, "Invalid refresh Token" )
    }

    if (incomingRefreshToken !== user.refreshToken){
      throw new ApiError(401, "Refresh Token is expired or used.")
    }

    const options = {
      httpOnly: true,
      secure: true
    }

    const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id);

    return  res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", newRefreshToken, options).json(new ApiResponse(200, {accessToken, refreshToken: newRefreshToken}, "Access Token Refreshed Successfully."))
} catch (error) {
  throw new ApiError(401, error?.message, "Invalid Refresh Token.")
}

})

const changeCurrentPassword = asyncHandler(async(req, res) => {
   const {oldPassword, newPassword} = req.body;

   const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if(!isPasswordCorrect) {
    throw new ApiError(400, "Invalid Old Password.")
  }

  user.password = newPassword;
  await user.save({validateBeforeSave: false})

  return res.status(200).json(new ApiResponse(200, {}, "Password Updated Successfully."))
})

const getCurrentUser = asyncHandler(async(req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, "User fetched Successfully."))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
const {email, fullName } = req.body;
if(!email && !fullName) {
  throw new ApiError(400, "All fields are required.");

}

const user = await User.findByIdAndUpdate(req.user?._id,{
  $set: {
    fullName,
    email: email,
  }
},{new : true}).select("-password");

return res.status(200).json( new ApiResponse(200, user, "Accounts Details Updated successfully."))
})

const updateUserAvatar = asyncHandler( async (req, res) => {
   const avatarLocalPath = req.file?.path;

   if (!avatarLocalPath){
    throw new ApiError(400, "Avatar file is missing.")
   }

   // previous delete 

   const avatar = await uploadOnCloudinary(avatarLocalPath);

  if(!avatar.url){
    throw new ApiError(400, "Error while updating avatar")
  }

  const user = await User.findByIdAndUpdate(req.user?._id, {
    $set: {
      avatar: avatar.url
    }
  },{new: true}).select("-password");

  return res.status(200).json(new ApiResponse(200, user, "Avatar Updated Successfully."))

});

const updateUserCoverImage = asyncHandler( async (req, res) => {
   const coverImageLocalPath = req.file?.path;

   if(!coverImageLocalPath){
    throw new ApiError(400, "Error while updating Cover Image.");

   }

   const coverImage =  await uploadOnCloudinary(coverImageLocalPath);

   const user = await User.findByIdAndUpdate(req.user?._id, {
    $set: {
      coverImage: coverImage.url
    }
   }, {new : true}).select("-password");

   return res.status(200).json(new ApiResponse(200, user, "coverImage Updated Successfully"))

});

const getUserChannelProfile = asyncHandler( async (req, res) => {
    const {username} = req.params;

    if (!username.trim()){
      throw new ApiError(400, "username is missing")
    }

    const channel = await user.aggregate([
      {
       $match : {username: username?.toLowerCase(),

       }
    },{
        $lookup : {
          from: "subscriptions",
          localField: "_id",
          foreignField : "channel",
          as: "subscribers"
        }
    }, {
      $lookup: {
        from: "subscriptions",
        localField :"_id",
        foreignField : "subscriber",
        as: "subscribedTo"
      }
    }, {
      $addFields: {
         subscribersCount : { $size: "$subscribers",},
         channelsSubscribedToCount : {$size : "$subscribedTo"},
         isSubscribed : {
          $cond : {
            if : {$in: [req.user?._id, $subscribers.subscriber]},
            then : true,
            else: false
          }
         }

      }
    }, {
      $project : {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1
      }
    }
  ])

  if (!channel?.length){
    throw new ApiError(404, "Channel doesnot exist.")
  }

  return res.status(200).json(new ApiResponse(200, channel[0], "User channel fetched successfully"));

})

const getWatchHistory = asyncHandler( async (req, res) => {
    const user = await User.aggregate([
      {
        $match : {
         _id:  new mongoose.Types.ObjectId(req.user?._id),
        }
      },{
        $lookup: {
          from : "videos",
          localField: "watchHistory",
          foreignField: "_id",
          as: "watchHistory", 
          pipeline : [
            {
              $lookup: {
                from : "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner", 
                pipeline: [{
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  }
                }
              ]
              }
            }, {
              
                $addFields: {
                  owner : { $first : "$owner",}
                  
                }
            }
          ]
        }
      }, 
    ])


    return res.status(200).json(new ApiResponse(200, user[0].watchHistory, "WatchHistory fetched Successfully."))
})


export {registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,




}