const Post = require("../models/Post");
const User = require("../models/User");
const mongoose=require('mongoose')
const randomPosts = async (req, res) => {
  const Array = [new mongoose.Types.ObjectId(process.env.OFFICIAL_ACCOUNT), new mongoose.Types.ObjectId(process.env.DEV_ACC)]
  const randomPosts = await Post.aggregate([
    { $match: { public: true,user:{$in:Array} } },
    { $sample: { size: 2 } },
  ]);
  if (!randomPosts) return res.status(404).json({ message: "No data found" });
  return res.json(randomPosts);
};
// @desc Get all post
// @route GET /post
// @access Private
const getAllPost = async (req, res) => {
  const { id } = req;
  let fri = [];
  if(!id)return res.status(403).json({message:"Forbidden"})
  if (id) fri = await User.findById(id).select("friendList").exec();
  const Array = [...fri.friendList, id];
  const Publicpost = await Post.find({ public: true }).populate("user", "imageUrl displayname verified").lean();
  // console.log(Publicpost)
  const PrivatePost = await Post.find({
    public: false,
    user: { $in: Array },
  }).populate("user", "imageUrl displayname verified").lean();
  // console.log(PrivatePost)
  const post = [...Publicpost, ...PrivatePost];
  if (!post?.length) {
    return res.status(400).json({ message: "No post found" });
  }

  res.json(post);
};


// @desc Create new post
// @route POST /post
// @access Private
const createNewPost = async (req, res) => {
  const { id } = req;
  if (!id) return res.status(400).json({ message: "Unauthorized" });
  const { title, content, imageUrl, public } = req.body;

  // Confirm data
  if (!title || !content || typeof public !== "boolean") {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Check for duplicate title
  const duplicate = await Post.findOne({ title })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  if (duplicate) {
    return res.status(409).json({ message: "Duplicate post title" });
  }

  // Create and store the new user
  const post = await Post.create({
    user: id,
    title,
    content,
    public,
    updatedAt: new Date()
  });

  if (imageUrl) post.imageUrl = imageUrl;
  const saveUser = await User.findById(id).select("-password").exec();
  saveUser.posts = [...saveUser.posts, post._id];
  const y = await saveUser.save();
  const x = post.save();
  if (x && y) {
    // Created
    return res.status(201).json({ message: "New post created" });
  } else {
    return res.status(400).json({ message: "Invalid post data received" });
  }
};

// @desc Update a post
// @route PATCH /post
// @access Private
const updatePost = async (req, res) => {
  const { id: x } = req;
  if (!x) {
    return res.status(400).json({ message: "Unauthorized" });
  }
  const { id, title, content, imageUrl, public } = req.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Confirm post exists to update
  const post = await Post.findById(id).exec();

  if (!post) {
    return res.status(400).json({ message: "post not found" });
  }
  if (post.user != x) {
    return res.status(403).json({ message: "user not matching" });
  }
  // Check for duplicate title
  const duplicate = await Post.findOne({ title })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  // Allow renaming of the original post
  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: "Duplicate post title" });
  }
  if (title) post.title = title;
  if (content) post.content = content;
  if (typeof public === "boolean") post.public = public;
  if (imageUrl) post.imageUrl = imageUrl;
  post.updatedAt=new Date()
  const updatedpost = await post.save();

  res.json(`'${updatedpost.title}' updated`);
};

// @desc Delete a post
// @route DELETE /post
// @access Private
const deletePost = async (req, res) => {
  const { id: user } = req;
  if (!user) {
    return res.status(400).json({ message: "Unauthorized" });
  }
  const { id } = req.body;
  // console.log(id)
  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "post ID required" });
  }
//  console.log(id)
  // Confirm post exists to delete
  const post = await Post.findById(id).exec();
//  console.log(post)
  if (!post) {
    return res.status(400).json({ message: "post not found" });
  }
  if (user != post.user) {
    return res.status(403).json({ message: "user not matching" });
  }
  const result = await post.deleteOne();

  const reply = `post '${result.title}' with ID ${result._id} deleted`;

  res.json(reply);
};

const handleReactions = async (req, res) => {
  const { id: userId } = req;
  const { id, reactionName } = req.body;
  if (!id || !userId || !reactionName) {
    return res.status(400).send({ message: "data missing" });
  }
  const post = await Post.findById(id).select("-imageUrl -content -title").exec();
  const user = await User.findById(userId).select("-password -friendList -accept -requested").exec();
  if (!post || !user)
    return res.status(400).send({ message: "No User/Post exist" });
  const getArray = user[reactionName].filter(
    (i) => i.toString() == post._id.toString()
  );
  // console.log(getArray);
  if (!getArray.length) {
    post.reactions[reactionName] += 1;
    user[reactionName] = [...user[reactionName], post._id];
  } else {
    post.reactions[reactionName] -= 1;
    user[reactionName] = user[reactionName].filter(
      (i) => i.toString() != post._id.toString()
    );
  }
  const x = await post.save();
  const y = await user.save();
  res.status(200).json({ message: `${x.title} Updated` });
};

const getPostsByUserId = async (req, res) => {
  const { id: userId } = req;
  let { id } = req?.params;
  // console.log(id)
  if (id==='postsList'||!id) {
    id = userId;
  }
  try {
    if (!id || !userId)
      return res.send(400).json({ message: "All field required" });
    const user = await User.findById(userId).select("-password").exec();
    if (id.toString() == userId.toString()) {
      const Posts = await Post.find({ _id: { $in: user.posts } }).exec();
      return res.json(Posts);
    }
    const array = user.friendList.filter((i) => i.toString() == id.toString());
    // console.log(array)
    const friendUser = await User.findById(id).select("-password").exec();
    if (array.length) {
      const Posts = await Post.find({ _id: { $in: friendUser.posts } }).exec();
      // console.log(Posts)
      return res.json(Posts);
    } else {
      const Posts = await Post.find({
        _id: { $in: friendUser.posts },
        public: true,
      }).exec();
      return res.json(Posts);
    }
  } catch (err) {
    return res.status(400).json({message:"Error"})
  }
};

module.exports = {
  getAllPost,
  createNewPost,
  updatePost,
  deletePost,
  handleReactions,
  getPostsByUserId,
  randomPosts,
};
