import RoomRepository from "./room.repository";
import * as request from 'request';
import { shuffleArray } from "../helpers";
import { Question } from "../models/question.model";
import { Service } from "typedi";

const questions: any = {};
const userAnsweredQuestions: any = {};

@Service()
class QuestionRepository {
    
    constructor(private readonly roomRepository: RoomRepository) {}

    public getAllQuestions = () => {
        return questions;
    } 

    public prepareQuestions = async (roomId: string) => {
        if (this.checkIfARoomHasQuestions(roomId)) {
            return;
        }

        let tokenBody = await request.get('https://opentdb.com/api_token.php?command=request', {}, async function (err, res, body) {
            let tokenBodyJson = JSON.parse(body);
            let token = tokenBodyJson.token;
            let apiUrl = 'https://opentdb.com/api.php?amount=10&difficulty=easy&type=multiple&token=' + token;

            await request.get(apiUrl, {}, function (err, res, body) {
                let bodyJson = JSON.parse(body);

                questions[roomId] = [];

                bodyJson.results.map((result: any, i: any) => {
                    let correctAnswer = result.correct_answer;
                    let incorrectAnswers = result.incorrect_answers;
                    let variants = [correctAnswer].concat(incorrectAnswers);

                    variants = shuffleArray(variants);

                    let questionStoreData: Question = {
                        id: i,
                        question: result.question,
                        variants: variants,
                        correctAnswerIndex: variants.indexOf(correctAnswer)
                    }

                    questions[roomId].push(questionStoreData);
                });

                return questions[roomId];
            });
        });
    }

    public getQuestionsByRoomId = (roomId: string) => {
        if(Object.keys(questions).includes(roomId)) {
            return [];
        }

        return questions[roomId];
    }

    public checkIfARoomHasQuestions = (roomId: string) => {
        let questions = this.getAllQuestions();
        return Object.keys(questions).includes(roomId);
    }

    public getUserAnsweredQuestions = (userId: string) => {
        if (!Object.keys(userAnsweredQuestions).includes(userId)) {
            userAnsweredQuestions[userId] = [];
        }

        return userAnsweredQuestions[userId];
    }

    public getQuestionByRoomAndQuestionId = (roomId: string, questionId: number) => {
        let questionsOfRoom = questions[roomId];

        if (!questionsOfRoom || !questionsOfRoom[questionId]) {
            return null;
        }

        return questionsOfRoom[questionId];
    }

    public markQuestionAsAnsweredByUser = (userId: string, questionId: number) => {
        userAnsweredQuestions[userId].push(questionId);
    }

    public removeQuestionsByRoomId = (roomId: string) => {
        if (Object.keys(questions).includes(roomId)) {
            delete questions[roomId];
        }
    }
}

export default QuestionRepository;