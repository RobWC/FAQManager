jQuery(document).ready(function($){
    var databasename = 'faq';
    
    //setup dialogs
    $('#save-dialog').dialog({
        autoOpen: false,
        closeOnEscape: true,
        resizable: false,
        modal: true,
        buttons: {
            Ok: function() {
                $(this).dialog("close");
                $('#dialog').dialog("close");
            }
        }
    });
    
    $('#dialog').dialog({
        autoOpen: false,
        closeOnEscape: true,
        minWidth: 700,
        resizable: false,
        buttons: {
            "Save Changes": function() {
                //define content
                var documentUpdate = FAQ.newEmptyDocument();
                //grab question content
                if ($('#dialogContent #dialogQuestion textarea').val() && $('#dialogContent #dialogQuestion textarea').val() != '' && $('#dialogContent #dialogQuestion textarea').val() != null) {
                    documentUpdate.question = $('#dialogContent #dialogQuestion textarea').val();
                } else if ($('#dialogContent #dialogQuestion').text() && ($('#dialogContent #dialogQuestion textarea').val() == '' || $('#dialogContent #dialogQuestion textarea').val() == undefined)) {
                    documentUpdate.question = $('#dialogContent #dialogQuestion').text();
                } else {
                    //unable to save question as it is blang
                };
                //grab answer
                if ($('#dialogContent #dialogAnswer textarea').val() && $('#dialogContent #dialogAnswer textarea').val() != '' && $('#dialogContent #dialogAnswer textarea').val() != null) {
                    documentUpdate.answer = $('#dialogContent #dialogAnswer textarea').val();
                } else if ($('#dialogContent #dialogAnswer').text() && ($('#dialogContent #dialogAnswer textarea').val() == '' || $('#dialogContent #dialogAnswer textarea').val() == undefined)) {
                    documentUpdate.answer = $('#dialogContent #dialogAnswer').text();
                } else {
                    //unable to save answer as it is blang
                };
                //var categories
                if ($('div#dialogCategory ol#selectable li.ui-selected').length != 0) {
                    $('div#dialogCategory ol#selectable li.ui-selected').each(function(index) {
                        documentUpdate.category.push($(this).text());
                    });
                } else {
                    documentUpdate.category.push('None');
                };

                documentUpdate._rev = $('#dialogContent').attr('data-rev');
                documentUpdate._id = $('#dialogContent').attr('data-id');
                //send the final updatee
                var options = new Object();
                options.error = function() {
                    alert('unable to save update');
                };
                $.couch.db(databaseName).saveDoc(documentUpdate, options);
                console.log(documentUpdate);
                $('#save-dialog').dialog("open");
                //refresh source line
                //select element by id
                //empty question
                $('tr[id="' + documentUpdate._id + '"] td[id="question"]').empty().fadeOut('slow');
                $('tr[id="' + documentUpdate._id + '"] td[id="question"]').append(documentUpdate.question).fadeIn('slow');
                //empty answer
                $('tr[id="' + documentUpdate._id + '"] td[id="answer"]').empty().fadeOut('slow');
                $('tr[id="' + documentUpdate._id + '"] td[id="answer"]').append(documentUpdate.answer).fadeIn('slow');
                //empty category
                $('tr[id="' + documentUpdate._id + '"] td[id="category"]').empty().fadeOut('slow');
                $('tr[id="' + documentUpdate._id + '"] td[id="category"]').append(documentUpdate.category).fadeIn('slow');
                //fade in update of each
                $('#dialogContent #dialogAnswer textarea').val('');
                $('#dialogContent #dialogQuestion textarea').val('');
                $('div#dialogCategory ol#selectable li.ui-selected').removeClass('ui-selected');
                
            },
            "Clear": function() {
                $('#dialog div#dialogContent div#dialogQuestion textarea').val('');
                $('#dialog div#dialogContent div#dialogAnswer textarea').val('');
                 $('div#dialogCategory ol#selectable li.ui-selected').removeClass('ui-selected');
            },
            "Cancel": function() {
                $(this).dialog("close");
            }
        }
    });
    
    //setup handlers
    $("a#addRecord").evently({
        click: function() {
            if ($('#dialog').dialog('isOpen')) {
                $('#dialog').dialog('close');
            };
            $("div#dialogCategory").empty();
            $("div#dialogCategory").append('<ol id="selectable"/>');
            $.getJSON('_view/categories?reduce=false', function(data) {
                var array = data.rows;
                $.each(array, function(i, item) {
                    $("div#dialogCategory ol").append('<li class="ui-state-default">' + array[i].key + '</li>');
                });
            });
            $('#selectable').selectable();

            $('#dialog').dialog('open');
            return false;
        }
    });
    
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
        
        $.getJSON('/' + databasename + '/_fti/_design/search/complete?q=' + queryValue, function(data) {
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
        } else if (event.which == '0') {
            $("table#answers").fadeOut('slow', function() {
                $("table#answers").empty();
                $("#query").val('');
                $('#stats-box').fadeIn('slow');
            });
        };
    });
    
    $("button#submit").button();
    $("button#submit").click(function(){
        $("table#answers").fadeIn('slow', function() {
            handleSubmit();
        });           
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