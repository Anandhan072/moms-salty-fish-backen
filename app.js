const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const bodyParser = require('body-parser');
const morgan = require("morgan");


const htmlRouter = require("./Routers/htmlRouters");
const itemsRouter = require("./Routers/itemRouters");
const authRouter = require("./Routers/authRouters");
const userRouter = require("./Routers/userRouters");
const offerRouter = require("./Routers/offerRouters");
const bannerRouter = require("./Routers/bannerRouter");
const categoryRouter = require("./Routers/categoryRouter");


const app = express();

app.use(
  cors({
    origin: ["https://momssaltyfish.com", "http://localhost:5173"],
    credentials: true,
  })
);

app.use(bodyParser.json()); 
// app.options("*", cors({ origin: "http://localhost:5173", credentials: true }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(express.json());
app.use(cookieParser());

app.use(express.static(path.join(__dirname, "public")));
app.use("/api/v1/html/", htmlRouter);
app.use("/api/v1/auth/", authRouter);
app.use("/api/v1/user/", userRouter);
app.use("/api/v1/items/", itemsRouter);
app.use("/api/v1/offer/", offerRouter);
app.use("/api/v1/banner/", bannerRouter);
app.use("/api/v1/category/", categoryRouter);


module.exports = app;
