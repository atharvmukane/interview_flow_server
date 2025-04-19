import { getModelForClass, prop } from "@typegoose/typegoose";
import { ObjectId } from "mongodb";

export class AppConfig {
  readonly _id: ObjectId;

  readonly createdAt: Date;

  @prop()
  type: string;

  @prop()
  value: any;

  @prop()
  showButton: boolean;


  @prop()
  commonType: string;
}

export const AppConfigModel = getModelForClass(AppConfig, {
  schemaOptions: { timestamps: true },
});
