import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { hash, makeSalt } from '../modules/my-crypto';

export default function Register() {

    const navigate = useNavigate();

    function onRegister() {
        let id = idRef.current.value, pw = pwRef.current.value, 
        pwAgain = pwAgainRef.current.value, nickname = nickRef.current.value;

        if(pw !== pwAgain) {
            window.alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        fetch(`http://${window.location.hostname}:5000/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: id,
                pw: pw,
                nickname: nickname
            })
        }).then(res => {
            return res.json();
        }).then(json => {
            let status = json.status;
            switch(status) {
                case 'already-exist':
                    window.alert('이미 존재하는 아이디 또는 닉네임입니다.');
                    idRef.current.value = '';
                    break;
                case 'inapposite-id':
                    window.alert('부적절한 아이디입니다. 영문과 숫자를 포함한 4자 이상, 15자 이하의 아이디를 입력해주세요.');
                    idRef.current.value = '';
                    break;
                case 'inapposite-password':
                    window.alert('부적절한 비밀번호입니다. 영문과 숫자, 특수문자를 포함한 8자 이상, 20자 이하의 비밀번호를 입력해주세요.');
                    idRef.current.value = '';
                    break;
                case 'inapposite-nickname':
                    window.alert('부적절한 닉네임입니다. 15자 이하의 닉네임을 입력해주세요.');
                    nickRef.current.value = '';
                    break;
                case 'ok':
                    window.alert('회원가입이 완료되었습니다.');
                    window.localStorage.setItem('loggedIn', JSON.stringify({ id: id, token: json.token }));
                    navigate('/');
                    break;
            }
        });
    }

    let idRef = useRef(null), pwRef = useRef(null), pwAgainRef = useRef(null), nickRef = useRef(null);

    useEffect(() => {
        document.title = 'ㄲㅡㅌ : 말잇기 - 회원가입';
    }, []);

    return <div className="register-window">
        <div className="register-title">회원가입</div>
        <label>
            아이디 <br/>
            <input type="text" ref={idRef} placeholder="사용하실 아이디를 입력하세요"/>
        </label>  <br/>
        <label>
            비밀번호 <br/>
            <input type="password" ref={pwRef} placeholder="사용하실 비밀번호를 입력하세요"/>
        </label>  <br/>
        <label>
            비밀번호 확인 <br/>
            <input type="password" ref={pwAgainRef} placeholder="비밀번호를 다시 입력하세요"/>
        </label>  <br/>
        <label>
            닉네임 <br/>
            <input type="text" ref={nickRef} placeholder="사용하실 닉네임을 입력하세요"/>
        </label>  <br/>
        <button className="register-btn" onClick={onRegister}>회원가입</button>
        <Link to='/login' className='about-to-login'>로그인하기</Link>
    </div>
}