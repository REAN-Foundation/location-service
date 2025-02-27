import { CurrentUser } from "../../domain.types/miscellanuous/current.user";
import { CurrentClient } from "../../domain.types/miscellanuous/current.client";
import { ActionScope, RequestType, ResourceOwnership } from "../../auth/auth.types";


declare global{
    namespace Express {
        interface Request {
            currentUser        : CurrentUser;
            currentClient      : CurrentClient;
            currentUserTenantId: string;
            context            : string;
            actionScope        : ActionScope;
            ownership          : ResourceOwnership;
            requestType        : RequestType | null | undefined;
            resourceId         : string | number | null | undefined;
            resourceOwnerUserId: string | null | undefined;
            resourceTenantId   : string | null | undefined;
            clientAppAuth      : boolean; //This flag indicates that the request is for the client app specific endpoints
            customAuthorization: boolean; //This flag indicates that the authorization is done using a custom function
            alternateAuth      : boolean; //This flag indicates that the request is for the alternate authentication
            signupOrSignin     : boolean; //This flag indicates that the request is for user registration or login
            optionalUserAuth   : boolean; //The resources may or may not require user authentication
        }
    }
}
