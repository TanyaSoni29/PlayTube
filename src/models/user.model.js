import mongoose, {Schema} from "mongoose";

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
    index: true,
    
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,

  },
  fullName : {
    type: String,
    required: true,
    index: true,
    trim: true,

  },
  avatar: {
    type: String,
    required: true,
  },
  coverImage: {
    type: String,
  },
  password: {
    type: String,
    required: [true, "Password is Required."],

  },
  refreshToken : {
    type: String,

  },
  watchHistory: [{
    type : Schema.Types.ObjectId,
    ref: "Video"
  }]
},
{
    timestamps: true
})


export const User = mongoose.model("User", userSchema);
