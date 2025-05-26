import { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
  if (userId && !isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  if (query && typeof query !== "string") {
    throw new ApiError(400, "Query must be a string");
  }

  if (sortBy && !["createdAt", "views", "title"].includes(sortBy)) {
    throw new ApiError(400, "Invalid sortBy field");
  }

  if (sortType && !["asc", "desc"].includes(sortType)) {
    throw new ApiError(400, "Invalid sortType");
  }

  const filter = {
    isPublished: true,
    ...(userId && { owner: userId }),
    ...(query && { title: { $regex: query, $options: "i" } }),
  };

  const sortOptions = {};
  if (sortBy) {
    sortOptions[sortBy] = sortType === "asc" ? 1 : -1;
  }
  const pageNumger = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);
  const skip = (pageNumger - 1) * limitNumber;

  const queryVideos = Video.find(filter)
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNumber)
    .populate("owner", "username fullName avatar")
    .exec();

  const totalCount = await Video.countDocuments(filter);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        videos: queryVideos,
        totalCount,
        page: pageNumger,
        limit: limitNumber,
      },
      "Videos fetched successfully"
    )
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description, duration } = req.body;
  // TODO: get video, upload to cloudinary, create video

  const { videoFile, thumbnail } = req.files;
  const userId = req.user._id;
  if (!videoFile || !thumbnail)
    throw new ApiError(400, "Video file and Thumbnail are required");
  if (!title || !description)
    throw new ApiError(400, "Title and description are required");

  const uploadVideo = await uploadOnCloudinary(videoFile.tempFilePath, "video");
  const uploadThumbnail = await uploadOnCloudinary(
    thumbnail.tempFilePath,
    "image"
  );

  if (!uploadVideo?.secure_url || !uploadThumbnail?.secure_url) {
    throw new ApiError(500, "Cloudinary upload failed");
  }

  const video = await Video.create({
    videoFile: uploadVideo.secure_url,
    thumbnail: uploadThumbnail.secure_url,
    owner: userId,
    title,
    description,
    duration: duration, // Assuming size is in bytes
  });

  if (!video) throw new ApiError(500, "Failed to create video");

  res
    .status(201)
    .json(new ApiResponse(201, video, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  if (!videoId) throw new ApiError(400, "Video Id is required");
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id");

  const video = await Video.findById(videoId)
    .populate("owner", "username fullName avatar")
    .exec();

  if (!video) throw new ApiError(404, "Video not found");

  res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  const { title, description } = req.body;
  const thumbnail = req.file ? req.file.path : null;

  if (!title || !description || !thumbnail) {
    throw new ApiError(400, "Title and description are required");
  }

  if (!videoId) throw new ApiError(400, "Video Id is required");
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const updatedThumbnail = uploadOnCloudinary(thumbnail.tempFilePath, "image");

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      title,
      description,
      thumbnail: updatedThumbnail?.secure_url,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedVideo) {
    throw new ApiError(404, "Video not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!videoId) throw new ApiError(400, "Video Id is required");
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const deletedVideo = await Video.findByIdAndDelete(videoId);

  if (!deletedVideo) throw new ApiError(404, "Video not found");

  res
    .status(200)
    .json(new ApiResponse(200, deletedVideo, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) throw new ApiError(400, "Video Id is required");
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video Id");

  const existingPublishStatus = await Video.findById(videoId);
  if (!existingPublishStatus) {
    throw new ApiError(404, "Video not found");
  }
  //   if (existingPublishStatus.isPublished) {
  //     const updatedStatus = await Video.findByIdAndUpdate(videoId, {
  //       isPublished: false,
  //     });
  //     if (!updatedStatus) throw new ApiError(404, "Video not Found");
  //     return res
  //       .status(200)
  //       .json(
  //         new ApiResponse(
  //           200,
  //           updatedStatus,
  //           "Publish Status Updated Successfully"
  //         )
  //       );
  //   }

  //   if (!existingPublishStatus.isPublished) {
  //     const updatedStatus = await Video.findByIdAndUpdate(videoId, {
  //       isPublished: true,
  //     });
  //     if (!updatedStatus) throw new ApiError(404, "Video not Found");
  //     return res
  //       .status(200)
  //       .json(
  //         new ApiResponse(
  //           200,
  //           updatedStatus,
  //           "Publish Status Updated Successfully"
  //         )
  //       );
  //   }

  const updatedStatus = await Video.findByIdAndUpdate(
    videoId,
    { isPublished: !existingPublishStatus.isPublished },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedStatus, "Publish Status Updated Successfully")
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
