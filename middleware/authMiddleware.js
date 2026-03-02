const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({
      message: "Access Denied. No token provided."
    });
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);

    req.user = verified; // { id: user._id }
    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid or Expired Token"
    });
  }
};