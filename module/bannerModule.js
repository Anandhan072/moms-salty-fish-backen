const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, unique: true },
    map: { type: String, trim: true },
    descriptions: { type: String, trim: true },
    video: { type: String, trim: true },
    image: { type: String, trim: true },
    button: { type: String, trim: true },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true } // ✅ this adds createdAt & updatedAt
);

module.exports = mongoose.model("Banner", bannerSchema);
