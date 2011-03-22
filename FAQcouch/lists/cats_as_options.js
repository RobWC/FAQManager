function(head, req) {
    start({
        "headers": {
            "Content-Type": "text/html"
        }
    });
    var row;
    while(row = getRow()) {
        if (row.value.categoryName) {
            send('<option value="' + row.value.categoryName + '">'+ row.value.categoryName + '<\/option>');
        }
    }
}