/****************************************************************************************
 *  ITEM MODEL - Enhanced Production Version (Final)
 *  Author: Salty Fish
 *  Description: Scalable item schema with stock, variants, reviews, SEO, and meta info
 ****************************************************************************************/

const mongoose = require("mongoose");
const crypto = require("crypto");
const { Schema } = mongoose;

/* =====================================================
   VARIANT SCHEMA
===================================================== */
const VariantSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    weight: {
      value: { type: Number, required: true, min: 1 },
      unit: { type: String, default: "g", enum: ["g", "kg", "ml", "l", "pcs"] },
    },
    price: {
      type: Schema.Types.Decimal128,
      required: true,
      min: 0,
      get: (v) => (v ? parseFloat(v.toString()) : v),
      set: (v) => mongoose.Types.Decimal128.fromString(String(v)),
    },
    MRP: {
      type: Schema.Types.Decimal128,
      required: true,
      min: 0,
      get: (v) => (v ? parseFloat(v.toString()) : v),
      set: (v) => mongoose.Types.Decimal128.fromString(String(v)),
      validate: {
        validator: function (v) {
          return !this.price || parseFloat(v.toString()) >= parseFloat(this.price.toString());
        },
        message: "MRP must be greater than or equal to price",
      },
    },
    offerPrice: {
      type: Schema.Types.Decimal128,
      get: (v) => (v ? parseFloat(v.toString()) : v),
      set: (v) => mongoose.Types.Decimal128.fromString(String(v)),
    },
    offerPercentage: { type: String },
    sku: { type: String, trim: true, sparse: true },
    barcode: { type: String, trim: true, sparse: true },
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true, toJSON: { getters: true }, toObject: { getters: true } }
);

/* =====================================================
   STOCK UPDATE SCHEMA
===================================================== */
const StockUpdateSchema = new Schema(
  {
    value: { type: Number, required: true },
    type: { type: String, enum: ["add", "remove"], required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

/* =====================================================
   DESCRIPTION SCHEMA
===================================================== */
const DescriptionSchema = new Schema(
  {
    header: { type: String, trim: true },
    content: { type: String, trim: true },
  },
  { _id: false, timestamps: true }
);

/* =====================================================
   USER REVIEW SCHEMA
===================================================== */
const UserReviewSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    userName: { type: String },
    gender: { type: String, enum: ["male", "female", "other"], default: "other" },
    userProfile: {
      type: String,
      trim: true,
      default: function () {
        if (this.gender === "female") {
          return "https://res.cloudinary.com/dzj11mc68/image/upload/v1760363196/woman_rvbkyn.png";
        } else if (this.gender === "male") {
          return "https://res.cloudinary.com/dzj11mc68/image/upload/v1760363190/man_qbihxz.png";
        } else {
          return "https://res.cloudinary.com/dzj11mc68/image/upload/v1760363199/neutral_user.png";
        }
      },
    },
    comment: { type: String, trim: true },
    commentImage: [{ type: String, trim: true }],
    rating: { type: Number, min: 1, max: 5, required: true },
    verifiedPurchase: { type: Boolean, default: false },
    helpfulVotes: { type: Number, default: 0 },
  },
  { _id: true, timestamps: true }
);

/* =====================================================
   ITEM SCHEMA
===================================================== */
const ItemSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    sortName: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, trim: true, lowercase: true },

    description: { type: [DescriptionSchema], default: [] },
    userReviews: { type: [UserReviewSchema], default: [] },

    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      validate: {
        validator: async function (catId) {
          const Category = mongoose.model("Category");
          return !!(await Category.exists({ _id: catId }));
        },
        message: "Invalid category reference",
      },
    },

    subCategory: {
      type: [Schema.Types.ObjectId],
      required: true,
      validate: {
        validator: async function (subs) {
          if (!this.category) return false;
          const Category = mongoose.model("Category");
          const cat = await Category.findById(this.category);
          if (!cat || !Array.isArray(cat.subCategories)) return false;
          const allowed = cat.subCategories.map((s) => s._id.toString());
          return subs.every((s) => allowed.includes(s.toString()));
        },
        message: (props) => `Invalid subCategory: ${props.value}`,
      },
    },

    stockUnit: { type: String, default: "g", enum: ["g", "kg", "ml", "l", "pcs"] },
    stockTotalWeight: {
      value: { type: Number, default: 0 },
      at: { type: Date, default: Date.now },
    },
    stockBalanceWeight: {
      value: { type: Number, default: 0 },
      at: { type: Date, default: Date.now },
    },
    lowStockThreshold: { type: Number, default: 10 },
    stockUpdatedArray: { type: [StockUpdateSchema], default: [] },

    variants: { type: [VariantSchema], default: [] },

    photos: {
      type: [
        {
          url: { type: String, trim: true },
          main: { type: Boolean, default: false },
        },
      ],
      validate: [(arr) => arr.length <= 10, "{PATH} exceeds 10 images"],
      default: [
        "https://res.cloudinary.com/dzj11mc68/image/upload/v1760366597/Brick_Veil_by_Monsoon_Collective_y3493m.jpg",
      ],
    },
    mainPhoto: { type: String, trim: true },
    barcode: { type: String, trim: true, sparse: true },

    active: { type: Boolean, default: true },
    deleted: { type: Boolean, default: false },
    metadata: {
      brand: { type: String, trim: true },
      origin: { type: String, trim: true },
      tags: [{ type: String, trim: true }],
      nutritionalInfo: { type: String },
      shelfLife: { type: String },
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true, virtuals: true },
    toObject: { getters: true, virtuals: true },
  }
);

/* =====================================================
   VIRTUALS
===================================================== */
ItemSchema.virtual("inStock").get(function () {
  return this.stockBalanceWeight.value > 0;
});

ItemSchema.virtual("averageRating").get(function () {
  if (!this.userReviews.length) return 0;
  const total = this.userReviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((total / this.userReviews.length) * 10) / 10;
});

/* =====================================================
   INDEXES
===================================================== */
ItemSchema.index({ name: 1, category: 1 }, { unique: true });
ItemSchema.index({ active: 1 });
ItemSchema.index({ createdAt: -1 });
ItemSchema.index({ name: "text", sortName: "text", "description.content": "text" });

/* =====================================================
   PRE-SAVE HOOKS
===================================================== */
ItemSchema.pre("save", async function (next) {
  // ✅ Slug generation
  if (this.isModified("name") && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  // ✅ Ensure one main photo
  if (Array.isArray(this.photos) && this.photos.length > 0) {
    let mainImg = this.photos.find((p) => p.main);
    if (!mainImg) {
      this.photos[0].main = true;
      mainImg = this.photos[0];
    }
    this.mainPhoto = mainImg.url;
  }

  // ✅ Unique item barcode
  if (!this.barcode) {
    let unique = false;
    while (!unique) {
      const code = "ITEM-" + crypto.randomBytes(4).toString("hex").toUpperCase();
      const exists = await mongoose.models.Item.findOne({ barcode: code });
      if (!exists) {
        this.barcode = code;
        unique = true;
      }
    }
  }

  // ✅ Variant offer / SKU / barcode logic
  if (Array.isArray(this.variants)) {
    for (const [i, variant] of this.variants.entries()) {
      const mrp = parseFloat(variant.MRP?.toString() || 0);
      const price = parseFloat(variant.price?.toString() || 0);

      if (mrp > 0 && price > 0) {
        // ---- Offer amount = MRP - Price ----
        let offerAmount = mrp - price;

        // ---- Offer percentage ----
        let offerPercent = ((mrp - price) / mrp) * 100;
        if (offerPercent > 50) {
          offerPercent = 50;
          // when capped, recompute price based on 50% offer
          offerAmount = mrp * 0.5;
        }

        this.variants[i].offerPrice = mongoose.Types.Decimal128.fromString(offerAmount.toFixed(2));
        this.variants[i].offerPercentage = `${Math.round(offerPercent)}%`;
      }

      // ---- SKU generation ----
      if (!variant.sku && this.name) {
        const nameLetters = this.name
          .replace(/[^a-zA-Z0-9\s-]/g, "")
          .split(/\s|-/)
          .filter(Boolean)
          .map((word) => word[0].toUpperCase())
          .join("");
        const weightPart = variant.weight?.value ? `-${variant.weight.value}` : "";
        this.variants[i].sku = `${nameLetters}${weightPart}`;
      }

      // ---- Unique variant barcode ----
      if (!variant.barcode) {
        let uniqueVariant = false;
        while (!uniqueVariant) {
          const vCode = "VAR-" + crypto.randomBytes(4).toString("hex").toUpperCase();
          const exists = await mongoose.models.Item.findOne({
            "variants.barcode": vCode,
          });
          if (!exists) {
            this.variants[i].barcode = vCode;
            uniqueVariant = true;
          }
        }
      }
    }
  }

  next();
});

/* =====================================================
   EXPORT
===================================================== */
module.exports = mongoose.model("Item", ItemSchema);
