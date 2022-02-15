import express from 'express'
import createHttpError from 'http-errors'
import { isAuthenticatedUser, authorizedRoles } from '../middleware/auth.js'
import ErrorResponse from '../utils/errorhandler.js'
import orderModel from '../models/orderModel.js'
import productModel from '../models/productModel.js'
import ApiFeatures from '../utils/features.js'
import mongoose from 'mongoose'

const orderRouter = express.Router()

// ************ Create new order **********

orderRouter.post('/order/new',isAuthenticatedUser, async (req, res, next) => {
    const {
      shippingInfo,
      orderItems,
      paymentInfo,
      itemsPrice,
      shippingPrice,
      totalPrice,
    } = req.body

    const order = await orderModel.create({
      shippingInfo,
      orderItems,
      paymentInfo,
      itemsPrice,
      shippingPrice,
      totalPrice,
      paidAt: Date.now(),
      user: req.user._id,
    })

    res.status(201).json({
      success: true,
      order,
    })
})

// ************ Get single order **********

orderRouter.get('/order/:id',isAuthenticatedUser, async (req, res, next) => {
  const order = await orderModel.findById(req.params.id).populate(
    "user",
    "name email"
  )
  if (!order) {
    return next(new ErrorResponse("Order not found with this Id", 404));
  }

  res.status(200).json({
    success: true,
    order,
  });
})

// ************ Get logged in user order **********

orderRouter.get('/orders/me',isAuthenticatedUser,  async (req, res, next) => {
    const orders = await orderModel.find({ user: req.user._id })
    res.status(200).json({
      success: true,
      orders,
    })
})

// ************ Get all orders -- Admin **********

orderRouter.get(
  '/admin/orders',
  isAuthenticatedUser,
  authorizedRoles('admin'),
  async (req, res, next) => {
    try {
      const orders = await orderModel.find()

      let totalAmount = 0
      orders.forEach((order) => {
        totalAmount += order.totalPrice
      })

      res.status(200).json({
        success: true,
        totalAmount,
        orders,
      })
    } catch (error) {
      next(error)
    }
  },
)

// ************ Update Order Status -- Admin **********

orderRouter.put(
  '/admin/order/:id',
  isAuthenticatedUser,
  authorizedRoles('admin'),
  async (req, res, next) => {
    try {
      const order = await orderModel.findById(req.params.id)

      if (!order) {
        return next(new ErrorResponse('Order not found with this Id', 404))
      }

      if (order.orderStatus === 'Delivered') {
        return next(
          new ErrorResponse('You have already delivered this order', 400),
        )
      }
     if(req.body.status ==='Shipped'){
         order.orderItems.forEach(async order => {
           await updateStock(order.product, order.quantity);
         });
     }
     

      order.orderStatus = req.body.status

      if (req.body.status === 'Delivered') {
        order.deliveredAt = Date.now()
      }

      await order.save({ validateBeforeSave: false })

      res.status(200).json({
        success: true,
      })
    } catch (error) {
      next(error)
    }
  },
)

async function updateStock(id, quantity) {
  const product = await productModel.findById(id)

  product.Stock -= quantity

  await product.save({ validateBeforeSave: false })
}

// ************ Delete orders -- Admin **********

orderRouter.delete(
  '/admin/order/:id',
  isAuthenticatedUser,
  authorizedRoles('admin'),
  async (req, res, next) => {
    try {
      const order = await orderModel.findById(req.params.id)

      if (!order) {
        return next(new ErrorResponse('Order not found with this Id', 404))
      }

      await order.remove()

      res.status(200).json({
        success: true,
      })
    } catch (error) {
      next(error)
    }
  },
)

export default orderRouter
