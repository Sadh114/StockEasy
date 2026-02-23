const router = require("express").Router();
const { Signup, Login } = require("../controllers/AuthController");

router.post("/signup", Signup);
router.post("/login", Login);

module.exports = router;
