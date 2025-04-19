
import { getModelForClass, index, prop, Ref } from "@typegoose/typegoose";
import { ObjectId } from "mongodb";
import { FlowUser } from "../userModule/user.model";
import { ChatGPTSession } from "./chatgpt.session.model";

export enum ChatGptRole {
    User = "user",
    Assistant = "assistant",
    System = "system"
}

export class ChatGptMessage {
    readonly _id: ObjectId;

    readonly createdAt: Date;

    @prop({ ref: () => FlowUser })
    user: Ref<FlowUser>;

    @prop({ ref: () => ChatGPTSession })
    session: Ref<ChatGPTSession>;

    @prop({ enum: ChatGptRole })
    role: ChatGptRole;

    @prop()
    content: string;

    @prop({ default: false })
    isDeleted: boolean;
}

export const ChatGptMessageModel = getModelForClass(ChatGptMessage, {
    schemaOptions: { timestamps: true },
});
