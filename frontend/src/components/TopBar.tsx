import { Link, useNavigate } from 'react-router-dom';
import '../App.css';
import { useAuth } from '../hooks/useAuth';

export default function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  return (
    <div className="topbar">
      <Link to="/" className="brand">
        <span className="brand-dot" /> NearMe
      </Link>
      <div className="nav-actions">
        {user ? (
          <>
            <span className="subtle">{user.nickname}</span>
            <button className="btn ghost" onClick={handleLogout} type="button">
              로그아웃
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn ghost">
              로그인
            </Link>
            <Link to="/register" className="btn">
              회원가입
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
