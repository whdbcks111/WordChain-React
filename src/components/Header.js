import { useState } from 'react';
import {Link, useNavigate} from 'react-router-dom';

export default function Header({ loginInfo, logout }) {

    const nav = useNavigate();

    return <div className='header'>
        <div className='header-left'>
            <Link to='/' className='header-front no-drag'>ㄲㅡㅌ : 말잇기</Link>
        </div>
        <div className='header-right'>
            {
                loginInfo.isLoggedIn ?
                <div className='header-button no-drag' onClick={() => {
                    logout();
                    nav('/login');
                }}>로그아웃 ({loginInfo.id})</div> :
                <Link to='/login' className='header-button'>로그인</Link>
            }
        </div>
    </div>;
}