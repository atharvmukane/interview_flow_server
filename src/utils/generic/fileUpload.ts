import awsSDK from "aws-sdk";
import moment from "moment";
const sgMail = require('@sendgrid/mail')

const SESConfig = {
  apiVersion: "2010-12-01",
  accessKeyId: process.env.SES_ACCESSKEY,
  secretAccessKey: process.env.SES_SECRETKEY,
  region: process.env.REGION,
};

export const sendMail = async (params: any, campaign: boolean = false,
  campaignId: any = "") => {
  new awsSDK.SES(SESConfig)
    .sendEmail(params)
    .promise()
    .then(async (res) => {
      console.log(res);

      return true;
    });
};

export const sendMailViaSendGrid = async (params: any, campaign: boolean = false,
  campaignId: any = "") => {


  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
  // const msg = {
  //   to: 'shivac142@gmail.com', // Change to your recipient
  //   from: 'Tushar R. Ghone <contact@tusharghone.com>', // Change to your verified sender
  //   subject: 'Sending with SendGrid is Fun',
  //   text: 'and easy to do anywhere, even with Node.js',
  //   html: '<strong>and easy to do anywhere, even with Node.js</strong>',
  // }
  return new Promise(async (resolve, reject) => {
    await sgMail
      .send(params)
      .then(async () => {
        console.log('Email sent');
        resolve(true);
      })
      .catch((error: any) => {
        console.error(error);
        reject(false);
      })
  });


};

const S3 = new awsSDK.S3({
  signatureVersion: "v4",
  accessKeyId: process.env.ACCESSKEY!,
  secretAccessKey: process.env.SECRETKEY!,
  region: process.env.REGION,
  apiVersion: "2006-03-01",
});
const S3_BUILDBY_CHAT = new awsSDK.S3({
  signatureVersion: "v4",
  accessKeyId: process.env.ACCESSKEY_BUILDBY_CHAT!,
  secretAccessKey: process.env.SECRETKEY_BUILDBY_CHAT!,
  region: process.env.REGION_BUILDBY_CHAT,
  apiVersion: "2006-03-01",
});

export const getUploadFileUrl = async (fileName: string) => {
  // const fileNamePrefix = uuid();
  // const extension = extractExtention(fileName);
  return await S3.getSignedUrlPromise("putObject", {
    Bucket: process.env.BUCKETNAME,
    Key: `${getLocaiton()}​/${fileName}​`,
    ACL: "public-read",
    Expires: 6000 * 5,
  });
};
function getLocaiton(): string {
  const yearMonthFolder = moment().format("YYYY/MM");
  return `uploads/${yearMonthFolder}`;
}
export const uploadToS3Bucket = async (fileName: string, file: any) => {
  let contentType = "";
  if (fileName.split(".")[fileName.split(".").length - 1] == "pdf") {
    contentType = "application/pdf";
  } else if (
    fileName.split(".")[fileName.split(".").length - 1] == "mp4" ||
    fileName.split(".")[fileName.split(".").length - 1] == "mov" ||
    fileName.split(".")[fileName.split(".").length - 1] == "webm"
  ) {
    contentType = `video/${fileName.split(".")[fileName.split(".").length - 1]}`;
  } else if (
    fileName.split(".")[fileName.split(".").length - 1] == "doc" ||
    fileName.split(".")[fileName.split(".").length - 1] == "docx" ||
    fileName.split(".")[fileName.split(".").length - 1] == "csv" ||
    fileName.split(".")[fileName.split(".").length - 1] == "xls" ||
    fileName.split(".")[fileName.split(".").length - 1] == "ods" ||
    fileName.split(".")[fileName.split(".").length - 1] == "xlsx"
  ) {
    contentType = "application/msword";
  } else {
    contentType = `image/${fileName.split(".")[fileName.split(".").length - 1]
      }`;
  }
  return new Promise((resolve, reject) => {
    S3.upload(
      {
        Key: fileName,
        Bucket: process.env.BUCKETNAME!,
        ACL: process.env.FILEPERMISSION!,
        Body: file,
        ContentType: contentType,

        // ContentEncoding: "base64",
        // ContentType: "image/jpeg",
      },
      (error: Error, data: any) => {
        if (error) {
          reject(error);
        }
        resolve(data);
      }
    );
  });
};
export const deleteFromS3Bucket = async (fileId: string) => {
  return new Promise((resolve, reject) => {
    S3.deleteObject(
      {
        Key: fileId,
        Bucket: process.env.BUCKETNAME!,
      },
      (error: Error, data: any) => {
        if (error) {
          reject(error);
        }
        resolve(data);
      }
    );
  });
};
export const uploadToS3Bucket_Buildby_Chat = async (fileName: string, file: any) => {
  let contentType = "";
  if (fileName.split(".")[fileName.split(".").length - 1] == "pdf") {
    contentType = "application/pdf";
  } else if (
    fileName.split(".")[fileName.split(".").length - 1] == "mp4" ||
    fileName.split(".")[fileName.split(".").length - 1] == "mov" ||
    fileName.split(".")[fileName.split(".").length - 1] == "webm"
  ) {
    contentType = `video/${fileName.split(".")[fileName.split(".").length - 1]
      }`;
  } else if (
    fileName.split(".")[fileName.split(".").length - 1] == "doc" ||
    fileName.split(".")[fileName.split(".").length - 1] == "docx" ||
    fileName.split(".")[fileName.split(".").length - 1] == "csv" ||
    fileName.split(".")[fileName.split(".").length - 1] == "xls" ||
    fileName.split(".")[fileName.split(".").length - 1] == "ods" ||
    fileName.split(".")[fileName.split(".").length - 1] == "xlsx"
  ) {
    contentType = "application/msword";
  } else if (
    fileName.split(".")[fileName.split(".").length - 1] == "txt"
  ) {
    // fileName = fileName.split(".")[0] + '.txt';
    contentType = "text/plain";
  } else if (
    fileName.split(".")[fileName.split(".").length - 1] == "webp"
  ) {
    contentType = "application/webp";
  } else if (
    fileName.split(".")[fileName.split(".").length - 1] == "mp4"
  ) {
    contentType = "video/mp4";
  } else {
    contentType = `image/jpeg`;
    // contentType = `image/${fileName.split(".")[fileName.split(".").length - 1]
    //   }`;
    fileName = fileName.split(".")[0] + '.jpeg';
  }
  return new Promise((resolve, reject) => {
    S3_BUILDBY_CHAT.upload(
      {
        Key: fileName,
        Bucket: process.env.BUCKETNAME_BUILDBY_CHAT!,
        ACL: process.env.FILEPERMISSION_BUILDBY_CHAT!,
        Body: file,
        ContentType: contentType,

        // ContentEncoding: "base64",
        // ContentType: "image/jpeg",
      },
      (error: Error, data: any) => {
        if (error) {
          reject(error);
        }
        resolve(data);
      }
    );
  });
};
export const deleteFromS3Bucket_Buildby_Chat = async (fileId: string) => {
  return new Promise((resolve, reject) => {
    S3_BUILDBY_CHAT.deleteObject(
      {
        Key: fileId,
        Bucket: process.env.BUCKETNAME_BUILDBY_CHAT!,
      },
      (error: Error, data: any) => {
        if (error) {
          reject(error);
        }
        resolve(data);
      }
    );
  });
};
