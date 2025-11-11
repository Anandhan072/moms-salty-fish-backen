const mongoose = require("mongoose");

/* =====================================================
   Offer Reference Schema (Subdocument)
===================================================== */
const OfferReferenceSchema = new mongoose.Schema(
  {
    offerCode: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [10, "Offer code must be less than 10 characters"],
    },
    Courier: {
      type: Boolean,
      required: true,
      default: false,
    },
    offerPercentage: {
      type: Number,
      min: [1, "Minimum discount must be at least 1%"],
      max: [20, "Maximum discount allowed is 20%"],
      default: 1,
    },
    offerMaxPrice: {
      type: Number,
      required: [true, "Maximum discount price is required"],
      min: [1, "Minimum value must be 1"],
      max: [200, "Maximum value allowed is 200"],
    },
    minPurchaseAmount: {
      type: Number,
      default: 0,
      min: [0, "Minimum purchase must be 0 or greater"],
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    lifetime: {
      type: Boolean,
      default: false,
    },
    validFrom: {
      type: Date,
      default: Date.now,
      set: function (val) {
        if (this.lifetime) return new Date();
        if (!val) return new Date();
        if (typeof val === "number" && val > 0) {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + val);
          return futureDate;
        }
        if (val instanceof Date || !isNaN(Date.parse(val))) return new Date(val);
        return new Date();
      },
    },
    validUntil: {
      type: Date,
      required: false,
      set: function (val) {
        if (this.lifetime) return undefined;
        if (!val) return undefined;
        if (val === 0) {
          const validFromDate = this.validFrom || new Date();
          const nextDay = new Date(validFromDate);
          nextDay.setDate(nextDay.getDate() + 1);
          return nextDay;
        }
        if (typeof val === "number") {
          const validFromDate = this.validFrom || new Date();
          const expiryDate = new Date(validFromDate);
          expiryDate.setDate(expiryDate.getDate() + val);
          return expiryDate;
        }
        if (val instanceof Date || !isNaN(Date.parse(val))) return new Date(val);
        return undefined;
      },
    },
    userIDs: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
  },
  { _id: false }
);

/* =====================================================
   Offer Schema
===================================================== */
const OfferSchema = new mongoose.Schema(
  {
    offerName: {
      type: String,
      required: [true, "Offer name is required"],
      unique: true,
      trim: true,
      maxlength: [100, "Offer name must be less than 100 characters"],
    },
    offerDetails: {
      type: OfferReferenceSchema,
      required: false, // optional now
    },
  },
  { timestamps: true }
);

/* =====================================================
   Middleware to set `isActive` field
===================================================== */
OfferSchema.pre("save", function (next) {
  const now = new Date();
  const offerDetails = this.offerDetails;

  if (offerDetails) {
    if (offerDetails.lifetime) {
      offerDetails.validFrom = now;
      offerDetails.validUntil = undefined;
      offerDetails.isActive = true;
    } else {
      if (!offerDetails.validFrom) offerDetails.validFrom = now;
      if (!offerDetails.validUntil) {
        const validUntilDate = new Date(offerDetails.validFrom);
        validUntilDate.setDate(validUntilDate.getDate() + 3);
        offerDetails.validUntil = validUntilDate;
      }

      if (offerDetails.validFrom <= now) offerDetails.isActive = true;
      else offerDetails.isActive = false;

      if (offerDetails.validUntil && offerDetails.validUntil < now) offerDetails.isActive = false;
    }
  }

  next();
});

/* =====================================================
   Model Export
===================================================== */
module.exports = mongoose.model("Offer", OfferSchema);
