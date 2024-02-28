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
      thumbsUp: {
        type: Number,
        default: 0,
      },
      clap: {
        type: Number,
        default: 0,
      },
      heart: {
        type: Number,
        default: 0,
      },
    },
    updatedAt: {
      type: Date,
      required:true
    }
  },
);

module.exports = mongoose.model("Post", postSchema);
