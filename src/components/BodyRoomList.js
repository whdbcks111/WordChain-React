import RoomElement from "./RoomElement";
import { useState, useEffect } from "react";

export default function BodyRoomList() {

    let [rooms, setRooms] = useState([]);
    let [roomSearch, setRoomSearch] = useState('');
    let [showPWRoom, setShowPWRoom] = useState(true);

    useEffect(() => {
        let iid = setInterval(() => {
            fetch(`http://${window.location.hostname}:5000/rooms`).then(res => res.json()).then(json => { 
                setRooms(json);
            });
        }, 1000);
        return () => clearInterval(iid);
    }, [])

    return <div className="room-list-cont">
        <div className="headbar">
            <label>
                비밀번호방 <input type="checkbox" defaultChecked={true} onChange={e => setShowPWRoom(e.currentTarget.checked)}/>
            </label>
            <label>
                방 검색 <input type="text" defaultValue='' onChange={e => setRoomSearch(e.currentTarget.value)}/>
            </label>
        </div>
        <div className="room-list">
            {rooms.filter(r => r.name.includes(roomSearch) && (!r.usePassword || showPWRoom) ).map(room => <RoomElement key={room.id} room={room}/>)}
        </div>
    </div>;
}