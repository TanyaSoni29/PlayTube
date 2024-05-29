import mongoose from "mongoose";


const videoSchema = new mongoose.Schema({
videoFile: {
type: String,

},
thumbnail: {
type: String,

},
owner: {
    type : mongoose.Schema.Types.ObjectId,
    ref: "User"
},
title: {
   type : String,
   required : true,
},
description: {
    type : String,
    required : true,
    trim : true
},

duration : {
type: Number,

},
views :{
type: Number,
default: 0,
},
isPublished : {
type: Boolean,
default: true,
}
},
{
    timestamps: true,
})

export const Video = mongoose.model("Video", videoSchema)