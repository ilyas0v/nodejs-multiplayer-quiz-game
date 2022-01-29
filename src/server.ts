import "reflect-metadata"
import { SocketIOService } from "./services/socketio.service";
import App from './app';
import RoomController from './controllers/room.controller';
import Container from 'typedi';
import RoomRepository from './repositories/room.repository';
import UserController from './controllers/user.controller';
import QuestionController from './controllers/question.controller';


const app = App.getApp();
const http = App.getHttp();

const io: any = SocketIOService.getInstance();

const roomRepository     = Container.get(RoomRepository);
const userController     = Container.get(UserController);
const roomController     = Container.get(RoomController);
const questionController = Container.get(QuestionController);

/**
 * WEBSOCKET OPERATIONS
 */
io.on("connection", (socket: any) => 
{
    socket.on('disconnect', () => {
        userController.disconnect(socket);
    });

    socket.on('newRoom', (data: string) => {
        roomController.newRoom(socket, data);
    });

    socket.on('joinRoom', (data: string) => {
        roomController.joinRoom(socket, data);    
    });

    socket.on('answerQuestion', (data: string) => {
        questionController.answer(socket, data);
    });

    socket.on('updateAvatar', (data: string) => {
        userController.updateAvatar(socket, data);
    });

    io.emit('refreshRooms', JSON.stringify(roomRepository.prepareAllRoomsData()));
});



const server = http.listen(process.env.PORT || 3000, () => {
    console.log("listening on *:3000");
});