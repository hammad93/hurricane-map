$(document).ready(function () {

    $('#sidebarCollapse').on('click', function () {
        $('#sidebar').toggleClass('active');
    });
    addMarkersAndLines(groupData(live_storms));
    resizeMap();
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
function addMarkersAndLines(groupedData) {
    // create an empty array to hold the polyline latlngs
    const polylineLatLngs = [];
  
    // loop through each storm id in the grouped data
    for (const id in groupedData) {
      // get the array of storm objects for this id
      const storms = groupedData[id];
  
      // determine the most recent time for this group
      const mostRecentTime = Math.max(...storms.map(storm => storm.time));
  
      // loop through each storm object in the array
      storms.forEach((storm, index) => {
        // calculate the opacity based on the time difference from the most recent time
        const timeDiff = mostRecentTime - storm.time;
        const opacity = Math.max(0, 1 - (timeDiff / (6 * 24 * 60 * 60 * 1000))); // 6 days
        
        // record is less than 5 days old from the most recent time
        if (timeDiff <= 5 * 24 * 60 * 60 * 1000) {
          // add a marker to the map with the calculated opacity
          const marker = L.marker([storm.lat, storm.lon], {'zIndexOffset': opacity * 100}).addTo(map);
    
          // set the marker tooltip content
          marker.setOpacity(opacity);
          marker.bindTooltip(`ID: ${id}<br>Time: ${new Date(storm.time)}`);
        }
        // add the marker latlng to the polyline latlngs array
        polylineLatLngs.push([storm.lat, storm.lon]);
        
        // add a circle to the map with the calculated opacity
        const circle = L.circle([storm.lat, storm.lon], {
          'opacity': opacity,
          'zIndexOffset': opacity * 100,
          'radius': 100000 // specify the radius of the circle in meters
        }).addTo(map);
      });
  
      // add a polyline to the map
      L.polyline(polylineLatLngs, { color: 'red' }).addTo(map);
  
      // reset the polyline latlngs array for the next storm id
      polylineLatLngs.length = 0;
    }
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
