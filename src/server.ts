import * as express from "express";
import { Server } from 'http';
import * as socketIO from 'socket.io';
import * as cors from 'cors';
import * as uuid from 'uuid';
import * as request from 'request';


const app = express();

app.use(cors());
app.use( express.json({ limit: '50mb' }) );
app.use('/', express.static('frontend'));

const http = new Server(app);
const io = (socketIO as any)(http, { cors: { origin: '*' } });


app.get('/api', (req: any, res: any) => {
    //prepareQuestions('123');
    res.json(questions);
});

const users: any = {}; 
const rooms: any = {};
const userScores: any = {};
const questions: any = {};
const userAnsweredQuestions: any = {};

/**
 * WEBSOCKET OPERATIONS
 */
io.on("connection", (socket: any) => 
{
    socket.on('disconnect', () => {
        let userId = socket.id;
        let user =  users[userId];

        if(user) {
            if(Object.keys(rooms).includes(user.currentRoomId)) {
                let room = rooms[user.currentRoomId];
                let index = room.players.indexOf(userId);
                room.players.splice(index, 1);
                delete users[userId];

                refreshRoomUsers(user.currentRoomId);

                if (room.players.length == 0) {
                    delete rooms[user.currentRoomId];
                }
            }
        }
    });

    socket.on('newRoom', (data: string) => {
        let roomId = uuid.v4();

        let roomData = JSON.parse(data);
        let userId = socket.id;

        rooms[roomId] = {
            name: roomData.name,
            owner: roomData.owner,
            maxPlayers: roomData.maxPlayers,
            players: []
        };

        let room = rooms[roomId];

        if (!room.players.includes(userId)) {
            room.players.push(userId);
            users[userId] = { name: roomData.owner, currentRoomId: roomId };
            let players = getPlayersByRoomId(roomId);
            io.to(userId).emit('joinedRoom',  JSON.stringify({ id: roomId, ...room, players: players }));

            checkUserCount(roomId);
        }

        io.emit('refreshRooms', JSON.stringify(prepareRoomData()));

    });

    socket.on('joinRoom', (data: string) => {
        let joinData = JSON.parse(data);

        const selectedRoomId = joinData.selectedRoomId;

        if (!selectedRoomId || !Object.keys(rooms).includes(selectedRoomId)) {
            return false;
        }
        
        const room = rooms[selectedRoomId];
        const userId = socket.id;

        if(!room.players.includes(userId)) {
            room.players.push(userId);
            users[userId] = { name: joinData.name, currentRoomId: selectedRoomId };
            let players = getPlayersByRoomId(selectedRoomId);   
            io.to(userId).emit('joinedRoom', JSON.stringify({ id: selectedRoomId, ...room, players: players }));
        
            refreshRoomUsers(selectedRoomId);

            if (!Object.keys(questions).includes(selectedRoomId)) { // If no questions prepared yet, then prepare
                checkUserCount(selectedRoomId);
            }
            
        }

        io.emit('refreshRooms', JSON.stringify(prepareRoomData()));

    });

    socket.on('answerQuestion', (data: string) => {
        
        let answerData = JSON.parse(data);
        let roomId     = answerData.roomId;
        let questionId = answerData.questionId;
        let variantId  = answerData.variantId;
        let userId     = socket.id;

        if (!Object.keys(userAnsweredQuestions).includes(userId)) {
            userAnsweredQuestions[userId] = [];
        }

        if (userAnsweredQuestions[userId].includes(questionId)) {
            return false;
        }

        let question = questions[roomId][questionId];

        if (question.correctAnswerIndex == variantId) {
            userScores[roomId][userId] += 1;
            refreshRoomUsers(roomId);

            io.to(userId).emit('correctAnswer', JSON.stringify({ selectedVariant: variantId, correctVariant: question.correctAnswerIndex }));
        } else {
            io.to(userId).emit('wrongAnswer', JSON.stringify({ selectedVariant: variantId, correctVariant: question.correctAnswerIndex }));
        }

        userAnsweredQuestions[userId].push(questionId);
    });

    io.emit('refreshRooms', JSON.stringify(prepareRoomData()));
});

const prepareRoomData = () => {
    let result: any[] = [];

    Object.keys(rooms).map( (roomId: string) => {
        result.push({
            id: roomId,
            currentPlayers: getPlayersByRoomId(roomId).length,
            ...rooms[roomId],
        })
    });

    return result;
};

const getPlayersByRoomId = (roomId: string) => {

    if(!Object.keys(rooms).includes(roomId) || !Object.keys(rooms[roomId].players).length) {
        return [];
    }

    const room = rooms[roomId];

    let players: any[] = [];

    room.players.map((playerId: any) => {
        players.push({
            id: playerId,
            ...users[playerId],
            score: getUserScore(roomId, playerId)
        })
    });

    return players;
}

const getUserScore = (roomId: string, userId: string) => {
    if (!Object.keys(userScores).includes(roomId)) {
        userScores[roomId] = {};
    }

    if (!Object.keys(userScores[roomId]).includes(userId)) {
        userScores[roomId][userId] = 0;
    }

    return userScores[roomId][userId];
}

const incrementUserScore = (roomId: string, userId: string) => {
    let score = getUserScore(roomId, userId);
    userScores[roomId][userId] = score + 1;
}

const refreshRoomUsers = (roomId: string) => {
    let players = getPlayersByRoomId(roomId);
    players.map((player: any) => {
        io.to(player.id).emit('refreshPlayers', JSON.stringify(players));
    });
}

const checkUserCount = (roomId: string) => {
    let room = rooms[roomId];
    let players = getPlayersByRoomId(roomId);

    if(room.maxPlayers == players.length) {
        players.map((player: any) => {
            io.to(player.id).emit('allUsersReady', 'All users are ready. Game will start in 5 seconds');
        });

        prepareQuestions(roomId);
        setTimeout(() => { startGame(roomId); }, 1000);
    }
}

const startGame = (roomId: string) => {
    let room = rooms[roomId];

    questions[roomId].map((question: any, i: any) => {
        setTimeout(() => {

            let players = getPlayersByRoomId(roomId);
            let counter = 15;

            players.map((player: any) => {
                io.to(player.id).emit('newQuestion', JSON.stringify(question));
                io.to(player.id).emit('timer', counter);
            });

            counter -= 1;

            let questionTimer = setInterval(() => {
                players.map((player: any) => {
                    io.to(player.id).emit('timer', counter);
                });

                counter -= 1;

                if (counter == -1) {
                    clearInterval(questionTimer);
                }
            }, 1000);

        }, 16000 * i);

    });

    setTimeout(() => {
        removeRoomData(roomId);
    }, 200000);
}

const prepareQuestions: any = async (roomId: string) => {

    if (Object.keys(questions).includes(roomId)) {
        return;
    }

    let body = await request.get('https://opentdb.com/api.php?amount=10&type=multiple&token=992060a405ae581d283fa674474f3d4c566235a3cfc91275610aadcdf43f6558', {}, function (err, res, body) {
        let bodyJson = JSON.parse(body);

        questions[roomId] = [];

        bodyJson.results.map((result: any, i: any) => {
            let correctAnswer = result.correct_answer;
            let incorrectAnswers = result.incorrect_answers;
            let variants = [correctAnswer].concat(incorrectAnswers);

            variants = shuffle(variants);

            questions[roomId].push({
                id: i,
                question: result.question,
                variants: variants,
                correctAnswerIndex: variants.indexOf(correctAnswer)
            });
        });
    });

}


const removeRoomData = (roomId: string) => {
    if(Object.keys(rooms).includes(roomId)) {
        delete rooms[roomId];
    }

    if (Object.keys(questions).includes(roomId)) {
        delete questions[roomId];
    }

    io.emit('refreshRooms', JSON.stringify(prepareRoomData()));
}


const shuffle = (array: string[]) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
}

const server = http.listen(process.env.PORT || 3000, () => {
    console.log("listening on *:3000");
});