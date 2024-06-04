import mongoose, {Schema} from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"


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

userSchema.pre("save", async function(next) {
  if(!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10)
  next();
})

userSchema.method.isPasswordCorrect = async function(password) {
return await bcrypt.compare(password, this.password);
}

userSchema.method.generateAccessToken = function() {
  return jwt.sign(
    {
      _id : this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName
    },
      process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIREIN
    }
  )
}
userSchema.method.generateRefreshToken = function() {
  return jwt.sign(
    {
      _id : this._id,
    },
      process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIREIN
    }
  )
}



export const User = mongoose.model("User", userSchema);
