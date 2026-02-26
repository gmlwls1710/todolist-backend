const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 1,
    },
    user_type: {
      type: String,
      required: true,
      enum: ['customer', 'admin'],
    },
  },
  {
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
  }
);

module.exports = mongoose.model('User', userSchema);
