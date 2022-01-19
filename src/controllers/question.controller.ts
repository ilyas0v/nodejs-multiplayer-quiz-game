import RoomRepository from "../repositories/room.repository";
import { UserRepository } from "../repositories/user.repository";
import { ScoreRepository } from "../repositories/score.repository";
import QuestionRepository from "../repositories/question.repository";
import { Service } from "typedi";
import { GameService } from "../services/game.service";
import { SocketIOService } from "../services/socketio.service";

@Service()
class QuestionController {

    private io: any;

    constructor(private roomRepository: RoomRepository, 
                private userRepository: UserRepository, 
                private questionRepository: QuestionRepository,
                private scoreRepository: ScoreRepository, 
                private gameService: GameService)
    {
        this.io = SocketIOService.getInstance();
    }

    /**
     * 
     * @param socket 
     * @param data 
     * @returns void
     */
    public answer = (socket: any, data: string) => {

        let answerData = JSON.parse(data);
        let roomId = answerData.roomId;
        let questionId = answerData.questionId;
        let variantId = answerData.variantId;
        let userId = socket.id;


        if (this.questionRepository.getUserAnsweredQuestions(userId).includes(questionId)) {
            return false;
        }

        let question = this.questionRepository.getQuestionByRoomAndQuestionId(roomId, questionId);

        if(!question) {
            return;
        }

        if (question.correctAnswerIndex == variantId) {
            let previousScore = this.scoreRepository.getUserScoreBy(userId, roomId);
            this.scoreRepository.setUserScore(roomId, userId, previousScore + 1);
            this.roomRepository.refreshRoomUsers(roomId);

            this.io.to(userId).emit('correctAnswer', JSON.stringify({ selectedVariant: variantId, correctVariant: question.correctAnswerIndex }));
        } else {
            this.io.to(userId).emit('wrongAnswer', JSON.stringify({ selectedVariant: variantId, correctVariant: question.correctAnswerIndex }));
        }

       this.questionRepository.markQuestionAsAnsweredByUser(userId, questionId);
    }
}

export default QuestionController;