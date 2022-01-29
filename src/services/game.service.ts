import { User } from "../models/user.model";
import { Service } from "typedi";
import QuestionRepository from "../repositories/question.repository";
import RoomRepository from "../repositories/room.repository";
import { SocketIOService } from "./socketio.service";
import { QUESTION_DURATION } from "../config";

@Service()
export class GameService {
    
    private io: any;

    constructor(private roomRepo: RoomRepository, private questionRepo: QuestionRepository) {
        this.io = SocketIOService.getInstance();
    }

    public startGame = (roomId: string) => {
        let room      = this.roomRepo.getRoomById(roomId);
        let questions = this.questionRepo.getAllQuestions();

        if(!this.roomRepo.hasQuestions(roomId)) {
            this.questionRepo.prepareQuestions(room);
            setTimeout(() => { this.startGame(roomId) }, 3000);
        }

        this.roomRepo.setGameAsStarted(roomId);

        questions[roomId].map((question: any, i: any) => {
            setTimeout(() => {

                let players = this.roomRepo.getPlayersByRoomId(roomId);
                let counter = 15;

                players.map((player: any) => {
                    this.io.to(player.id).emit('newQuestion', JSON.stringify(question));
                    this.io.to(player.id).emit('timer', counter);
                });

                counter -= 1;

                let questionTimer = setInterval(() => {
                    players.map((player: any) => {
                        this.io.to(player.id).emit('timer', counter);
                    });

                    counter -= 1;

                    if (counter == -1) {
                        clearInterval(questionTimer);
                    }
                }, 1000);

            }, QUESTION_DURATION * i);

        });

        setTimeout(() => {
            this.finishGame(roomId);
            setTimeout(() => {
                this.roomRepo.removeRoomData(roomId);
            }, 1000);
        }, (QUESTION_DURATION * 10) + 200);
    }

    public finishGame = (roomId: string) => {
        let players = this.roomRepo.getPlayersByRoomId(roomId);

        let winner = players[0];

        players.map((player: User) => {
            if (player.score > winner.score) {
                winner = player;
            }
        });

        let lastRank = 0;

        players.sort((a: User, b: User) => {
            return b.score - a.score;
        });

        for(let i = 0; i < players.length; i++) {
            if (i == 0 || players[i].score != players[i - 1].score) {
                lastRank++;
            }

            if(players[i].score == 0) {
                players[i].rank = -1;
            } else {
                players[i].rank = lastRank;
            }

        }

        players.map((player: User) => {
            this.io.to(player.id).emit('gameFinished', JSON.stringify({rankedPlayers: players}));
        });
    }
}