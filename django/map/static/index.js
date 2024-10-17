/*
               ,,ggddY"""Ybbgg,,
          ,agd888b,_ "Y8, ___`""Ybga,
       ,gdP""88888888baa,.""8b    "888g,
     ,dP"     ]888888888P'  "Y     `888Yb,
   ,dP"      ,88888888P"  db,       "8P""Yb,
  ,8"       ,888888888b, d8888a           "8,
 ,8'        d88888888888,88P"' a,          `8,
,8'         88888888888888PP"  ""           `8,
d'          I88888888888P"                   `b
8           `8"88P""Y8P'                      8
8            Y 8[  _ "                        8
8              "Y8d8b  "Y a                   8
8                 `""8d,   __                 8
Y,                    `"8bd888b,             ,P
`8,                     ,d8888888baaa       ,8'
 `8,                    888888888888'      ,8'
  `8a                   "8888888888I      a8'
   `Yba                  `Y8888888P'    adP'
     "Yba                 `888888P'   adY"
       `"Yba,             d8888P" ,adP"'     https://ascii.co.uk
          `"Y8baa,      ,d888P,ad8P"'
               ``""YYba8888P""''

      ┬ ┬┬ ┬┬─┐┬─┐┬┌─┐┌─┐┌┐┌┌─┐  ┌┬┐┌─┐┌─┐
      ├─┤│ │├┬┘├┬┘││  ├─┤│││├┤───│││├─┤├─┘
      ┴ ┴└─┘┴└─┴└─┴└─┘┴ ┴┘└┘└─┘  ┴ ┴┴ ┴┴  
*/

window.startup = async function (Cesium) {
  'use strict';
  const viewer = new Cesium.Viewer("cesiumContainer", {
    homeButton: false,
    navigationHelpButton: false,
    sceneModePicker: false,
    timeline: false,
    imageryProvider: false,
    baseLayerPicker: false,
    geocoder: false
  });
  const scene = viewer.scene;
  const globe = scene.globe;
  
  // https://nasa-gibs.github.io/gibs-api-docs/access-advanced-topics/
  // https://nasa-gibs.github.io/gibs-api-docs/available-visualizations/
  var base = new Cesium.UrlTemplateImageryProvider({
    url : 'https://gitc-{s}.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi?layer=BlueMarble_ShadedRelief&style=default&tilematrixset=GoogleMapsCompatible_Level8&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpeg&TileMatrix={z}&TileCol={x}&TileRow={y}'
  });
  var borders = new Cesium.UrlTemplateImageryProvider({
    url : 'https://gitc-{s}.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi?layer=Reference_Features_15m&style=default&tilematrixset=GoogleMapsCompatible_Level13&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix={z}&TileCol={x}&TileRow={y}'
  });
  var map_labels = new Cesium.UrlTemplateImageryProvider({
    url : 'https://gitc-{s}.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi?layer=Reference_Labels_15m&style=default&tilematrixset=GoogleMapsCompatible_Level13&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix={z}&TileCol={x}&TileRow={y}'
  });

  viewer.imageryLayers.addImageryProvider(base);
  viewer.imageryLayers.addImageryProvider(borders);
  viewer.imageryLayers.addImageryProvider(map_labels);

  scene.highDynamicRange = true;
  globe.enableLighting = true;
  globe.atmosphereLightIntensity = 20.0;
  
  fetchLiveStorms().then(data => {
    if (data) {
      console.log('Forecasts data:', data);
      const groupedStorms = groupData(data);
      plotStorms(groupedStorms, viewer);
      const strongestStorm = findHighestWindSpeedEntry(groupedStorms);
      centerCameraOnLocation(viewer, strongestStorm.lat, strongestStorm.lon);
      createForecastMarkers(viewer, groupedStorms);
      createStormButtons(viewer, groupedStorms);
    } else {
      console.log('Failed to fetch forecasts data.');
    }
  });
  let mins = [
    Cesium.Math.toRadians(0.05),
    Cesium.Math.toRadians(0.1),
    Cesium.Math.toRadians(0.2),
    Cesium.Math.toRadians(0.5),
    Cesium.Math.toRadians(1.0),
    Cesium.Math.toRadians(2.0),
    Cesium.Math.toRadians(5.0),
    Cesium.Math.toRadians(10.0)
    ];
    let lastRefresh = 0;
    let camera = viewer.camera;
    let labels = new Cesium.LabelCollection();
    scene.primitives.add(labels);
    let polylines = new Cesium.PolylineCollection();
    scene.primitives.add(polylines);
    let ellipsoid = scene.globe.ellipsoid;
    let currentExtent = getExtentView();

    function updateLabelPositions() {
        let center = screenCenterPosition();
        center = new Cesium.Cartographic.fromCartesian(center);
        var len = labels.length;
        for (var i = 0; i < len; ++i) {
            var b = labels.get(i);
            let carto = new Cesium.Cartographic.fromCartesian(b.position);
            if (b.isLat) carto.longitude = center.longitude;
            else carto.latitude = center.latitude;
            b.position = ellipsoid.cartographicToCartesian(carto);
        }
    }

    function refresh() {
        let lr = lastRefresh;
        let now = new Date().getTime();
        if (now - lr < 500) return;
        updateLabelPositions();
        let extent = getExtentView();
        let shouldRefresh = true;
        if (currentExtent) {
            let w = Math.abs(extent.west - currentExtent.west),
                s = Math.abs(extent.south - currentExtent.south),
                e = Math.abs(extent.east - currentExtent.east),
                n = Math.abs(extent.north - currentExtent.north);
            let m = 0.001;
            if (w < m && s < m && e < m && n < m) shouldRefresh = false;
        }
        if (!shouldRefresh && labels.length) return;
        currentExtent = extent;
        lr = now;
        off();
        on(extent);
    }

    function on(extent) {
        drawGrid(extent);
    }

    function off() {
        polylines.removeAll();
        labels.removeAll();
    }

    function drawGrid(extent) {
        if (!extent) extent = getExtentView();
        polylines.removeAll();
        labels.removeAll();

        // var minPixel = 0;
        // var maxPixel = this._canvasSize;

        var dLat = 0,
            dLng = 0,
            index;
        // get the nearest to the calculated value
        for (
            index = 0;
            index < mins.length && dLat < (extent.north - extent.south) / 10;
            index++
        ) {
            dLat = mins[index];
        }
        for (
            index = 0;
            index < mins.length && dLng < (extent.east - extent.west) / 10;
            index++
        ) {
            dLng = mins[index];
        }

        // round iteration limits to the computed grid interval
        var minLng =
            (extent.west < 0
                ? Math.ceil(extent.west / dLng)
                : Math.floor(extent.west / dLng)) * dLng;
        var minLat =
            (extent.south < 0
                ? Math.ceil(extent.south / dLat)
                : Math.floor(extent.south / dLat)) * dLat;
        var maxLng =
            (extent.east < 0
                ? Math.ceil(extent.east / dLat)
                : Math.floor(extent.east / dLat)) * dLat;
        var maxLat =
            (extent.north < 0
                ? Math.ceil(extent.north / dLng)
                : Math.floor(extent.north / dLng)) * dLng;

        // extend to make sure we cover for non refresh of tiles
        minLng = Math.max(minLng - 2 * dLng, -Math.PI);
        maxLng = Math.min(maxLng + 2 * dLng, Math.PI);
        minLat = Math.max(minLat - 2 * dLat, -Math.PI / 2);
        maxLat = Math.min(maxLat + 2 * dLng, Math.PI / 2);

        var lat,
            lng,
            granularity = Cesium.Math.toRadians(1);

        // labels positions
        var latitudeText = minLat + Math.floor((maxLat - minLat) / dLat / 2) * dLat;

        for (lng = minLng; lng < maxLng; lng += dLng) {
            // draw meridian
            var path = [];
            for (lat = minLat; lat < maxLat; lat += granularity) {
                path.push(new Cesium.Cartographic(lng, lat));
            }
            path.push(new Cesium.Cartographic(lng, maxLat));
            var degLng = Cesium.Math.toDegrees(lng);
            let text = convertDEGToDMS(degLng.toFixed(gridPrecision(dLng)));
            let color =
                text === "0°E" || text === "180°E"
                    ? Cesium.Color.YELLOW
                    : Cesium.Color.WHITE;
            if (text !== "180°W") {
                polylines.add({
                    positions: ellipsoid.cartographicArrayToCartesianArray(path),
                    width: 1,
                    material: new Cesium.Material.fromType("Color", {
                        color
                    })
                });
                makeLabel(lng, latitudeText, text, false);
            }
        }

        // lats
        var longitudeText =
            minLng + Math.floor((maxLng - minLng) / dLng / 2) * dLng;
        for (lat = minLat; lat < maxLat; lat += dLat) {
            // draw parallels
            var path = [];
            for (lng = minLng; lng < maxLng; lng += granularity) {
                path.push(new Cesium.Cartographic(lng, lat));
            }
            path.push(new Cesium.Cartographic(maxLng, lat));
            var degLat = Cesium.Math.toDegrees(lat);
            let text = convertDEGToDMS(degLat.toFixed(gridPrecision(dLat)), true);
            let color = text === "0°N" ? Cesium.Color.YELLOW : Cesium.Color.WHITE;
            polylines.add({
                positions: ellipsoid.cartographicArrayToCartesianArray(path),
                width: 1,
                material: new Cesium.Material.fromType("Color", {
                    color
                })
            });
            makeLabel(longitudeText, lat, text, true);
        }
    }

    function makeLabel(lng, lat, text, isLat, color = "white") {
        if (text === "0°N") text = "Equator";
        if (text === "0°E") text = "Prime Meridian";
        if (text === "180°E") text = "Antimeridian";
        let center = new Cesium.Cartographic.fromCartesian(screenCenterPosition());
        let carto = new Cesium.Cartographic(lng, lat);
        if (isLat) carto.longitude = center.longitude;
        else carto.latitude = center.latitude;
        let position = ellipsoid.cartographicToCartesian(carto);
        let label = labels.add({
            position,
            text,
            font: "normal",
            fillColor: color,
            outlineColor: color,
            style: Cesium.LabelStyle.FILL,
            pixelOffset: new Cesium.Cartesian2(isLat ? 0 : 4, isLat ? -6 : 0),
            eyeOffset: Cesium.Cartesian3.ZERO,
            horizontalOrigin: isLat
                ? Cesium.HorizontalOrigin.CENTER
                : Cesium.HorizontalOrigin.LEFT,
            verticalOrigin: isLat
                ? Cesium.VerticalOrigin.BOTTOM
                : Cesium.VerticalOrigin.TOP,
            scale: 1.0
        });
        label.isLat = isLat;
    }

    function gridPrecision(dDeg) {
        if (dDeg < 0.01) return 3;
        if (dDeg < 0.1) return 2;
        if (dDeg < 1) return 1;
        return 0;
    }

    function screenCenterPosition() {
        let canvas = scene.canvas;
        let center = new Cesium.Cartesian2(
            Math.round(canvas.clientWidth / 2),
            Math.round(canvas.clientHeight / 2)
        );
        var cartesian =camera.pickEllipsoid(center);

    if(!cartesian) cartesian = new Cesium.Cartesian3.fromDegrees(0,0,0);
        return cartesian;
    }

    function getExtentView() {
        var camera = scene.camera;
        var canvas = scene.canvas;
        var corners = [
            camera.pickEllipsoid(new Cesium.Cartesian2(0, 0), ellipsoid),
            camera.pickEllipsoid(new Cesium.Cartesian2(canvas.width, 0), ellipsoid),
            camera.pickEllipsoid(
                new Cesium.Cartesian2(0, canvas.height),
                ellipsoid
            ),
            camera.pickEllipsoid(
                new Cesium.Cartesian2(canvas.width, canvas.height),
                ellipsoid
            )
        ];
        for (var index = 0; index < 4; index++) {
            if (corners[index] === undefined) {
                return Cesium.Rectangle.MAX_VALUE;
            }
        }
        return Cesium.Rectangle.fromCartographicArray(
            ellipsoid.cartesianArrayToCartographicArray(corners)
        );
    }

    function convertDEGToDMS(deg, lat) {
        var absolute = Math.abs(deg);

        var degrees = Math.floor(absolute);
        var minutesNotTruncated = (absolute - degrees) * 60;
        var minutes = Math.floor(minutesNotTruncated);
        var seconds = ((minutesNotTruncated - minutes) * 60).toFixed(2);

        let direction = lat ? (deg >= 0 ? "N" : "S") : deg >= 0 ? "E" : "W";
        let text = degrees + "°";
        if (minutes || seconds !== "0.00") text += minutes + "'";
        if (seconds !== "0.00") text += seconds + '"';
        text += direction;

        return text;
    }

    let pH = 0,
        pLat = 0,
        pLon = 0,
        pHeading = 0;

    viewer.clock.onTick.addEventListener(function() {
        let { pitch, positionCartographic, heading } = camera;
        let h = positionCartographic.height;
        let lat = positionCartographic.latitude;
        let lon = positionCartographic.longitude;
        if (h !== pH || lat !== pLat || lon !== pLon || heading !== pHeading) {
                pH = h;
                pLat = lat;
                pLon = lon;
                pHeading = heading;
                refresh();
        }
    });
};
// Function to add labels to the grid
function addGridLabels(viewer, minLat, maxLat, minLon, maxLon, latSpacing, lonSpacing) {
    // Function to create a label
    function createLabel(text, lon, lat) {
        viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(lon, lat),
            label: {
                text: text,
                font: '14px sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -9)
            }
        });
    }

    // Add latitude labels
    for (let lat = minLat; lat <= maxLat; lat += latSpacing) {
        createLabel(lat.toFixed(0) + "°", minLon, lat);
    }

    // Add longitude labels
    for (let lon = minLon; lon <= maxLon; lon += lonSpacing) {
        createLabel(lon.toFixed(0) + "°", lon, minLat);
    }
}
async function fetchLiveStorms() {
  try {
      const response = await fetch('https://nfc.ai:1337/live-storms'); // Replace with your API endpoint
      if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
      }
      const liveStorms = await response.json();
      return liveStorms;
  } catch (error) {
      console.error('Error fetching live storms:', error);
      return null;
  }
}
function groupData(data) {
  const groupedData = {};
  data.forEach(item => {
      const id = item.id;
      if (!groupedData[id]) {
          groupedData[id] = [];
      }
      groupedData[id].push(item);
  });
  return groupedData;
}
function saffirSimpsonCategory(knots) {
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
function unixSeconds(timestamp) {
  return Math.floor(new Date(timestamp).getTime() / 1000);
}
function plotStorms(groupedData, viewer) {
  Object.values(groupedData).forEach(storms => {
      const positions = [];
      // determine the most recent time for this group
      const mostRecentTime = Math.max(...storms.map(storm => unixSeconds(storm.time)));
      console.log(`${storms[0].id} most recent time unix: ${mostRecentTime}`)
      storms.forEach((storm, index) => {
          // calculate the opacity based on the time difference from the most recent time
          const timeDiff = mostRecentTime - unixSeconds(storm.time);
          var level = Math.max(0, 1 - (timeDiff / (6 * 24 * 60 * 60))); // 6 days
          var opacity = level;
          if (timeDiff > 0) {
              opacity = Math.max(0.05, level - 0.1);
          }
          else {
            level = 3; // the most recent entry can be a greater level for easier visual cue
          }
          console.log(`${storm.id} at ${storm.time} opacity: ${opacity} level: ${level}`)

          // create description for each storm track record
          const description_html = `
                  <h4>Storm History</h4>
                  <ul>
                      <li><strong>Source:</strong> ${storm.source}</li>
                      <li><strong>Storm ID:</strong> ${storm.id}</li>
                      <li><strong>Time:</strong> ${storm.time}</li>
                      <li><strong>Latitude:</strong> ${storm.lat}</li>
                      <li><strong>Longitude:</strong> ${storm.lon}</li>
                      <li><strong>Wind Speed (knots):</strong> ${storm.wind_speed}</li>
                      <li><strong>Wind Speed (mph):</strong> ${storm.wind_speed_mph}</li>
                      <li><strong>Wind Speed (km/h):</strong> ${storm.wind_speed_kmph}</li>
                  </ul>
          `
          // Add a marker for each storm point
          const position = Cesium.Cartesian3.fromDegrees(storm.lon, storm.lat, (level * 100))
          positions.push(position);
          viewer.entities.add({
              position: position,
              point: {
                  pixelSize: 50,
                  color: Cesium.Color.fromCssColorString(
                      getColorCode(parseFloat(storm.wind_speed))
                    ).withAlpha(opacity),
                  scaleByDistance: new Cesium.NearFarScalar(0, 5, 8000000, 1)  
              },
              description: description_html
          });

          // Add a billboard as a marker for each storm point
          let category = saffirSimpsonCategory(parseFloat(storm.wind_speed));
          if (timeDiff > 0) {
              opacity = Math.max(0.2, level - 0.25);
          }
          viewer.entities.add({
              position: Cesium.Cartesian3.fromDegrees(storm.lon, storm.lat, (level * 10000)),
              billboard: {
                  image: `static/${category}.png`,
                  color: new Cesium.Color(1.0, 1.0, 1.0, opacity),
                  scaleByDistance: new Cesium.NearFarScalar(0, 0.2, 10000000, 0.05)
              },
              description: description_html
          });
      });
      // Add a line to connect the storm points
      viewer.entities.add({
          polyline: {
              positions: positions,
              width: 2,
              material: Cesium.Color.RED
          }
      });
  });
}
function getColorCode(knots) {
  if (knots < 34) {
      return "#008000"; // Tropical Depression - Green
  } else if (knots >= 34 && knots <= 63) {
      return "#FFFF00"; // Tropical Storm - Yellow
  } else if (knots >= 64 && knots <= 82) {
      return "#ff8000"; // Category 1 - Orange
  } else if (knots >= 83 && knots <= 95) {
      return "#FF4040"; // Category 2 -  Light Red
  } else if (knots >= 96 && knots <= 112) {
      return "#FF0000"; // Category 3 - Medium Red
  } else if (knots >= 113 && knots <= 135) {
      return "#b30000"; // Category 4 - Dark Red
  } else {
      return "#b300b3"; // Category 5 - Fuchsia
  }
}
function createStormButtons(viewer, groupedData){
    const recentEntries = findMostRecentEntries(groupedData);
    let topOffset = 1; // Start with 1rem for the first button

    Object.values(recentEntries).forEach(entry => {
        const category = saffirSimpsonCategory(parseFloat(entry.wind_speed));
        const iconPath = `static/${category}.png`; // Path to the icon
        const topPosition = `${topOffset}rem`;

        // Create the button with the icon
        stormButtons.innerHTML += `
            <button id="button${entry.id}" type="button" class="btn btn-success btn-sm" style="position: fixed; text-align: left; width: 8rem; top: ${topPosition}; left: 1rem;">
                <img src="${iconPath}" alt="Category Icon" style="width: 1.5rem; height: 1.5rem;"> 
                ${entry.id}
            </button>`;
        
        topOffset += 2;
    })

    // Add click event listeners to animate camera to most recent entry
    Object.values(recentEntries).forEach(entry => {
        const button = document.getElementById(`button${entry.id}`);
        if (button) {
            button.onclick = function() {
                // Define what happens when the button is clicked
                console.log(`Button for ${entry.id} clicked`);
                centerCameraOnLocation(viewer, entry.lat, entry.lon)
            };
        }
    });
}
function findMostRecentEntries(groupedData) {
  const mostRecentEntries = {};

  Object.keys(groupedData).forEach(stormId => {
      let mostRecentEntry = null;
      let mostRecentTime = 0;

      groupedData[stormId].forEach(entry => {
          const entryTime = new Date(entry.time).getTime(); // Assuming 'time' is in a format that can be parsed to a Date object

          if (mostRecentEntry === null || entryTime > mostRecentTime) {
              mostRecentEntry = entry;
              mostRecentTime = entryTime;
          }
      });

      mostRecentEntries[stormId] = mostRecentEntry;
  });

  return mostRecentEntries;
}
function findHighestWindSpeedEntry(groupedData) {
  const mostRecentEntries = findMostRecentEntries(groupedData);
  let highestWindSpeedEntry = null;
  let highestWindSpeed = -1;

  Object.values(mostRecentEntries).forEach(entry => {
      if (entry.wind_speed > highestWindSpeed) {
          highestWindSpeed = entry.wind_speed;
          highestWindSpeedEntry = entry;
      }
  });

  return highestWindSpeedEntry;
}
function centerCameraOnLocation(viewer, latitude, longitude, zoomLevel = 10000000) {
  // Check if viewer, latitude, and longitude are provided
  if (!viewer || latitude === undefined || longitude === undefined) {
      console.error("Invalid arguments. Viewer, latitude and longitude are required.");
      return;
  }

  // Convert latitude and longitude to Cartesian3 coordinates
  const destination = Cesium.Cartesian3.fromDegrees(longitude, latitude, zoomLevel);

  // Set the camera to look at the specified location
  viewer.camera.flyTo({
      destination: destination,
      orientation: {
          heading: Cesium.Math.toRadians(0), // East, default orientation
          pitch: Cesium.Math.toRadians(-90), // Look directly at the target
          roll: 0.0
      },
      duration: 2 // Duration in seconds for the camera flight
  });
}
async function fetchForecasts() {
  try {
    const response = await fetch('https://nfc.ai:1337/forecasts');

    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    // Parse the response as JSON
    const jsonData = await response.json();

    // Filter out the models that are defined as 'gpt-3.5-turbo'
    //const filteredData = jsonData.filter(item => item.model !== 'gpt-3.5-turbo');
    return jsonData;
  } catch (error) {
    console.error('Error fetching forecasts:', error);
    return null;
  }
}
async function createForecastMarkers(viewer, liveData) {
    const forecasts = await fetchForecasts();
    if (!forecasts) {
        console.error('Failed to fetch forecasts');
        return;
    }

    // Iterate over each storm in the forecast data
    Object.keys(forecasts).forEach(stormId => {
        let positions = [];
        let prevForecast = null;

        // Check if there's live storm data for the current storm ID
        if (liveData[stormId] && liveData[stormId].length > 0) {
            const latestStormData = liveData[stormId][liveData[stormId].length - 1];
            const livePosition = Cesium.Cartesian3.fromDegrees(latestStormData.lon, latestStormData.lat, 10000);

            // Add a marker for the live storm position
            viewer.entities.add({
                position: livePosition,
                point: {
                    pixelSize: 5,
                    color: Cesium.Color.YELLOW,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 1
                },
                description: `
                    <h4>Live Storm Data</h4>
                    <ul>
                        <li><strong>ID:</strong> ${stormId}</li>
                        <li><strong>Time:</strong> ${latestStormData.time}</li>
                        <li><strong>Latitude:</strong> ${latestStormData.lat}</li>
                        <li><strong>Longitude:</strong> ${latestStormData.lon}</li>
                        <li><strong>Wind Speed:</strong> ${latestStormData.wind_speed} knots</li>
                    </ul>
                `
            });

            // Connect the live storm position to the first forecasted position
            const firstForecast = forecasts[stormId][0];
            const firstForecastPosition = Cesium.Cartesian3.fromDegrees(firstForecast.lon, firstForecast.lat, 10000);

            // Draw a polyline from the live storm to the first forecast position
            viewer.entities.add({
                polyline: {
                    positions: [livePosition, firstForecastPosition],
                    width: 2,
                    material: Cesium.Color.CYAN.withAlpha(0.8)
                }
            });

            // Add the live position to the positions array to maintain connection continuity
            positions.push(livePosition);
        }

        // Iterate over each forecast for the current storm ID
        forecasts[stormId].forEach(forecast => {
            const position = Cesium.Cartesian3.fromDegrees(forecast.lon, forecast.lat, 10000);

            // Add a marker for each forecast point
            viewer.entities.add({
                position: position,
                point: {
                    pixelSize: 5,
                    color: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 1
                },
                description: `
                    <h4>Forecast Details</h4>
                    <ul>
                        <li><strong>ID:</strong> ${stormId}</li>
                        <li><strong>Time:</strong> ${forecast.forecast_time}</li>
                        <li><strong>Latitude:</strong> ${forecast.lat}</li>
                        <li><strong>Longitude:</strong> ${forecast.lon}</li>
                        <li><strong>Wind Speed:</strong> ${forecast.wind_speed} knots</li>
                    </ul>
                `
            });

            // Handle International Date Line crossing
            if (prevForecast && Math.abs(prevForecast.lon - forecast.lon) > 180) {
                viewer.entities.add({
                    polyline: {
                        positions: positions,
                        width: 2,
                        material: Cesium.Color.FUCHSIA.withAlpha(0.8)
                    }
                });
                positions = [];
            }

            prevForecast = forecast;
            positions.push(position);
        });

        // Add the polyline for the storm if positions exist
        if (positions.length > 0) {
            viewer.entities.add({
                polyline: {
                    positions: positions,
                    width: 2,
                    material: Cesium.Color.FUCHSIA.withAlpha(0.8)
                }
            });
        }
    });
}


if (typeof Cesium !== 'undefined') {
    window.startupCalled = true;
    window.startup(Cesium).catch((error) => {
      "use strict";
      console.error(error);
    });
}
