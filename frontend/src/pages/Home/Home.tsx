import React from 'react'
import { useAuth } from '../../context/AuthContext';

const Home = () => {
  const { user, logout } = useAuth();
  return (
    <div style={{ maxWidth: 720, margin: '2rem auto' }}>
      <h2>Home Page</h2>
      {user ? (
        <div>
          <p>Signed in as: {user.name || user.email}</p>
          <button onClick={() => { logout(); window.location.replace('/login'); }}>Logout</button>
        </div>
      ) : (
        <div>You are not signed in.</div>
      )}
    </div>
  )
}

export default Home
