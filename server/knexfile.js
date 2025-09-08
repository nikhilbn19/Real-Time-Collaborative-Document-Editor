require("dotenv").config();

module.exports = {
  development: {
    client: "pg",
    connection: process.env.POSTGRES_URL,
    migrations: {
      directory: "./migrations",
    },
    seeds: {
      directory: "./seeds",
    },
  },
};
