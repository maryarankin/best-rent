const express = require('express');
const app = express();
const oracledb = require('oracledb');
require('dotenv').config();
const path = require('path');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');

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
    try {
        connection = await oracledb.getConnection({user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, connectionString: "//oracle.cise.ufl.edu/orcl"});

        console.log("Successfully connected to Oracle Database");
    }

    catch (err) {
        console.log(err);
    }
}

run();

const changeCapitalization = (cityName) => {
    const cityUppercase = cityName.split(" ");

    for (let i = 0; i < cityUppercase.length; i++) {
        cityUppercase[i] = cityUppercase[i][0].toUpperCase() + cityUppercase[i].substr(1).toLowerCase();
    }

    return cityUppercase.join(" ");
}

app.get('/', (req, res) => {
    res.render('home');
})

app.get('/complexqueries', (req, res) => {
    res.render('complexQueries');
})

app.get('/numtuples', async (req, res) => {
    let stmt = `SELECT c_count + r_count + rpsf_count 
    FROM 
        (SELECT COUNT(*) AS c_count 
        FROM maryrankin.city), 
        (SELECT COUNT(*) AS r_count 
        FROM maryrankin.rent), 
        (SELECT COUNT(*) AS rpsf_count 
        FROM maryrankin.rent_per_sq_ft)`;

    let numTuplesInfo = await connection.execute(stmt);
    let numTuples = numTuplesInfo.rows[0][0];

    req.flash('success', `Total tuples in database: ${numTuples}`);
    res.redirect('/complexqueries');
    return;
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

    if (req.body.startingYear >= req.body.endingYear) {
        req.flash('error', 'Starting year must be before ending year');
        res.redirect('/query1');
        return;
    }

    res.redirect(`query1Graph/${req.body.startingYear}/${req.body.endingYear}/${req.body.city}/${req.body.state}`);
})

app.get('/query1Graph/:startingYear/:endingYear/:city/:state', async (req, res) => {
    let { startingYear, endingYear, city, state } = req.params;

    city = changeCapitalization(city);

    let stmt = `SELECT AVG(r.price), r.year 
    FROM maryrankin.rent r NATURAL JOIN maryrankin.city c 
    WHERE c.city_name='${city}' AND c.cstate='${state}' AND r.year BETWEEN ${startingYear} AND ${endingYear} 
    GROUP BY r.year 
    ORDER BY r.year ASC`;

    let cityInfo = await connection.execute(stmt);
    
    if (cityInfo.rows[0] === undefined) {
        req.flash('error', 'City or Years Not Found');
        res.redirect('/query1');
        return;
    }

    else {
        const years = [];
        const avgRent = [];

        for (let i = 0; i < cityInfo.rows.length; i++) {
            years.push(cityInfo.rows[i][1]);
            avgRent.push(cityInfo.rows[i][0]);
        }

        res.render('query1Graph', { city, state, years, avgRent });
    }
})

app.get('/query2', (req, res) => {
    res.render('query2');
})

app.post('/query2', (req, res) => {
    if (req.body.startingYear >= req.body.endingYear) {
        req.flash('error', 'Starting year must be before ending year');
        res.redirect('/query2');
        return;
    }

    res.redirect(`query2Graph/${req.body.startingYear}/${req.body.endingYear}/${req.body.state}`);
})

app.get('/query2Graph/:startingYear/:endingYear/:state', async (req, res) => {
    let { startingYear, endingYear, state } = req.params;

    let stmt = `SELECT AVG(r.price), r.year 
    FROM maryrankin.rent_per_sq_ft r NATURAL JOIN maryrankin.city c 
    WHERE c.cstate='${state}' AND r.year BETWEEN ${startingYear} AND ${endingYear} 
    GROUP BY r.year 
    ORDER BY r.year ASC`;

    let stateInfo = await connection.execute(stmt);
    
    if (stateInfo.rows[0] === undefined) {
        req.flash('error', 'Data for These Years Not Found');
        res.redirect('/query2');
        return;
    }

    else {
        const years = [];
        const avgRent = [];

        for (let i = 0; i < stateInfo.rows.length; i++) {
            years.push(stateInfo.rows[i][1]);
            avgRent.push(stateInfo.rows[i][0]);
        }

        res.render('query2Graph', { state, years, avgRent });
    }
})

app.get('/query3', (req, res) => {
    res.render('query3');
})

app.post('/query3', (req, res) => {
    if (req.body.startingYear >= req.body.endingYear) {
        req.flash('error', 'Starting year must be before ending year');
        res.redirect('/query3');
        return;
    }

    res.redirect(`query3Graph/${req.body.startingYear}/${req.body.endingYear}/${req.body.region}`);
})

app.get('/query3Graph/:startingYear/:endingYear/:region', async (req, res) => {
    let { startingYear, endingYear, region } = req.params;

    let stmt = `SELECT dp - jp, j.year 
    FROM 
        (SELECT AVG(r.price) AS jp, r.year 
        FROM maryrankin.rent r NATURAL JOIN maryrankin.city c 
        WHERE c.region='${region}' AND r.month='Jan' 
        GROUP BY r.year) j, 
        (SELECT AVG(r.price) AS dp, r.year 
        FROM maryrankin.rent r NATURAL JOIN maryrankin.city c 
        WHERE c.region='${region}' AND r.month='Dec' 
        GROUP BY r.year) d 
    WHERE j.year = d.year AND j.year BETWEEN ${startingYear} AND ${endingYear} 
    ORDER BY j.year`;

    let regionInfo = await connection.execute(stmt);
    
    if (regionInfo.rows[0] === undefined) {
        req.flash('error', 'Data for These Years Not Found');
        res.redirect('/query3');
        return;
    }
    else {
        const years = [];
        const change = [];

        for (let i = 0; i < regionInfo.rows.length; i++) {
            years.push(regionInfo.rows[i][1]);
            change.push(regionInfo.rows[i][0]);
        }

        res.render('query3Graph', { region, years, change });
    }
})

app.get('/query4', (req, res) => {
    res.render('query4');
})

app.post('/query4', (req, res) => {
    if (req.body.startingYear >= req.body.endingYear) {
        req.flash('error', 'Starting year must be before ending year');
        res.redirect('/query4');
        return;
    }

    res.redirect(`query4Graph/${req.body.startingYear}/${req.body.endingYear}/${req.body.state}`);
})

app.get('/query4Graph/:startingYear/:endingYear/:state', async (req, res) => {
    let { startingYear, endingYear, state } = req.params;

    let stmt = `SELECT avg_price2 - avg_price1, city1, city2, yr1 
    FROM
        (SELECT AVG(r1.price) AS avg_price1, r1.year AS yr1, c1.city_name AS city1 
        FROM maryrankin.city c1 NATURAL JOIN maryrankin.rent r1 
        WHERE city_code =
            (SELECT cheapest
            FROM
                (SELECT AVG(price) AS avg, city_code AS cheapest 
                FROM maryrankin.rent NATURAL JOIN maryrankin.city
                WHERE year BETWEEN ${startingYear} AND ${endingYear} AND cstate='${state}'
                GROUP BY city_code
                ORDER BY avg ASC
                FETCH FIRST 1 ROWS ONLY)
            )
        GROUP BY r1.year, c1.city_name
        ORDER BY r1.year ASC),
        (SELECT AVG(r2.price) AS avg_price2, r2.year yr2, c2.city_name city2 
        FROM maryrankin.city c2 NATURAL JOIN maryrankin.rent r2 
        WHERE city_code =
            (SELECT most_expensive
            FROM
                (SELECT AVG(price) AS avg, city_code AS most_expensive 
                FROM maryrankin.rent NATURAL JOIN maryrankin.city
                WHERE year BETWEEN ${startingYear} AND ${endingYear} AND cstate='${state}'
                GROUP BY city_code
                ORDER BY avg DESC
                FETCH FIRST 1 ROWS ONLY)
            )
        GROUP BY r2.year, c2.city_name
        ORDER BY r2.year ASC)
    WHERE yr1 = yr2 AND yr1 BETWEEN ${startingYear} AND ${endingYear}`;

    let stateInfo = await connection.execute(stmt);
    
    if (stateInfo.rows[0] === undefined) {
        req.flash('error', 'Data for These Years Not Found');
        res.redirect('/query4');
        return;
    }
    else {
        const years = [];
        const rentDiff = [];
        let cheapestCity = stateInfo.rows[0][1];
        cheapestCity = cheapestCity.replace('\'', '');
        let mostExpensiveCity = stateInfo.rows[0][2];

        for (let i = 0; i < stateInfo.rows.length; i++) {
            years.push(stateInfo.rows[i][3]);
            rentDiff.push(stateInfo.rows[i][0]);
        }

        res.render('query4Graph', { state, cheapestCity, mostExpensiveCity, years, rentDiff, startingYear, endingYear });
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

    if (req.body.startingYear >= req.body.endingYear) {
        req.flash('error', 'Starting year must be before ending year');
        res.redirect('/query5');
        return;
    }

    res.redirect(`query5Graph/${req.body.startingYear}/${req.body.endingYear}/${req.body.city}/${req.body.state}`);
})

app.get('/query5Graph/:startingYear/:endingYear/:city/:state', async (req, res) => {
    let { startingYear, endingYear, city, state } = req.params;

    city = changeCapitalization(city);

    let stmt = `SELECT AVG(r.price / rpsf.price), r.year 
    FROM maryrankin.rent_per_sq_ft rpsf, maryrankin.rent r, maryrankin.city c 
    WHERE c.city_name='${city}' AND c.cstate='${state}' AND c.city_code = r.city_code AND r.city_code = rpsf.city_code AND r.month = rpsf.month AND r.year = rpsf.year AND r.year BETWEEN ${startingYear} AND ${endingYear} 
    GROUP BY r.year 
    ORDER BY r.year ASC`;

    let cityInfo = await connection.execute(stmt);
    
    if (cityInfo.rows[0] === undefined) {
        req.flash('error', 'City or Years Not Found');
        res.redirect('/query5');
        return;
    }

    else {
        const years = [];
        const avgSqFt = [];

        for (let i = 0; i < cityInfo.rows.length; i++) {
            years.push(cityInfo.rows[i][1]);
            avgSqFt.push(cityInfo.rows[i][0]);
        }

        res.render('query5Graph', { city, state, years, avgSqFt });
    }
})

app.get('/query6', (req, res) => {
    res.render('query6');
})

app.post('/query6', (req, res) => {
    if (!req.body.city) {
        req.flash('error', 'Must enter a location');
        res.redirect('/query6');
        return;
    }

    if (req.body.startingYear >= req.body.endingYear) {
        req.flash('error', 'Starting year must be before ending year');
        res.redirect('/query6');
        return;
    }

    res.redirect(`query6Graph/${req.body.startingYear}/${req.body.endingYear}/${req.body.city}/${req.body.state}`);
})

app.get('/query6Graph/:startingYear/:endingYear/:city/:state', async (req, res) => {
    let { startingYear, endingYear, city, state } = req.params;

    city = changeCapitalization(city);

    let stmt = `SELECT AVG(r.price), r.year, c.city_name, c.county
    FROM maryrankin.rent r NATURAL JOIN maryrankin.city c
    WHERE city_code =
        (SELECT cheapest_city
        FROM 
            (SELECT AVG(r1.price) AS avg_price1, city_code AS cheapest_city, c1.county AS c1_county
            FROM maryrankin.rent r1 NATURAL JOIN maryrankin.city c1
            WHERE r1.year BETWEEN ${startingYear} AND ${endingYear} AND c1.cstate='${state}'
            GROUP BY city_code, c1.county),
            (SELECT AVG(r2.price) AS avg_price2, c2.county AS c2_county
            FROM maryrankin.rent r2 NATURAL JOIN maryrankin.city c2 
            WHERE c2.city_name='${city}' AND c2.cstate='${state}' AND r2.year BETWEEN ${startingYear} AND ${endingYear}
            GROUP BY c2.county)
        WHERE avg_price1 <= avg_price2 AND c1_county = c2_county
        ORDER BY avg_price1 ASC
        FETCH FIRST 1 ROWS ONLY)
    AND r.year BETWEEN 2010 and 2017
    GROUP BY r.year, c.city_name, c.county
    ORDER BY r.year ASC`;

    let cityInfo = await connection.execute(stmt);
    
    if (cityInfo.rows[0] === undefined) {
        req.flash('error', 'City or Years Not Found');
        res.redirect('/query6');
        return;
    }

    else {
        const years = [];
        const avgRent = [];
        let cheapestCity = cityInfo.rows[0][2];
        cheapestCity = cheapestCity.replace('\'', '');
        let county = cityInfo.rows[0][3];

        for (let i = 0; i < cityInfo.rows.length; i++) {
            years.push(cityInfo.rows[i][1]);
            avgRent.push(cityInfo.rows[i][0]);
        }

        res.render('query6Graph', { city, state, county, cheapestCity, years, avgRent });
    }
})

app.listen(3000, () => {
    console.log('serving on port 3000');
})
