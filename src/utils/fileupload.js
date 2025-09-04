import { v2 as cloudinary } from "cloudinary";
import fs from "fs"; //from node.js
import dotenv from "dotenv";
dotenv.config();

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
  // secure:true,
});
// console.log(
//   "CLOUDINARY_CLOUD_NAME raw:",
//   JSON.stringify(process.env.CLOUDINARY_CLOUD_NAME)
// );

const uploadOnCloudinary = async (localFilePath) => {
  try {
    // console.log("local path in uploadoncloudinaryfn", localFilePath);
    
    if (!localFilePath) return null;
    //upload the file on Cloudinary and set the options

    // console.log("came inside uploadOnCloudinaryFunction")

    const options = {
      resource_type: "auto",
      use_filename: true, //set the publicId to name of file
      unique_filename: false,
      overwrite: true,
      //overwrites any image with same public ID so name
      //the file names must be unique that we are uploading,
      //otherwise the assets may get same publicID as we set `override` as false in our case
    };
    // console.log("Cloudinary object:", cloudinary);

    const response = await cloudinary.uploader.upload(localFilePath, options);
    // console.log(response,"Cloudinary Response");
    fs.unlinkSync(localFilePath);

    return response;

  } catch (error) {
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    } //remove the locally saved temporary
    //file as the upload operation got failed.
    console.error(error);
    return null;
  }
};

export default uploadOnCloudinary;
