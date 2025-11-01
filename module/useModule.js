const mongoose = require("mongoose");
const crypto = require("crypto");
const validator = require("validator");

/* =====================================================
   📦 Item Reference Schema (for cart, favorites, orders)
===================================================== */
const itemReferenceSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId },
  quantity: { type: Number, default: 1, min: 1 },
  addedAt: { type: Date, default: Date.now },
});

/* =====================================================
   🔑 Token Schema Base (for access + refresh)
===================================================== */
const refreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true },
  deviceId: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

/* =====================================================
   🛍 User Product Info Schema
===================================================== */
const userProductInfoSchema = new mongoose.Schema({
  favorites: { type: [itemReferenceSchema], default: [] },
  cart: { type: [itemReferenceSchema], default: [] },
  orders: {
    type: [
      {
        items: { type: [itemReferenceSchema], required: true },
        orderDate: { type: Date, default: Date.now },
        status: {
          type: String,
          enum: [
            "pending",
            "accepted",
            "preparing",
            "waiting-for-shipment",
            "shipped",
            "delivered",
            "awaiting-review",
            "cancelled",
          ],
          default: "pending",
        },
        totalAmount: { type: Number, default: 0, min: 0 },
      },
    ],
    default: [],
  },
});

/* =====================================================
   🏠 Address Schema
===================================================== */
const addressSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Home", "Office", "Others"],
    default: "Home",
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: (v) => !v || validator.isMobilePhone(v, "any"),
      message: "Invalid phone number",
    },
  },
  street: { type: String, trim: true },
  addressLine: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  pincode: { type: String, trim: true },
  country: { type: String, default: "India" },
});

/* =====================================================
   👤 User Schema
===================================================== */
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      unique: true,
      validate: {
        validator: (v) => !v || validator.isEmail(v),
        message: "Invalid email address",
      },
    },
    phoneNumber: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      validate: {
        validator: (v) => !v || validator.isMobilePhone(v, "any"),
        message: "Invalid phone number",
      },
    },

    name: { type: String, trim: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },

    // OTP for login
    otp: String,
    otpExpires: Date,

    // Tokens
    refreshTokens: { type: [refreshTokenSchema], default: [] },

    address: [addressSchema],

    userProfile: {
      type: String,
      trim: true,
      validate: {
        validator: (v) => !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v),
        message: "Invalid profile image URL",
      },
    },

    userProductInfo: { type: userProductInfoSchema, default: {} },

    active: { type: Boolean, default: true, select: false },
  },
  { timestamps: true }
);

/* =====================================================
   ⚙️ Pre-validation
===================================================== */
userSchema.pre("validate", function (next) {
  if (!this.email && !this.phoneNumber) {
    next(new Error("Either email or phone number is required"));
  } else next();
});

/* =====================================================
   🔢 OTP METHODS
===================================================== */
userSchema.methods.createOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = crypto.createHash("sha256").update(otp).digest("hex");
  this.otpExpires = Date.now() + 3 * 60 * 1000; // 3 minutes
  return otp;
};

userSchema.methods.verifyOTP = function (enteredOTP) {
  if (!this.otp || !this.otpExpires) return false;
  const hashed = crypto.createHash("sha256").update(enteredOTP).digest("hex");
  const isValid = this.otp === hashed && this.otpExpires > Date.now();
  if (isValid) {
    this.otp = undefined;
    this.otpExpires = undefined;
  }
  return isValid;
};

/* =====================================================
   🔑 TOKEN METHODS
===================================================== */

// Add or update a token (access or refresh)
userSchema.methods.addToken = async function (token, deviceId, validDays) {
  const hashed = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000); // expiry in days
  this.refreshTokens = this.refreshTokens.filter((t) => t.deviceId !== deviceId);
  this.refreshTokens.push({ tokenHash: hashed, deviceId, expiresAt });
  return this.save({ validateBeforeSave: false });
};

// Verify refresh token
userSchema.methods.verifyRefreshToken = function (token, deviceId) {
  const hashed = crypto.createHash("sha256").update(token).digest("hex");
  const t = this.refreshTokens.find((r) => r.tokenHash === hashed && r.deviceId === deviceId);
  return !!t && t.expiresAt > Date.now();
};

// Remove expired tokens
userSchema.methods.removeExpiredTokens = async function () {
  const now = Date.now();
  this.refreshTokens = this.refreshTokens.filter((r) => r.expiresAt > now);
  return this.save({ validateBeforeSave: false });
};

// Revoke token for a specific device
userSchema.methods.revokeAccessToken = async function (deviceId) {
  this.refreshTokens = this.refreshTokens.filter((r) => r.deviceId !== deviceId);
  return this.save({ validateBeforeSave: false });
};

/* =====================================================
   🧩 Indexes for performance
===================================================== */
userSchema.index({ active: 1 });
userSchema.index({ "refreshTokens.deviceId": 1 });

/* =====================================================
   ✅ Export Model
===================================================== */
module.exports = mongoose.model("User", userSchema);
