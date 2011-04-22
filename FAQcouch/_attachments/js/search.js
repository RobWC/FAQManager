jQuery(document).ready(function($){
    var databasename = 'faq';
    function handleSubmit() {
        $("#answers").empty();
        var queryValue = $("#query").val();
        var queryToStore = new Object();
        queryToStore.type = 'query';
        queryToStore.query = queryValue;
        
        var options = new Object();
        options.error = function() { alert('Could not save document!')};
        
        $.couch.db('queries-store').saveDoc(queryToStore, options);
        //save search query in the queries dd
        
        $.getJSON('/' + databasename + '/_search?q=' + queryValue, function(data) {
            var rows = new Array();
            rows = data.rows;
            if (rows == undefined || rows == null || rows == []) {
                $("#answers").append('<tr><td>No Results Found</td></tr>');
            } else {
                var i;
                for (i in rows){
                    var count = 0;
                    $.get('/' + databasename + '/' + rows[i].id,function(data){
                        var css;
                        if (FAQ.isEven(count)) {
                            css = 'even';
                        } else {
                            css = 'odd';
                        };
                        count++;
                        //$('<img>',{ src: 'mypic.gif' }).appendTo('#mylist').wrap('<li>');
                        $('<tr>',{"class": css,"id":data._id}).appendTo('#answers');
                        
                        $('<td>' + FAQ.textRendererSearch(data.question,queryValue) + '</td>').appendTo('#' + data._id);
                        FAQ.textRenderer(data.answer,queryValue,'<td>').appendTo('#' + data._id);
                        $('<td>' + data.category + '</td>').appendTo('#' + data._id);
                        //$("#answers").append('<tr id="' + data._id + '" class="' + css + '"><td>' + FAQ.textRenderer(FAQ.textRendererSearch(data.question,queryValue).text()) + '</td><td>' +  FAQ.textRenderer(FAQ.textRendererSearch(data.answer,queryValue).text()) + '</td><td>' + data.category + '</td></tr>');
                    },'json');
                    //documentData = $.parseJSON(result.responseText);
                }   
            }
       });  
    };
    
    
    
    $('#query').keypress(function(event) {
        if (event.which == '13') {
            handleSubmit();
        };
    });
    
    $("button#submit").button();
    $("button#submit").click(function(){
        handleSubmit();
    });
    
    $("button#clear").button();
    $("button#clear").click(function(){
        $("table#answers").fadeOut('slow', function() {
            $("table#answers").empty();
        });
    });
});