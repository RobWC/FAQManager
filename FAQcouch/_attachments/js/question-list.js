//when document is ready do stuff
        
jQuery(document).ready(function($){
    
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
                            $('#dialog').append('<p><b>Question: </b><div id="dialogQuestion">' + data.question + '</div></p><p><b>Answer: </b><div id="dialogAnswer">' + data.answer + '</div></p><p><b>Category: </b><div id="dialogCategory">' + data.category + '</div></p>');
                        };
                        
                        $("#dialogQuestion").evently({
                            dblclick: function(){
                                 $("#dialogQuestion");
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
                        
                        $("#dialogAnswer").evently({
                            dblclick: function(){
                                //take text and place into text area
                                $("div#dialogAnswer").contents().filter(function() {
                                    var content = this.textContent;
                                    $("div#dialogAnswer").append('<div id="hiddenAnswer" data-answer="' + content + '" />')
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
                        
                         $("#dialogCategory").evently({
                            dblclick: function(){
                                //figure this out
                                $("div#dialogQuestion").contents().filter(function() {
                                    var content = this.textContent;
                                    $("div#dialogQuestion").append('<div id="hiddenQuestion" data-question="' + content + '" />')
                                    return this.textContent }).wrap('<textarea class="editDialog" width="400"/>');
                                //test for controls
                                if ($('#dialogSaveControls').length()) {
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
            
            $("#faqTable tbody > tr > td a[id^='delete']").evently({
                click: function() {
                    var rowID = $('#' + this.id).parent().parent().attr('id');
                    var rowRev = $('#' + this.id).parent().parent().attr('data-rev');
                    removeDocument(rowID, rowRev);
                    //renormalize the colors
                    return false;
                }
            });
            
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
            }
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
    
    function isEven(value) {
        if (value%2 == 0) {
            return true;
        } else {
            return false;
        };

    };
    
    function addDialogButtons() {
        //append HTML div
        $('#dialog').append('<div id="dialogSaveControls"><p> <button id="save">Save Changes</button> <button id="clear">Clear</button> <button id="cancel">Cancel</button> </p></div>');
        //activate jqueryui buttons
        //ok button
        $('#dialogSaveControls #save, #dialogSaveControls #clear, #dialogSaveControls #cancel').button();
        //save the changes
        $('#dialogSaveControls #save').click(function(){alert('woot')});
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
                //add categories
            };
            
        });
        //cancel all changes and
        $('#dialogSaveControls #cancel').click(function(){
            $('#dialog').dialog('close');
        });
    };
    
});