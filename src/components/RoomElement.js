import padlock from '../images/padlock.png';
import btnSound from '../sounds/btn_sound.wav'
import { baseSettings } from '../App';
import { useContext } from 'react';

export default function RoomElement({room}) {

    const settings = baseSettings;

    function joinRoom() {

        let sound = new Audio(btnSound);
        sound.volume = settings.buttonSoundVolume;
        sound.play();

        let loggedInInfo = window.localStorage.getItem('loggedIn');
        if (loggedInInfo && loggedInInfo.length > 0) loggedInInfo = JSON.parse(loggedInInfo);
        else {
            alert('로그인된 사용자만 이용하실 수 있습니다.');
            return;
        }

        fetch(`http://${window.location.hostname}:5000/joinroom`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: loggedInInfo.id,
                roomId: room.id,
                token: loggedInInfo.token,
                password: room.usePassword ? prompt('방 비밀번호를 입력하세요') : null
            })
        }).then(r => r.json()).then(json => {
            switch(json.status) {
                case 'non-exist':
                    alert(`방이 존재하지 않습니다. (ID:${room.id})`);
                    break;
                case 'full':
                    alert('방이 꽉 찼습니다.');
                    break;
                case 'already-start':
                    alert('이미 게임을 시작했습니다.');
                    break;
                case 'password-not-match':
                    alert('비밀번호가 일치하지 않습니다.');
                    break;
            }
        });
    }

    return <div className={'room-element' + (room.isStarted ? ' start': '')} onClick={() => {
        joinRoom();
    }}>
        <div className="room-id">
            {room.id}
        </div>
        <div className="room-name">
            {room.name}
        </div>
        <div className="room-usercnt">
            {room.users.length}/8
        </div>
        {room.usePassword ? <img src={padlock} width='15px' className='padlock'/>: <></>}
    </div>
}