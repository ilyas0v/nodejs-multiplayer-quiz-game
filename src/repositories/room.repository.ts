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

    /**
     * 
     * @returns {}
     */
    public getAllRooms = () : {} => {
        return rooms;
    }

    /**
     * 
     * @param roomId 
     * @param roomData 
     * @returns Room
     */
    public storeRoomById = (roomId: string, roomData: Room) : Room => {
        rooms[roomId] = roomData;
        return rooms[roomId];
    }

    /**
     * 
     * @param roomId 
     * @returns Room
     */
    public getRoomById = (roomId: string) : Room => {
        if(this.checkRoomExists(roomId)) {
            return rooms[roomId];
        }

        return null;
    }

    /**
     * 
     * @param roomId 
     * @returns boolean
     */
    public checkRoomExists = (roomId: string) : boolean => {
        return Object.keys(rooms).includes(roomId);
    }

    /**
     * 
     * @param roomId 
     * @returns User[]
     */
    public getPlayersByRoomId = (roomId: string) : User[] => {
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

    /**
     * 
     * @param roomId
     * @returns boolean
     */
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

    /**
     * 
     * @returns Room[]
     */
    public prepareAllRoomsData = (test: string = '') => {
        
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

    /**
     * 
     * @param roomId 
     * @returns boolean
     */
    public hasQuestions = (roomId: string) : boolean => {
        let questions = this.questionRepository.getAllQuestions();
        return Object.keys(questions).includes(roomId);
    }

    /**
     * 
     * @param roomId 
     * returns void
     */
    public removeRoomData = (roomId: string) : void => {
        if (Object.keys(rooms).includes(roomId)) {
            delete rooms[roomId];
        }

        this.questionRepository.removeQuestionsByRoomId(roomId);

        this.io.emit('refreshRooms', JSON.stringify(this.prepareAllRoomsData()));
    }

    /**
     * 
     * @param roomId 
     * returns void
     */
    public refreshRoomUsers = (roomId: string) :  void => {
        let players = this.getPlayersByRoomId(roomId);
        players.map((player: any) => {
            this.io.to(player.id).emit('refreshPlayers', JSON.stringify(players));
        });
    }
}

export default RoomRepository;