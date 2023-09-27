//key for iqair 3540bf38-4239-4525-82ef-cfaeab698538
//http://api.airvisual.com/v2/nearest_city?key=3540bf38-4239-4525-82ef-cfaeab698538
//{{urlExternalAPI}}v2/nearest_city?lat={{LATITUDE}}&lon={{LONGITUDE}}&key={{YOUR_API_KEY}}

$(function(){
    //Creating map
    var mymap = L.map('mapid', {zoomControl: false}).setView([54.237933,-2.36967],5); 

    //Adding map background
    var CartoDB_Voyager = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',subdomains: 'abcd',maxZoom: 19,minZoom: 3});
    CartoDB_Voyager.addTo(mymap);

    //Creating a layer of markers
    var markers = new L.layerGroup();
    markers.addTo(mymap);

    function removeMarkers() {
        markers.clearLayers();
    };

    //Adding clear all button
    L.easyButton({
        position: 'bottomright',
        leafletClasses: true,
        states: [{ stateName: 'center', onClick: function(btn, mymap) {
            removeMarkers();
        }, title: 'Clear all markers', icon: 'fa-times-circle'}]
    }).addTo(mymap);

    //Adding load all button
    L.easyButton({
        position: 'bottomright',
        leafletClasses: true,
        states: [{ stateName: 'center', onClick: function(btn, mymap) {
            console.log("Loading markers from profile!");

            $.post("/dogetmarkers", function(data, status) {
                //console.log("Requested markers!!");
                var passedMarkers = data;
                
                passedMarkers.forEach(element => {
                    var marker = element.split(" ");

                    $.getJSON(`/airQuality?lat=${marker[0]}&lon=${marker[1]}`, function(result) {
                        var lat = result.data.location.coordinates[1];
                        var lng = result.data.location.coordinates[0];
             
                        L.marker([lat,lng]).addTo(markers).bindPopup("<p><b>" + result.data.city + "</b>" + "<br>Air Quality Index US: " + result.data.current.pollution.aqius).openPopup() + "</p>";      
                    });
                });
            });

        }, title: 'Load all markers', icon: 'fa fa-download'}]
    }).addTo(mymap);

    //Adding save all button
    L.easyButton({
        position: 'bottomright',
        leafletClasses: true,
        states: [{ stateName: 'center', onClick: function(btn, mymap) {
            //console.log("Saving all markers to profile!");
            var output = {latlngs:[]};

            markers.eachLayer(function(layer) {
                output.latlngs.push(layer.getLatLng().lat + " " + layer.getLatLng().lng);
            });

            if (output.latlngs.length == 0) {
                //console.log("No markers!");
            } else {
                $.post("/doupdatemarkers", output, function(data, status) {});
            };
        }, title: 'Save all markers', icon: 'fa fa-floppy-o'}]
    }).addTo(mymap);

    //Adding the more information button
    L.easyButton({
        position: 'bottomright',
        leafletClasses: true,
        states: [{ stateName: 'center', onClick: function(btn, mymap) {
            var modal = $("#moreHelp");

            if (modal.css("display") == "none") {
                modal.css("display","block");
            } else if (modal.css("display") == "block") {
                modal.css("display","none");
            };
        },
        title: 'Help', icon: 'fa-question-circle'}]
    }).addTo(mymap);

    //Adding the zoom buttons to the bottom right
    L.control.zoom({
        position:'bottomright'
    }).addTo(mymap);
    
    //Map clicked event
    mymap.on("click", function(e) {
       
       $.getJSON(`/airQuality?lat=${e.latlng.lat}&lon=${e.latlng.lng}`, function(result) {
           var lat = result.data.location.coordinates[1];
           var lng = result.data.location.coordinates[0];

           L.marker([lat,lng]).addTo(markers).bindPopup("<p><b>" + result.data.city + "</b>" + "<br>Air Quality Index US: " + result.data.current.pollution.aqius).openPopup() + "</p>";      
       });
       
     });
});