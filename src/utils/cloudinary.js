import { config } from '../config/index.js';

import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            return null;
        }
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
        });
        console.log('File uploaded on cloudinary . file src: ' + response.url);
        fs.unlinkSync(localFilePath);
        return response;
    } catch (err) {
        console.log('Error on cloudinary: ', err);
        fs.unlinkSync(localFilePath);
    }
};

const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log('Deleted from cloudinary. PublicId: ' + publicId);
        return result;
    } catch (err) {
        console.log('Error deleting from cloudinary: ', err);
        throw err;
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };
