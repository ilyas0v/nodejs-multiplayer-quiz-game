import { User } from "../models/user.model";
import { Service } from "typedi";

const users: any = {};

@Service()
export class UserRepository {
    

    public getAllUsers = () => {
        return users;
    }

    public findById = (userId: string) => {
        if(!Object.keys(users).includes(userId)) {
            return null;
        }

        return users[userId];
    }

    public storeUserById = (userId: string, userData: User) => {
        users[userId] = userData;
        return users[userId];
    }
}