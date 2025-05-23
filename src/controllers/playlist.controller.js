import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  //TODO: create playlist
  if (!name || !description) throw new ApiError(400, "All fields are Required");

  const addedPlaylist = await Playlist.create({
    name,
    description,
  });

  if (!addedPlaylist)
    throw new ApiError(500, "Something went wrong while creating new playlist");

  res
    .status(201)
    .json(new ApiResponse(201, addedPlaylist, "Created playlist successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
  if (!userId) throw new ApiError(400, "User ID is required");
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid User ID");
  }

  const userPlaylists = await Playlist.aggregate([
    {
      $match: { owner: mongoose.Types.ObjectId(userId) },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $unwind: "$owner",
    },
  ]);

  if (userPlaylists.length === 0)
    throw new ApiError(404, "User Playlist not found");

  res
    .status(200)
    .json(
      new ApiResponse(200, userPlaylists, "User Playlist fetch Successfully")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id
  if (!playlistId) throw new ApiError(400, "Playlist Id is required");

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) throw new ApiError(404, "Playlist not found");

  res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetch Successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!playlistId || !videoId)
    throw new ApiError(400, "Playlist Id and video Id is required");

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $push: { videos: videoId } },
    { new: true }
  );

  if (!updatedPlaylist) throw new ApiError(404, "Playlist not found");

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Video Added to the playlist successfully"
      )
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
  if (!playlistId || !videoId)
    throw new ApiError(401, "Playlist Id and video Id is required");

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: { videos: videoId },
    },
    { new: true }
  );

  if (!updatedPlaylist) throw new ApiError(404, "Playlist not found");

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Video remove from playlist successfully"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist

  if (!playlistId) throw new ApiError(401, "PLaylist Id is required");

  const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

  if (!deletedPlaylist)
    throw new ApiError(500, "Something went wrong while deleting the playlist");

  res
    .status(204)
    .json(
      new ApiResponse(204, deletedPlaylist, "Playlist Deleted Successfully")
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist
  if (!playlistId) throw new ApiError(401, "PlaylistId is required");

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      name: name,
      description: description,
    },
    { new: true }
  );

  if (!updatedPlaylist)
    throw new ApiError(500, "Something went wrong while updating playlist");

  res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "Playlist Updated Successfully")
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
