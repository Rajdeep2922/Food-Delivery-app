import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          {/* Brand */}
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              <span>🍴</span>
              <span className="footer__logo-text">ForkLane</span>
            </Link>
            <p className="footer__tagline caption text-mute">
              Premium food delivery.<br />
              Good food. No wait.
            </p>
          </div>

          {/* Links */}
          <div className="footer__col">
            <h4 className="footer__heading">Explore</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/menu">Full Menu</Link></li>
              <li><Link to="/menu?category=Burgers">Burgers</Link></li>
              <li><Link to="/menu?category=Pizza">Pizza</Link></li>
              <li><Link to="/menu?category=Indian">Indian</Link></li>
            </ul>
          </div>

          <div className="footer__col">
            <h4 className="footer__heading">Account</h4>
            <ul>
              <li><Link to="/login">Sign In</Link></li>
              <li><Link to="/register">Create Account</Link></li>
              <li><Link to="/orders">Order History</Link></li>
              <li><Link to="/profile">My Profile</Link></li>
              <li><Link to="/cart">Cart</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
