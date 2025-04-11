/* eslint-disable arrow-body-style */
/* eslint-disable import/no-extraneous-dependencies */

import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config({ path: './config/config.env' });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const createUploader = folder => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: folder,
      //   resource_type: 'raw',
      public_id: (req, file) =>
        `${file.fieldname}-${Date.now()}-${file.originalname}`,
      format: async (req, file) => {
        const allowedFormats = ['jpeg','jpg','png','pdf','doc','docx','xls','xlsx','ppt','pptx'];
        const ext = file.originalname.split('.').pop();
        if (allowedFormats.includes(ext)) {
          return ext;
        }
        throw new Error('Invalid file format.');
      },
    },
  });

  return multer({ storage });
};

export default createUploader;
