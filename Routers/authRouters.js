const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

// OTP Flow
router.post("/request-otp", authController.requestOtp);
router.post("/verify-otp", authController.verifyOtp);

// // Logout
router.post("/logout", authController.protect, authController.logout);

// //refresh Token

router.post("/refresh-token", authController.refreshToken);

// router.post("/check-auth-valid", authController.checkValidBearer);

// // Protected route example
router.post("/me", authController.protect);

// // Admin-only route
// router.get(
//   "/admin-only",
//   authController.protect,
//   authController.restrictTo("admin"),
//   (req, res) => {
//     res.status(200).json({ status: "success", message: "Hello Admin!" });
//   }
// );

module.exports = router;
