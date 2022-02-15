import { v2 as cloudinary } from 'cloudinary'
import multer from 'multer'
import { CloudinaryStorage } from 'multer-storage-cloudinary'

const {
  CLOUDINARY_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env

cloudinary.config({
  cloud_name: CLOUDINARY_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
})
// CLOUDINARY_NAME = dytffimtv;

// CLOUDINARY_KEY = 345766481989252;

// CLOUDINARY_SECRET = Hewe0wS4 - N836NHy3tUOEtgkyYk;

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
})
export const parseFile = multer({ storage })
