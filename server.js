'use strict';

const express = require('express');
require('dotenv').config();

const PORT = process.env.PORT || 3030;
const app = express();

app.get('/location', (request, response) => {
    const locationData = require('./data/location.json');
    let queryData = request.query.city;
    let currentLocation = new Location(queryData, locationData);
    response.send(currentLocation)
})

function Location(queryData, locationData) {
    this.search_query = queryData,
        this.formatted_query = locationData[0].display_name,
        this.latitude = locationData[0].lat,
        this.longitude = locationData[0].lon;
}
app.get('/weather', (request, response) => {
    let array = [];
    const geoData = require('./data/weather.json');
    geoData.data.forEach(element => {
        console.log(element.weather.description);
        console.log(element.valid_date);
        let weatherData = new Weather(element);
        array.push(weatherData);
    });
    response.send(array)
})

function Weather(geoData) {
    this.forecast = geoData.weather.description;
    this.time = geoData.valid_date;
}

app.use(express.static('.'))


app.get('/', (request, response) => {
    console.log('test');
    response.status(200).send('Working');
});

app.use('*', (req, res) => {
    res.status(404).send('NOT FOUND');
});

app.use((error, req, res) => {
    res.status(500).send(error);
});

app.listen(PORT, () => {
    console.log(`Listening on PORT ${PORT}`);
})
