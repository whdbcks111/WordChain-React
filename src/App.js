import './App.css';
import Header from './components/Header';
import Login from './components/Login';
import NotFoundPage from './components/NotFoundPage';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Register from './components/Register';
import io from 'socket.io-client';
import { createContext, useEffect, useRef, useState } from 'react';
import MainPage from './components/MainPage';
import soundChat from './sounds/chat.wav';

export const baseSettings = {
    backgroundMusicVolume: 0.06,
    buttonSoundVolume: 0.1,
    effectSoundVolume: 0.1
};
export const socket = io.connect(`http://${window.location.hostname}:5000`);
export const keyEventBinds = {};

const chatSound = new Audio(soundChat);

function App() {

    const [loginInfo, setLoginInfo] = useState({
        isLoggedIn: false,
        id: null
    });

    const [roomInfo, setRoomInfo] = useState(null);
    const chatListRef = useRef(null);

    function logout() {
        window.localStorage.removeItem('loggedIn');
        setLoginInfo({
            ...loginInfo,
            isLoggedIn: false
        });
    }

    function checkLoggedIn() {
        let loggedInInfo = window.localStorage.getItem('loggedIn');
        if (loggedInInfo && loggedInInfo.length > 0) loggedInInfo = JSON.parse(loggedInInfo);

        if (loggedInInfo)
            fetch(`http://${window.location.hostname}:5000/user?id=${loggedInInfo.id}&token=${loggedInInfo.token}`).then(res => res.json()).then(json => {
                if (json) {
                    setLoginInfo({
                        ...loginInfo,
                        isLoggedIn: true,
                        id: loggedInInfo.id
                    });
                    socket.emit('user-login-info', loggedInInfo);
                }
                else {
                    setLoginInfo({
                        ...loginInfo,
                        isLoggedIn: false,
                        id: null
                    });
                    window.localStorage.removeItem('loggedIn');
                }
            });
    }

    useEffect(() => {
        checkLoggedIn();
        let checkLoggedInInterval = setInterval(checkLoggedIn, 1000);

        let checkUnloggedRoom = setInterval(() => {
            if(!loginInfo.isLoggedIn && roomInfo) setRoomInfo(null);
        }, 1000);

        let getRoomInfo = setInterval(() => {
            let loggedInInfo = window.localStorage.getItem('loggedIn');
            if (loggedInInfo && loggedInInfo.length > 0) loggedInInfo = JSON.parse(loggedInInfo);

            if(loggedInInfo) 
                fetch(`http://${window.location.hostname}:5000/roomdata?id=${loggedInInfo.id}`)
                .then(r => r.json())
                .then(json => {
                    setRoomInfo(json.data);
                });
        }, 400);

        socket.on('roomdata', data => {
            setRoomInfo(data);
            console.log(JSON.stringify(data, null, 2));
        });

        socket.on('room-msg', data => {
            let scrollToDown = false;
            if(!chatListRef.current) return;
            if(chatListRef.current.scrollTop + chatListRef.current.clientHeight 
                >= chatListRef.current.scrollHeight - 100) scrollToDown = true;
            chatListRef.current.innerText += data + '\n';
            if(scrollToDown) {
                chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
            }

            chatSound.volume = baseSettings.buttonSoundVolume;
            chatSound.play();
        });

        const keyBindEvent = e => {
            Object.values(keyEventBinds).forEach(f => {
                f(e);
            });
        };

        window.addEventListener('keydown', keyBindEvent);

        return () => {
            clearInterval(checkLoggedInInterval);
            clearInterval(checkUnloggedRoom);
            clearInterval(getRoomInfo);
            window.removeEventListener(keyBindEvent);
        };
    }, []);

    return (
        <BrowserRouter>
            <div className='app'>
                <Header loginInfo={loginInfo} logout={logout} />
                <Routes>
                    <Route path='/' element={
                        <MainPage loginInfo={loginInfo} roomInfo={roomInfo} chatListRef={chatListRef}/>
                    } />
                    <Route path='/login' element={
                        <Login />
                    } />
                    <Route path='/register' element={
                        <Register />
                    } />
                    <Route path='*' element={
                        <NotFoundPage />
                    } />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
