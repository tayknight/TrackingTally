var getUsersEntries =  function(pageNum, queryString) {
    $("#entriesDisplay").html();
    queryString = queryString || 'q=1';
    username = $('#entryForm').data('username');
    pageNum = pageNum || 1;
    $.ajax({
        url: '/' + username + '/entries/find/?' + queryString
        , type: 'get'
        , dataType: 'html'
        , success: function(data) {
                    $("#entriesDisplay").html(data);
                    initializeEntryClickHandler();
                    makePagination(pageNum, parseInt($('#entriesPagination').data('entries-count')));
                    window.history.replaceState(null, 'pagination change', '/' + username + '/entries/page/' + pageNum)
                    }
    });
}

var searchEntries = function(querystring) {
    $.ajax({
        url: '/search' + querystring
        , type: 'get'
        , dataType: 'html'
        , success: function(data) {
                    $("#entriesDisplay").html(data);
                    initializeEntryClickHandler();
                    makePagination(1, parseInt($('#entriesPagination').data('entries-count')));
                    window.history.replaceState(null, 'search change', '/search' + querystring)
                    }
    });
}

var placeExistingEntry = function(thisData) {
    $('#entryverb').val(thisData.verb);
    $('#entryquantifier').val(thisData.quantifier);
    $('#entryadjective').val(thisData.adjective);
    $('#entrynoun').val(thisData.noun);
    $('#entrycomment').val(thisData.comment);
    
    $('#entryverb').focus();
};

var initializeEntryClickHandler = function() {
    $('.placeEntry').click(function() { placeExistingEntry($(this).data()) })
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
            getUsersEntries(1);
          }
        , dataType: ''
    })
        return false;
    });    
}

var initializeCancelHandler = function() {
    $('#cancelButton').click(function() { $('#entryForm').clearForm() });
}

var initializeSearchHandler = function() {
    $('#searchButton').click(function() { 
        var verb = $('#entryverb').val();
        var quantifier = $('#entryquantifier').val();
        var adjective = $('#entryadjective').val();
        var noun = $('#entrynoun').val();
        var comment = $('#entrycomment').val();
        
        var querystring = '?q=1';
        if (verb.length > 0) {
            querystring += "&verb=" + encodeURIComponent(verb);
        }
        if (quantifier.length > 0) {
            querystring += "&quantifier=" + encodeURIComponent(quantifier);
        }
        if (adjective.length > 0) {
            querystring += "&adjective=" + encodeURIComponent(adjective);
        }
        if (noun.length > 0) {
            querystring += "&noun=" + encodeURIComponent(noun);
        }
        if (comment.length > 0) {
            querystring += "&quantifier=" + encodeURIComponent(comment);
        }
        console.log('querystring: ' + querystring);
        searchEntries(querystring);
    });
}

var makePagination = function(requested, total_entries) {
    var requested = parseInt(requested);
    var total_entries = parseInt(total_entries);
    var limit = 10;
    var total_pages = Math.ceil(total_entries/limit);
    var previous = requested - 1;
    var next = requested + 1;
    var totalminusone = total_pages - 1;
    
    //$('#entriesPagination').append("<div class='pagination'><ul>");
    var parent_ul = $("<ul></ul>");

    if (total_pages <= 1) {
        parent_ul.append('<li class="disabled"><a href="#">1</a></li>');
    }    
    else if (total_pages > 1) {        
        if (total_pages < 6) { // dont' bother paginating
            for (var counter = 1; counter <= total_pages; counter++) {
                if (counter == requested) {
                    parent_ul.append('<li class="active"><a>' + counter + '</a></li>');
                }
                else {
                    parent_ul.append('<li><a>' + counter + '</a></li>');
                }
            }
        }   
        else if (total_pages >= 6) {
            // beginning. only hide later pages.
            if (requested < 5) {
                for (var counter = 1; counter <= 5; counter++) {
                    if (counter == requested) {
                        parent_ul.append('<li class="active"><a>' + counter + '</a></li>');
                    }
                    else {
                        parent_ul.append('<li><a>' + counter + '</a></li>');
                    }
                }
                parent_ul.append('<li class="disabled"><a>...</a></li>');
                parent_ul.append('<li><a href="#">' + total_pages + '</a></li>');
            }
            // in middle; hide some front and back
            else if ( total_pages - 3 > requested) {
                parent_ul.append('<li><a href="#">1</a></li>');
                parent_ul.append('<li class="disabled"><a>...</a></li>');
                for (var counter = requested-1; counter < (requested + 2); counter++) {
                    if (counter == requested) {
                        parent_ul.append('<li class="active"><a>' + counter + '</a></li>');
                    }
                    else {
                        parent_ul.append('<li><a>' + counter + '</a></li>');
                    }
                }
                parent_ul.append('<li class="disabled"><a>...</a></li>');
                parent_ul.append('<li><a href="#">' + total_pages + '</a></li>');
            }
            // close to the end; only hide early pages
            else {
                parent_ul.append('<li><a href="#">1</a></li>');
                parent_ul.append('<li class="disabled"><a>...</a></li>');
                for (var counter = total_pages - 4; counter <= total_pages; counter++) {
                    if (counter == requested) {
                        parent_ul.append('<li class="active"><a>' + counter + '</a></li>');
                    }
                    else {
                        parent_ul.append('<li><a>' + counter + '</a></li>');
                    }
                }
            }
        }
        else {
            parent_ul.append('<li><a href="#">1</a></li>');
            parent_ul.append('<li><a href="#">2</a></li>');
            parent_ul.append('<li><a href="#">3</a></li>');
            for (var counter = total_pages; counter <= total_pages; counter++) {
                if (counter == requested) {
                    parent_ul.append('<li class="counter"><a href="#">' + counter + '</a></li>');
                }   
                else {
                    parent_ul.append('<li><a>' + counter + '</a></li>');
                }
            }
            if (requested < total_pages - 1){
                parent_ul.append('<li><a href="#">Next</a></li>');
            }
            else {
                parent_ul.append('<li class="disabled"><a href="#">Next</a></li>');
            }
        }
    }
    var pagination_div = $('<div class="pagination"></div>');
    pagination_div.append(parent_ul);
    $('#entriesPagination').append(pagination_div);
    
    // attach click handler to each pagination unit
    $('#entriesPagination > div.pagination > ul > li > a').click(function() { 
        getUsersEntries($(this).html());
    });
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