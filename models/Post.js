const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,  
    },
    content: {
      type: String,
      default:""
    },
    imageUrl: {
      type: String,
      default:""
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    public: {
      type: Boolean,
      required: true,
    },
    reactions: {
      thumbsUp: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }],
      clap: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }],
      heart: [{
       type: mongoose.Schema.Types.ObjectId,
       ref: "User",
      }],
    },
    updatedAt: {
      type: Date,
      required:true
    }
  },
);

module.exports = mongoose.model("Post", postSchema);
