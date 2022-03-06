import BodyRoomList from "./BodyRoomList";
import BodyUserList from "./BodyUserList";
import BodyRoom from "./BodyRoom";

export default function MainBody({roomInfo, chatListRef}) {

    return <div className="main-body">
        <BodyUserList/>
        {
            roomInfo ? 
            <BodyRoom roomInfo={roomInfo} chatListRef={chatListRef}/> :
            <BodyRoomList/>
        }
    </div>
}