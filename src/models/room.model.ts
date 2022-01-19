import { User } from "./user.model";

export class Room {
    constructor(public id: string, 
                public name: string, 
                public owner: string, 
                public maxPlayers: number, 
                public currentPlayers: number = 1,
                public playerIds: string[] = []) {}

    public hasUser? = (userId: string) => {
        return this.playerIds.includes(userId);
    }
}