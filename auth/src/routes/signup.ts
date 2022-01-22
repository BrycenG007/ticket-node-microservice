import express, { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { BadRequestError } from "../errors/bad-request-error";
import jwt from "jsonwebtoken";

import { RequestValidationError } from "../errors/request-validation-error";
import { User } from "../models/user";
import { JsonWebTokenError } from "jsonwebtoken";

const router = express.Router();

router.post(
  "/api/users/signup",
  [
    body("email").isEmail().withMessage("Email must be valid"),
    body("password")
      .trim()
      .isLength({ min: 4, max: 20 })
      .withMessage("Password must be between 4 and 20 characters"),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw new RequestValidationError(errors.array());
    }
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new BadRequestError("User email already exists");
    }

    const newUser = User.build({ email, password });
    await newUser.save();

    //generate a JWT
    const userJwt = jwt.sign({
      id: newUser.id,
      email: newUser.email
    }, process.env.JWT_KEY!);

    //store it on session object
    req.session = {
      jwt: userJwt
    };

    console.log(userJwt);
    console.log(req.session);    

    res.status(201).send(newUser);
  }
);

export { router as signupRouter };
