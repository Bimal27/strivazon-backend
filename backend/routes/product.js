import express from 'express'
import createHttpError from 'http-errors'
import { isAuthenticatedUser, authorizedRoles } from '../middleware/auth.js'
import productModel from '../models/productModel.js'
import ErrorResponse from '../utils/errorhandler.js'
import ApiFeatures from '../utils/features.js'
import cloudinary from 'cloudinary'

const productRouter = express.Router()

//*************** CREATE PRODUCT Admin ********************/
productRouter.post(
  '/admin/product',
  isAuthenticatedUser,
  authorizedRoles('admin'),
  async (req, res, next) => {
    try {

      let images = [];

      if (typeof req.body.images === "string") {
        images.push(req.body.images);
      } else {
        images = req.body.images;
      }

  const imagesLinks = [];

  for (let i = 0; i < images.length; i++) {
    const result = await cloudinary.v2.uploader.upload(images[i], {
      folder: "products",
    });

    imagesLinks.push({
      public_id: result.public_id,
      url: result.secure_url,
    });
  }
     req.body.images = imagesLinks;
  req.body.user = req.user.id;

  const product = await productModel.create(req.body);

  res.status(201).json({
    success: true,
    product,
  });
    } catch (error) {
      next(error)
    }
  },
)

//*************** GET ALL PRODUCTS ********************/
productRouter.get('/product', async (req, res, next) => {
  try {
    const resultPerPage = 8
    const productsCount = await productModel.countDocuments()
    const apiFeatures = new ApiFeatures(productModel.find(), req.query)
      .search()
      .filter()
      .pagination(resultPerPage)
    const products = await apiFeatures.query
    res.send(products, productsCount, resultPerPage)
  } catch (error) {
    next(error)
  }
})

// Get All Product (Admin)
productRouter.get(
  "/admin/products",
  isAuthenticatedUser,
  authorizedRoles("admin"),
  async (req, res, next) => {
    const products = await productModel.find();

    res.status(200).json({
      success: true,
      products
    });
  }
);

//*************** GET PRODUCTS BY ID ********************/
productRouter.get('/product/:id', async (req, res, next) => {
  const product = await productModel.findById(req.params.id)

  if (!product) {
    return next(new ErrorResponse('Product not found', 404))
  }
  res.status(200).json({
    success: true,
    product,
  })
})

//*************** UPDATE PRODUCT  Admin ********************/
productRouter.put(
  '/admin/product/:id',
  isAuthenticatedUser,
  authorizedRoles('admin'),
  async (req, res, next) => {
    try {

       let product = await productModel.findById(req.params.id)
        let images = [];

  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images;
  }

  if (images !== undefined) {
    // Deleting Images From Cloudinary
    for (let i = 0; i < product.images.length; i++) {
      await cloudinary.v2.uploader.destroy(product.images[i].public_id);
    }

    const imagesLinks = [];

    for (let i = 0; i < images.length; i++) {
      const result = await cloudinary.v2.uploader.upload(images[i], {
        folder: "products",
      });

      imagesLinks.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }

    req.body.images = imagesLinks;
  }

      product = await productModel.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true,
          useFindAndModify: false, },
      )
      if (product) res.send(product)
      else
        next(
          createHttpError(404, `Product with id ${req.params.id} is not found`),
        )
    } catch (error) {
      next(error)
    }
  },
)

//*************** DELETE PRODUCT Admin ********************/
productRouter.delete(
  '/admin/product/:id',
  isAuthenticatedUser,
  authorizedRoles('admin'),
  async (req, res, next) => {
    try {
      const product = await productModel.findById(req.params.id);

  if (!product) {
    return next(new ErrorResponse("Product not found", 404));
  }

  // Deleting Images From Cloudinary
  for (let i = 0; i < product.images.length; i++) {
    await cloudinary.v2.uploader.destroy(product.images[i].public_id);
  }

  await product.remove();

  res.status(200).json({
    success: true,
    message: "Product Delete Successfully",
  });
    } catch (error) {
      next(error)
    }
  },
)

export default productRouter
