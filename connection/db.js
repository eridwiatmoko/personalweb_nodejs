const { Pool } = require("pg");

const dbPool = new Pool({
  // database: "personal_web",
  // port: 5432,
  // user: "postgres",
  // password: "root",
  connectionString: 'postgres://xivedbsdffncty:15eea47fe2e86d1c3196c2234eb7f9fc4c5cd82a3e0e7e806c094283720b85f9@ec2-52-70-205-234.compute-1.amazonaws.com:5432/d11sol76p89qfa',
  ssl: {
     rejectUnauthorized: false,
  },
});

});

module.exports = dbPool;
