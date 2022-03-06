import { useContext, useRef } from "react"
import { baseSettings } from "../App"
import btnSound from '../sounds/btn_sound.wav';

export default function BaseSettings({ currentPopup, setCurrentPopup }) {

    const settings = baseSettings;
    const btnSoundRef = useRef(), backgroundVolRef = useRef();

    return <div className='popup-window'>
        <div className='popup-title'>설정</div>
        <button onClick={() => {
            setCurrentPopup(null);
            let sound = new Audio(btnSound);
            sound.volume = settings.buttonSoundVolume;
            sound.play();
        }} 
        className='popup-close'>X</button>

        
        <label>
            배경음악 볼륨
            <input type="range" defaultValue={settings.backgroundMusicVolume*100} min='0' max='100' onChange={e => {
                settings.backgroundMusicVolume = Number(e.target.value) / 100;
                backgroundVolRef.current.innerText = Math.floor(settings.backgroundMusicVolume*100);
            }}/>
            <span ref={backgroundVolRef}>{Math.floor(settings.backgroundMusicVolume*100)}</span> <br/>
        </label>

        <label>
            버튼 소리 볼륨
            <input type="range" defaultValue={settings.buttonSoundVolume*100} min='0' max='100' onChange={e => {
                settings.buttonSoundVolume = Number(e.target.value) / 100;
                btnSoundRef.current.innerText = Math.floor(settings.buttonSoundVolume*100);
            }}/>
            <span ref={btnSoundRef}>{Math.floor(settings.buttonSoundVolume*100)}</span> <br/>
        </label>

    </div>
}