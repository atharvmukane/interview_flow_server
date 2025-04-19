import { getModelForClass, prop } from "@typegoose/typegoose";
import { ObjectId } from "mongodb";

export enum AppGeneralInfoState {
  ABOUTUS = "ABOUTUS",
  GUIDELINES = "GUIDELINES",
  TERMSANDCONDITION = "TERMSANDCONDITION",
  PRIVACYPOLICY = "PRIVACPOLICY",
}

export class APPGENERALINFO {
  readonly _id: ObjectId;

  readonly createdAt: Date;

  @prop()
  content: string;

  @prop({ enum: AppGeneralInfoState })
  state: AppGeneralInfoState;
}

export const AppGeneralInfoModel = getModelForClass(APPGENERALINFO, {
  schemaOptions: { timestamps: true },
});
