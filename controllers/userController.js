const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// const cookie = require("cookie");

// @desc Get all users
// @route GET /users
// @access Private
const getUsersById = async (req, res) => {
  if (!req?.id) return res.json({ message: "Invalid Query" });
  const { id } = req;
  const { id: userId } = req?.params;
  // console.log(userId)
  try {
    if (userId === "usersList" || !userId) {
      const user = await User.findById(id)
        .select("-password")
        .populate(
          "friendList",
          "username displayname imageUrl verified clap heart thumbsUp"
        )
        .populate(
          "accept",
          "username displayname imageUrl verified clap heart thumbsUp"
        )
        .populate(
          "requested",
          "username displayname imageUrl verified clap heart thumbsUp"
        )
        .lean();
      return res.json(user);
    }
    const user = await User.findById(userId)
      .select("-password -requested -accept")
      .populate("friendList", "username displayname imageUrl verified")
      .populate("accept", "username displayname imageUrl verified")
      .populate("requested", "username displayname imageUrl verified")
      .lean();
    // If no users
    if (!user) {
      return res.status(400).json({ message: "No users found" });
    }
    return res.json(user);
  } catch (err) {
    return res.status(400).json({ message: "No such user exist" });
  }
};

const getRecommendations = async (req, res) => {
  // console.log(req.user);
  if (!req?.id) return res.json({ message: "Invalid Query" });
  const { id } = req;
  // console.log("bhjdhdddndndndsnsdnsnsndnnddnsmdmsdmdsmdsmdsmdsmsdmsdm")
  const { friendList, accept, requested } = await User.findById(id)
    .select("-password")
    .exec();
  const users = await User.find({
    _id: { $nin: [...friendList, id, ...accept, ...requested] },
  })
    .select("username displayname imageUrl verified")
    .limit(25)
    .lean();
  // If no users
  if (!users?.length) {
    return res.status(400).json({ message: "No users found" });
  }

  return res.json(users);
};

const handleFriendReq = async (req, res) => {
  const { reqToId } = req.body;
  const { id } = req;
  // Confirm data
  if (!id) {
    return res.status(403).json({ message: "Unauthorized" });
  }
  if (!reqToId) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (id.toString() === reqToId.toString()) {
    return res.status(400).json({ message: "Bad request" });
  }
  // Does the user exist to update?
  const user = await User.findById(id).select("-password").exec();
  const anotherUser = await User.findById(reqToId).select("-password").exec();
  if (!user || !anotherUser) {
    return res.status(400).json({ message: "User not found" });
  }
  // console.log(reqToId);
  // console.log(id);
  const alreadyReq = user.requested.find(
    (i) => i.toString() === reqToId.toString()
  );

  if (alreadyReq) {
    user.requested = user.requested.filter(
      (i) => i.toString() !== reqToId.toString()
    );
    anotherUser.accept = anotherUser.accept.filter(
      (i) => i.toString() !== id.toString()
    );
    await user.save();
    await anotherUser.save();
    return res.json({ message: "Unrequested" });
  }

  const verifyFriendList = user.friendList.find(
    (i) => i.toString() === reqToId.toString()
  );
  if (verifyFriendList) {
    // Unfriend Both
    user.friendList = user.friendList.filter(
      (i) => i.toString() !== reqToId.toString()
    );
    anotherUser.friendList = anotherUser.friendList.filter(
      (i) => i.toString() !== id.toString()
    );
    await user.save();
    await anotherUser.save();
    return res.json({ message: "Unfriend Successful" });
  }
  user.requested = [...user.requested, anotherUser._id];
  anotherUser.accept = [...anotherUser.accept, user._id];
  await user.save();
  await anotherUser.save();

  res.json({ message: "Requested" });
};

const handleAcceptReq = async (req, res) => {
  const { id } = req;
  if (!id) {
    return res.status(400).json({ message: "Unauthorized" });
  }
  const { reqToId, accepted } = req.body;
  // console.log(reqToId, accepted)
  // Confirm data
  if (!id || !reqToId || typeof accepted !== "boolean") {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Does the user exist to update?
  const user = await User.findById(id).select("-password").exec();
  const anotherUser = await User.findById(reqToId).select("-password").exec();
  if (!user || !anotherUser) {
    return res.status(400).json({ message: "User not found" });
  }
  user.accept = user.accept.filter((i) => i.toString() !== reqToId.toString());
  anotherUser.requested = anotherUser.requested.filter(
    (i) => i.toString() !== id.toString()
  );
  if (!accepted) {
    await user.save();
    await anotherUser.save();
    return res.json({ message: "Rejected" });
  }
  user.friendList = [...user.friendList, anotherUser._id];
  anotherUser.friendList = [...anotherUser.friendList, user._id];
  await user.save();
  await anotherUser.save();

  return res.json({
    message: `Friend Added`,
  });
};
// @desc Create new user
// @route POST /users
// @access Private
const createNewUser = async (req, res) => {
  const { username, password, persist } = req.body;

  // Confirm data
  if (!username || !password) {
    // return req.json()
    // console.log(req.body.username)
    return res.status(400).json({ message: "All fields are required" });
  }

  // Check for duplicate username
  const duplicate = await User.findOne({ username })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  if (duplicate) {
    return res.status(409).json({ message: "Duplicate username" });
  }

  // Hash password
  const hashedPwd = await bcrypt.hash(password, 10); // salt rounds

  const userObject = { username, password: hashedPwd };

  // Create and store new user
  const user = await User.create(userObject);

  if (user) {
    //created
    const accessToken = jwt.sign(
      {
        UserInfo: {
          username: user.username,
          userid: user._id,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { username: user.username },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );
    if (persist === true) {
      res.cookie("jwt", refreshToken, {
        httpOnly: true, //accessible only by web server
        secure: true, //https
        sameSite: "None", //cross-site cookie
        maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
        partitioned: true,
      });
    } else {
      res.cookie("jwt", refreshToken, {
        httpOnly: true, //accessible only by web server
        secure: true, //https
        sameSite: "None", //cross-site cookie
        expires: 0, //cookie expiry: set to match rT
        partitioned: true,
      });
    }

    // Send accessToken containing username and roles
    res.json({ accessToken });
  } else {
    res.status(400).json({ message: "Invalid user data received" });
  }
};

// @desc Update a user
// @route PATCH /users
// @access Private
const updateUser = async (req, res) => {
  const { id } = req;
  if (!id) {
    return res.status(400).json({ message: "Unauthorized" });
  }
  const { username, password, imageUrl, about, displayname } = req.body;

  // Confirm data
  if (!id || !username) {
    return res
      .status(400)
      .json({ message: "All fields except password are required" });
  }

  // Does the user exist to update?
  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  // Check for duplicate
  const duplicate = await User.findOne({ username })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  // Allow updates to the original user
  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: "Duplicate username" });
  }

  user.username = username;
  if (imageUrl) user.imageUrl = imageUrl;
  user.about = about;
  user.displayname = displayname;
  if (password) {
    // Hash password
    user.password = await bcrypt.hash(password, 10); // salt rounds
  }

  const updatedUser = await user.save();

  res.json({ message: `${updatedUser.username} updated` });
};

// @desc Delete a user
// @route DELETE /users
// @access Private
const deleteUser = async (req, res) => {
  const { id } = req;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "User info Required" });
  }

  // Does the user exist to delete?
  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const result = await user.deleteOne();
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
  const reply = `Username ${result.username} with ID ${result._id} deleted`;

  return res.json(reply);
};
const getUsersBySearch = async (req, res) => {
  // console.log("bbbb")
  if (!req?.id) return res.json({ message: "Invalid Query" });
  const { searchInput } = req?.params;
  if (!searchInput) searchInput = "";
  // Search for users with matching username or displayname (case-insensitive)
  const users = await User.find({
    $or: [
      { username: { $regex: searchInput, $options: "i" } }, // Case-insensitive
      { displayname: { $regex: searchInput, $options: "i" } }, // Case-insensitive
    ],
  })
    .select("username displayname imageUrl verified") // Select relevant fields
    .lean();

  if (!users?.length) {
    // console.log("dehhjde")
    return res.status(400).json({ message: "No users found" });
  }

  return res.json(users);
};

module.exports = {
  getUsersById,
  createNewUser,
  updateUser,
  deleteUser,
  getRecommendations,
  getUsersBySearch,
  handleAcceptReq,
  handleFriendReq,
};
