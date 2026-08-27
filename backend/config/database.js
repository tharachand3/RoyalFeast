const mongoose = require("mongoose");

const connectDatabase = () => {
  const mongoUri = process.env.DB_URI || process.env.DB_LOCAL_URI;

  if (!mongoUri) {
    console.error(
      "MongoDB URI is not defined. Set DB_URI or DB_LOCAL_URI in config/config.env"
    );
    process.exit(1);
  }

  mongoose
    .connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    })
    .then((con) => {
      console.log(
        `MongoDB Database connected with HOST:${con.connection.host}`
      );
    })
    .catch((err) => {
      console.error(`MongoDB connection failed: ${err.message}`);
      process.exit(1);
    });
};

module.exports = connectDatabase;
