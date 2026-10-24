import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: api.cart,
    enabled: Boolean(user),
  });

  return (
    <header className="header" data-testid="app-header">
      <Link to="/" className="brand" data-testid="nav-home">
        Shop
      </Link>

      <nav className="nav">
        <Link to="/" data-testid="nav-catalog">
          Catalog
        </Link>

        {user && (
          <Link to="/orders" data-testid="nav-orders">
            Orders
          </Link>
        )}

        {user && (
          <Link to="/wishlist" data-testid="nav-wishlist">
            Saved
          </Link>
        )}

        {user && (
          <Link to="/addresses" data-testid="nav-addresses">
            Addresses
          </Link>
        )}

        {user?.role === 'ADMIN' && (
          <Link to="/admin" data-testid="nav-admin">
            Admin
          </Link>
        )}

        <Link to="/cart" className="cart-link" data-testid="nav-cart">
          Cart
          <span className="badge" data-testid="cart-badge">
            {cart?.totalQuantity ?? 0}
          </span>
        </Link>

        {user ? (
          <>
            <span data-testid="current-user">{user.email}</span>
            <button
              type="button"
              data-testid="logout-button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              Log out
            </button>
          </>
        ) : (
          <Link to="/login" data-testid="nav-login">
            Log in
          </Link>
        )}
      </nav>
    </header>
  );
}
