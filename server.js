const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });
const app = require("./app");

console.log("Loaded ENV:", process.env.NODE_ENV);

const DB_URL_EL = process.env.MONGO_DB_URL.replace("<db_password>", process.env.MONGO_DB_PASSWORD);

mongoose
  .connect(DB_URL_EL, {
    dbName: "momssaltyfish", // 👈 specify database name here)
  })
  .then((con) => {
    console.log("DB connected!");
    console.log("kmlnl");
  })
  .catch((err) => {
    console.error("DB connection error:", err);
  });

const port = process.env.PORT || 3000;
app.listen(port, `0.0.0.0`, () => {
  console.log(`App running on port ${port}...`);
});

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});
