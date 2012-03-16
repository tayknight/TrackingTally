var getUsersEntries =  function(fetchDate) {
    if (!fetchDate) {
        var t = $('#today').html();
        fetchDate = moment(new Date(t)).format('YYYY-MM-DD');
        console.log(fetchDate);
    }
    $("#entriesDisplay").html();
    $.ajax({
        url: '/entries/user/' + $("#user_id").val() + '/' + fetchDate
        , type: 'get'
        , dataType: 'html'
        , success: function(data) {
                    $("#entriesDisplay").html(data);
                    initializeEntryClickHandler();
                    initializeOlderClickHandler();
                    initializeNewerClickHandler();
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

var initializeOlderClickHandler = function() {
    $('#olderButton').click(function() {    
        var t = $('#today').html();
        fetchDate = moment(new Date(t)).add('d', -1).format('YYYY-MM-DD');
        getUsersEntries(fetchDate);
    });
};

var initializeNewerClickHandler = function() {
    $('#newerButton').click(function() {    
        var t = $('#today').html();
        fetchDate = moment(new Date(t)).add('d', 1).format('YYYY-MM-DD');
        getUsersEntries(fetchDate);
    });
};

var initializeEntryClickHandler = function() {
    $('.placeEntry').click(function() { placeExistingEntry($(this).attr('id')) })
}

var initializeSaveHandler = function() {
    var t = $('#today').html();
    var fetchDate = moment(new Date(t)).format('YYYY-MM-DD');
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
            $('#entryForm').clearForm();
            getUsersEntries(fetchDate);
          }
        , dataType: ''
    })
        return false;
    });    
}

var initilizeCancelHandler = function() {
    $('#cancelButton').click(function() { $('#entryForm').clearForm() });
}

$.fn.clearForm = function() {
    return this.each(function() {
        var type = this.type, tag = this.tagName.toLowerCase();
        if (tag == 'form')
            return $(':input',this).clearForm();
        if (type == 'text' || type == 'password' || tag == 'textarea')
            this.value = '';
        else if (type == 'checkbox' || type == 'radio')
        this.checked = false;
        else if (tag == 'select')
        this.selectedIndex = -1;
    });
};