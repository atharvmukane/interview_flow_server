import { getModelForClass, index, prop, Ref } from "@typegoose/typegoose";
import { ObjectId } from "mongodb";
import { FlowUser } from "../userModule/user.model";

export class ChatGPTSession {
    readonly _id: ObjectId;

    readonly createdAt: Date;

    @prop({ ref: () => FlowUser })
    user: Ref<FlowUser>;

    @prop()
    firstQuestion: string;

    @prop()
    firstAnswer: string;

    @prop({ default: false })
    isDeleted: boolean;
}

export const ChatGPTSessionModel = getModelForClass(ChatGPTSession, {
    schemaOptions: { timestamps: true },
});
