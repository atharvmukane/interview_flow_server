import { AppConfigModel } from "../model/appConfig.model";
import { Response, Request, NextFunction } from "express";

export const insertAppConfig = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  if (req.body.type == "FAQ") {
    req.body.value = JSON.stringify(req.body.value);
  }
  let data = await AppConfigModel.create(req.body);
  if (data) {
    res.status(200).json({
      message: "Details added successfully",
      detail: data,
      type: true,
    });
  } else {
    res.status(500).json({
      message: "Error adding Details",
      type: false,
    });
  }
};
export const fetchAppConfig = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const config = await AppConfigModel.findOne({
    type: req.body.type,
  });

  res.status(200).json({
    result: config,
    success: true,
  });
};

export const fetchCommonAppConfig = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const config = await AppConfigModel.find({
    commonType: req.body.commonType,
  });

  res.status(200).json({
    result: config,
    success: true,
  });
};
export const fetchAllRoutes = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const config = await AppConfigModel.find({
    commonType: req.body.type,
  });
  let type: any = [];
  if (config.length > 0) {
    config.forEach((element: any) => {
      type.push(element['type']);
    });
  }
  res.status(200).json({
    result: config,
    type: type,
    success: true,

  });
};


export const getAppConfigs = async (
  req: any,
  res: Response,
  next: NextFunction
) => {

  try {
    const { types } = req.body;

    const configs = await AppConfigModel.find({
      type: { $in: types },
    });

    return res.status(200).json({
      result: configs,
      success: configs != null,
    });

  } catch (e) {
    return res.status(400).json({
      success: false,
    });
  }
};