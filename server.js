import app from './app.js';
import databaseConnection from './config/dbConnection.js';

databaseConnection();
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`server is running ${PORT}`);
});
