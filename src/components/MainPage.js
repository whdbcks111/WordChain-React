import { useContext, useEffect, useRef, useState } from "react";
import BaseSettings from "./BaseSettings";
import MainHeader from "./MainHeader";
import MainBody from "./MainBody";
import btnSound from '../sounds/btn_sound.wav';
import CreateRoomWindow from "./CreateRoomWindow";
import backgroundMusic from '../sounds/background.wav';
import gameMusic from '../sounds/game.wav';
import { baseSettings } from "../App";
import Ranking from "./Ranking";

export default function MainPage({ loginInfo, roomInfo, chatListRef }) {

    const [currentPopup, setCurrentPopup] = useState(null);
    const isInitMount = useRef(true);
    const isInitSound = useRef(null);
    const settings = baseSettings;

    const currentPopupRef = useRef();
    useEffect(() => {
        currentPopupRef.current = currentPopup;
    }, [currentPopup]);

    const checkBackgroundMusic = () => {
        if(!settings.music) {
            settings.music = new Audio(gameMusic);
            settings.music.volume = settings.backgroundMusicVolume;
            settings.music.loop = true;
            settings.music.play();
        }
    };

    useEffect(() => {
        document.title = 'ㄲㅡㅌ : 말잇기 - 메인';

        window.addEventListener('keydown', e => {
            if(e.code === 'Escape' && currentPopupRef.current) {
                setCurrentPopup(null);
                let sound = new Audio(btnSound);
                sound.volume = settings.buttonSoundVolume;
                sound.play();
            }
        });

        const interactEvents = ['click', 'dblclick', 'keydown', 'scroll', 'contextmenu'];

        interactEvents.forEach(eventName => {
            window.addEventListener(eventName, checkBackgroundMusic);
        });

        let musicInt = setInterval(() => {
            if(settings.music)
                settings.music.volume = settings.backgroundMusicVolume;
        }, 1000);

        return () => {
            clearInterval(musicInt);
        }
    }, []);

    return <div className="main">
        {currentPopup === 'base-settings' ? <BaseSettings setCurrentPopup={setCurrentPopup} currentPopup={currentPopup}/>: <></>}
        {currentPopup === 'ranking' ? <Ranking setCurrentPopup={setCurrentPopup} currentPopup={currentPopup}/>: <></>}
        {currentPopup === 'create-room' ? <CreateRoomWindow setCurrentPopup={setCurrentPopup} currentPopup={currentPopup} loginInfo={loginInfo}/>: <></>}
        <MainHeader setCurrentPopup={setCurrentPopup} currentPopup={currentPopup} loginInfo={loginInfo} roomInfo={roomInfo}/>
        <MainBody roomInfo={roomInfo} chatListRef={chatListRef}/>
    </div>
}