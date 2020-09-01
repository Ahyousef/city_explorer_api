'use strict';
// Required Modules
const express = require('express');
require('dotenv').config();
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
const { json } = require('express');



// App setup
const PORT = process.env.PORT || 3030;
const locationKEY = process.env.GEOCODE_API_KEY
const weatherKEY = process.env.WEATHER_API_KEY
const trailKEY = process.env.TRAIL_API_KEY
const client = new pg.Client(process.env.DATABASE_URL)
const app = express();
app.use(cors());
app.use(express.static('.'))


// Constructors
function Location(queryData, locationData) {
    this.search_query = queryData;
    this.formatted_query = locationData[0].display_name;
    this.latitude = locationData[0].lat;
    this.longitude = locationData[0].lon;
}

function Weather(geoData) {
    this.forecast = geoData.weather.description;
    this.time = geoData.valid_date;
}

function Trail(td) { // td stands for trail data
    this.name = td.name;
    this.location = td.location;
    this.length = td.length;
    this.stars = td.stars;
    this.star_votes = td.starVotes;
    this.summary = td.summary;
    this.trail_url = td.url;
    this.conditions = td.conditionStatus + ': ' + td.conditionDetails;
    this.condition_date = td.conditionDate.slice(0, 10);
    this.condition_time = td.conditionDate.slice(11,)
}

// Functions 

function locationHandler(req, res) {
    let SQL = `SELECT * FROM cities WHERE search_query=$1;`;
    let cityName = req.query.city;
    let safeValue = [cityName]
    client.query(SQL, safeValue)
        .then(results => {
            if (results.rowCount !== 0) {
                console.log('Already exists, taking from database');
                res.status(200).json(results.rows[0])
            }
            else {
                console.log('Does not exist in database, getting from API');
                const locationURL = `https://eu1.locationiq.com/v1/search.php?key=${locationKEY}&q=${cityName}&format=json`;
                superagent.get(locationURL)
                    .then(
                        data => {
                            let currentLocation = new Location(cityName, data.body);
                            let saveValues = Object.values(currentLocation)
                            let SQL = `INSERT INTO cities VALUES ($1,$2,$3,$4)`
                            console.log('Saving into Database');
                            client.query(SQL, saveValues)
                                .catch(error => errorHandler(error, req, res))
                            res.send(currentLocation)
                        }
                    )
                    .catch(() => {
                        errorHandler('something went wrong in etting the data from locationiq web', req, res)
                    })
            }
        })
        .catch(error => errorHandler(error, req, res))



}



function weatherHandler(req, res) {
    let array = [];
    let longitude = req.query.longitude;
    let latitude = req.query.latitude;
    const weatherURL = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${latitude}&lon=${longitude}&key=${weatherKEY}`;
    superagent.get(weatherURL)
        .then(
            data => {
                data.body.data.map(element => {
                    let weatherData = new Weather(element);
                    array.push(weatherData);
                });

                res.send(array)
            }
        )
        .catch(() => {
            errorHandler('something went wrong in etting the data from locationiq web', req, res)
        })

}

function trailHandler(req, res) {
    let array = [];
    let longitude = req.query.longitude;
    let latitude = req.query.latitude;
    const trailURL = `https://www.hikingproject.com/data/get-trails?lat=${latitude}&lon=${longitude}&key=${trailKEY}`;
    superagent.get(trailURL)
        .then(
            data => {
                // data.body.data.map(element => {
                //     let weatherData = new Weather(element);
                //     array.push(weatherData);
                // });
                let parsedData = JSON.parse(data.text)
                parsedData.trails.map(element => {
                    let trailData = new Trail(element);
                    array.push(trailData)
                })
                res.send(array)

            }
        )

}


function status200(req, res) { res.status(200).send('Working'); }

function status404(req, res) { res.status(404).send('NOT FOUND Error 404'); }

function errorHandler(error, request, response) {
    response.status(500).send(error);
}


// Routes
app.get('/location', locationHandler)
app.get('/weather', weatherHandler)
app.get('/trails', trailHandler)

app.get('/', status200);
app.use('*', status404);
app.use(errorHandler)


client.connect()
    .then(() => {
        app.listen(PORT, () =>
            console.log(`listening on ${PORT}`)
        );
    })
