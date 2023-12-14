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
      baseLayerPicker: false,
    });
    const scene = viewer.scene;
    const globe = scene.globe;
    const skyAtmosphere = scene.skyAtmosphere;

    scene.highDynamicRange = true;
    globe.enableLighting = true;
    globe.atmosphereLightIntensity = 20.0;

    const defaultGroundAtmosphereLightIntensity =
      globe.atmosphereLightIntensity;
    const defaultGroundAtmosphereRayleighCoefficient =
      globe.atmosphereRayleighCoefficient;
    const defaultGroundAtmosphereMieCoefficient =
      globe.atmosphereMieCoefficient;
    const defaultGroundAtmosphereMieAnisotropy =
      globe.atmosphereMieAnisotropy;
    const defaultGroundAtmosphereRayleighScaleHeight =
      globe.atmosphereRayleighScaleHeight;
    const defaultGroundAtmosphereMieScaleHeight =
      globe.atmosphereMieScaleHeight;
    const defaultGroundAtmosphereHueShift = globe.atmosphereHueShift;
    const defaultGroundAtmosphereSaturationShift =
      globe.atmosphereSaturationShift;
    const defaultGroundAtmosphereBrightnessShift =
      globe.atmosphereBrightnessShift;
    const defaultLightFadeOut = globe.lightingFadeOutDistance;
    const defaultLightFadeIn = globe.lightingFadeInDistance;
    const defaultNightFadeOut = globe.nightFadeOutDistance;
    const defaultNightFadeIn = globe.nightFadeInDistance;

    const defaultSkyAtmosphereLightIntensity =
      skyAtmosphere.atmosphereLightIntensity;
    const defaultSkyAtmosphereRayleighCoefficient =
      skyAtmosphere.atmosphereRayleighCoefficient;
    const defaultSkyAtmosphereMieCoefficient =
      skyAtmosphere.atmosphereMieCoefficient;
    const defaultSkyAtmosphereMieAnisotropy =
      skyAtmosphere.atmosphereMieAnisotropy;
    const defaultSkyAtmosphereRayleighScaleHeight =
      skyAtmosphere.atmosphereRayleighScaleHeight;
    const defaultSkyAtmosphereMieScaleHeight =
      skyAtmosphere.atmosphereMieScaleHeight;
    const defaultSkyAtmosphereHueShift = skyAtmosphere.hueShift;
    const defaultSkyAtmosphereSaturationShift =
      skyAtmosphere.saturationShift;
    const defaultSkyAtmosphereBrightnessShift =
      skyAtmosphere.brightnessShift;

    const viewModel = {
      // Globe settings

      enableTerrain: false,
      enableLighting: true,
      groundTranslucency: false,

      // Ground atmosphere settings

      showGroundAtmosphere: true,
      groundAtmosphereLightIntensity: defaultGroundAtmosphereLightIntensity,
      groundAtmosphereRayleighCoefficientR:
        defaultGroundAtmosphereRayleighCoefficient.x / 1e-6,
      groundAtmosphereRayleighCoefficientG:
        defaultGroundAtmosphereRayleighCoefficient.y / 1e-6,
      groundAtmosphereRayleighCoefficientB:
        defaultGroundAtmosphereRayleighCoefficient.z / 1e-6,
      groundAtmosphereMieCoefficient:
        defaultGroundAtmosphereMieCoefficient.x / 1e-6,
      groundAtmosphereRayleighScaleHeight: defaultGroundAtmosphereRayleighScaleHeight,
      groundAtmosphereMieScaleHeight: defaultGroundAtmosphereMieScaleHeight,
      groundAtmosphereMieAnisotropy: defaultGroundAtmosphereMieAnisotropy,
      groundHueShift: defaultGroundAtmosphereHueShift,
      groundSaturationShift: defaultGroundAtmosphereSaturationShift,
      groundBrightnessShift: defaultGroundAtmosphereBrightnessShift,
      lightingFadeOutDistance: defaultLightFadeOut,
      lightingFadeInDistance: defaultLightFadeIn,
      nightFadeOutDistance: defaultNightFadeOut,
      nightFadeInDistance: defaultNightFadeIn,

      // Sky atmosphere settings

      showSkyAtmosphere: true,
      skyAtmosphereLightIntensity: defaultSkyAtmosphereLightIntensity,
      skyAtmosphereRayleighCoefficientR:
        defaultSkyAtmosphereRayleighCoefficient.x / 1e-6,
      skyAtmosphereRayleighCoefficientG:
        defaultSkyAtmosphereRayleighCoefficient.y / 1e-6,
      skyAtmosphereRayleighCoefficientB:
        defaultSkyAtmosphereRayleighCoefficient.z / 1e-6,
      skyAtmosphereMieCoefficient:
        defaultSkyAtmosphereMieCoefficient.x / 1e-6,
      skyAtmosphereRayleighScaleHeight: defaultSkyAtmosphereRayleighScaleHeight,
      skyAtmosphereMieScaleHeight: defaultSkyAtmosphereMieScaleHeight,
      skyAtmosphereMieAnisotropy: defaultSkyAtmosphereMieAnisotropy,
      skyHueShift: defaultSkyAtmosphereHueShift,
      skySaturationShift: defaultSkyAtmosphereSaturationShift,
      skyBrightnessShift: defaultSkyAtmosphereBrightnessShift,
      perFragmentAtmosphere: false,
      dynamicLighting: true,
      dynamicLightingFromSun: false,

      // Fog settings

      showFog: true,
      density: 1.0,
      minimumBrightness: 0.03,

      // Scene settings

      hdr: true,
  };
  fetchLiveStorms().then(data => {
    if (data) {
      console.log('Forecasts data:', data);
      const groupedStorms = groupData(data);
      plotStorms(groupedStorms, viewer);
      const strongestStorm = findHighestWindSpeedEntry(groupedStorms);
      centerCameraOnLocation(viewer, strongestStorm.lat, strongestStorm.lon);
      createForecastMarkers(viewer);
    } else {
      console.log('Failed to fetch forecasts data.');
    }
  });
};
async function fetchLiveStorms() {
  try {
      const response = await fetch('http://fluids.ai:1337/live-storms'); // Replace with your API endpoint
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
          const level = Math.max(0, 1 - (timeDiff / (6 * 24 * 60 * 60))); // 6 days
          var opacity = level;
          if (timeDiff > 0) {
              opacity = Math.max(0.05, level - 0.1);
          }
          console.log(`${storm.id} at ${storm.time} opacity: ${opacity}`)

          // create description for each storm track record
          const description_html = `
                  <h4>Storm History</h4>
                  <ul>
                      <li><strong>Storm ID:</strong> ${storm.id}</li>
                      <li><strong>Time:</strong> ${storm.time}</li>
                      <li><strong>Latitude:</strong> ${storm.lat}</li>
                      <li><strong>Longitude:</strong> ${storm.lon}</li>
                      <li><strong>Wind Speed (knots):</strong> ${storm.wind_speed}</li>
                      <li><strong>Wind Speed (mph):</strong> ${storm.wind_speed_mph}</li>
                      <li><strong>Wind Speed (km/h):</strong> ${storm.wind_speed_kph}</li>
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
async function createForecastMarkers(viewer) {
  const forecasts = await fetchForecasts();
  if (!forecasts) {
      console.error('Failed to fetch forecasts');
      return;
  }

  const groupedForecasts = {};

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

  Object.keys(groupedForecasts).forEach(model => {
      Object.keys(groupedForecasts[model]).forEach(stormId => {
          let positions = [];
          let prevForecast = null;

          groupedForecasts[model][stormId].forEach(forecast => {
              const position = Cesium.Cartesian3.fromDegrees(forecast.lon, forecast.lat, 100000);
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
                          <li><strong>Model:</strong> ${forecast.model}</li>
                          <li><strong>ID:</strong> ${forecast.id}</li>
                          <li><strong>Time:</strong> ${forecast.time}</li>
                          <li><strong>Latitude:</strong> ${forecast.lat}</li>
                          <li><strong>Longitude:</strong> ${forecast.lon}</li>
                          <li><strong>Wind Speed:</strong> ${forecast.wind_speed} knots</li>
                      </ul>
                  `
              });

              if (prevForecast && Math.abs(prevForecast.lon - forecast.lon) > 180) {
                  // Handle crossing the International Date Line
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

          if (positions.length > 0) {
              // Create and add the polyline for the current storm ID group
              viewer.entities.add({
                  polyline: {
                      positions: positions,
                      width: 2,
                      material: Cesium.Color.FUCHSIA.withAlpha(0.8)
                  }
              });
          }
      });
  });
}

if (typeof Cesium !== 'undefined') {
    window.startupCalled = true;
    window.startup(Cesium).catch((error) => {
      "use strict";
      console.error(error);
    });
}
