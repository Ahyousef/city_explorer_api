DROP TABLE IF EXISTS cities;

CREATE TABLE IF NOT EXISTS cities (
    search_query VARCHAR(225),
    formatted_query VARCHAR(225),
    latitude VARCHAR(225),
    longitude VARCHAR(225)
);

INSERT INTO cities VALUES ('lynnwood','Lynnwood, Snohomish County, Washington, USA',47.8278656,-122.3053932);