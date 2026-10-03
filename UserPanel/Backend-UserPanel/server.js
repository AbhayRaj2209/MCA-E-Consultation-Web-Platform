// Entry point: env load karta hai aur HTTP server start karta hai
require('dotenv').config();

const app = require('./src/app');

const PORT = process.env.PORT || 5046;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
