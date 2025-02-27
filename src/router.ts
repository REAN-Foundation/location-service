import express from "express";
import { Logger } from "./common/logger";
import { register as registerCFRRoutes } from "./api/cfr/cfr.routes";

////////////////////////////////////////////////////////////////////////////////////

export class Router {

    private _app: express.Application = null;

    constructor(app: express.Application) {
        this._app = app;
    }

    public init = async (): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            try {

                //Handling the base route
                this._app.get('/api/v1/', (req, res) => {
                    res.send({
                        message : `Welcome to the API [Version ${process.env.API_VERSION}]`,
                    });
                });

                registerCFRRoutes(this._app);
                resolve(true);

            } catch (error: any) {
                Logger.instance().log('Error initializing the router: ' + error.message);
                reject(false);
            }
        });
    };

}
