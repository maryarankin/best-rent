const express = require('express');
const app = express();
const oracledb = require('oracledb');
require('dotenv').config();
const path = require('path');
const ejsMate = require('ejs-mate');

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));


try {
    oracledb.initOracleClient({libDir: process.env.DB_FILEPATH});
  } 
  catch (err) {
    console.error(err);
    process.exit(1);
  }

async function run() {
    let connection;

    try {
        connection = await oracledb.getConnection({user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, connectionString: "//oracle.cise.ufl.edu/orcl"});

        console.log("Successfully connected to Oracle Database");

        //await connection.execute("CREATE TABLE testtable (col1 VARCHAR(20), col2 VARCHAR(25))");
        
        const stmts = [
            `INSERT INTO testtable (col1, col2) VALUES ('test1', 'test2')`,
            `INSERT INTO testtable (col1, col2) VALUES ('test3', 'test4')`
        ]

        for (const s of stmts) {
        //    await connection.execute(s);
        }

        //await connection.commit();

        let result = await connection.execute("SELECT * FROM TESTTABLE");
        console.log(result);
    }

    catch (err) {
        console.log(err);
    }

    finally {
        if (connection) {
            try {
                await connection.close();
            }
            catch (err) {
                console.log(err);
            }
        }
    }
}

run();

app.get('/', (req, res) => {
    res.render('home');
})

app.listen(3000, () => {
    console.log('serving on port 3000');
})