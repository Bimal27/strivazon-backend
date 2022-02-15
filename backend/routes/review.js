import express from 'express'
import createHttpError from 'http-errors'
import { isAuthenticatedUser, authorizedRoles } from '../middleware/auth.js'
import productModel from '../models/productModel.js'
import ErrorResponse from '../utils/errorhandler.js'
import ApiFeatures from '../utils/features.js'


const reviewRouter = express.Router()

/*************** Product Review ********************/
reviewRouter.put('/review', isAuthenticatedUser, async (req, res, next) => {
  try {
    const { rating, comment, productId } = req.body
    const review = {
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment,
    }

    const product = await productModel.findById(productId)

    const isReviewed = product.reviews.find(
      (rev) => rev.user.toString() === req.user._id.toString(),
      (rev) => rev.user.toString() === req.user._id.toString(),
    )

    if (isReviewed) {
      product.reviews.forEach((rev) => {
        if (rev.user.toString() === req.user._id.toString())
          (rev.rating = rating), (rev.comment = comment)
      })
    } else {
      product.reviews.push(review)
      product.numberOfReviews = product.reviews.length
    }

    let avg = 0
    product.reviews.forEach((rev) => {
      avg += rev.rating
    })
    product.ratings = avg / product.reviews.length

    await product.save({ validateBeforeSave: false })

    res.status(200).json({
      success: true,
    })
  } catch (error) {
    next(error)
  }
})

// ******************* Get All The Review  of a product ********************

reviewRouter.get('/reviews/:productId', async (req, res, next) => {
  try {
    const product = await productModel.findById(req.params.productId)
    if (!product) {
      return next(new ErrorResponse('Product not found', 404))
    }
    res.status(200).json({
      success: true,
      reviews: product.reviews,
    })
  } catch (error) {
    next(error)
  }
})

// // ******************* Delete Review ********************

reviewRouter.delete('/reviews', isAuthenticatedUser, async (req, res, next) => {
  try {
    const product = await productModel.findById(req.query.productId)
    if (!product) {
      return next(new ErrorResponse('Product not found', 404))
    }

    const reviews = product.reviews.filter(
      (rev) => rev._id.toString() !== req.query.id.toString(),
    )

    let avg = 0

    reviews.forEach((rev) => {
      avg += rev.rating
    })

    let ratings = 0;
    if(reviews.length === 0){
      ratings = 0
    }else{
           ratings = avg / reviews.length;
    }

    const numberOfReviews = reviews.length

    await productModel.findByIdAndUpdate(
      req.query.productId,
      {
        reviews,
        ratings,
        numberOfReviews,
      },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      },
    )

    res.status(200).json({
      success: true,
    })
  } catch (error) {
    next(error)
  }
})

export default reviewRouter
