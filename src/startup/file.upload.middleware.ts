import express from "express";
import fs from "fs";
import multer from 'multer';
import { ConfigurationManager } from "../config/configuration.manager";
import { Logger } from "../common/logger";

///////////////////////////////////////////////////////////////////////////////

export const multerFileUploadMiddleware = (router: express.Router) => {
    const MAX_UPLOAD_FILE_SIZE = ConfigurationManager.MaxUploadFileSize();
    const UPLOAD_FOLDER = ConfigurationManager.UploadTemporaryFolder();

    if (!fs.existsSync(UPLOAD_FOLDER)) {
        try {
            fs.mkdirSync(UPLOAD_FOLDER, { recursive: true });
        } catch (error) {
            Logger.instance().log(`Error creating upload directory: ${error.message}`);
        }
        
    }
    const storage = multer.diskStorage({
        destination : (req, file, cb) => {
            cb(null, UPLOAD_FOLDER);
        },
        filename : (request, file, cb) => {
            cb(null, Date.now() + file.originalname);
        }
    });
    const upload = multer({
        storage : storage,
        limits  : { fileSize: MAX_UPLOAD_FILE_SIZE },
    }).single('file');

    router.use((req, res, next) => {
        upload(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                Logger.instance().log(`Multer error:" ${err.message}`);
                return res.status(400).send({ message: `Multer error: ${err.message}` });
            } else if (err) {
                Logger.instance().log(`Error uploading file: ${err.message}`);
                return res.status(400).send({ message: `File upload error: ${err.message}` });
            }
            next();
        });
    });
};
