const User = require("../model/UserModel");
const { createSecretToken } = require("../util/SecretToken");
const bcrypt = require("bcryptjs");

const isProd = process.env.NODE_ENV === "production";

const getCookieDomain = (req) => {
  const host = req.get('host');
  if (host && host.includes('onrender.com')) {
    return '.onrender.com';
  }
  return undefined;
};

module.exports.Signup = async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password || !username) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "User already exists." });
    }
    const user = await User.create({ email, password, username });
    const token = createSecretToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      domain: getCookieDomain(req),
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });
    return res.status(201).json({
      message: "User signed up successfully",
      success: true,
      token,
      user: { id: user._id, email: user.email, username: user.username },
    });
  } catch (error) {
    console.error("[AUTH] Signup failed", error);
    return res.status(500).json({ success: false, message: "Unable to complete signup." });
  }
};




module.exports.Login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }
    const user = await User.findOne({ email });
    if (!user) {
      console.error("[AUTH] Login failed - email not found", { email });
      return res.status(401).json({ success: false, message: "Incorrect email or password." });
    }
    const auth = await bcrypt.compare(password, user.password);
    if (!auth) {
      console.error("[AUTH] Login failed - invalid password", { email });
      return res.status(401).json({ success: false, message: "Incorrect email or password." });
    }
    const token = createSecretToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      domain: getCookieDomain(req),
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({
      message: "User logged in successfully",
      success: true,
      token,
      user: { id: user._id, email: user.email, username: user.username },
    });
  } catch (error) {
    console.error("[AUTH] Login failed", error);
    return res.status(500).json({ success: false, message: "Unable to login right now." });
  }
};
