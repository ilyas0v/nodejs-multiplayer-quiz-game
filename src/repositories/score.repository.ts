import { Service } from "typedi";

const scores: any = {};

@Service()
export class ScoreRepository {

    constructor() { }

    /**
     * 
     * @param userId 
     * @param roomId 
     * @returns number
     */
    public getUserScoreBy = (userId: string, roomId: string) : number => {
        if (!this.hasRoom(roomId)) {
            scores[roomId] = {};
        }

        if (!this.hasUser(roomId, userId)) {
            this.setUserScore(roomId, userId, 0);
        }

        return scores[roomId][userId];
    }

    /**
     * 
     * @param roomId 
     * @returns boolean
     */
    public hasRoom = (roomId: string) : boolean => {
        return Object.keys(scores).includes(roomId)
    }

    /**
     * 
     * @param roomId 
     * @param userId 
     * @returns boolean
     */
    public hasUser = (roomId: string, userId: string) : boolean => {
        return Object.keys(scores[roomId]).includes(userId);
    }

    /**
     * 
     * @param roomId 
     * @param userId 
     * @param score 
     */
    public setUserScore = (roomId: string, userId: string, score: number) : void => {
        scores[roomId][userId] = score;
    }
}