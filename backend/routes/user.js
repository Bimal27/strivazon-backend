import express from 'express'
import User from '../models/userModel.js'
import ErrorResponse from '../utils/errorhandler.js'
import sendToken from '../utils/jwtToken.js'
import sendEmail from '../utils/sendEmail.js'

import crypto from 'crypto'

import { isAuthenticatedUser, authorizedRoles } from '../middleware/auth.js'
import cloudinary from 'cloudinary'


// Register a User

const userRouter = express.Router()

userRouter.post('/', async (req, res, next) => {
  try {
  
    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
      folder: 'avatars',
      width: 150,
      crop: 'scale',
    })
  

    const { name, email, password } = req.body
    const user = await User.create({
      name,
      email,
      password,
      avatar: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    }
    })

    sendToken(user, 201, res)
    // const token = user.getJWTToken()

    // res.status(201).json({
    //   success: true,
    //   token,
    // })
  } catch (err) {
    next(err)
  }
})

// Login a User
userRouter.post('/login', async (req, res, next) => {
  
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return next(new ErrorResponse('Please enter email and password', 400))
    }
    const user = await User.findOne({ email }).select('+password')

    if (!user) {
      // return next(new ErrorResponse('Invalid email or password', 401))
      return res
        .status(401)
        .json({
          success: false,
          message: "Invalid email or password"
        });
    }
    const isPasswordMatched = await user.comparePassword(password)

    if (!isPasswordMatched) {
      // return next(new ErrorResponse('Invalid email or password', 401))
       return res
         .status(401)
         .json({
           success: false,
           message: "Invalid email or password"
         });
    }

     sendToken(user, 200, res)
//      const token = user.getJWTToken()
// console.log("token", token)
//      res.cookie("token", token)
//      res.status(200).send({success:true, user, token})

    // res.status(200).json({
    //   success: true,
    //   token,
    // })
  } catch (err) {
    next(err)
  }
})

// ******* Logout User **********

userRouter.get('/logout', async (req, res, next) => {
  try {
    res.cookie('token', null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    res.status(200).json({
      success: true,
      message: 'Logged Out Successfully',
    })
  } catch (err) {
    next(err)
  }
})

// ******* Forget Password **********

userRouter.post('/forgotpassword', async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email })

  if (!user) {
    return next(new ErrorResponse('User not found', 404))
  }

  // Get ResetPassword Token
  const resetToken = user.getResetPasswordToken()

  await user.save()

  // const resetPasswordUrl = `${req.protocol}://${req.get(
  //   'host',
  // )}/password/reset/${resetToken}`

  // // Create reset url to email to provided email
  // const resetPasswordUrl = `http://localhost:3001/passwordreset/${resetToken}`

  const resetPasswordUrl = `http://localhost:3000/password/reset/${resetToken}`

  const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\nIf you have not requested this email then, please ignore it.`

  try {
    await sendEmail({
      email: user.email,
      subject: `Ecommerce Password Recovery`,
      message,
    })

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    })
  } catch (error) {
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined

    await user.save()

    return next(new ErrorResponse(error.message, 500))
  }
})

// ****************** Reset Password ****************************

userRouter.put('/password/reset/:token', async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex')
  try {
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    })

    if (!user) {
      return next(
        new ErrorResponse(
          'Reset Password Token is invalid or has been expired',
          400,
        ),
      )
    }

    if (req.body.password !== req.body.conformPassword) {
      return next(new ErrorResponse('Password does not match', 400))
    }

    user.password = req.body.password
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined

    await user.save()

    sendToken(user, 200, res)
  } catch (error) {
    next(error)
  }
})

// ****************** Get user Details ****************************

userRouter.get('/me', isAuthenticatedUser, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    res.status(200).json({
      success: true,
      user,
    })
  } catch (error) {
    next(error)
  }
})

// ****************** Update user password ****************************

userRouter.put(
  '/password/update',
isAuthenticatedUser,
  async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorResponse("Old password is incorrect", 400));
  }

  if (req.body.newPassword !== req.body.conformPassword) {
    return next(new ErrorResponse("password does not match", 400));
  }

  user.password = req.body.newPassword;

  await user.save();

  sendToken(user, 200, res);
  },
)



// ****************** Update User Profile ****************************

userRouter.put("/me/:id", isAuthenticatedUser, async (req, res, next) => {
  const updateProfile = new User({
    _id: req.params.id,
    name: req.body.name,
    email: req.body.email
    // imageUrl: req.body.imageUrl,
    // price: req.body.price,
    // userId: req.body.userId
  });
  User.updateOne({ _id: req.params.id }, updateProfile)
    .then(() => {
      res.status(201).json({ message: "User updated successfully!" });
    })
    .catch(error => {
      res.status(400).json({ error: error });
    });
});

// ****************** Get all the Users (Admin) ****************************

userRouter.get(
  '/admin/users',
  isAuthenticatedUser,
  authorizedRoles('admin'),
  async (req, res, next) => {
    try {
      const users = await User.find()

      res.status(200).json({
        success: true,
        users,
      })
    } catch (error) {
      next(error)
    }
  },
)

// ****************** Get single Users (Admin) ****************************

userRouter.get(
  '/admin/user/:id',
  isAuthenticatedUser,
  authorizedRoles('admin'),
  async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id)

      if (!user) {
        return next(
          new ErrorResponse(`User not found with Id:${req.params.id}`),
        )
      }

      res.status(200).json({
        success: true,
        user,
      })
    } catch (error) {
      next(error)
    }
  },
)

// ****************** Update User Role --- Admin ****************************

userRouter.put(
  '/admin/user/:id',
  isAuthenticatedUser,
  authorizedRoles('admin'),
  async (req, res, next) => {
    try {
      const updateProfile = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
      }

      const user = await User.findByIdAndUpdate(req.user.id, updateProfile, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      })

      res.status(200).json({
        success: true,
      })
    } catch (error) {
      next(error)
    }
  },
)

// ****************** Delete User ---- Admin****************************

userRouter.delete(
  '/admin/user/:id',
  isAuthenticatedUser,
  authorizedRoles('admin'),
  async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id)

      if (!user) {
        return next(
          new ErrorResponse(`User not found with Id:${req.params.id}`),
        )
      }
      await user.remove()

      res.status(200).json({
        success: true,
        message: 'User Deleted Successfully',
      })
    } catch (error) {
      next(error)
    }
  },
)
export default userRouter
