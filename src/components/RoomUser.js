export default function RoomUser({ roomInfo, user }) {
    return <div className={'room-user' 
        + (roomInfo.curTurn === user.id ? ' current-turn': '') 
        + (user.isSpectator ? ' spect': '')} key={user.id}>
        <div className='room-user-name'>{user.nickname}</div> 
        <div className={
            'room-user-flag ' + (roomInfo.owner === user.id ? 
                'owner': 
                (user.ready ? 'ready': 'wait')) + (user.isSpectator ? ' spect': '')
        }>
            {user.isSpectator ? '관전': (
        roomInfo.owner === user.id ? '방장': (
            user.ready ? '준비': '대기'
        ))}
        </div>
    </div>;
}