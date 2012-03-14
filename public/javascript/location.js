function getUserLocation() {
    //check if the geolocation object is supported, if so get position
    if (navigator.geolocation)
        navigator.geolocation.getCurrentPosition(displayLocation, displayError);
    else
        document.getElementById("position").innerHTML = "Position not found";
}

function displayLocation(position) {
    //build text string including co-ordinate data passed in parameter
    var displayText = "Position Found. Embed?";

    //display the string for demonstration
    document.getElementById("position").innerHTML = displayText;
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
        locationElement.innerHTML = "Location data not available";
        break;
    case error.TIMEOUT:
        locationElement.innerHTML = "Location request timeout";
        break;
    case error.UNKNOWN_ERROR:
        locationElement.innerHTML = "Position error.";
        break;
    default: locationElement.innerHTML = "Position Error.";
        break;
    }
}