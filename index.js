const express = require('express');
const app = express();
const oracledb = require('oracledb');
require('dotenv').config();
const path = require('path');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');
const { orderMonths } = require('./orderMonths')

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// SESSION
const sessionConfig = {
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        //httpOnly: true,
        //secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig));
app.use(flash());

app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.event = req.flash('event');
    next()
})

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

//change to main query page
app.get('/complexqueries', (req, res) => {
    res.render('complexQueries');
})

//delete but keep as sample for querying db
app.get('/search/:cityName', async (req, res) => {
    let { cityName } = req.params;

    const cityNameUppercase = cityName.split(" ");

    for (let i = 0; i < cityNameUppercase.length; i++) {
        cityNameUppercase[i] = cityNameUppercase[i][0].toUpperCase() + cityNameUppercase[i].substr(1);
    }

    cityName = cityNameUppercase.join(" ");

    let stmt = `SELECT * FROM akonate.city1 WHERE "City Name"='${cityName}'`;
    let cityInfo = await connection.execute(stmt);

    if (cityInfo.rows[0] === undefined) {
        let errorMsg = "City Not Found";
        res.render('citySearchError', { errorMsg });
    }

    else {

    /* display >1 result if have same city name! */

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

app.get('/query1', (req, res) => {
    res.render('query1');
})

app.post('/query1', (req, res) => {
    if (!req.body.city) {
        req.flash('error', 'Must enter a location');
        res.redirect('/query1');
        return;
    }

    if (req.body.startingYear > req.body.endingYear) {
        req.flash('error', 'Starting year must be before ending year');
        res.redirect('/query1');
        return;
    }

    res.redirect(`query1Graph/${req.body.startingYear}/${req.body.endingYear}/${req.body.city}`);
})

app.get('/query1Graph/:startingYear/:endingYear/:location', async (req, res) => {
    let { startingYear, endingYear, location } = req.params;

    const locationUppercase = location.split(" ");

    for (let i = 0; i < locationUppercase.length; i++) {
        locationUppercase[i] = locationUppercase[i][0].toUpperCase() + locationUppercase[i].substr(1);
    }

    location = locationUppercase.join(" ");

    let stmt = `SELECT AVG(r.price), r.year FROM akonate.rent r NATURAL JOIN akonate.city1 c WHERE c.city_name='${location}' AND r.year BETWEEN ${startingYear} AND ${endingYear} GROUP BY r.year ORDER BY r.year ASC`;

    let cityInfo = await connection.execute(stmt);
    
    if (cityInfo.rows[0] === undefined) {
        req.flash('error', 'City or Years Not Found');
        res.redirect('/query1');
        return;
    }

    else {

        /* display >1 result if have same city name! */

        const years = [];
        const avgRent = [];

        for (let i = 0; i < cityInfo.rows.length; i++) {
            years.push(cityInfo.rows[i][1]);
            avgRent.push(cityInfo.rows[i][0]);
        }

        console.log(years);
        console.log(avgRent);

        res.render('query1Graph', { location, years, avgRent });
    }
})

app.get('/query2', (req, res) => {
    res.render('query2');
})

app.post('/query2', (req, res) => {
    if (req.body.startingYear > req.body.endingYear) {
        req.flash('error', 'Starting year must be before ending year');
        res.redirect('/query2');
        return;
    }

    res.redirect(`query2Graph/${req.body.startingYear}/${req.body.endingYear}/${req.body.state}`);
})

app.get('/query2Graph/:startingYear/:endingYear/:location', async (req, res) => {
    let { startingYear, endingYear, location } = req.params;

    const locationUppercase = location.split(" ");

    for (let i = 0; i < locationUppercase.length; i++) {
        locationUppercase[i] = locationUppercase[i][0].toUpperCase() + locationUppercase[i].substr(1);
    }

    location = locationUppercase.join(" ");

    let stmt = `SELECT AVG(r.price), r.year FROM akonate.rent_per_sq_ft r NATURAL JOIN akonate.city1 c WHERE c."State"='${location}' AND r.year BETWEEN ${startingYear} AND ${endingYear} GROUP BY r.year ORDER BY r.year ASC`;

    let cityInfo = await connection.execute(stmt);
    
    if (cityInfo.rows[0] === undefined) {
        req.flash('error', 'Data for Years Not Found');
        res.redirect('/query2');
        return;
    }

    else {

        /* display >1 result if have same city name! */

        const years = [];
        const avgRent = [];

        for (let i = 0; i < cityInfo.rows.length; i++) {
            years.push(cityInfo.rows[i][1]);
            avgRent.push(cityInfo.rows[i][0]);
        }

        console.log(years);
        console.log(avgRent);

        res.render('query2Graph', { location, years, avgRent });
    }
})

app.get('/query3', (req, res) => {
    res.render('query3');
})

app.post('/query3', (req, res) => {
    if (!req.body.region) {
        req.flash('error', 'Must enter a location');
        res.redirect('/query3');
        return;
    }

    if (req.body.startingYear > req.body.endingYear) {
        req.flash('error', 'Starting year must be before ending year');
        res.redirect('/query3');
        return;
    }

    res.redirect(`query3Graph/${req.body.startingYear}/${req.body.endingYear}/${req.body.region}`);
})

app.get('/query3Graph/:startingYear/:endingYear/:location', (req, res) => {
    let { startingYear, endingYear, location } = req.params;

    const querySelections = {
        startingYear,
        endingYear,
        location
    }
    res.render('query3Graph', { querySelections });
})

app.get('/query4', (req, res) => {
    res.render('query4');
})

app.post('/query4', (req, res) => {
    if (!req.body.city) {
        req.flash('error', 'Must enter a location');
        res.redirect('/query4');
        return;
    }

    if (req.body.startingYear > req.body.endingYear) {
        req.flash('error', 'Starting year must be before ending year');
        res.redirect('/query4');
        return;
    }

    res.redirect(`query4Graph/${req.body.startingYear}/${req.body.endingYear}/${req.body.city}`);
})

app.get('/query4Graph/:startingYear/:endingYear/:location', async (req, res) => {
    let { startingYear, endingYear, location } = req.params;

    const locationUppercase = location.split(" ");

    for (let i = 0; i < locationUppercase.length; i++) {
        locationUppercase[i] = locationUppercase[i][0].toUpperCase() + locationUppercase[i].substr(1);
    }

    location = locationUppercase.join(" ");

    let stmt = `SELECT AVG(r.price), r.month FROM akonate.rent r NATURAL JOIN akonate.city1 c WHERE c.city_name='${location}' AND r.year BETWEEN ${startingYear} AND ${endingYear} GROUP BY r.month ORDER BY r.month ASC`;

    let cityInfo = await connection.execute(stmt);
    
    if (cityInfo.rows[0] === undefined) {
        req.flash('error', 'City or Years Not Found');
        res.redirect('/query4');
        return;
    }
    else {
        /* display >1 result if have same city name! */

        const months = [];
        const avgRent = [];

        for (let i = 0; i < cityInfo.rows.length; i++) {
            months.push(cityInfo.rows[i][1]);
            avgRent.push(cityInfo.rows[i][0]);
        }

        const monthsAndRent = [months, avgRent];
        const monthsAndRentInOrder = orderMonths(monthsAndRent);
        const monthsInOrder = monthsAndRentInOrder[0];
        const avgRentInOrder = monthsAndRentInOrder[1];

        res.render('query4Graph', { location, monthsInOrder, avgRentInOrder, startingYear, endingYear });
    }
})

app.get('/query5', (req, res) => {
    res.render('query5');
})

app.post('/query5', (req, res) => {
    if (!req.body.city) {
        req.flash('error', 'Must enter a location');
        res.redirect('/query5');
        return;
    }

    if (req.body.startingYear > req.body.endingYear) {
        req.flash('error', 'Starting year must be before ending year');
        res.redirect('/query5');
        return;
    }

    res.redirect(`query5Graph/${req.body.startingYear}/${req.body.endingYear}/${req.body.city}`);
})

app.get('/query5Graph/:startingYear/:endingYear/:location', async (req, res) => {
    let { startingYear, endingYear, location } = req.params;

    const locationUppercase = location.split(" ");

    for (let i = 0; i < locationUppercase.length; i++) {
        locationUppercase[i] = locationUppercase[i][0].toUpperCase() + locationUppercase[i].substr(1);
    }

    location = locationUppercase.join(" ");

    let stmt = `SELECT AVG(r.price / rpsf.price), r.year FROM akonate.rent_per_sq_ft rpsf, akonate.rent r, akonate.city1 c WHERE c.city_name='${location}' AND c.city_code = r.city_code AND r.city_code = rpsf.city_code AND r.month = rpsf.month AND r.year = rpsf.year AND r.year BETWEEN ${startingYear} AND ${endingYear} GROUP BY r.year ORDER BY r.year ASC`;

    let cityInfo = await connection.execute(stmt);
    
    if (cityInfo.rows[0] === undefined) {
        req.flash('error', 'City or Years Not Found');
        res.redirect('/query5');
        return;
    }

    else {

        /* display >1 result if have same city name! */

        const years = [];
        const avgSqFt = [];

        for (let i = 0; i < cityInfo.rows.length; i++) {
            years.push(cityInfo.rows[i][1]);
            avgSqFt.push(cityInfo.rows[i][0]);
        }

        console.log(years);
        console.log(avgSqFt);

        res.render('query5Graph', { location, years, avgSqFt });
    }
})

app.listen(3000, () => {
    console.log('serving on port 3000');
})