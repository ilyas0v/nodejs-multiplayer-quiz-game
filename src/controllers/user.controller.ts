import RoomRepository from "../repositories/room.repository";
import { UserRepository } from "../repositories/user.repository";
import QuestionRepository from "../repositories/question.repository";
import { Service } from "typedi";
import { GameService } from "../services/game.service";
import { Room } from "../models/room.model";
import { User } from "../models/user.model";
import { SocketIOService } from "../services/socketio.service";

@Service()
class UserController {
    
    private io: any;

    constructor(private readonly roomRepository: RoomRepository, private readonly userRepository: UserRepository, private readonly questionRepository: QuestionRepository, private readonly gameService: GameService) {
        this.io = SocketIOService.getInstance();
    }

    /**
     * 
     * @param socket 
     */
    public disconnect = (socket: any) => {
        let userId = socket.id;
        let user: User = this.userRepository.findById(userId);
        let rooms = this.roomRepository.getAllRooms();
        let users = this.userRepository.getAllUsers();

        if (user) {
            if (Object.keys(rooms).includes(user.currentRoomId)) {
                let room: Room = this.roomRepository.getRoomById(user.currentRoomId);
                let index = room.playerIds.indexOf(userId);
                room.playerIds.splice(index, 1);
                delete users[userId];

                this.roomRepository.refreshRoomUsers(user.currentRoomId);

                if (room.playerIds.length == 0) {
                    delete rooms[user.currentRoomId];
                }
            }
        }

        this.io.emit('refreshRooms', JSON.stringify(this.roomRepository.prepareAllRoomsData()));
    }

    /**
     * 
     * @param socket 
     * @param data 
     * @returns void
     */
    public updateAvatar = (socket: any, data: string) => {
        let updateData = JSON.parse(data);

        let x    = updateData.x;
        let y    = updateData.y;
        let user = this.userRepository.findById(socket.id);

        if(!user) {
            return false;
        }

        this.userRepository.updateAvatar(socket.id, x, y);
        this.roomRepository.refreshRoomUsers(user.currentRoomId);
    }
}



export default UserController;