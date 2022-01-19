import * as express from "express";
import { Server } from 'http';
import * as cors from 'cors';
import { GameService } from "./services/game.service";

class App {
    public static app: express.Application = null;
    public static http: Server = null;

    constructor() {}

    public static getApp = () => {
        if(!this.app) {
            let app = express();
            this.app = app;
        }

        this.setMiddlewares();
        return this.app;
    }

    public static getHttp = () => {
        let app = this.getApp();

        if(!this.http) {
            let http = new Server(app);
            this.http = http;
        }

        return this.http;
    }

    public static setMiddlewares = () => {
        this.app.use(cors());
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use('/', express.static('frontend'));
    }
}

export default App;