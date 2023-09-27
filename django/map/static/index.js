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

    // Filter out the models that are defined as 'gpt-3.5-turbo'
    const filteredData = jsonData.filter(item => item.model !== 'gpt-3.5-turbo');
    return filteredData;
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
  const forecastLine = { color: 'red', opacity: 0.5 };

  // Group forecasts by model and then by storm ID
  forecasts.forEach(forecast => {
    if (!groupedForecasts[forecast.model]) {
      groupedForecasts[forecast.model] = {};
    }
    if (!groupedForecasts[forecast.model][forecast.id]) {
      groupedForecasts[forecast.model][forecast.id] = [];
    }
    groupedForecasts[forecast.model][forecast.id].push(forecast);
  });

  // Iterate through each model
  Object.keys(groupedForecasts).forEach(model => {
    // Iterate through each storm ID within the model
    Object.keys(groupedForecasts[model]).forEach(stormId => {
      const latlngs = [];

      groupedForecasts[model][stormId].forEach((forecast, index, self) => {
        let latLng = new L.LatLng(forecast.lat, forecast.lon);
        let prevForecast = self[index - 1];
        let marker = L.circleMarker(latLng, {
          radius: 5,
          fillColor: "#FFFFFF",
          color: "#FFFFFF",
          weight: 1,
          opacity: 1,
          fillOpacity: 1.0,
          zIndexOffset: 1000
        }).addTo(map);

        if (prevForecast) {
          if (Math.abs(prevForecast.lon - forecast.lon) > 180) {
            // This means we crossed the International Date Line
            // First, complete the existing polyline
            L.polyline(latlngs, forecastLine).addTo(map);
            latlngs = [];
          }
        }

        // Bind tooltip to the marker
        marker.bindTooltip(`
          <strong>Model:</strong>${forecast.model}<br>
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
      const polyline = L.polyline(latlngs, forecastLine).addTo(map);
    });
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
		// Convert wind speed from knots to mph and kmh
		const windSpeedMph = (storm.int * 1.15078).toFixed(2); // rounded to 2 decimal places for clarity
		const windSpeedKmh = (storm.int * 1.852).toFixed(2); 
		
		// Derive the storm category based on the Saffir-Simpson scale
		let stormCategory;
		if (storm.int < 34) {
		    stormCategory = "Tropical Depression";
		} else if (storm.int < 64) {
		    stormCategory = "Tropical Storm";
		} else if (storm.int < 83) {
		    stormCategory = "Category 1";
		} else if (storm.int < 96) {
		    stormCategory = "Category 2";
		} else if (storm.int < 113) {
		    stormCategory = "Category 3";
		} else if (storm.int < 137) {
		    stormCategory = "Category 4";
		} else {
		    stormCategory = "Category 5";
		}
		
		// Update the marker tooltip
		marker.bindTooltip(`
		    ID: ${storm.id}<br>
		    Time: ${new Date(storm.time).toLocaleString()}<br>
		    Latitude: ${storm.lat}<br>
		    Longitude: ${storm.lon}<br>
		    Wind Speed: ${storm.int} knots (${windSpeedMph} mph / ${windSpeedKmh} kmh)<br>
		    Category: ${stormCategory}
		`);
                marker.setOpacity(opacity);
            }

            // add the marker latlng to the polyline latlngs array
            polylineLatLngs.push([storm.lat, storm.lon]);

            let circleColor = getColorCode(parseFloat(storm.int));
            const circle = L.circle([storm.lat, storm.lon], {
                'opacity': opacity,
                'zIndexOffset': opacity * 100,
                'color': circleColor,
                'radius': 100000 * 2 // twice the avg radius 
            }).addTo(map);
        });

        // After iterating through all storms for a given id, add a polyline for any remaining points
        if (polylineLatLngs.length > 0) {
            L.polyline(polylineLatLngs, { color: 'red' }).addTo(map);
        }

        // reset the polyline latlngs array for the next storm id
        polylineLatLngs.length = 0;
    }
}

var map = L.map('map').setView([0, 0], 2);

var OpenStreetMap_Mapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    opacity: 0.7,  // Set OSM layer opacity to 0.7
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

OpenStreetMap_Mapnik.bringToFront();  // Ensure the OSM layer is always on top

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
