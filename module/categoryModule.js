const mongoose = require("mongoose");

/* =====================================================
   Utility: Slugify function
===================================================== */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-") // replace spaces & non-word chars with -
    .replace(/^-+|-+$/g, ""); // remove leading/trailing hyphens
}

/* =====================================================
   SubCategory Schema
===================================================== */
const subCategorySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  image: { type: String, trim: true },
  url: {
    type: String,
    trim: true,
    index: true,
    unique: true,
    // ❌ remove required
  },
});

/* =====================================================
   Main Category Schema
===================================================== */
const categorySchema = new mongoose.Schema(
  {
    categoryTitle: {
      type: String,
      required: true,
      trim: true,
      index: true,
      unique: [true, "Category must be unique!"],
    },
    image: {
      type: String,
      trim: true,
    },
    subCategories: {
      type: [subCategorySchema],
      default: [],
    },
    url: {
      type: String,
      trim: true,
      index: true,
      unique: [true, "URL must be unique!"],
      // ❌ remove required
    },
  },
  { timestamps: true }
);

/* =====================================================
   Pre-save Middleware
===================================================== */
categorySchema.pre("save", function (next) {
  // Generate category URL
  if (!this.url || this.isModified("categoryTitle")) {
    this.url = slugify(this.categoryTitle);
  }

  // Generate subcategory URLs
  if (this.subCategories && this.subCategories.length > 0) {
    this.subCategories.forEach((sub) => {
      if (!sub.url || sub.isModified?.("title")) {
        sub.url = slugify(sub.title);
      }
    });
  }

  next();
});

/* =====================================================
   Model Export
===================================================== */
module.exports = mongoose.model("Category", categorySchema);
