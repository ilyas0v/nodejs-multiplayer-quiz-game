import { User } from "../models/user.model";
import { Room } from "../models/room.model";
import { UserRepository } from "./user.repository";
import { ScoreRepository } from "./score.repository";
import { SocketIOService } from "../services/socketio.service";
import QuestionRepository from "./question.repository";
import { Service } from "typedi";

const rooms: any = {};

@Service()
class RoomRepository {
    private io: any = null;

    constructor(private userRepository: UserRepository, private scoreRepository: ScoreRepository, private questionRepository: QuestionRepository) {
        this.io = SocketIOService.getInstance();
    }

    public getAllRooms = () => {
        return rooms;
    }

    public a = 1;

    public storeRoomById = (roomId: string, roomData: Room) => {
        rooms[roomId] = roomData;
        return rooms[roomId];
    }

    public getRoomById = (roomId: string) => {
        if(this.checkRoomExists(roomId)) {
            return rooms[roomId];
        }

        return null;
    }

    public checkRoomExists = (roomId: string) => {
        return Object.keys(rooms).includes(roomId);
    }

    public getPlayersByRoomId = (roomId: string) => {
        if (!this.checkRoomExists(roomId)) {
            return [];
        }

        const room = this.getRoomById(roomId);

        let players: User[] = [];

        room.playerIds.map((playerId: string) => {
            players.push({
                id: playerId,
                ...this.userRepository.findById(playerId),
                score: this.scoreRepository.getUserScoreBy(playerId, roomId)
            })
        });

        return players;
    }

    public checkUserCountForStart = (roomId: string) : boolean => {
        let room = this.getRoomById(roomId);

        if(!room) {
            return false;
        }

        let players = this.getPlayersByRoomId(roomId);

        if (room.maxPlayers == players.length) {
            return true;
        }

        return false;
    }

    public prepareAllRoomsData = () => {
        let result: Room[] = [];

        Object.keys(rooms).map((roomId: string) => {
            result.push({
                id: roomId,
                currentPlayers: this.getPlayersByRoomId(roomId).length,
                ...this.getRoomById(roomId)
            })
        });

        return result;
    }

    public hasQuestions = (roomId: string) => {
        let questions = this.questionRepository.getAllQuestions();
        return Object.keys(questions).includes(roomId);
    }

    public removeRoomData = (roomId: string) => {
        if (Object.keys(rooms).includes(roomId)) {
            delete rooms[roomId];
        }

        this.questionRepository.removeQuestionsByRoomId(roomId);

        this.io.emit('refreshRooms', JSON.stringify(this.prepareAllRoomsData()));
    }

    public refreshRoomUsers = (roomId: string) => {
        let players = this.getPlayersByRoomId(roomId);
        players.map((player: any) => {
            this.io.to(player.id).emit('refreshPlayers', JSON.stringify(players));
        });
    }
}

export default RoomRepository;