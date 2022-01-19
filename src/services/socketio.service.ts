import * as socketIO from 'socket.io';
import { App } from '../app';

export class SocketIOService {
    private static io: any = null;

    public static getInstance = () => {
        let http = App.getHttp();
        if(!this.io) {
            let io = (socketIO as any)(http, { cors: { origin: '*' } });
            this.io = io;
        }
        return this.io;
    }

}