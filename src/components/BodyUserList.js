import { useEffect, useState } from "react";

export default function BodyUserList() {

    let [users, setUsers] = useState([]);

    useEffect(() => {
        let iid = setInterval(() => {
            fetch(`http://${window.location.hostname}:5000/onlineusers`).then(res => res.json()).then(json => {
                setUsers(json);
            });
        }, 1000);
        return () => clearInterval(iid);
    }, [])

    return <div className="user-list">
        <div className="user-list-title">
            접속 유저 목록
        </div>
        <div className="list">
            {users.map(u => <div className="user-name" key={u.id}>{u.nickname} ({u.id.slice(0, 2) + '..'})</div>)}
        </div>
    </div>;
}