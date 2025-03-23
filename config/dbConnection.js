import mongoose from 'mongoose';

const databaseConnection = async () => {
  mongoose
    .connect(process.env.DB_URI)
    .then(conn => {
      console.log(`Database connected : ${conn.connection.host}`);
    })
    .catch(error => {
      console.error(`Database error : ${error}`);
    });
};

export default databaseConnection;
