function getUsersEntries() {
    //$("#entriesDisplay").append('<p>test</p>');
    $.get('/entries', function(data) {
        $("#entriesDisplay").append(data);
    });
}