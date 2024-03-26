const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  displayname: {
    type: String,
    default: "Guest User",
    required:true
  },
  mail: {
    type: String,
    default:""
  },
  vT: {
    type: String,
    default:""
  },
  cT: {
    type: String,
    default:""
  },
  password: {
    type: String,
    required: true,
  },
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
  thumbsUp: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
  heart: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
 clap: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
  about: {
    type: String,
  },
  verified: {
    type: Boolean,
    default: false,
    required:true
  },
  friendList: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  imageUrl: {
    type: String,
    default:"https://img.freepik.com/premium-vector/businessman-avatar-cartoon-character-profile_18591-50581.jpg?size=626&ext=jpg&ga=GA1.1.441218786.1698688883&semt=ais"
  },
  requested:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  accept:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ]
});

module.exports = mongoose.model("User", userSchema);
