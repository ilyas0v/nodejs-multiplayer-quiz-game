import { Service } from "typedi";

const scores: any = {};

@Service()
export class ScoreRepository {
    constructor() { }

    public getUserScoreBy = (userId: string, roomId: string) : number => {
        if (!this.hasRoom(roomId)) {
            scores[roomId] = {};
        }

        if (!this.hasUser(roomId, userId)) {
            this.setUserScore(roomId, userId, 0);
        }

        return scores[roomId][userId];
    }

    public hasRoom = (roomId: string) => {
        return Object.keys(scores).includes(roomId)
    }

    public hasUser = (roomId: string, userId: string) => {
        return Object.keys(scores[roomId]).includes(userId);
    }

    public setUserScore = (roomId: string, userId: string, score: number) => {
        scores[roomId][userId] = score;
    }
}