import { User } from "../models/user.model";
import { Service } from "typedi";

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
        users[userId] = userData;
        return users[userId];
    }
}