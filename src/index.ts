import * as dotenv from 'dotenv';
import Application from './app';
import serverless from 'serverless-http';

dotenv.config();

(async () => {
    const app = Application.instance();
    await app.start();
})();

export const handler = serverless(Application.instance().app());
