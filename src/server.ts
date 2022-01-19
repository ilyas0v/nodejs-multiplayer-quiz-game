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

app.get('/api', (req: any, res: any) => {
    // res.json(questions);
});

// const users: any = {}; 
// const rooms: any = {};
// const userScores: any = {};
// const questions: any = {};
// const userAnsweredQuestions: any = {};

let roomRepo = Container.get(RoomRepository);
const userController = Container.get(UserController);
const rc = Container.get(RoomController);
const questionController = Container.get(QuestionController);

/**
 * WEBSOCKET OPERATIONS
 */
io.on("connection", (socket: any) => 
{
    socket.on('disconnect', () => {
        userController.disconnect(io, socket);
    });

    socket.on('newRoom', (data: string) => {
        rc.newRoom(io, socket, data);
    });

    socket.on('joinRoom', (data: string) => {
        rc.joinRoom(io, socket, data);    
    });

    socket.on('answerQuestion', (data: string) => {
        questionController.answer(io, socket, data);
    });

    io.emit('refreshRooms', JSON.stringify(roomRepo.prepareAllRoomsData()));
});



const server = http.listen(process.env.PORT || 3000, () => {
    console.log("listening on *:3000");
});