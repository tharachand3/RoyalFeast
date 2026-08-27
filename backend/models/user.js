const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
{
  name: {
    type: String,
    required: [true, "Please enter your name"],
    maxlength: [30, "Name cannot exceed 30 characters"],
  },

  email: {
    type: String,
    required: [true, "Please enter email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Enter valid email"],
  },

  password: {
    type: String,
    required: [true, "Enter password"],
    minlength: 6,
    select: false,
  },

  passwordConfirm: {
    type: String,
    required: [true, "Confirm password"],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not same",
    },
  },

  phoneNumber: {
    type: String,
    required: true,
    match: [/^[0-9]{10}$/, "Enter valid phone number"],
  },

  role: {
    type: String,
    enum: ["user", "restaurant-owner", "admin"],
    default: "user",
  },

  avatar: {
    public_id: String,
    url: String,
  },

  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
},
{ timestamps: true }
);

// HASH PASSWORD
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  next();
});

// PASSWORD COMPARE
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword = this.password
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// CHECK IF PASSWORD CHANGED AFTER JWT
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

// CREATE JWT TOKEN
userSchema.methods.getJWTToken = function () {
  const rawExpiry =
    process.env.JWT_EXPIRES ||
    process.env.JWT_EXPIRE ||
    process.env.JWT_EXPIRES_TIME ||
    "90d";
  const days = parseInt(rawExpiry, 10) || 90;
  const expiresIn = days * 24 * 60 * 60;

  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, { expiresIn });
};

// PASSWORD RESET TOKEN
userSchema.methods.createPasswordResetToken = function () {

  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model("User", userSchema);