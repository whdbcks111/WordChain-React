import express from 'express';
import {saveDataFile, loadDataFile, saveDataFileImmediately} from './modules/data-manager.mjs'
import {makeSalt, hash} from './modules/my-crypto.mjs';
import path from 'path';
import { fileURLToPath } from 'url';
import {Server} from 'socket.io';
import http from 'http';
import words from './db/words.json';
import headSounds from './db/head_sounds.json';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 5000;
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const datas = {
    rooms: [],
    users: []
};

const socketUserIdMap = new Map();
const userIdSocketMap = new Map();

loadDataFile(path.join(__dirname, 'db/db.json'), () => datas);
saveDataFile(path.join(__dirname, 'db/db.json'), () => datas, 10);

function compareHeadSound(ch, other) {
    return other === headSounds[ch] || other === ch;
}

function getClientUser(user) {
    let newUser = {...user};
    delete newUser.salt;
    delete newUser.pw;
    delete newUser.token;
    return newUser;
}

function getClientRoom(room) {
    let newRoom = {...room};
    delete newRoom.salt;
    delete newRoom.password;
    return newRoom;
}

function createRoomUser(id) {
    return {
        id,
        ready: false,
        isSpectator: false
    };
}

function handle1vs1(room, dwin) {
    if(room.users.filter(u => !u.isSpectator).length === 2) {
        let win = dwin || room.users.filter(u => !u.isSpectator).find(u => u.id !== room.curTurn), 
        lose = room.users.filter(u => !u.isSpectator).find(u => u !== win);
        win = datas.users.find(u => u.id === win.id);
        lose = datas.users.find(u => u.id === lose.id);
        if(!win || !lose) return;
        room.users.forEach(u => {
            let socket = userIdSocketMap.get(u.id);
            if(socket) io.to(socket.id).emit('room-msg', `승자 - ${win.nickname}`);
        });
        if(lose.score > win.score) {
            let t = win.score;
            win.score = lose.score;
            lose.score = t;
            lose.wins = [];
            if(!win.wins.includes(lose.id)) win.wins.push(lose.id);
        }
        else if(!win.wins.includes(lose.id)){
            win.score++;
            win.wins.push(lose.id);
        }
    }
}

function resetRoom(room) {
    room.isStarted = false;
    room.users.forEach(u => {
        if(!u.isBot) u.ready = false;
    });
    room.curTurn = null;
    room.words = [];
}

function broadcastMessage(room, msg) {
    room.users.forEach(u => {
        let socket = userIdSocketMap.get(u.id);
        if(socket) io.to(socket.id).emit('room-msg', msg);
    });
}

function turnChange(room) {
    let nextTurn = room.users.findIndex(u => u.id === room.curTurn);
    do { 
        nextTurn = (nextTurn + 1) % room.users.length; 
    }
    while(room.users[nextTurn].isSpectator);
    room.curTurn = room.users[nextTurn].id;
}

function wordPush(room, user, word) {
    turnChange(room);
    room.words.push(word);
    broadcastMessage(room, `[${user.nickname}] ${word.word}`);
    room.latestWordPush = Date.now();
}

function makeBot(name, normalChance=1, routeChance=1, leadChance=0, handleLeadChance=0, oneShotChance=0) {
    return {
        id: makeSalt().slice(0, 10) + 'T' + Date.now(),
        isBot: true,
        nickname: `[봇] ${name}`,
        normalChance,
        routeChance,
        leadChance,
        handleLeadChance,
        oneShotChance,
        ready: true,
        isSpectator: false
    };
}

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

io.on('connection', socket => {
    console.log('new client connected');
    socket.on('disconnect', () => {
        console.log('disconnected some client');
        userIdSocketMap.delete(socketUserIdMap.get(socket));
        socketUserIdMap.delete(socket);
    })
    socket.on('user-login-info', data => {
        let user = datas.users.find(u => u.id === data.id && u.token === data.token);
        if(user) {
            user.latestLoginCheck = Date.now();
            socketUserIdMap.set(socket, user.id);
            userIdSocketMap.set(user.id, socket);
        }
    });
    socket.on('chat', data => {
        if(!data || !data.msg) return;
        let room = datas.rooms.find(u => u.id === data.roomId);
        let user = datas.users.find(u => u.id === data.id && u.token === data.token);
        if(user && room) {
            let roomUser = room.users.find(ru => ru.id === user.id);
            if(data.msg) data.msg = (data.msg + '').slice(0, 100);
            if(['ㅈㅈ', 'gg', '포기'].includes(data.msg.toLowerCase()) && room.isStarted) {
                broadcastMessage(room, `${user.nickname}님이 포기하여 게임을 종료합니다.`);
                if(room.users.filter(u => !u.isSpectator).length == 2) 
                    handle1vs1(room, room.users.filter(u => !u.isSpectator).find(u => u.id !== user.id));
                resetRoom(room);
            }
            else if(['/첫단어뺏기'].includes(data.msg.toLowerCase()) && room.isStarted && room.words.length === 1 
                && !roomUser.isSpectator && room.curTurn === user.id 
                && room.users.filter(u => !u.isSpectator).length === 2 ) {
                room.curTurn = room.users.filter(u => !u.isSpectator).find(u => u != room.curTurn);
                broadcastMessage(room, `${user.nickname}님이 첫 단어를 뺏으셨습니다.`);
            }
            else if(['/봇', '/봇추가', '/addbot', '/bot'].includes(data.msg.split(' ')[0]) && !room.isStarted && roomUser.id === room.owner) {
                switch(data.msg.split(' ')[1]) {
                    case '초보': case 'easy':
                        room.users.push(makeBot('초보 끝말잇기 봇', 1, 0.1, 0, 0, 0));
                        break;
                    case '중수': case 'normal':
                        room.users.push(makeBot('중수 끝말잇기 봇', 1, 0.5, 0.3, 1, 0.05));
                        break;
                    case '고수': case 'normal':
                        room.users.push(makeBot('고수 끝말잇기 봇', 1, 1, 1, 1, 1));
                        break;
                    default:
                        room.users.push(makeBot('일반 끝말잇기 봇', 1, 0, 0, 1, 0.01));
                        break;
                }
            }
            else if(['/ㄱ', '/r'].includes(data.msg.toLowerCase()) && !room.isStarted) {
                roomUser.ready = !roomUser.ready;
            }
            else if(['/ㄴ', '/s'].includes(data.msg.toLowerCase()) && !room.isStarted) {
                roomUser.isSpectator = !roomUser.isSpectator;
            }
            else if(user.id === room.curTurn && 
                (room.words.length == 0 || compareHeadSound(room.words.slice(-1)[0].word.slice(-1)[0], data.msg[0]))) {
                let word = words.find(w => w.word === data.msg);
                if(!word) {
                    broadcastMessage(room, `[${user.nickname}] ${data.msg} 라는 단어는 존재하지 않습니다.`);
                }
                else if(room.words.some(w => w.word === word.word)) {
                    broadcastMessage(room, `[${user.nickname}] ${data.msg} 은(는) 이미 사용한 단어입니다.`);
                }
                else if(room.words.length === 0 && ['lead', 'one-shot'].includes(word.type)) {
                    broadcastMessage(room, `[${user.nickname}] ${data.msg} - 처음에 유도단어나 한방단어를 사용하실 수 없습니다.`);
                }
                else {
                    wordPush(room, user, word);
                }
            }
            else {
                broadcastMessage(room, `${user.nickname} : ${data.msg}`);
            }
        }
    });
});

setInterval(() => {
    datas.rooms.forEach((room) => {
        room.users = room.users.filter(u => {
            let user = datas.users.find(s => s.id === u.id);
            let isOnline = user && userIdSocketMap.get(user.id) && Date.now() - (user.latestLoginCheck || 0) < 5000;
            if(!isOnline && user) broadcastMessage(room, `${user.nickname} 님이 퇴장하셨습니다.`);
            return isOnline || u.isBot;
        });
        if(room.users.every(u => u.id !== room.owner) && room.users.filter(u => !u.isBot).length) room.owner = room.users.filter(u => !u.isBot)[0].id;
        if(room.users.filter(u => !u.isBot).length === 0) {
            datas.rooms = datas.rooms.filter(r => r.id !== room.id);
            return;
        }
        else if(room.users.filter(u => !u.isSpectator).length <= 1 && room.isStarted) {
            resetRoom(room);
            broadcastMessage(room, `플레이어가 1명밖에 남지 않아 게임을 종료합니다.`);
        }
        else {
            if(room.users.filter(u => !u.isSpectator).every(u => u.id !== room.curTurn) && room.isStarted) {
                room.curTurn = room.users[0].id;
                room.latestWordPush = Date.now();
            }
            if(room.words.length && room.isStarted) {
                let lastWordEnd = room.words.slice(-1)[0].word.slice(-1);
                if(!words.some(w => (w.word[0] === lastWordEnd || w.word[0] === headSounds[lastWordEnd])
                && !room.words.some(_ => _.word === w.word))) {
                    broadcastMessage(room, `더 이상 이을 수 있는 단어가 없어 게임을 종료합니다.`);
                    handle1vs1(room);
                    resetRoom(room);
                }
            }
            if(Date.now() - room.latestWordPush > room.wordLimitTime * 1000 && room.isStarted) {
                broadcastMessage(room, `제한시간이 종료되어 게임을 종료합니다.`);
                handle1vs1(room);
                resetRoom(room);
            }
        }
        room.users.forEach(roomUser => {
            let user = datas.users.find(u => u.id === roomUser.id);
            if(!roomUser.isBot) user.roomId = room.id;
            else roomUser.ready = true;

            if(roomUser.isBot && room.curTurn === roomUser.id && Date.now() - room.latestWordPush > 1000) {
                let usableWords = [];
                if(room.words.length === 0) {
                    usableWords = words.filter(w => w.type === 'route');
                }
                else {
                    let lastWord = room.words.slice(-1)[0], lastChar = lastWord.word.slice(-1);
                    if(lastWord.type !== 'lead' || Math.random() < roomUser.handleLeadChance) {
                        if(Math.random() < roomUser.oneShotChance) {
                            usableWords = words.filter(w => w.type === 'one-shot' && compareHeadSound(lastChar, w.word[0])
                                && !room.words.some(uw => uw.word === w.word));
                        }
                        if(Math.random() < roomUser.leadChance && !usableWords.length) {
                            usableWords = words.filter(w => w.type === 'lead' && compareHeadSound(lastChar, w.word[0])
                                && !room.words.some(uw => uw.word === w.word));
                        }
                        if(Math.random() < roomUser.routeChance && !usableWords.length) {
                            usableWords = words.filter(w => w.type === 'route' && compareHeadSound(lastChar, w.word[0])
                                && !room.words.some(uw => uw.word === w.word));
                        }
                        if(Math.random() < roomUser.normalChance && !usableWords.length) {
                            usableWords = words.filter(w => w.type === 'normal' && compareHeadSound(lastChar, w.word[0])
                                && !room.words.some(uw => uw.word === w.word));
                        }
                    }
                }
                if(usableWords.length > 0) wordPush(room, roomUser, usableWords[Math.floor(usableWords.length * Math.random())]);
                else {
                    broadcastMessage(room, `${roomUser.nickname}님이 포기하여 게임을 종료합니다.`);
                    handle1vs1(room);
                    resetRoom(room);
                }
            }
        });
    });

    datas.users.forEach(user => {
        let room = datas.rooms.find(r => r.id === user.roomId);
        if(!room || room.users.every(u => u.id !== user.id)) user.roomId = null;
    });
}, 400);

app.use(express.json());

app.get('/word', (req, res) => {
    let type = req.query.type;
    let pattern = new RegExp('^' + req.query.p.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
    res.send(words.filter(w => type ? w.type === type && pattern.test(w.word) : pattern.test(w.word)));
});

app.get('/user', (req, res) => {
    let id = req.query.id;
    let token = req.query.token;
    let data = getClientUser(datas.users.find(u => u.id.toLowerCase() === id.toLowerCase() && (!token || token === u.token)));
    res.send(data);
});

app.get('/roomdata', (req, res) => {
    let user = datas.users.find(u => u.id === req.query.id);
    if(!user) {
        res.send({
            data: null
        });
        return;
    }
    let room = datas.rooms.find(r => r.id === user.roomId);
    if(!room) res.send({
       data: null 
    });
    else {
        let roomClone = getClientRoom(room);
        roomClone.users = roomClone.users.map(u => {
            let newUser = Object.assign(getClientUser(datas.users.find(_ => _.id === u.id)), u);
            return newUser;
        });
        res.send({
            data: roomClone || null
        });
    }
})

app.get('/users', (req, res) => {
    res.send(datas.users.map(u => getClientUser(u)));
});

app.get('/rooms', (req, res) => {
    res.send(datas.rooms.map(r => getClientUser(r)));
});

app.get('/onlineusers', (req, res) => {
    res.send(datas.users.filter(u => Date.now() - u.latestLoginCheck < 1000 * 5).map(u => getClientUser(u)));
});

app.post('/register', (req, res) => {
    let json = req.body;
    if(datas.users.some(u => u.id.toLowerCase() === json.id.toLowerCase() || u.nickname === json.nickname)) 
        res.send({
            status: 'already-exist'
        });
    else if(!/[a-z_][a-z0-9_]+/.test(json.id.toLowerCase()) || json.id.length < 4 || json.id.length > 15) 
        res.send({
            status: 'inapposite-id'
        });
    else if(!/[a-z_!@#$%^&*][a-z0-9_!@#$%^&*]+/.test(json.pw.toLowerCase()) || json.pw.length < 8 || json.pw.length > 20) 
        res.send({
            status: 'inapposite-password'
        });
    else if(json.nickname.length < 1 || json.nickname.length > 15)
        res.send({
            status: 'inapposite-nickname'
        });
    else {
        let token = makeSalt();
        let salt = makeSalt();
        let pw = hash(json.pw, salt);
        datas.users.push({
            id: json.id.toLowerCase(),
            pw: pw,
            salt: salt,
            nickname: json.nickname,
            token: token,
            score: 0,
            latestLoginCheck: Date.now(),
            wins: [],
            roomId: null
        });
        res.send({ 
            status: 'ok',
            token: token
        });        
        saveDataFileImmediately(path.join(__dirname, 'db/db.json'), datas);
    }
});

app.post('/login', (req, res) => {
    let json = req.body;
    let user = datas.users.find(u => u.id.toLowerCase() === json.id.toLowerCase());
    if(user) {
        let pw = hash(json.pw, user.salt);
        if(user.pw === pw) {
            let token = makeSalt();
            user.token = token;
            res.send({
                status: 'ok',
                token: token
            });
        }
        else {
            res.send({
                status: 'unmatched-password'
            });
        }
    }
    else {
        res.send({
            status: 'non-exist'
        });
    }
});

app.post('/leaveroom', (req, res) => {
    let json = req.body;
    let user = datas.users.find(u => u.id === json.id && u.token === json.token);
    if(user && user.roomId) {
        let room = datas.rooms.find(r => r.id === user.roomId);
        if(room) room.users = room.users.filter(u => u.id !== user.id);
        res.send({
            status: 'ok'
        });
        room.users.forEach(u => {
            let socket = userIdSocketMap.get(u.id);
            if(socket) io.to(socket.id).emit('room-msg', `${user.nickname} 님이 퇴장하셨습니다.`);
        });
    }
    else {
        res.send({
            status: 'non-exist'
        });
    }
});

app.post('/startgame', (req, res) => {
    let json = req.body;
    let user = datas.users.find(u => u.id === json.id && u.token === json.token);
    let room = datas.rooms.find(r => r.id === user.roomId);
    if(user && room && room.owner === user.id) {
        if(room.users.filter(u => !u.isSpectator).length < 2) {
            res.send({
                status: 'non-enough-player'
            });
        }
        else if(room.users.filter(u => !u.isSpectator).every(u => u.ready || room.owner === u.id)) {
            room.isStarted = true;
            room.curTurn = null;
            room.words = [];
            room.curTurn = room.users.filter(u => !u.isSpectator)[0].id;
            room.latestWordPush = Date.now();
            res.send({
                status: 'ok'
            });
        }
        else {
            res.send({
                status: 'non-enough-ready'
            });
        }
    }
    else {
        res.send({
            status: 'non-exist'
        });
    }
});

app.post('/spectgame', (req, res) => {
    let json = req.body;
    let user = datas.users.find(u => u.id === json.id && u.token === json.token);
    let room = datas.rooms.find(r => r.id === user.roomId);
    if(user && room && !room.isStarted) {
        room.users.forEach(u => {
            if(u.id === user.id) u.isSpectator = !u.isSpectator;
        });
    }
    else {
        res.send({
            status: 'non-exist'
        });
    }
});

app.post('/joinroom', (req, res) => {
    let json = req.body;
    let user = datas.users.find(u => u.id === json.id && u.token === json.token);
    let room = datas.rooms.find(r => r.id === json.roomId);
    if(user && room) {
        if(room.users.length >= 8) {
            res.send({
                status: 'full'
            });
        }
        else if(room.usePassword && hash(json.password, room.salt) !== room.password) {
            res.send({
                status: 'password-not-match'
            });
        }
        else if(room.isStarted) {
            res.send({
                status: 'already-start'
            });
        }
        else if(room.users.every(u => u.id !== user.id)) {
            room.users.push(createRoomUser(user.id));
            user.roomId = room.id;
            res.send({
                status: 'ok'
            });
            room.users.forEach(u => {
                let socket = userIdSocketMap.get(u.id);
                if(socket) io.to(socket.id).emit('room-msg', `${user.nickname} 님이 입장하셨습니다.`);
            });
        }
    }
    else {
        res.send({
            status: 'non-exist'
        });
    }
});

app.post('/createroom', (req, res) => {
    let json = req.body;
    let user = datas.users.find(u => u.id.toLowerCase() === json.creator.toLowerCase());
    if(datas.rooms.length >= 999) {
        res.send({
            status: 'full'
        });
    }
    else if(datas.rooms.some(r => r.users.some(u => u.id === user.id))) {
        res.send({
            status: 'already-in-room'
        });
    }
    else if(user) {
        let roomId = 1;
        while(datas.rooms.some(r => r.id === roomId))
            roomId++;
        let salt = makeSalt();
        let room = {
            id: roomId,
            owner: json.creator,
            users: [createRoomUser(json.creator)],
            words: [],
            isStarted: false,
            curTurn: null,
            latestWordPush: 0,
            wordLimitTime: 90,
            name: json.roomName.slice(0, 20),
            usePassword: json.usePassword,
            password: hash(json.password, salt),
            salt: salt
        };
        datas.rooms.push(room);
        res.send({
            status: 'ok'
        });
    }
    else {
        res.send({
            status: 'non-exist-id'
        });
    }
});

server.listen(port, () => {
    console.log(`[api-server] server is listening at port ${port}`);
});