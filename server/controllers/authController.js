const login = (req, res) => {
  const { username, password } = req.body;

  // For a temporary login, hardcode credentials
  if (username === 'testuser' && password === 'testpass') {
    return res.status(200).json({ message: 'Login successful', token: 'fake-jwt-token' });
  } else {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
};

module.exports = {
  login,
};