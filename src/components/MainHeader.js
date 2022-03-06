import { keyEventBinds, socket } from "../App";
import MainHeaderItem from "./MainHeaderItem";

export default function MainHeader({ currentPopup, setCurrentPopup, loginInfo, roomInfo }) {

    let loggedInInfo = window.localStorage.getItem('loggedIn');
    if (loggedInInfo && loggedInInfo.length > 0) loggedInInfo = JSON.parse(loggedInInfo);

    let roomUser = roomInfo && roomInfo.users.find(u => u.id === loggedInInfo.id);

    function leaveRoom() {
        loggedInInfo = window.localStorage.getItem('loggedIn');
        if (loggedInInfo && loggedInInfo.length > 0) loggedInInfo = JSON.parse(loggedInInfo);
        else return;

        fetch(`http://${window.location.hostname}:5000/leaveroom`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: loggedInInfo.id,
                token: loggedInInfo.token
            })
        });
    }

    function startGame() {
        loggedInInfo = window.localStorage.getItem('loggedIn');
        if (loggedInInfo && loggedInInfo.length > 0) loggedInInfo = JSON.parse(loggedInInfo);
        else return;

        fetch(`http://${window.location.hostname}:5000/startgame`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: loggedInInfo.id,
                token: loggedInInfo.token
            })
        }).then(r => r.json()).then(json => {
            switch(json.status) {
                case 'non-exist':
                    alert('방장이 아닙니다.');
                    break;
                case 'non-enough-ready':
                    alert('모두 준비가 완료되지 않았습니다.');
                    break;
                case 'non-enough-player':
                    alert('플레이어는 최소 2명 이상이어야 합니다.');
                    break;
            }
        });
    }

    function readyGame() {
        loggedInInfo = window.localStorage.getItem('loggedIn');
        if (loggedInInfo && loggedInInfo.length > 0) loggedInInfo = JSON.parse(loggedInInfo);
        else return;
        if(socket && loggedInInfo)
            socket.emit('chat', {
                roomId: roomInfo.id,
                id: loggedInInfo.id,
                token: loggedInInfo.token,
                msg: '/r'
            });
    }

    function spectGame() {
        loggedInInfo = window.localStorage.getItem('loggedIn');
        if (loggedInInfo && loggedInInfo.length > 0) loggedInInfo = JSON.parse(loggedInInfo);
        else return;

        if(socket && loggedInInfo)
            socket.emit('chat', {
                roomId: roomInfo.id,
                id: loggedInInfo.id,
                token: loggedInInfo.token,
                msg: '/s'
            });
    }

    keyEventBinds['readyNspect'] = e => {
        if(e.code === 'KeyR' && e.ctrlKey && roomInfo.owner != loggedInInfo.id) {
            e.preventDefault();
            readyGame();
        }
        else if(e.code === 'KeyS' && e.ctrlKey) {
            e.preventDefault();
            spectGame();
        }
        else if(e.code === 'Escape') {
            e.preventDefault();
            leaveRoom();
        }
    }

    return <div className="main-header">
        <MainHeaderItem titleName='설정' onClick={e => {
            if(currentPopup === 'base-settings') setCurrentPopup(null);
            else setCurrentPopup('base-settings');
        }}/>
        <MainHeaderItem titleName='랭킹' onClick={e => {
            if(currentPopup === 'ranking') setCurrentPopup(null);
            else setCurrentPopup('ranking');
        }}/>
        <MainHeaderItem titleName='커뮤니티'/>
        {
            roomInfo ? 
            <>
            {
                roomInfo.owner === loggedInInfo.id ? (
                    roomInfo.isStarted? <></> : <>
                    <MainHeaderItem titleName='방 설정' onClick={e => leaveRoom()} itemColor='#ffca00' />
                    <MainHeaderItem titleName='시작' onClick={e => startGame()} itemColor='#eea900' />
                    </>
                ) : (roomInfo.isStarted ? <></> : 
                    <MainHeaderItem titleName={roomUser && roomUser.ready ? '대기': '준비'} 
                    onClick={e => readyGame()} itemColor='#eea900' />    
                )
            }
            {roomInfo.isStarted ? <></> : 
                    <MainHeaderItem titleName='관전' onClick={e => spectGame()} itemColor='#ffca00' />
                    }
            <MainHeaderItem titleName='나가기' onClick={e => leaveRoom()} itemColor='#eea900' />
            </> :
            <MainHeaderItem titleName='방 만들기' onClick={e => {
                if(!loginInfo.isLoggedIn)
                    alert('로그인된 사용자만 이용하실 수 있습니다.');
                else if(currentPopup === 'create-room') setCurrentPopup(null);
                else setCurrentPopup('create-room');
            }}/>
        }
    </div>
}