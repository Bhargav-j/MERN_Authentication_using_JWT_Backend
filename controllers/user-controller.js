const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../model/user");

const secretKey = process.env.JWT_SECRET_KEY;

// SingUp
const signup = async (req, res, next) => {
  const { name, email, password } = req.body;

  // Check if email already exists
  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Server Not Responding" });
  }

  if (existingUser) {
    return res
      .status(400)
      .json({ message: "user already exists!!!  Login Instead" });
  }

  // If the email check passed, create a new user

  let newuser;
  try {
    const hashedPassword = bcrypt.hashSync(password, 5);

    newuser = new User({
      name: name,
      email: email,
      password: hashedPassword,
    });

    await newuser.save();
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server Not Responding" });
  }

  return res.status(201).json({ message: newuser });
};

// Login
const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server Not Responding" });
  }

  if (!existingUser) {
    return res.status(400).json({ message: "User Not Found. SignUp" });
  }

  const isPasswordCorrect = bcrypt.compareSync(password, existingUser.password);
  if (!isPasswordCorrect) {
    return res.status(400).json({ message: "Incorrect Password" });
  }

  // creating a JWT token and sending it in a httpOnly cookies
  const token = jwt.sign({ id: existingUser.id }, secretKey, {
    expiresIn: "35s",
  });

  // Removing any existing cookies present in the request with the cookie name equal to userID
  if (req.cookies[`${existingUser.id}`]) {
    re.cookie[`${existingUser.id}`] = "";
  }

  // Here we are passing the cookie in the header
  res.cookie(String(existingUser._id), token, {
    path: "/",
    expires: new Date(Date.now() + 1000 * 80),
    httpOnly: true,
    sameSite: "None",
    secure : true
  });

  return res.status(200).json({
    message: "Successfully LoggedIn",
    user: existingUser,
    token: token,
  });
};

// verifyToken every time user enter to Dashboard page and for every 30sec
//add the userID to the request to get data further
const verifyToken = (req, res, next) => {
  const cookie = req.headers.cookie;
  token = cookie.split("=")[1];

  if (!token) {
    return res.status(404).send("No Token Found");
  }

  jwt.verify(String(token), secretKey, (err, userdata) => {
    if (err) {
      // console.log(err)
      return res.status(400).send("Invalid Token");
    }

    // Adding the userID to the request object
    req.id = userdata.id;
  });

  next();
};

// After token verification, getting the user data from Database
const getuser = async (req, res, next) => {
  // console.log(req)
  const userId = req.id;

  let user;

  try {
    user = await User.findById(userId, "-password");
  } catch (error) {
    console.log(error);
    return res.status(500).send("Server Not Responding");
  }

  if (!user) {
    return res.status(404).json({ message: "user not found" });
  }

  return res.status(200).json(user);
};

//  Assign new token every 30sec after user login
// clear the old cookies and userID and assign freshly
const refreshToken = (req, res, next) => {
  const cookies = req.headers.cookie; // raw cookie string
  const PrevToken = cookies.split("=")[1];

  if (!PrevToken) {
    return res.status(400).json({ message: "Couldn't find the token" });
  }

  jwt.verify(String(PrevToken), secretKey, (err, user) => {
    if (err) {
      console.log(err);
      return res.status(403).json({ message: "Authentication Failed" });
    }

    res.clearCookie(`${user.id}`); // Explicity clearing the cookies before sending the new response every time
    req.cookies[`${user.id}`] = ""; // cookies as an object provided by the cookie-parser middleware

    const token = jwt.sign({ id: user.id }, secretKey, {
      expiresIn: "35s",
    });

    res.cookie(String(User.id), token, {
      path: "/",
      expires: new Date(Date.now() + 1000 * 80),
      httpOnly: true,
      sameSite: "None",
      secure : true
    });

    // assign userID in the request
    req.id = user.id;

    next();
  });
};



const logout = (req, res, next) => {
  const cookie = req.headers.cookie;
  token = cookie.split("=")[1];

  if (!token) {
    return res.status(404).send("No Token Found");
  }

  jwt.verify(String(token), secretKey, (err, userdata) => {
    if (err) {
      console.log(err)
      return res.status(403).json({message : "Authorisation Failed"});
    }

    res.clearCookie(`${userdata.id}`)
    req.cookies[`${userdata.id}`] = "";

    return res.status(200).json({message : "Successfully Logged out"})
  });
};


exports.signup = signup;
exports.login = login;
exports.verifyToken = verifyToken;
exports.getuser = getuser;
exports.refreshToken = refreshToken;
exports.logout = logout;
