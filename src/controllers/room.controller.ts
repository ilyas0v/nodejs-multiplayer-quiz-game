import RoomRepository from "../repositories/room.repository";
import * as uuid from 'uuid';
import { Room } from "../models/room.model";
import { UserRepository } from "../repositories/user.repository";
import { User } from "../models/user.model";
import QuestionRepository from "../repositories/question.repository";
import { Service } from "typedi";
import { GameService } from "../services/game.service";

@Service()
class RoomController {
    constructor(private readonly roomRepository: RoomRepository, private readonly userRepository: UserRepository, private readonly questionRepository: QuestionRepository, private readonly gameService: GameService) {}

    public newRoom = (io: any, socket: any, newRoomData: string) => {

        let roomId: string = uuid.v4();
        let roomDataJson: any = JSON.parse(newRoomData);
        let userId = socket.id;

        if (!roomDataJson.name || !roomDataJson.owner || !roomDataJson.maxPlayers || !Number.isInteger(Number(roomDataJson.maxPlayers)) || Number(roomDataJson.maxPlayers) < 0) {
            return false;
        }

        let createRoomData: Room = new Room(
            roomId,
            roomDataJson.name,
            roomDataJson.owner,
            roomDataJson.maxPlayers,
        );

        let room: Room = this.roomRepository.storeRoomById(roomId, createRoomData);

        console.log(room);

        if(!room.hasUser(userId)) {
            room.playerIds.push(userId);
            this.userRepository.storeUserById(userId, { name: room.owner, currentRoomId: room.id });
            let players: User[] = this.roomRepository.getPlayersByRoomId(roomId);
            io.to(userId).emit('joinedRoom', JSON.stringify({ id: roomId, ...room, players: players}));
            
            let shouldStart = this.roomRepository.checkUserCountForStart(roomId);

            if(shouldStart) {
                this.questionRepository.prepareQuestions(roomId);
                setTimeout(() => { this.startGame(roomId); }, 3000);
            }
        }

        io.emit('refreshRooms', JSON.stringify(this.roomRepository.prepareAllRoomsData()));
    }    

    /**
     * 
     * @param data 
     * @returns void
     */
    public joinRoom = (io: any, socket: any, data: string) => {
        let joinData = JSON.parse(data);

        let selectedRoomId = joinData.selectedRoomId;

        if (!selectedRoomId || !this.roomRepository.getRoomById(selectedRoomId) || !joinData.name) {
            return false;
        }

        const room = this.roomRepository.getRoomById(selectedRoomId);
        const userId = socket.id;

        if (!room.hasUser(userId)) {
            room.playerIds.push(userId);
            this.userRepository.storeUserById(userId, { name: joinData.name, currentRoomId: selectedRoomId })
            let players = this.roomRepository.getPlayersByRoomId(selectedRoomId);
            io.to(userId).emit('joinedRoom', JSON.stringify({ id: selectedRoomId, ...room, players: players }));


            this.roomRepository.refreshRoomUsers(selectedRoomId);

            if (!this.questionRepository.checkIfARoomHasQuestions(selectedRoomId)) { // If no questions prepared yet, then prepare
                this.questionRepository.prepareQuestions(selectedRoomId);
            }

            let shouldStart = this.roomRepository.checkUserCountForStart(selectedRoomId);

            if (shouldStart) {
                setTimeout(() => { this.startGame(selectedRoomId); }, 3000);
            }

        }

        io.emit('refreshRooms', JSON.stringify(this.roomRepository.prepareAllRoomsData());

    }

    public startGame = (roomId: string) => {
        this.gameService.startGame(roomId);
    }

}



export default RoomController;