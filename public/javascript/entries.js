var getUsersEntries =  function() {
    $("#entriesDisplay").html();
    $.ajax({
        url: '/entries/user/' + $("#user_id").val()
        , type: 'get'
        , dataType: 'html'
        , success: function(data) {
                    $("#entriesDisplay").html(data);
                    }
    });
}