import {v2 as cloudinary} from 'cloudinary';
import fs from "fs";

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key:process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudnary = async (localfilepath, deleteAfterUpload) => {
    try {
        if (!localfilepath) return null

        
        //upload the file on cloudnary
        const response = await cloudinary.uploader.upload(localfilepath,{
            resource_type:"auto"
        })
        //file has been upload successful
        console.log("file is uploaded on cloudinary", response.url);
        if (fs.existsSync(localfilepath)) {
            
            fs.unlinkSync(localfilepath);
            
        }
        
        return response;
    } catch (error) {
        if (fs.existsSync(localfilepath)) {
            fs.unlinkSync(localfilepath)
        }
 // remove the locally saved temporary files as the upload operation got failed
 console.error("Error uploading file to Cloudinary:", error);     
 return null;
    }
}

export {uploadOnCloudnary}