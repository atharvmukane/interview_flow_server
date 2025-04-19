import { getModelForClass, prop, Ref } from '@typegoose/typegoose';
import { ObjectId } from 'mongodb';
import { FlowUser } from './../userModule/user.model';
// import { LoyaltyLevel } from '../loyaltyProgramModule/loyalty.model';


class InterviewQAA {
    @prop()
    index: number;

    @prop()
    question: string;

    @prop()
    answer: string;

    @prop()
    analaysis: {
        [key: string]: any;
    };
}

export class Interview {
    readonly _id: ObjectId;

    readonly createdAt: Date;

    readonly updatedAt: Date;

    @prop({})
    company: string;

    @prop({})
    industry: string;

    @prop({ ref: () => FlowUser })
    user: Ref<FlowUser>;

    @prop()
    date: Date;

    @prop()
    jobTitle: string;

    @prop({})
    jobDescription: string;

    @prop()
    skills: string[];

    @prop({ type: InterviewQAA })
    interviewQAA: InterviewQAA[];

    @prop({ default: true })
    isCompleted: boolean;

    @prop({ default: false })
    isDeleted: boolean;
}

export const InterviewModel = getModelForClass(Interview, {
    schemaOptions: { timestamps: true },
});
