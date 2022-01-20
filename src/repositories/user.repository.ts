import { User } from "../models/user.model";
import { Service } from "typedi";
import { randomInteger } from "../helpers";

const users: any = {};

@Service()
export class UserRepository {
    
    /**
     * 
     * @returns {}
     */
    public getAllUsers = () => {
        return users;
    }

    /**
     * 
     * @param userId 
     * @returns User
     */
    public findById = (userId: string) : User => {
        if(!Object.keys(users).includes(userId)) {
            return null;
        }

        return users[userId];
    }

    /**
     * 
     * @param userId 
     * @param userData 
     * @returns User
     */
    public storeUserById = (userId: string, userData: User) :  User => {
        let xRand = randomInteger(0, 4);
        let yRand = randomInteger(0, 4);
        userData['picturePosition'] = `-${xRand * 85 }px -${ yRand * 85 }px`;
        users[userId] = userData;
        return users[userId];
    }
}