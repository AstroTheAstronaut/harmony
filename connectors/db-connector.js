const mysql = require('mysql2');

// Create a connection pool to the MariaDB server
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root', // Change this to your MariaDB username
  password: 'matthy05', // Change this to your MariaDB password
  waitForConnections: true,
  connectionLimit: 10, // Adjust as needed
  queueLimit: 0
});

// Export the pool object for use in other modules
module.exports = pool.promise();
