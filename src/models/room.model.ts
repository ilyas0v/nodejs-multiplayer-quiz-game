import { User } from "./user.model";

export class Room {

    public gameAlreadyStarted: boolean = false;
    
    constructor(public id: string, 
                public name: string, 
                public owner: string, 
                public maxPlayers: number, 
                public category: number = null,
                public difficulty: string = null,
                public currentPlayers: number = 1,
                public playerIds: string[] = []) {}

    public hasUser? = (userId: string) => {
        return this.playerIds.includes(userId);
    }
}