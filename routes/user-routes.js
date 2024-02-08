const express = require("express");
const { signup, login, verifyToken, getuser, refreshToken, logout } = require("../controllers/user-controller");

const router = express.Router();


router.post("/signup", signup);
router.post("/login", login);
router.get("/user", verifyToken, getuser);
router.get('/refresh', refreshToken, verifyToken, getuser)
router.post('/logout', logout)


module.exports = router;