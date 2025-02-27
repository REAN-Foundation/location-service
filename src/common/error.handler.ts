
////////////////////////////////////////////////////////////////////////

import { ApiError } from "./api.error";
import { Logger } from "./logger";

export class ErrorHandler {

    static throwInputValidationError = (errorMessages) => {
        var message = 'Validation error has occurred!\n';
        if (errorMessages) {
            message = message + ' ' + Array.isArray(errorMessages) ? errorMessages.join(' ') : errorMessages.toString();
            message = message.split('"').join('');
        }
        throw new ApiError(422, message);
    };

    static throwDuplicateUserError = (message) => {
        throw new ApiError(422, message);
    };

    static throwNotFoundError = (message) => {
        throw new ApiError(404, message);
    };

    static throwUnauthorizedUserError = (message) => {
        throw new ApiError(401, message);
    };

    static throwForebiddenAccessError = (message) => {
        throw new ApiError(403, message);
    };

    static throwDbAccessError = (message, error) => {
        throw new ApiError(503, message);
    };

    static throwConflictError = (message) => {
        throw new ApiError(409, message);
    };

    static throwFailedPreconditionError = (message) => {
        throw new ApiError(412, message);
    };

    static throwInternalServerError = (message, error = null) => {
        throw new ApiError(500, message);
    };

    static handleValidationError = (error) => {
        if (error.isJoi === true) {
            Logger.instance().log(error.message);
            const errorMessages = error.details.map(x => x.message);
            ErrorHandler.throwInputValidationError(errorMessages);
        }
        else {
            ErrorHandler.throwInputValidationError(error.message);
        }
    };

}
