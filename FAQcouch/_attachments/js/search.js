jQuery(document).ready(function($){
    var databasename = 'faq';
    function handleSubmit() {
        $('#stats-box').fadeOut('fast');
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
            if (rows == undefined || rows == null || rows.length == 0) {
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
                        $('<tr>',{"class": css,"id":data._id}).appendTo('#answers');
                        
                        FAQ.textRenderer(data.question,queryValue,'<td>').appendTo('#' + data._id);
                        FAQ.textRenderer(data.answer,queryValue,'<td>').appendTo('#' + data._id);
                        $("#" + data._id).append($("<td>").text(data.category.toString()));
                    },'json');
                    //documentData = $.parseJSON(result.responseText);
                }   
            }
       });  
    };
    
    
    
    $('#query').keypress(function(event) {
        if (event.which == '13') {
        $("table#answers").fadeIn('slow', function() {
                 handleSubmit();
            });           
        };
    });
    
    $("button#submit").button();
    $("button#submit").click(function(){
        $("table#answers").fadeIn('slow', function() {
            handleSubmit();
        });           
    });
    
    $('#query').keypress(function(event) {
        if (event.which == '0') {
            $("table#answers").fadeOut('slow', function() {
                $("table#answers").empty();
                $("#query").val('');
                $('#stats-box').fadeIn('slow');
            });
        };
    });
    
    $("button#clear").button();
    $("button#clear").click(function(){
        $("table#answers").fadeOut('slow', function() {
            $("table#answers").empty();
            $("#query").val('');
            $('#stats-box').fadeIn('slow');
        });
    });
});