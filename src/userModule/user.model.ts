import { getModelForClass, prop, Ref } from '@typegoose/typegoose';
import { ObjectId } from 'mongodb';
// import { LoyaltyLevel } from '../loyaltyProgramModule/loyalty.model';


export enum UserRole {
  User = 'User',
  JobSeeker = 'Job Seeker',
  Employer = 'Employer',
}

export class FlowUser {
  readonly _id: ObjectId;

  readonly createdAt: Date;

  readonly updatedAt: Date;

  @prop({ trim: true })
  fullName: string;

  @prop({ trim: true })
  email: string;

  @prop()
  phone: string;

  @prop({ default: '91' })
  countryCode: string;


  @prop({ enum: UserRole })
  role: UserRole;

  @prop()
  dob: Date;

  @prop()
  gender: string;

  @prop({ default: 0 })
  totalSavings: number;

  @prop()
  walletBalance: number;

  @prop()
  walletId: string;

  @prop()
  avatar: string;

  @prop()
  fcmTokens: [string];

  @prop()
  password: string;

  // @prop({ ref: () => LoyaltyLevel })
  // membershipLevel: Ref<LoyaltyLevel>;

  @prop({ default: true })
  isActive: boolean;


  @prop({ default: false })
  isDeleted: boolean;
}

export const FlowUserModel = getModelForClass(FlowUser, {
  schemaOptions: { timestamps: true },
});
