import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { hash, makeSalt } from '../modules/my-crypto';

export default function Login() {

    const navigate = useNavigate();

    function onLogin() {
        let id = idRef.current.value, pw = pwRef.current.value;

        fetch(`http://${window.location.hostname}:5000/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: id,
                pw: pw
            })
        }).then(res => {
            return res.json();
        }).then(json => {
            let status = json.status;
            switch(status) {
                case 'non-exist':
                    window.alert('존재하지 않는 아이디입니다.');
                    idRef.current.value = '';
                    pwRef.current.value = '';
                    break;
                case 'inapposite-id':
                    window.alert('부적절한 아이디입니다. 영문과 숫자를 포함한 5자 이상, 15자 이하의 아이디를 입력해주세요.');
                    idRef.current.value = '';
                    break;
                case 'ok':
                    window.alert('로그인이 완료되었습니다.');
                    window.localStorage.setItem('loggedIn', JSON.stringify({ id: id, token: json.token }));
                    navigate('/');
                    break;
            }
        });

    }

    let idRef = useRef(null), pwRef = useRef(null);

    useEffect(() => {
        document.title = 'ㄲㅡㅌ : 말잇기 - 로그인';
    }, []);

    return <div className="login-window">
        <div className="login-title">로그인</div>
        <label>
            아이디 <br/>
            <input type="text" ref={idRef} placeholder="아이디를 입력하세요"/>
        </label>  <br/>
        <label>
            비밀번호 <br/>
            <input type="password" ref={pwRef} placeholder="비밀번호를 입력하세요"/>
        </label>  <br/>
        <button className="login-btn" onClick={onLogin}>로그인</button>
        <Link to='/register' className='about-to-register'>회원가입하기</Link>
    </div>
}