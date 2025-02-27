import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import "reflect-metadata";
import morgan from 'morgan';
import { Logger } from './common/logger';
import { Router } from './router';
import { ConfigurationManager } from './config/configuration.manager';
import { connectToDatabase } from './config/db';

// /////////////////////////////////////////////////////////////////////////

export default class Application {

    public _app: express.Application = null;

    private _router: Router = null;

    private static _instance: Application = null;

    private constructor() {
        this._app = express();
        this._router = new Router(this._app);
    }

    public static instance(): Application {
        return this._instance || (this._instance = new this());
    }

    public app(): express.Application {
        return this._app;
    }

    public start = async(): Promise<void> => {
        try {

            //Load configurations
            ConfigurationManager.loadConfigurations();

            //Set-up middlewares
            await this.setupMiddlewares();

            //Set the routes
            await this._router.init();

            await connectToDatabase();

            //Handle unhandled rejections
            process.on('unhandledRejection', (reason, promise) => {
                Logger.instance().log('Unhandled Rejection!');
                promise.catch(error => {
                    Logger.instance().log(`Unhandled Rejection at: ${error.message}`);
                });
            });

            process.on('exit', code => {
                Logger.instance().log(`Process exited with code: ${code}`);
            });

            //Start listening
            await this.listen();

        }
        catch (error: any){
            Logger.instance().log('An error occurred while starting location service.' + error?.message);
        }
    };

    private setupMiddlewares = async (): Promise<boolean> => {

        return new Promise((resolve, reject) => {
            try {
                this._app.use(cors());
                this._app.use(helmet());
                this._app.use(morgan('dev'));
                this._app.use(express.json());

                resolve(true);
            }
            catch (error) {
                reject(error);
            }
        });
    };

    private listen = () => {
        return new Promise((resolve, reject) => {
            try {
                const port = process.env.PORT;
                const server = this._app.listen(port, () => {
                    const serviceName = 'Location Service' + '-' + process.env.NODE_ENV;
                    Logger.instance().log(serviceName + ' is up and listening on port ' + process.env.PORT.toString());
                    this._app.emit("server_started");
                });
                module.exports.server = server;
                resolve(this._app);
            }
            catch (error) {
                reject(error);
            }
        });
    };

}
