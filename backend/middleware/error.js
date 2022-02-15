import ErrorResponse from '../utils/errorhandler.js'

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500
  err.message = err.message || 'Internal Server Error'

  //   //   *** Wrong Mongo Id Error **
  //   if (err.name === 'CastError') {
  //     const message = `Resource not found. Invalid:${err.path}`
  //     err = new ErrorResponse(message, 400)
  //   }

  res.status(err.statusCode).json({
    success: false,
    error: err.message,
  })
}

export default errorHandler
