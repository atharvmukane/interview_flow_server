import { Response, Request, NextFunction } from "express";
import { FlowUserModel, UserRole } from "./user.model";

import { ObjectId } from "mongodb";
import { uploadToS3Bucket } from "./../utils/generic/fileUpload";
import { createAccessToken } from "./../utils/generic/auth/auth.middlewares";


export const signup = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let { fullName, email, password, role, fcmToken }: any = req.body;

        let userQuery: any = {};


        let existingUser = await FlowUserModel.findOne({
            email: email,
            role: role,
            isActive: true,
            isDeleted: false
        });

        if (existingUser) {
            return res.status(200).send({
                success: false,
                message: 'Email is already registered. Log in to continue.',
            });
        }


        // if (req.files != null) {
        //     if (Object.keys(req.files).length > 0) {
        //         for (const key in req.files) {
        //             let S3Response: any;

        //             let userImageFileName = `${req.files[key].name}`;
        //             let userFileData = req.files[key].data;

        //             await uploadToS3Bucket(userImageFileName, userFileData).then(
        //                 async (data) => {
        //                     S3Response = data;
        //                 }
        //             );

        //             avatar = S3Response.Location;
        //         }
        //     }
        // }

        userQuery = {
            fullName,
            email,
            password,
            role,
            fcmTokens: fcmToken ? [fcmToken] : [],
        }

        let newUser = await FlowUserModel.create(userQuery);


        return res.status(200).send({
            success: newUser != null,
            message: newUser != null ? 'Signed up' : 'Failed to sign up',
            result: newUser,
            accessToken: newUser != null ? await createAccessToken(newUser._id) : null,
        });

    } catch (error: any) {
        return res.status(500).send({
            success: false,
            error: error.message,
            message: 'Failed to sign up',
        });
    }
};

export const login = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let { email, password, fcmToken }: any = req.query;

        let user;


        if (!password) {
            user = await FlowUserModel.findOne({ email: email, isActive: true, isDeleted: false });
        } else {
            user = await FlowUserModel.findOne({ email: email, password: password, isActive: true, isDeleted: false });

        }

        if (user && fcmToken && fcmToken != '') {
            await FlowUserModel.findByIdAndUpdate(user._id, { $addToSet: { fcmTokens: fcmToken } });
        }

        return res.status(200).send({
            success: true,
            login: user != null,
            result: user,
            accessToken: user != null ? await createAccessToken(user._id) : null,
        });

    } catch (error: any) {
        return res.status(500).send({
            success: false,
            login: false,
            error: error.message,
        });
    }
};

export const refreshUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let { user } = req.body;

        const refreshedUser = await FlowUserModel.findById(user);

        return res.status(200).send({
            success: refreshedUser != null,
            result: refreshedUser,
            message: refreshUser != null ? '' : 'failedToRefresh',
        });

    } catch (error: any) {
        return res.status(500).send({
            success: false,
            login: false,
            error: error.message,
            message: 'failedToRefresh',
        });
    }
};


export const editProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let { fullName, email, dob, avatar, gender, photoRemoved = 'false', user, isLocationAllowed, isNotificationAllowed }: any = req.body;
        let updatedUser;

        let updateQuery: any = {};
        // let files: any = req.files;


        if (JSON.parse(photoRemoved)) {

            updateQuery.avatar = '';

        }
        // else if (files != null) {
        // if (Object.keys(files).length > 0) {
        //     for (const key in files) {
        //         let S3Response: any;

        //         let userImageFileName = `${files[key].name}`;
        //         let userFileData = files[key].data;

        //         await uploadToS3Bucket(userImageFileName, userFileData).then(
        //             async (data) => {
        //                 S3Response = data;
        //             }
        //         );
        //         updateQuery.avatar = S3Response.Location;
        //     }
        // }
        // }


        if (isLocationAllowed || isNotificationAllowed) {
            if (isLocationAllowed) {
                updateQuery.isLocationAllowed = isLocationAllowed;
            }

            if (isNotificationAllowed) {
                updateQuery.isNotificationAllowed = isNotificationAllowed;
            }
        } else {
            updateQuery = {
                fullName,
                isLocationAllowed,
                isNotificationAllowed,
                email,
                dob: new Date(dob),
                gender,
                ...updateQuery
            }
        }


        updatedUser = await FlowUserModel.findByIdAndUpdate(user,
            updateQuery, { new: true });



        return res.status(200).send({
            success: updatedUser != null,
            message: updatedUser != null ? 'profileUpdateSuccess' : 'failedToSave',
            result: updatedUser,
        });

    } catch (error: any) {
        return res.status(500).send({
            success: false,
            error: error.message,
            message: 'failedToSave',
        });
    }
};


// export const updateAddress = async (
//     req: any,
//     res: Response,
//     next: NextFunction
// ) => {
//     try {
//         const { user, existingAddress, newAddress } = req.body;


//         const newAddressToMap = await EndUserAddressModel.findById(newAddress);

//         if (newAddressToMap && newAddressToMap.user) {
//             return res.status(200).send({
//                 success: false,
//                 message: 'addressAlreadyAssigned',
//             });
//         }

//         const existingUpdatedAddr = await EndUserAddressModel.findByIdAndUpdate(existingAddress, { $unset: { user: 1 } });
//         const newUpdatedAddr: any = await EndUserAddressModel.findByIdAndUpdate(newAddress, { user }, { new: true });

//         let updatedUser = await FlowUserModel.findByIdAndUpdate(user, { address: [new ObjectId(newAddress)] });
//         updatedUser = await FlowUserModel.findById(user);

//         if (newUpdatedAddr) {
//             newUpdatedAddr._doc['user'] = updatedUser;
//         }

//         return res.status(200).send({
//             success: newUpdatedAddr != null,
//             message: newUpdatedAddr != null ? 'addressUpdatedSuccess' : 'failedToUpdateAddress',
//             result: newUpdatedAddr,
//         });

//     } catch (error: any) {
//         return res.status(500).send({
//             success: false,
//             error: error.message,
//             message: 'failedToUpdateAddress',
//         });
//     }
// };



export const deleteFCMToken = async (
    req: any,
    res: Response,
    next: NextFunction
) => {
    try {
        let { user, userRole, fcmToken } = req.body;


        const updatedUser = await FlowUserModel.findOneAndUpdate(
            { _id: user },
            { $pull: { fcmTokens: fcmToken } }
        );


        if (user) {
            res.status(200).json({
                message: "Deletd FCM token Successfully",
                success: true,
                result: user,
            });
        } else {
            res.status(400).json({
                message: "Failed to delete token",
                success: false,
            });
        }
    } catch (e) {
        res.status(400).json({
            message: "Failed to delete token",
            success: false,
        });
    }
};


export const deleteAccount = async (
    req: any,
    res: Response,
    next: NextFunction
) => {
    try {
        let { user } = req.body;

        const deletedUser = await FlowUserModel.findByIdAndUpdate(
            user,
            { isActive: false, isDeleted: true, fcmTokens: [] }
        );


        if (deletedUser) {
            res.status(200).json({
                message: "accountDeleted",
                success: true,
                result: deletedUser,
            });

        } else {
            res.status(400).json({
                message: "deleteAccountFail",
                success: false,
            });
        }
    } catch (e) {
        res.status(400).json({
            message: "deleteAccountFail",
            success: false,
        });
    }
};