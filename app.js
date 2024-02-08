const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

const router = require("./routes/user-routes");

const app = express();

// app.use(cors());
app.use(
  cors({
    credentials: true,
    origin: "https://mern-authentication-using-jwt-secure.onrender.com",
  })
);
app.use(cookieParser());
app.use(express.json());

app.use("/api", router);

// Connect mongoDB to the mongoose
mongoose
  .connect(
    `mongodb+srv://jeereddybhargav:${process.env.DB_PASSWORD}@test1.o2eanfy.mongodb.net/?retryWrites=true&w=majority`
  )
  .then(() => {
    console.log("Connected to Database");
    // Run the server
    app.listen(5000);
    console.log("Server listening....");
  })
  .catch((err) => {
    console.log(err);
  });
