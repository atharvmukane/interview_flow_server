import { NextFunction, request, Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { FlowUserModel } from "./../../userModule/user.model";

export const verifyJwtToken = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { guest } = req.query;

    if (guest && JSON.parse(guest)) {
      return next();

    } else {
      const authorization: string = req.headers.authorization || "";

      if (authorization) {

        const token = authorization.split(" ")[1];
        const payload: any = await verify(token, process.env.ACCESS_TOKEN_SECRET!);


        const user = await FlowUserModel.findById(payload.userId);
        if (user) {
          if (!req.body) {
            req.body = {};
          }
          req.body.userRole = 'User';
          req.body.user = user._id;

          return next();

        }

        // } else {
        //   res.status(401).json({ success: false, message: "You are not authenticated." });
        // }
      }
    }
  } catch (error) {
    res.status(401).json({ success: false, message: "You are not authenticated." });
  }
};
