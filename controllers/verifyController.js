const nodemailer = require("nodemailer");
const User = require("../models/User");
const crypto = require("crypto");
const bcrypt=require('bcrypt')


const { google } = require("googleapis");

const { CLIENT_IDY, CLIENT_SECRET, REDIRECT_URI, GMAIL_REFRESH} = process.env;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_IDY,
  CLIENT_SECRET,
  REDIRECT_URI
);

oauth2Client.setCredentials({refresh_token:GMAIL_REFRESH});
const accessToken = oauth2Client.getAccessToken(); 

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: 'bhaveshjha58650@gmail.com',
      clientId: process.env.CLIENT_IDY,
      clientSecret: process.env.CLIENT_SECRET,
      accessToken: accessToken.token,
    },
});

const mail = async (req, res) => {
  const { id } = req;
  if (!id) return res.status(403).json({ message: "Unauthorized" });
  const { mail: email } = req?.body;
  const user = await User.findById(id).select("displayname verified");
  if (!user) return res.status(403).json({ message: "Unauthorized" });
  if (!email) return res.status(400).json({ message: "data missing" });
  if (user?.verified === true) {
    return res.status(403).json({message:"You are already verified"})
  }
  try {
    const token = crypto.randomBytes(48).toString("hex");
    const domain = `${process.env.DOMAIN}/verify?token=${token}`;
    const info = await transporter.sendMail({
      from: process.env.OFFICIAL_MAIL, // sender address
      to: email, // list of receivers
      subject: "Verify Your Mail", // Subject line
      html: `<div><b>Hi ${user.displayname}</b>, Greetings from blogSpot.</div>
          <div>Click the link to verify your mail, <a href=${domain}>${domain}</a></div>
          `,
    });
    user.mail = email;
    user.vT = token;
    await user.save();
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json({ message: "Some error occured" });
  }
  // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
  return res.status(200).json({ message: "mail sent" });
};

const verifyMail = async (req, res) => {
  const { token } = req?.query;
  if (!token || !token?.length)
    return res.status(403).json({ message: "Unauthorized" });
  try {
    const user = await User.findOne({ vT: token }).select("displayname");
    if (!user) return res.status(404).json({ message: "No User Found" });
    user.vT = "";
    user.verified = true;
    await user.save();
    return res
      .status(200)
      .send(`Hi ${user.displayname}, your email has been verified. Please go back to blogSpot app and reresh the blogSpot page.`);
  } catch (err) {
    console.log(err?.message);
    return res
      .status(400)
      .json({ message: `Some error occured,${err?.message}` });
  }
};
const passMail = async (req, res) => {
  const { username: uname } = req?.body;
  if (!uname||!uname?.length) return res.status(400).json({ message: "data missing" });
  const user = await User.findOne({username:uname}).select("displayname mail");
  if (!user) return res.status(403).json({ message: "Unauthorized" });
  if (!user.mail)
    return res.status(401).json({
      message: `mail id is not registered, please write to us on ${process.env.OFFICIAL_MAIL} for help.`,
    });
  try {
    const token = crypto.randomBytes(48).toString("hex");
    const domain = `${process.env.DOMAIN}/secure?token=${token}`;
    const info = await transporter.sendMail({
      from: process.env.OFFICIAL_MAIL, // sender address
      to: user.mail, // list of receivers
      subject: `Change your password`, // Subject line
      html: `<div><b>Hi ${user.displayname}</b>, Greetings from blogSpot.</div>
          <div>Click the link to change your password, <a href=${domain}>${domain}</a></div>
          <div>If you are not an intended person, please inform us at ${process.env.OFFICIAL_MAIL}</div>
          `,
    });
    user.cT = token;
    await user.save();
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json({ message: `Some error occured ${err?.message}` });
  }
  // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
  return res.status(200).json({ message: "mail sent" });
};
const verifyPassMail = async (req, res) => {
  const { token } = req?.query;
  if (!token || !token?.length)
    return res.status(403).json({ message: "Unauthorized" });
  try {
    const user = await User.findOne({ cT: token }).select("displayname");
    if (!user) return res.status(404).json({ message: "No User Found" });
    user.cT = "";
    await user.save();
    return res
      .status(200)
      .render('change',{id:user._id,username:user.displayname});
  } catch (err) {
    console.log(err?.message);
    return res
      .status(400)
      .json({ message: `Some error occured,${err?.message}` });
  }
};
const verificationSuccess = async (req, res) => {
  const { password, id } = req?.body;
  if (!password || !id) return res.status(403).json({ message: "Unauthorized, all data required." });
  try {
    const user = await User.findById(id).select('password');
    const hashedPwd = await bcrypt.hash(password, 10);
    user.password = hashedPwd;
    await user.save();
    return res.status(200).send("Password changed successfully.")
  } catch (err) {
    return res.status(400).json({message:"Some unexpected error occured, please try again."})
  }
};
module.exports = {
  mail,
  verifyMail,
  passMail,
  verifyPassMail,
  verificationSuccess,
};
