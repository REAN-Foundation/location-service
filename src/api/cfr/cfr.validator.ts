import * as joi from 'joi';
import { ErrorHandler } from '../../common/error.handler';
import { CFRCreateModel, CFROrAmbulanceSearchFilter, CFRUpdateLocationModel } from '../../domain.types/cfr/cfr.domain.types';

///////////////////////////////////////////////////////////////////////////////////////////////

export class CFRValidator {

    validateNearestCFRsRequest = async (requestBody) => {
        try {
            const schema = joi.object({
                latitude    : joi.number().required(),
                longitude   : joi.number().required(),
                radiusInKm  : joi.number().optional(),
                itemsPerPage: joi.number().optional(),
                reporterPhone : joi.string().optional()
            });
            await schema.validateAsync(requestBody);
            return this.getSearchFilter(requestBody);
        } catch (error) {
            ErrorHandler.handleValidationError(error);
        }
    };

    validateTenantId = async (tenantId: string) => {
        try {
            const schema = joi.string().guid().required();
            await schema.validateAsync(tenantId);
            return tenantId;
        } catch (error) {
            ErrorHandler.handleValidationError(error);
        }
    };

    validateNearestAmbulancesRequest = async (requestBody) => {
        try {
            const schema = joi.object({
                latitude    : joi.number().required(),
                longitude   : joi.number().required(),
                radiusInKm  : joi.number().optional(),
                itemsPerPage: joi.number().optional()
            });
            await schema.validateAsync(requestBody);
            return this.getSearchFilter(requestBody);
        } catch (error) {
            ErrorHandler.handleValidationError(error);
        }
    };

    validateCreateRequest = async (requestBody): Promise<CFRCreateModel> => {
        try {
            const schema = joi.object({
                TenantId: joi.string().guid().required(),
                Name : joi.string().required(),
                Address: joi.string().optional(),
                Latitude    : joi.number().required(),
                Longitude   : joi.number().required(),
                Phone  : joi.string().required()
            });
            await schema.validateAsync(requestBody);
            return this.getCreateModel(requestBody);
        } catch (error) {
            ErrorHandler.handleValidationError(error);
        }
    };

    getCreateModel = (requestBody): CFRCreateModel => {
        const model: CFRCreateModel = {
            TenantId: requestBody.TenantId,
            Name: requestBody.Name,
            Address: requestBody.Address ?? null,
            Latitude: requestBody.Latitude,
            Longitude: requestBody.Longitude,
            Phone: requestBody.Phone
        };
        return model;
    };

    getSearchFilter = (requestBody) => {
        const filters: CFROrAmbulanceSearchFilter = {
            Latitude: requestBody.latitude ?? null,
            Longitude: requestBody.longitude ?? null,
            RadiusInKm: requestBody.radiusInKm ?? null,
            ItemsPerPage: requestBody.itemsPerPage ?? 25,
            ReporterPhone: requestBody.reporterPhone ?? null
        };
        return filters;
    }

    validateNearestCFRs1Request = async (requestBody) => {
        try {
            const sanitized = {
                ...requestBody,
                minRadiusInKm: requestBody.minRadiusInKm === 'undefined' ? undefined : requestBody.minRadiusInKm,
                maxRadiusInKm: requestBody.maxRadiusInKm === 'undefined' ? undefined : requestBody.maxRadiusInKm,
            };
            const schema = joi.object({
                latitude     : joi.number().required(),
                longitude    : joi.number().required(),
                minRadiusInKm: joi.number().optional(),
                maxRadiusInKm: joi.number().optional(),
                itemsPerPage : joi.number().optional(),
                reporterPhone: joi.string().optional(),
            });
            await schema.validateAsync(sanitized);
            return this.getRadiusSearchFilter(sanitized);
        } catch (error) {
            ErrorHandler.handleValidationError(error);
        }
    };

    getRadiusSearchFilter = (requestBody): CFROrAmbulanceSearchFilter => {
        return {
            Latitude     : requestBody.latitude ?? null,
            Longitude    : requestBody.longitude ?? null,
            MinRadiusInKm: requestBody.minRadiusInKm ?? null,
            MaxRadiusInKm: requestBody.maxRadiusInKm ?? null,
            ItemsPerPage : requestBody.itemsPerPage ?? 25,
            ReporterPhone: requestBody.reporterPhone ?? null,
        };
    };

    validateResponderExistsRequest = async (requestBody): Promise<{ Phone: string }> => {
        try {
            const schema = joi.object({
                Phone: joi.string().required(),
            });
            await schema.validateAsync(requestBody);
            return {
                Phone: requestBody.Phone,
            };
        } catch (error) {
            ErrorHandler.handleValidationError(error);
        }
    };

    validateUpdateLocationRequest = async (requestBody): Promise<CFRUpdateLocationModel> => {
        try {
            const schema = joi.object({
                Phone: joi.string().required(),
                Latitude : joi.number().required(),
                Longitude: joi.number().required(),
            });
            await schema.validateAsync(requestBody);
            return {
                Phone    : requestBody.Phone,
                Latitude : requestBody.Latitude,
                Longitude: requestBody.Longitude,
            };
        } catch (error) {
            ErrorHandler.handleValidationError(error);
        }
    };

}
