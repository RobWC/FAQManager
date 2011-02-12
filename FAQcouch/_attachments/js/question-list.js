//when document is ready do stuff
        
jQuery(document).ready(function($){
    
    //setup boxes
    
    //load categories
    $.getJSON('_view/categories/', function(data){
        var array = data.rows;
        $.each(array, function(i, item){
            $("#category").append('<option value="' + array[i].key + '">  '+ array[i].key + '<\/option>');
        });
    });
    
    //load questions
    getContent('','');
    $('#dialog').dialog({ autoOpen: false, closeOnEscape: true, minWidth: 500, resizable: false });
    
    function getContent(category,activatingElement) {
        //total items to gather
        //get the next set of elements
        var getData = new Object();
        //set the number of items
        
        if (activatingElement) {
            //activated by element
            getData.limit = $('#rowCount').val();
            if (activatingElement != 'category') {
                getData.skip = 1;
            }
        } else {
            //inital get
            getData.limit = $('#rowCount').val();
        };
       
        //setting the default docs
        var firstDoc, lastDoc;
        //setting the default view
        var view;
        //determine the last element and grab its id
        if ($("#faqTable tr[id]").get(0) != null) {
            firstDoc = $("#faqTable tr[id]").get(0).id;
        };
        if ($("#faqTable tr[id]").get(-1) != null ) {
            lastDoc = $("#faqTable tr[id]").get(-1).id;
        };
        
        //grab the current category
        if (category != '') {
            view = '/faqcouch/_design/' + category.toLowerCase() + '/_view/' + category.toLowerCase();
        } else {
            //default already set
            view = '_view/questions_list';
        };
        
        //ordering
        if (activatingElement == 'nextPageLink') {
            getData.descending = 'false';
            getData.startkey = '"' + lastDoc + '"';
            //getData.startkey_docid = lastDoc;
        } else if (activatingElement == 'prevPageLink') {
            getData.descending = 'true';
            getData.startkey = '"' + firstDoc + '"';
            //getData.startkey_docid = firstDoc;
        } else if (activatingElement == 'category') {
            //loading new dataset
        };

        $.getJSON(view , getData, function(data){
            //update view with new questions
            $("#faqTable tr[id]").remove();
            
            var array = new Array();
            array = data.rows;
            
            var offset = parseFloat(data.offset);
            var totalRows = parseFloat(data.total_rows);
            var items = parseFloat($('#rowCount').val());
            
            if (activatingElement == 'prevPageLink') {   
                //reverse sort
                array.reverse();
            };
            
            var i;
            for (i in array){
                var css;
                if (isEven(i)) {
                    css = 'class="even"';   
                } else {
                    css = 'class="odd"';
                };
                $("#faqTable tbody#main").append('<tr id="' + array[i].value._id + '" data-rev="' + array[i].value._rev + '"' + css + '><td>' + array[i].value.question + '<\/td><td>' + array[i].value.answer + '<\/td><td>' + array[i].value.category + '<\/td><td class="actions"><a id="detail' + i.toString() + '" href="">Detail<\/a> <a id="delete' + i.toString() + '" href="">Delete<\/a><\/td><\/tr>');
            };
            

            $("#faqTable tbody > tr > td a[id^='detail']").evently({
                click: function() {
                    if ($('#dialog').dialog('isOpen')) {
                        $('#dialog').dialog('close');
                        
                    };
                    
                    $('#dialog').empty();     
                    
                    var rowID = $('#' + this.id).parent().parent().attr('id');
                    
                    $.getJSON('/faqcouch/' + rowID, function(data){
                        
                        if (data._id) {
                            $('#dialog').append('<div id="dialogContent" data-id="' + data._id + '" data-rev="' + data._rev + '"><p><b>Question: </b><div id="dialogQuestion">' + data.question + '</div></p><p><b>Answer: </b><div id="dialogAnswer">' + data.answer + '</div></p><p><b>Category: </b><div id="dialogCategory">' + data.category + '</div></p>');
                        };
                        
                        //events for dialogQuestion
                        $("#dialogQuestion").evently({
                            dblclick: function(){
                                //take text and place into text area
                                $("div#dialogQuestion").contents().filter(function() {
                                    var content = this.textContent;
                                    $("div#dialogQuestion").append('<div id="hiddenQuestion" data-question="' + content + '" />')
                                    return this.textContent }).wrap('<textarea class="editDialog" width="400"/>');
                                //test for controls
                                if ($('#dialogSaveControls').length) {
                                    //do nothing
                                } else {
                                    addDialogButtons();
                                    //add save button, reset, cancel
                                }    
                            }
                        });
                        
                        //events for dialogAnswer
                        $("#dialogAnswer").evently({
                            dblclick: function(){
                                //take text and place into text area
                                $("div#dialogAnswer").contents().filter(function() {
                                    var content = this.textContent;
                                    return this.textContent }).wrap('<textarea class="editDialog" width="400"/>');
                                //test for controls
                                if ($('#dialogSaveControls').length) {
                                    //do nothing
                                } else {
                                    addDialogButtons();
                                    //add save button, reset, cancel
                                }    
                            }
                        });
                        
                        //event for dialogCategory
                        $("#dialogCategory").evently({
                            dblclick: function(){
                                //figure this out
                                $("div#dialogCategory").contents().filter(function() {
                                    var content = this.textContent;
                                    $("div#dialogCategory").empty();
                                    $("div#dialogCategory").append('<div id="hiddenCategories" data-categories="' + content + '" />');
                                    var currentCategories = content.split(',');
                                    console.log(currentCategories);
                                    $("div#dialogCategory").append('<ol id="selectable"/>');
                                    $.getJSON('_view/categories/', function(data){
                                        var array = data.rows;
                                        $.each(array, function(i, item){
                                            var x;
                                            var match = new Boolean(false);
                                            for (x in currentCategories) {
                                                if (currentCategories[x] ==  array[i].key) {
                                                    $("#dialogCategory ol").append('<li class="ui-state-default ui-selected">' + array[i].key + '</li>');
                                                    match = true;
                                                };
                                            };
                                            if (match == false) {
                                                $("#dialogCategory ol").append('<li class="ui-state-default">' + array[i].key + '</li>');
                                            };
                                        });
                                    });
                                    $('#selectable').selectable();

                                });
                                //test for controls
                                if ($('#dialogSaveControls').length) {
                                    //do nothing
                                } else {
                                    addDialogButtons();
                                    //add save button, reset, cancel
                                }    
                            }
                        });
                        
                    });
                    //set title
                    //set question
                    //set answer
                    //set categories
                    $('#dialog').dialog('open');
                    return false;
                }
            });
            
            //event handler for the click button
            $("#faqTable tbody > tr > td a[id^='delete']").evently({
                click: function() {
                    var rowID = $('#' + this.id).parent().parent().attr('id');
                    var rowRev = $('#' + this.id).parent().parent().attr('data-rev');
                    removeDocument(rowID, rowRev);
                    //renormalize the colors
                    return false;
                }
            });
            
            //handle if the next page link href was clicked
            if (activatingElement == 'nextPageLink') {
                //next clicked
                if (offset + items < totalRows) {
                    $('#nextPageLink').removeAttr('href');
                    $('#nextPageLink').attr('href',' ');
                    if ($('#nextPageLink').hasClass('gray') == true) {
                        $('#nextPageLink').removeClass('gray');
                    };
                } else {
                    if ($('#nextPageLink').attr('href') != true) {
                        $('#nextPageLink').addClass('gray');
                    };
                    if ($('#nextPageLink').attr('href') != true) {
                        $('#nextPageLink').removeAttr('href');
                    };
                }
                
                //set previous: Can I go back?
                if (offset >= 1) {
                    $('#prevPageLink').removeAttr('href');
                    $('#prevPageLink').attr('href',' ');
                    if ($('#prevPageLink').hasClass('gray') == true) {
                        $('#prevPageLink').removeClass('gray');
                    };
                } else {
                    if ($('#prevPageLink').hasClass('gray') != true) {
                        $('#prevPageLink').addClass('gray');
                    };
                    if ($('#prevPageLink').attr('href') != true) {
                        $('#prevPageLink').removeAttr('href');    
                    };    
                };
            //handler if the prev page link button was clicked
            } else if (activatingElement == 'prevPageLink') {
                 if (offset + items < totalRows) {
                    $('#prevPageLink').removeAttr('href');
                    $('#prevPageLink').attr('href',' ');
                    if ($('#prevPageLink').hasClass('gray') == true) {
                        $('#prevPageLink').removeClass('gray');
                    };
                } else {
                    if ($('#prevPageLink').hasClass('gray') != true) {
                        $('#prevPageLink').addClass('gray');
                    };
                    if ($('#prevPageLink').attr('href') != true) {
                        $('#prevPageLink').removeAttr('href');    
                    };    
                }
                
                //set previous: Can I go back?
                if (offset >= 1) {
                    $('#nextPageLink').removeAttr('href');
                    $('#nextPageLink').attr('href',' ');
                    if ($('#nextPageLink').hasClass('gray') == true) {
                        $('#nextPageLink').removeClass('gray');
                    };
                } else {
                    if ($('#nextPageLink').attr('href') != true) {
                        $('#nextPageLink').addClass('gray');
                    };
                    if ($('#nextPageLink').attr('href') != true) {
                        $('#nextPageLink').removeAttr('href');
                    }; 
                };
            } else {
                //next clicked
                if (offset + items < totalRows) {
                    $('#nextPageLink').removeAttr('href');
                    $('#nextPageLink').attr('href',' ');
                    if ($('#nextPageLink').hasClass('gray') == true) {
                        $('#nextPageLink').removeClass('gray');
                    };
                } else {
                    if ($('#nextPageLink').attr('href') != true) {
                        $('#nextPageLink').addClass('gray');
                    };
                    if ($('#nextPageLink').attr('href') != true) {
                        $('#nextPageLink').removeAttr('href');
                    };
                }
                
                //set previous: Can I go back?
                if (offset >= items) {
                    $('#prevPageLink').removeAttr('href');
                    $('#prevPageLink').attr('href',' ');
                    if ($('#prevPageLink').hasClass('gray') == true) {
                        $('#prevPageLink').removeClass('gray');
                    };
                } else {
                    if ($('#prevPageLink').hasClass('gray') != true) {
                        $('#prevPageLink').addClass('gray');
                    };
                    if ($('#prevPageLink').attr('href') != true) {
                        $('#prevPageLink').removeAttr('href');    
                    };    
                };    
            }
            
            //prevNextShading(nextPageLinkAccess,prevPageLinkAccess,false);
        });    
    };
    
    //respond to questions getting clicked
    $("div#nextPrev a").evently({
        click: function() {
            var elementId = this.id;
            if ($('#' + elementId).hasClass('gray')) {
                //ignore if gray
            } else {
               //use get content
                getContent($("#category").val().toLowerCase(),elementId);
                return false;
            };
        }
    });
    
            

    //respond to combo box change
    $("#category").evently({
        change: function(){
            
            var elementId = this.id;
            
            if ($("#category").val() != '') {
                getContent($("#category").val().toLowerCase(),elementId);
            } else {
                getContent('',elementId);
            };
           
        }
    });
    
    //respond to combo box change
    $("#rowCount").evently({
        change: function(){
            
            var elementId = this.id;
            
            if ($("#category").val() != '') {
                getContent($("#category").val().toLowerCase(),elementId);
            } else {
                getContent('',elementId);
            };
           
        }
    });
    
    //used to delete a document from the grid view
    function removeDocument(id,rev){
        jQid = '#'+ id
        jQuery.ajax({
            type: "DELETE",
            url: '/faqcouch/' + id + '?rev=' + rev,
            success: function(){
                    //pop up little window saying its deleted
                    jQuery(jQid).fadeOut('slow');
            }
        });
        //remove clicked element
        return false;
    };
    
    //used to determine if the row is even or odd
    function isEven(value) {
        if (value%2 == 0) {
            return true;
        } else {
            return false;
        };
        return false;
    };
    
    //adds buttions on the dialog pop up for further details on an FAQ entry
    function addDialogButtons() {
        //append HTML div
        $('#dialog').append('<div id="dialogSaveControls"><p> <button class="dialogButtons" id="save">Save Changes</button> <button class="dialogButtons" id="clear">Clear</button> <button class="dialogButtons" id="cancel">Cancel</button> </p></div>');
        //activate jqueryui buttons
        //ok button
        $('#dialogSaveControls #save, #dialogSaveControls #clear, #dialogSaveControls #cancel').button();
        //save the changes
        $('#dialogSaveControls #save').click(function(){
            //define content
            var documentUpdate = {question:'',answer:'',category:[],_rev:'',_id:''};
            //grab question content
            if ($('#dialogContent #dialogQuestion textarea').val() && $('#dialogContent #dialogQuestion textarea').val() != '' && $('#dialogContent #dialogQuestion textarea').val() != null) {
                documentUpdate.question = $('#dialogContent #dialogQuestion textarea').val();
            } else if ($('#dialogContent #dialogQuestion').text() && ($('#dialogContent #dialogQuestion textarea').val() == '' || $('#dialogContent #dialogQuestion textarea').val() == undefined)) {
                documentUpdate.question = $('#dialogContent #dialogQuestion').text();
            } else {
                //unable to save question as it is blang
                alert('explode');
            };
            //grab answer
            if ($('#dialogContent #dialogAnswer textarea').val() && $('#dialogContent #dialogAnswer textarea').val() != '' && $('#dialogContent #dialogAnswer textarea').val() != null) {
                documentUpdate.answer = $('#dialogContent #dialogAnswer textarea').val();
            } else if ($('#dialogContent #dialogAnswer').text() && ($('#dialogContent #dialogAnswer textarea').val() == '' || $('#dialogContent #dialogAnswer textarea').val() == undefined)) {
                documentUpdate.answer = $('#dialogContent #dialogAnswer').text();
            } else {
                //unable to save answer as it is blang
                alert('explode answer');
            };
            //var categories
            if ($('div#dialogCategory ol li.ui-selected') == undefined) {
                $('div#dialogCategory ol li.ui-selected').each(function(index){
                    console.log($(this).text());
                    documentUpdate.category.push($(this).text());
                });    
            } else {
                documentUpdate.category = $("div#dialogCategory").text().split(',');
            };
            
            documentUpdate._rev = $('#dialogContent').attr('data-rev');
            documentUpdate._id = $('#dialogContent').attr('data-id');
            console.log(documentUpdate);
            //send the final updatee
            $.couch.db('faqcouch').saveDoc(documentUpdate);
            /*$.ajax({
                url: '/faqcouch/' + documentUpdate.id,
                contentType: 'application/json',
                data: documentUpdate,
                type: 'POST',
                dataType: 'json',
                success: function(){
                    alert('success');
                }
                
            });*/
            //grab the values of the current fields
            //save
            //alert user that the save was successful
            //post data
            //close the dialog
            //update the record on the screen
        });
        //revert to original
        $('#dialogSaveControls #clear').click(function(){
            //grab original content
            //delete the textareas
            //insert content data-question,data-answer
            var question = $("#hiddenQuestion").attr('data-question');
            var answer = $("#hiddenAnswer").attr('data-answer');
            var categories = $("#hiddenCategories").attr('data-categories');
            
            if (question != null) {
                $("#dialogQuestion").empty();
                $("#dialogQuestion").append(question).wrap('<p/>');

            };
            
            if (answer != null) {
                $("#dialogAnswer").empty();
                $("#dialogAnswer").append(answer).wrap('<p/>');
            };
            
            if (categories != null) {
                $("#dialogCategory").empty();
                $("#dialogCategory").append(categories).wrap('<p/>');
                //add categories
            };
            
        });
        //cancel all changes and
        $('#dialogSaveControls #cancel').click(function(){
            $('#dialog').dialog('close');
        });
    };
    
});