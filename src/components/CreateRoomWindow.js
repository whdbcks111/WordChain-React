
import { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { baseSettings } from '../App';
import btnSound from '../sounds/btn_sound.wav';

export default function CreateRoomWindow({ currentPopup, setCurrentPopup, loginInfo }) {

    const settings = baseSettings;
    const [nickname, setNickname] = useState('');
    const [pwHide, setPwHide] = useState(true);
    const roomName = useRef(null), pw = useRef(null);
    const [userInfo, setUserInfo] = useState(null);
    const nav = useNavigate();

    function createRoom() {
        if(!userInfo) return;
        fetch(`http://${window.location.hostname}:5000/createroom`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                creator: userInfo.id,
                roomName: roomName.current.value,
                usePassword: !pwHide,
                password: pw.current.value
            })
        }).then(res => {
            return res.json();
        }).then(json => {
            let status = json.status;
            switch(status) {
                case 'non-exist-id':
                    window.alert('유저 정보가 미확인되었습니다. 재로그인을 해주세요.');
                    nav('/login');
                    break;
                case 'full':
                    window.alert('서버에 방이 꽉 찼습니다. 더 이상 방을 생성할 수 없습니다.');
                    close();
                    break;
                case 'already-in-room':
                    window.alert('이미 방에 들어와 있습니다.');
                    close();
                    break;
                case 'ok':
                    close();
                    break;
            }
        });
    }

    function close() {
        setCurrentPopup(null);
        let sound = new Audio(btnSound);
        sound.volume = settings.buttonSoundVolume;
        sound.play();
    }

    useEffect(() => {
        fetch(`http://${window.location.hostname}:5000/user?id=${loginInfo.id}`).then(r => r.json()).then(json => {
            setNickname(json.nickname || '???');
            setUserInfo(json);
        });
    }, []);

    useEffect(() => {
        roomName.current.value = nickname ? nickname + '님의 재밌는 끝말잇기 방': '';
    }, [nickname])

    return <div className='popup-window'>
        <div className='popup-title'>방만들기</div>
        <button onClick={close} 
        className='popup-close'>X</button>

        <label>
            방 이름
            <input type="text" ref={roomName}/>
        </label> <br/>

        <input type="checkbox" onChange={e => setPwHide(!e.currentTarget.checked)}/>
        <label>
            비밀번호
            <input type="text" defaultValue={''} readOnly={pwHide} ref={pw}/>
        </label> <br/><br/>

        <button className='create-room-btn' onClick={createRoom}>방 만들기</button>
    </div>
}