function getUserLocation() {
    //check if the geolocation object is supported, if so get position
    if (navigator.geolocation)
        navigator.geolocation.getCurrentPosition(displayLocation, displayError);
    else
        document.getElementById("position").innerHTML = "Location not found";
}

function displayLocation(position) {
    console.log('position found');
    //build text string including co-ordinate data passed in parameter
    /*var displayText = "Include location";    

    //display the string for demonstration
    document.getElementById("position").innerHTML = displayText;
    $('#entrylatitude').val(position.coords.latitude);
    $('#entrylongitude').val(position.coords.longitude);
    */
}

function displayError(error) {
    //get a reference to the HTML element for writing result
    var locationElement = document.getElementById("position");

    //find out which error we have, output message accordingly
    switch(error.code) {
        case error.PERMISSION_DENIED:
            locationElement.innerHTML = "Permission was denied";
        break;
    case error.POSITION_UNAVAILABLE:
        locationElement.innerHTML = "Location not available";
        break;
    case error.TIMEOUT:
        locationElement.innerHTML = "Location req. timeout";
        break;
    case error.UNKNOWN_ERROR:
        locationElement.innerHTML = "Location error.";
        break;
    default: locationElement.innerHTML = "Location Error.";
        break;
    }
}