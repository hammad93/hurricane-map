$(document).ready(function () {

    $('#sidebarCollapse').on('click', function () {
        $('#sidebar').toggleClass('active');
    });
    addMarkersAndLines(groupData(live_storms));
    resizeMap();
    fetchForecasts().then(data => {
	  if (data) {
	    console.log('Forecasts data:', data);
	    createForecastMarkers(data);
	  } else {
	    console.log('Failed to fetch forecasts data.');
	  }
    });
});
let wmtsLayer = null;  // Global variable to hold the WMTS layer reference
let masks = {}; // Store each mask associated with a storm's id
function addImageryAroundStormCenter(groupedData) {
    for (const stormId in groupedData) {
        const storms = groupedData[stormId];
        const mostRecentTime = Math.max(...storms.map(storm => storm.time));
        const mostRecentStorm = storms.find(storm => storm.time === mostRecentTime);

        if (mostRecentStorm) {
            // Remove the old mask for this storm if it exists
            if (masks[stormId]) {
                map.removeLayer(masks[stormId]);
            }

            // Create a mask for the most recent time of the current storm
            const outerBounds = [
                [-90, -180],
                [-90, 180],
                [90, 180],
                [90, -180]
            ];

            const maskRadius = 0.5;  // Radius in degrees.
            const mask = [
                [mostRecentStorm.lat - maskRadius, mostRecentStorm.lon - maskRadius],
                [mostRecentStorm.lat - maskRadius, mostRecentStorm.lon + maskRadius],
                [mostRecentStorm.lat + maskRadius, mostRecentStorm.lon + maskRadius],
                [mostRecentStorm.lat + maskRadius, mostRecentStorm.lon - maskRadius]
            ];

            masks[stormId] = L.polygon([outerBounds, mask], {
                color: 'black',
                fillColor: 'black',
                fillOpacity: 0.7
            }).addTo(map);

            // Update the WMS imagery
            const currentDate = new Date();
            currentDate.setDate(currentDate.getDate() - 1);
            const prevDateISO = currentDate.toISOString();

            const wmsUrlTemplate = `https://gitc-a.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi?TIME=${prevDateISO}&layer=VIIRS_NOAA20_CorrectedReflectance_TrueColor&style=default&tilematrixset=250m&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/jpeg&TileMatrix={z}&TileCol={x}&TileRow={y}`;

            // If the WMTS layer already exists, remove it from the map
            if (wmtsLayer) {
                map.removeLayer(wmtsLayer);
            }

            // Create a new WMTS layer and add it to the map
            wmtsLayer = L.tileLayer(wmsUrlTemplate, {
                attribution: "NASA"
            }).addTo(map);
        }
    }
}
function groupData(data) {
  const result = {};
  data.forEach(item => {
    const id = item.id;
    const time = new Date(item.time);
    const timestamp = time.getTime();
    if (result[id]) {
      result[id].push({ ...item, time: timestamp });
    } else {
      result[id] = [{ ...item, time: timestamp }];
    }
    result[id].sort((a, b) => b.time - a.time); // sort the storm data by timestamp in descending order
  });
  return result;
}
async function fetchForecasts() {
  try {
    const response = await fetch('http://fluids.ai:1337/forecasts');

    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    // Parse the response as JSON
    const jsonData = await response.json();
    return jsonData;
  } catch (error) {
    console.error('Error fetching forecasts:', error);
    return null;
  }
}
function getColorCode(knots) {
    if (knots < 34) {
        return "#008000"; // Tropical Depression - Green
    } else if (knots >= 34 && knots <= 63) {
        return "#FFFF00"; // Tropical Storm - Yellow
    } else if (knots >= 64 && knots <= 82) {
        return "#FFC0C0"; // Category 1 - Light Red
    } else if (knots >= 83 && knots <= 95) {
        return "#FF8080"; // Category 2 - Medium Light Red
    } else if (knots >= 96 && knots <= 112) {
        return "#FF4040"; // Category 3 - Medium Red
    } else if (knots >= 113 && knots <= 135) {
        return "#FF0000"; // Category 4 - Dark Red
    } else {
        return "#8B0000"; // Category 5 - Very Dark Red
    }
}
function createForecastMarkers(forecasts) {
  const markers = [];
  const groupedForecasts = {};

  // Group forecasts by storm ID
  forecasts.forEach(forecast => {
    if (!groupedForecasts[forecast.id]) {
      groupedForecasts[forecast.id] = [];
    }
    groupedForecasts[forecast.id].push(forecast);
  });

  // Iterate through each storm ID group
  Object.keys(groupedForecasts).forEach(stormId => {
    const latlngs = [];

    groupedForecasts[stormId].forEach(forecast => {
      const latLng = new L.LatLng(forecast.lat, forecast.lon);
      const marker = L.circleMarker(latLng, {
	    radius: 5, // Adjust this to your desired size
	    fillColor: "#FFFFFF",
	    color: "#FFFFFF", // The color of the circle outline
	    weight: 1, // The width of the circle outline
	    opacity: 1,
	    fillOpacity: 1.0, // Fill opacity
	    zIndexOffset: 1000
      }).addTo(map);

      // Bind tooltip to the marker
      marker.bindTooltip(`
        <strong>Model:</strong> ChatGPT 3.5<br>
        <strong>ID:</strong> ${forecast.id}<br>
        <strong>Time:</strong> ${forecast.time}<br>
        <strong>Latitude:</strong> ${forecast.lat}<br>
        <strong>Longitude:</strong> ${forecast.lon}<br>
        <strong>Wind Speed:</strong> ${forecast.wind_speed} knots
      `);

      markers.push(marker);
      latlngs.push(latLng);
    });

    // Create and add the polyline to the map for the current storm ID group
    const polyline = L.polyline(latlngs, { color: 'red', opacity: 0.5 }).addTo(map);
  });
}

function hurricaneCategory(knots) {
    // Calculate the category based on knots
    if(knots < 64) {
        return 'storm';
    } else if(knots <= 82) {
        return 'cat1';
    } else if(knots <= 95) {
        return 'cat2';
    } else if(knots <= 113) {
        return 'cat3';
    } else if(knots <= 136) {
        return 'cat4';
    } else {
        return 'cat5';
    }
}

function addMarkersAndLines(groupedData) {
    // create an empty array to hold the polyline latlngs
    const polylineLatLngs = [];
    // loop through each storm id in the grouped data
    for (const id in groupedData) {
        // get the array of storm objects for this id
        const storms = groupedData[id];

        // determine the most recent time for this group
        const mostRecentTime = Math.max(...storms.map(storm => storm.time));

        // Initialize lastLongitude with the first storm's longitude for checking International Date Line crossings
        let lastLongitude = storms[0].lon;

        // loop through each storm object in the array
        storms.forEach((storm, index) => {
            // calculate the opacity based on the time difference from the most recent time
            const timeDiff = mostRecentTime - storm.time;
            var opacity = Math.max(0, 1 - (timeDiff / (6 * 24 * 60 * 60 * 1000))); // 6 days
            if (index > 0) {
                opacity = Math.max(0, opacity - 0.25);
            }

            // Check if we have crossed the International Date Line
            if (Math.abs(storm.lon - lastLongitude) > 180) {
                // If a crossing is detected, draw the accumulated polylineLatLngs up to that point
                L.polyline(polylineLatLngs, { color: 'red' }).addTo(map);

                // Clear the accumulated points to start a new segment of the storm's path
                polylineLatLngs.length = 0;
            }

            // Update the lastLongitude for the next iteration
            lastLongitude = storm.lon;

            if (timeDiff <= 5 * 24 * 60 * 60 * 1000) {
                let category = hurricaneCategory(parseFloat(storm.int));

                const marker = L.marker([storm.lat, storm.lon], {
                    'zIndexOffset': opacity * 1000,
                    'icon': L.icon({
                        'iconUrl': `static/${category}.png`,
                        'iconSize': [33, 33],
                        'iconAnchor': [22, 33],
                        'popupAnchor': [-3, -76]
                    })
                }).addTo(map);

                marker.setOpacity(opacity);
                marker.bindTooltip(`ID: ${id}<br>Time: ${new Date(storm.time)}`);
            }

            // add the marker latlng to the polyline latlngs array
            polylineLatLngs.push([storm.lat, storm.lon]);

            let circleColor = getColorCode(parseFloat(storm.int));
            const circle = L.circle([storm.lat, storm.lon], {
                'opacity': opacity,
                'zIndexOffset': opacity * 100,
                'color': circleColor,
                'radius': 100000
            }).addTo(map);
        });

        // After iterating through all storms for a given id, add a polyline for any remaining points
        if (polylineLatLngs.length > 0) {
            L.polyline(polylineLatLngs, { color: 'red' }).addTo(map);
        }

        // reset the polyline latlngs array for the next storm id
        polylineLatLngs.length = 0;
    }
    // Call the imagery function for the entire groupedData
    addImageryAroundStormCenter(groupedData);
}

var map = L.map('map').setView([0, 0], 2);
var OpenStreetMap_Mapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent('You clicked the map at ' + e.latlng.toString())
        .openOn(map);
}
function getVisibleMarkers() {
    const bounds = new L.LatLngBounds();
    map.eachLayer(function(layer) {
        if ((layer instanceof L.Marker) && (map.getBounds().contains(layer.getLatLng()))){
            bounds.extend(layer.getLatLng());
        }
    });
    return bounds;
}
function resizeMap() {
    document.getElementById('map').style.width = window.screen.width.toString() + "px";
    document.getElementById('map').style.height = window.screen.height.toString() + "px";
    map.invalidateSize();
    map.fitBounds(getVisibleMarkers().pad(0.5));
}
map.on('click', onMapClick);


var plot;
document.getElementById('plot_button').onclick = function() {
    var sid = document.getElementById("inputGroupSelect04").value;
    plot = $.get('/?type=plot&SID=' + sid, (data, status) => {
        console.log('test ' + sid + data);
        return data;
    });
    plot.then(function(e){
        plot.data = JSON.parse(plot.responseText);
        console.log(plot.data);
        var i;
        var path = []
        for (i = 0; i < plot.data["lat"].length; i++) {
            path.push(new google.maps.LatLng(plot.data["lat"][i], plot.data["lon"][i]))
        }
        var polyline = new google.maps.Polyline({path:path, strokeColor: "#FF0000", strokeOpacity: 1.0, strokeWeight: 2});
        polyline.setMap(map);
        map.setCenter(new google.maps.LatLng(plot.data["lat"][0], plot.data["lon"][0]), 6);
    });

}
