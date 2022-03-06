import { useContext, useEffect, useRef, useState } from "react";
import leaveSound from '../sounds/leave.wav';
import joinSound from '../sounds/join.wav';
import startSound from '../sounds/start.wav';
import { baseSettings, socket } from '../App';
import RoomUser from "./RoomUser";

const soundLeave = new Audio(leaveSound);
const soundJoin = new Audio(joinSound);
const soundStart = new Audio(startSound);

export default function BodyRoom({roomInfo, chatListRef}) {

    const settings = baseSettings;
    let lastRoomUserCnt = useRef(roomInfo.users.length);
    let lastIsStarted = useRef(roomInfo.isStarted);

    const chatField = useRef(null);
    const chatSendRef = useRef(null);
    const timeRef = useRef(null);

    let loggedInInfo = window.localStorage.getItem('loggedIn');
    if (loggedInInfo && loggedInInfo.length > 0) loggedInInfo = JSON.parse(loggedInInfo);

    function send(e) {
        if(socket && chatField.current.value) {
            loggedInInfo = window.localStorage.getItem('loggedIn');
            if (loggedInInfo && loggedInInfo.length > 0) loggedInInfo = JSON.parse(loggedInInfo);
            if(socket && loggedInInfo)
                socket.emit('chat', {
                    roomId: roomInfo.id,
                    id: loggedInInfo.id,
                    token: loggedInInfo.token,
                    msg: chatField.current.value.slice(0, 100)
                });
        }
        chatField.current.value = '';
    }

    function onEnterChat(e) {
        if(e.keyCode === 13) {
            chatSendRef.current.click();
        }
    }

    useEffect(() => {
        if(lastRoomUserCnt.current < roomInfo.users.length) {
            soundJoin.volume = settings.effectSoundVolume;
            soundJoin.play();
        }
        else if(lastRoomUserCnt.current > roomInfo.users.length) {
            soundLeave.volume = settings.effectSoundVolume;
            soundLeave.play();
        }

        if(!lastIsStarted.current && roomInfo.isStarted) {
            soundStart.volume = settings.effectSoundVolume;
            soundStart.play();
        }

        lastIsStarted.current = roomInfo.isStarted;
        lastRoomUserCnt.current = roomInfo.users.length;
    }, [roomInfo]);

    useEffect(() => {

        let inte = setInterval(() => {
            if(timeRef.current) {
                timeRef.current.innerText = Math.max(0, roomInfo.wordLimitTime - (Date.now() - roomInfo.latestWordPush) / 1000).toFixed(1);
            }
        }, 100);

        return () => clearInterval(inte);
    }, [roomInfo]);
    
    return <div className={'room-body' + (roomInfo.isStarted ? ' start': '')}>
        <div className="room-title">{roomInfo.name}<div className="room-user-cnt">{roomInfo.users.length}/8</div></div>
        { roomInfo.isStarted ? 
        <div className="room-gamestack">
            <div>
                {roomInfo.words.map(w => <div key={w.word} className={'room-word ' + w.type}>{w.word}</div>)}
            </div>
            <div className="time-label">
                제한시간 <div className="time" ref={timeRef}> </div>
            </div>
        </div>: <></> }
        <div className={'room-users' + (roomInfo.isStarted ? ' start': '')}>
            {roomInfo.users.map(user => {
                return <RoomUser user={user} key={user.id} roomInfo={roomInfo}/>;
            })}
        </div>
        <div className="room-chat">
            <div className="room-chat-list" ref={chatListRef}></div>
            <div className="room-chat-input">
                <input type='text' ref={chatField} onKeyDown={onEnterChat} />
                <button ref={chatSendRef} onClick={send}>전송</button>
            </div> 
        </div>
    </div>;
}