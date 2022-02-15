import User from '../models/userModel.js'
import ErrorResponse from '../utils/errorhandler.js'
import jwt from 'jsonwebtoken'

export const isAuthenticatedUser = async (req, res, next) => {

  const { token } = req.cookies

  

  if (!token) {
    return next(new ErrorResponse('Please Login to access this resource', 401))
  }

  const decodedData = jwt.verify(token, process.env.JWT_SECRET)

  req.user = await User.findById(decodedData.id)

  next()

}
export const authorizedRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `Role: ${req.user.role} is not allowed to access this resource `,
          403,
        ),
      )
    }

    next()
  }
}
