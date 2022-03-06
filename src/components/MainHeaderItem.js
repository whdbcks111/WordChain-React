import { useContext } from 'react';
import btnSound from '../sounds/btn_sound.wav';
import { baseSettings } from '../App';

const sound = new Audio(btnSound);

export default function MainHeaderItem(props) {
    const settings = baseSettings;

    return <div className="main-header-item no-drag" 
        onClick={e => {
            if(props.onClick) props.onClick(e);
            sound.volume = settings.buttonSoundVolume;
            sound.play();
        }}
        style={{ backgroundColor: props.itemColor }}>
        {props.titleName}
    </div>
}