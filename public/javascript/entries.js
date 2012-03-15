var getUsersEntries =  function() {
    $("#entriesDisplay").html();
    $.ajax({
        url: '/entries/user/' + $("#user_id").val()
        , type: 'get'
        , dataType: 'html'
        , success: function(data) {
                    $("#entriesDisplay").html(data);
                    initializeEntryClickHandler();
                    }
    });
}

var placeExistingEntry = function(thisId) {
    verb = $('#entry_row_' + thisId).children('td.verb').text();
    quantifier = $('#entry_row_' + thisId).children('td.quantifier').text();
    adjective = $('#entry_row_' + thisId).children('td.adjective').text();
    noun = $('#entry_row_' + thisId).children('td.noun').text();
    comment = $('#entry_row_' + thisId).children('td.comment').text();
    
    $('#entryverb').val(verb);
    $('#entryquantifier').val(quantifier);
    $('#entryadjective').val(adjective);
    $('#entrynoun').val(noun);
    $('#entrycomment').val(comment);
    
    $('#entryverb').focus();
};

var initializeEntryClickHandler = function() {
    $('.placeEntry').click(function() { placeExistingEntry($(this).attr('id')) })
}

var initializeSaveHandler = function() {
    $('#entryForm').submit(function() {
        /* stop form from submitting normally */
        event.preventDefault(); 
      
        var verb = $('#entryverb').val();
        var quantifier = $('#entryquantifier').val();
        var adjective = $('#entryadjective').val();
        var noun = $('#entrynoun').val();
        var comment = $('#entrycomment').val();
        var latitude = $('#entrylatitude').val();
        var longitude = $('#entrylongitude').val();
        var public = $('#entrypublic').val();
        
        var formdata = 'verb=' + verb + '&quantifier=' + quantifier + '&adjective=' + adjective + '&noun=' + noun + '&comment=' + comment + '&latitude=' + latitude + '&longitude=' + longitude + '&public=' + public;

        $.ajax({
        type: 'POST'
        , url: '/update'
        , data: formdata
        , success: function() {
            getUsersEntries();
          }
        , dataType: ''
    })
        return false;
    });    
}
