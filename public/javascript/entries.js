var currentUserEntries;

var getUsersEntries =  function(pageNum, queryString) {
  thisDate = moment().utc().format('YYYY-MM-DD');
  // if there is a queryString, we need to parse it for values. 
  // The presence of a queryString indicates:
  // 1. a search result set is being paged throught
  // 2. a URL is being directly navigated to.
  $("#entriesDisplay").html();
  
  if (queryString == undefined) {
    queryString = 'q=1&d=' + thisDate;
  }
  else
  {
    queryString = queryString || 'q=1';
  }
  
  username = $('#entryForm').data('username');
  requestedDate = $('#entriesPagination').data('requestedDate')
  pageNum = pageNum || 1;
  $.ajax({
    url: '/' + username + '/entries/?' + queryString + '&page=' + pageNum
    , type: 'get'
    , success: function(data) {
          currentUserEntries = data;
          entriesList = new Hogan.Template(T.entries_template);
          $("#entriesDisplay").html(entriesList.render(data));
          initializeEntryClickHandler();
          //makePagination(pageNum, requestedDate, parseInt($('#entriesPagination').data('entries-count')));
          initializeDayClickHandler()
          History.replaceState(null, '', '/' + username + '/entries/?' + queryString + '&page=' + pageNum)          
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

var initializeDayClickHandler = function() {
  $('.navigateDay').click(function() { 
    getUsersEntries(1, 'd=' + $(this).data('navigation-date'));
  })
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
    
    var querystring = '';
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
      querystring += "&comment=" + encodeURIComponent(comment);
    }

    getUsersEntries(1,querystring);
  });
}

var makePagination = function(requested, requestedDate, totalEntries) {
  var requested = parseInt(requested);
  var totalEntries = parseInt(totalEntries);
  var limit = 10;
  var totalPages = Math.ceil(totalEntries/limit);
  var previous = requested - 1;
  var next = requested + 1;
  var totalminusone = totalPages - 1;
  var requestedDate = requestedDate;
  
  //$('#entriesPagination').append("<div class='pagination'><ul>");
  var parentUl = $("<ul></ul>");

  if (totalPages <= 1) {
    parentUl.append('<li class="disabled"><a href="#">1</a></li>');
  }  
  else if (totalPages > 1) {    
    if (totalPages < 6) { // dont' bother paginating
      for (var counter = 1; counter <= totalPages; counter++) {
        if (counter == requested) {
          parentUl.append('<li class="active"><a>' + counter + '</a></li>');
        }
        else {
          parentUl.append('<li><a>' + counter + '</a></li>');
        }
      }
    }   
    else if (totalPages >= 6) {
      // beginning. only hide later pages.
      if (requested < 5) {
        for (var counter = 1; counter <= 5; counter++) {
          if (counter == requested) {
            parentUl.append('<li class="active"><a>' + counter + '</a></li>');
          }
          else {
            parentUl.append('<li><a>' + counter + '</a></li>');
          }
        }
        parentUl.append('<li class="disabled"><a>...</a></li>');
        parentUl.append('<li><a href="#">' + totalPages + '</a></li>');
      }
      // in middle; hide some front and back
      else if ( totalPages - 3 > requested) {
        parentUl.append('<li><a href="#">1</a></li>');
        parentUl.append('<li class="disabled"><a>...</a></li>');
        for (var counter = requested-1; counter < (requested + 2); counter++) {
          if (counter == requested) {
            parentUl.append('<li class="active"><a>' + counter + '</a></li>');
          }
          else {
            parentUl.append('<li><a>' + counter + '</a></li>');
          }
        }
        parentUl.append('<li class="disabled"><a>...</a></li>');
        parentUl.append('<li><a href="#">' + totalPages + '</a></li>');
      }
      // close to the end; only hide early pages
      else {
        parentUl.append('<li><a href="#">1</a></li>');
        parentUl.append('<li class="disabled"><a>...</a></li>');
        for (var counter = totalPages - 4; counter <= totalPages; counter++) {
          if (counter == requested) {
            parentUl.append('<li class="active"><a>' + counter + '</a></li>');
          }
          else {
            parentUl.append('<li><a>' + counter + '</a></li>');
          }
        }
      }
    }
    else {
      parentUl.append('<li><a href="#">1</a></li>');
      parentUl.append('<li><a href="#">2</a></li>');
      parentUl.append('<li><a href="#">3</a></li>');
      for (var counter = totalPages; counter <= totalPages; counter++) {
        if (counter == requested) {
          parentUl.append('<li class="counter"><a href="#">' + counter + '</a></li>');
        }   
        else {
          parentUl.append('<li><a>' + counter + '</a></li>');
        }
      }
      if (requested < totalPages - 1){
        parentUl.append('<li><a href="#">Next</a></li>');
      }
      else {
        parentUl.append('<li class="disabled"><a href="#">Next</a></li>');
      }
    }
  }
  var paginationDiv = $('<div class="pagination"></div>');
  paginationDiv.append(parentUl);
  $('#entriesPagination').append(paginationDiv);
  
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
    getUsersEntries(1,'');
  });
};