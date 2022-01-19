export class Room {
    constructor(public id: string, 
                public name: string, 
                public owner: string, 
                public maxPlayers: number, 
                public playerIds: string[] = []) {}

    public hasUser? = (userId: string) => {
        return this.playerIds.includes(userId);
    }
}