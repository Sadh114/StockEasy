const jwt = require("jsonwebtoken");
const User = require("../model/UserModel");

const getTokenFromRequest = (req) => {
  const cookieToken = req.cookies?.token;
  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return null;
};

const authRequired = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const payload = jwt.verify(token, process.env.TOKEN_KEY);
    const user = await User.findById(payload.id).select("_id username email avatarUrl balance");

    if (!user) {
      return res.status(401).json({ success: false, message: "Session is invalid" });
    }

    req.user = user;
    return next();
  } catch (error) {
    console.error("[AUTH] Token verification failed", error.message);
    return res.status(401).json({ success: false, message: "Session expired. Please login again." });
  }
};

module.exports = { authRequired };
