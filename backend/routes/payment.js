import express from "express";
import { isAuthenticatedUser } from "../middleware/auth.js";

import Stripe from 'stripe'

const stripe = Stripe(process.env.STRIPE_SECRET_KEY)


const paymentRouter = express.Router();

paymentRouter.post("/payment/process", async (req, res, next) =>{
    const myPayment = await stripe.paymentIntents.create({
    amount: req.body.amount,
    currency: "eur",
    metadata: {
      company: "Strivazon",
    },
  });

  res
    .status(200)
    .json({ success: true, client_secret: myPayment.client_secret });
});

paymentRouter.get("/stripeapikey", async (req, res, next) => {
  res.status(200).json({ stripeApiKey: process.env.STRIPE_API_KEY });
});

export default paymentRouter
