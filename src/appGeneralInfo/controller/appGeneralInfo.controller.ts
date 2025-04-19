import { Response, Request, NextFunction } from "express";
import { ErrorResponse } from "../../utils/errorResponse";
import {
  AppGeneralInfoModel,
  AppGeneralInfoState,
} from "../model/appGeneralInfo.model";

export const createInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let generalInfo = await AppGeneralInfoModel.create(req.body);
  res.status(200).send({
    message: "Success",
    type: true,
    result: generalInfo,
  });
};

export const fetchInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { body } = req;
  const { state } = body;
  const generalInfo = await AppGeneralInfoModel.findOne({ state: state });
  res.status(200).send({
    message: "Success",
    type: true,
    result: generalInfo,
  });
};

export const fetchPolicy = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { body } = req;
  const { state } = body;
  const generalInfo = await AppGeneralInfoModel.findOne({ state: state });
  res.status(200).send({
    message: "Success",
    type: true,
    result: generalInfo,
  });
};

export const updateInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { body } = req;
  const { infoId } = body;
  let generalInfo;
  generalInfo = await AppGeneralInfoModel.findById(infoId);
  if (!generalInfo) {
    return next(new ErrorResponse(`Info not found by this id:${infoId}`, 404));
  }
  generalInfo = await AppGeneralInfoModel.findByIdAndUpdate(
    { _id: infoId },
    { content: req.body.content },
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200).send({
    message: "Success",
    type: true,
    result: generalInfo,
  });
};
