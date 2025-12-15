import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/auth';
import type { FormEvent } from 'react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await register({ email, password, nickname });
      setMessage('가입이 완료되었습니다. 로그인해주세요.');
      setTimeout(() => navigate('/login'), 400);
    } catch (err: any) {
      setMessage(err.response?.data?.message || '가입에 실패했습니다.');
    }
  };

  return (
    <div className="card form-card">
      <h2 className="page-title">회원가입</h2>
      <form className="stack" onSubmit={handleSubmit}>
        <div>
          <label>닉네임</label>
          <input className="input" value={nickname} onChange={(e) => setNickname(e.target.value)} />
        </div>
        <div>
          <label>이메일</label>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label>비밀번호</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="btn">
          가입하기
        </button>
        {message && <small className="subtle">{message}</small>}
        <small className="subtle">
          이미 계정이 있다면 <Link to="/login">로그인</Link>
        </small>
      </form>
    </div>
  );
}
