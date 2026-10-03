// Entry point: env load karta hai, DB schema ensure karta hai aur server start karta hai
require('dotenv').config();

const app = require('./src/app');
const { ensureSchema } = require('./src/db/schema');

const PORT = process.env.PORT || 5000;

ensureSchema()
  .catch((err) => console.error('Could not ensure admin_users table:', err.message))
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
