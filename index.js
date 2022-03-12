const express = require('express');
const app = express();
const oracledb = require('oracledb');
require('dotenv').config();
const path = require('path');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

let connection;

try {
    oracledb.initOracleClient({libDir: process.env.DB_FILEPATH});
  } 
  catch (err) {
    console.error(err);
    process.exit(1);
  }

  

async function run() {
    //let connection;

    try {
        connection = await oracledb.getConnection({user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, connectionString: "//oracle.cise.ufl.edu/orcl"});

        console.log("Successfully connected to Oracle Database");

        //await connection.execute("CREATE TABLE city2 (city_code NUMBER(6) PRIMARY KEY NOT NULL, city_name VARCHAR2(25) NOT NULL, metro VARCHAR2(25), county VARCHAR2(25) NOT NULL, state VARCHAR2(25) NOT NULL, region VARCHAR2(25) NOT NULL, population_rank NUMBER(6) NOT NULL)");
        
        // const stmts = [
        //     `INSERT INTO city2 VALUES (6181, 'New York', 'New York', 'Queens', 'NY', 'Northeast', 1)`,
        //     `INSERT INTO city2 VALUES (12447, 'Los Angeles', 'Los Angeles', 'Los Angeles', 'CA', 'West', 2)`
        // ]

        // for (const s of stmts) {
        //    await connection.execute(s);
        // }

         //await connection.commit();
    }

    catch (err) {
        console.log(err);
    }

    finally {
        if (connection) {
            try {
                //await connection.close();
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

app.get('/search', (req, res) => {
    res.render('search');
})

app.post('/search', (req, res) => {
    let cityName = req.body.city;

    res.redirect(`search/${cityName}`);
})

app.get('/search/:cityName', async (req, res) => {
    let { cityName } = req.params;

    const cityNameUppercase = cityName.split(" ");

    for (let i = 0; i < cityNameUppercase.length; i++) {
        cityNameUppercase[i] = cityNameUppercase[i][0].toUpperCase() + cityNameUppercase[i].substr(1);
    }

    cityName = cityNameUppercase.join(" ");

    let stmt = `SELECT * FROM city2 WHERE city_name='${cityName}'`;
    let cityInfo = await connection.execute(stmt);
    console.log(cityInfo)

    if (cityInfo.rows[0] === undefined) {
        res.render('error');
    }

    else {

    /* display >1 result if have same city name! */

    /* what if metro is blank? */

    let cityRow = {
        city_code: cityInfo.rows[0][0],
        city_name: cityInfo.rows[0][1],
        metro: cityInfo.rows[0][2],
        county: cityInfo.rows[0][3],
        state: cityInfo.rows[0][4],
        region: cityInfo.rows[0][5],
        population_rank: cityInfo.rows[0][6]
    };

    res.render('city', { cityRow });
}
})

app.listen(3000, () => {
    console.log('serving on port 3000');
})