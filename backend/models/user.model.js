const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
      userEmail: {
              type: String,
              required: true,
              unique: true,
              trim: true,
              minlength: 1
      },
/*      userId: {
              type: String,
              required: true,
              unique: true,
              trim: true,
              minlength: 1
      },*/
      accessToken: {
              type: String,
              required: true,
              unique: false,
              trim: true,
              minlength: 1
      },
      refreshToken: {
              type: String,
              required: true,
              unique: false,
              trim: true,
              minlength: 1
      },
      expirationTimestamp: {
          type: Number, // TODO: Probably better to save as date..
          required: true,
          unique: false
      }
}, {
      timestamps: true,
});

const User = mongoose.model('User', userSchema, 'user');

module.exports = User;
