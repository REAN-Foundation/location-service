import express from 'express';
import { CFRController } from './cfr.controller';
import { multerFileUploadMiddleware } from '../../startup/file.upload.middleware';

///////////////////////////////////////////////////////////////////////////////////

export const register = (app: express.Application): void => {
    const router = express.Router();
    const controller = new CFRController();

    multerFileUploadMiddleware(router);
    
    router.get('/:tenantId/nearest-cfrs', controller.getNearestCFRs);
    router.get('/:tenantId/nearest-ambulances', controller.getNearestAmbulances);
    router.post('/:tenantId/upload-cfrs', controller.uploadCFRs);
    router.post('/:tenantId/upload-ambulances', controller.uploadAmbulances);
    app.use('/api/v1', router);
};
