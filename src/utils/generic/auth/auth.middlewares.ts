import { sign, verify } from "jsonwebtoken";

export const createAccessTokenForAdmin = async (userId: any, type: string): Promise<string> => {
    let token = sign({ userId, type }, process.env.ACCESS_TOKEN_SECRET_FOR_ADMIN!, {
    });
    return token;
};
export const createAccessToken = async (userId: any): Promise<string> => {
    let token = sign({ userId }, process.env.ACCESS_TOKEN_SECRET!, {
    });
    return token;
};