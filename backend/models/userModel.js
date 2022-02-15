import mongoose from 'mongoose'
import validator from 'validator'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'


const { Schema, model } = mongoose

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Please Enter Your name'],
    maxLength: [20, 'Name cannot exceed 20 characters'],
    minLength: [4, 'Name must be more than 4 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please Enter Your email-address'],
    unique: true,
    validate: [validator.isEmail, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Please Enter Your Password'],
    minLength: [8, 'Password must be greater than 8 characters'],
    select: false,
  },

  avatar: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  role: {
    type: String,
    default: 'user',
  },
  createdAt:{
    type:Date,
    default: Date.now,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
})

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next()
  }
      
  this.password = await bcrypt.hash(this.password, 10)
})

// *************** JWT Token ****************

userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  })
}

// *************** Compare password ****************
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password)
}

// *************** Generating Reset password token ****************

userSchema.methods.getResetPasswordToken = function () {
  //  Generating token

  const resetToken = crypto.randomBytes(15).toString('hex')

  // Hashing and adding resetPasswordToken to userSchema

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000

  return resetToken
}

export default model('User', userSchema)
