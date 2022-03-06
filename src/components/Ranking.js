import { useContext, useEffect, useRef, useState } from "react"
import { baseSettings } from "../App"
import btnSound from '../sounds/btn_sound.wav';

export default function Ranking({ currentPopup, setCurrentPopup }) {

    const settings = baseSettings;
    const [users, setUsers] = useState([]);

    useEffect(() => {
        let iid = setInterval(() => {
            fetch(`http://${window.location.hostname}:5000/users`).then(res => res.json()).then(json => {
                setUsers(json);
            });
        }, 1000);
        return () => clearInterval(iid);
    }, []);

    return <div className='popup-window'>
        <div className='popup-title'>랭킹</div>
        <button onClick={() => {
            setCurrentPopup(null);
            let sound = new Audio(btnSound);
            sound.volume = settings.buttonSoundVolume;
            sound.play();
        }} 
        className='popup-close'>X</button>

        <div className="ranking">
            {users.sort((a, b) => b.score - a.score).map(u => <>
                <div className="ranking-user">
                    [{u.nickname}] <div className="ranking-score">랭킹스코어 {u.score}점</div>
                </div>
            </>)}
        </div>

    </div>
}