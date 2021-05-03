$(document).ready(function () {

    $('#sidebarCollapse').on('click', function () {
        $('#sidebar').toggleClass('active');
    });

});

function myMap() {
    var mapProp= {
      center:new google.maps.LatLng(33.774640, -84.396417),
      zoom:2,
    };
    var map = new google.maps.Map(document.getElementById("googleMap"),mapProp);
    document.getElementById("googleMap").style.width = window.innerWidth - 250 + "px";
}