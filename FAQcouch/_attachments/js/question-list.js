//when document is ready do stuff
jQuery(document).ready(function($) {

    var databaseName = 'faq';

    //setup boxes
    //load categories
    $.get('_list/cats_as_options/categories?reduce=false', function(data) {
        $("#category").append(data);
    });

    //load questions
    getContent('','');

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

    $('#save-nchange').dialog({
        autoOpen: false,
        closeOnEscape: true,
        resizable: false,
        modal: true,
        buttons: {
            Ok: function() {
                $(this).dialog("close");
            }
        }
    });

    $('#dialog').dialog({
        autoOpen: false,
        closeOnEscape: true,
        minWidth: 700,
        resizable: false,
        buttons: {
            "Edit": function() {
                //start editing
                var documentID = $('div#dialogContent').attr('data-id');
                //get the original content
                
                $.getJSON('/' + databaseName + '/' + documentID, function(data) {
                    var document = new Object();
                    document.category = new Array();
                    document.question = new String();
                    document.answer = new String();
                    document.category = data.category;
                    document.question = data.question;
                    document.answer = data.answer;
                    
                     //events for dialogQuestion
                    $("div#dialogContent").attr('data-changed', 'true');
                    
                    //fixed
                    $("div#dialogQuestion").empty();
                    $("div#dialogQuestion").append('<div id="hiddenQuestion" data-question="' + document.question.toString() + '" />');
                    $("div#dialogQuestion").append('<p id="questionText">' + document.question.toString() + '</p>');
                    $("div#dialogQuestion p#questionText").wrapInner('<textarea class="editDialog" width="400"/>');
                    
                    $("div#dialogAnswer").empty();
                    $("div#dialogAnswer").append('<div id="hiddenAnswer" data-answer="' + document.answer.toString() + '" />');
                    $("div#dialogAnswer").append('<p id="answerText">' + document.answer.toString() + '</p>');
                    $("div#dialogAnswer p#answerText").wrapInner('<textarea class="editDialog" width="400"/>');
                    
                    var content = $("div#dialogCategory").text();
                    $("div#dialogContent").attr('data-changed', 'true');
                    $("div#dialogCategory").empty();
                    $("div#dialogCategory").append('<div id="hiddenCategories" data-categories="' + content + '" />');
                    var currentCategories = content.split(',');
                    $("div#dialogCategory").append('<ol id="selectable"/>');
                    $.getJSON('_view/categories?reduce=false', function(data) {
                        var array = data.rows;
                        $.each(array, function(i, item) {
                            var x;
                            var match = new Boolean(false);
                            for (x in currentCategories) {
                                if (currentCategories[x] == array[i].key) {
                                    $("div#dialogCategory ol").append('<li class="ui-state-default ui-selected">' + array[i].key + '</li>');
                                    match = true;
                                } else {
                                    false;
                                };
                            };
                            if (match == false) {
                                $("div#dialogCategory ol").append('<li class="ui-state-default">' + array[i].key + '</li>');
                            };
                        });
                    });
                    $('#selectable').selectable();

                
                });

                //$("div#dialogAnswer").html($("div#dialogAnswer").text().replace("<br>","\n"));
                //we need to pull the source text for this.
            },
            "Save Changes": function() {
                //define content
                var documentUpdate = {
                    question: '',
                    answer: '',
                    category: new Array(),
                    _rev: '',
                    _id: ''
                };
                //grab question content
                if ($('#dialogContent').attr('data-changed') == 'true') {
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
                    if ($('div#dialogCategory ol#selectable') != undefined) {
                        if ($('div#dialogCategory ol li.ui-selected')) {
                            $('div#dialogCategory ol li.ui-selected').each(function(index) {
                                documentUpdate.category.push($(this).text());
                            });
                        } else {
                            documentUpdate.category.push('None');
                        }
                    } else {
                        documentUpdate.category.push($("div#dialogCategory").text().split(','));
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
                } else {
                    $('#save-nchange').dialog("open");
                };
            },
            "Clear": function() {
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

            },
            "Cancel": function() {
                $(this).dialog("close");
            }
        }
    });

    function getContent(category, activatingElement) {
        //total items to gather
        //get the next set of elements
        var getData = new Object();
        //set the number of items
        if (activatingElement == 'prevPageLink' || activatingElement == 'nextPageLink') {
            //activated by element
            getData.skip = 1;
        } else {
            //inital get
        };
        getData.limit = $('#rowCount').val();

        //setting the default docs
        var firstDoc, lastDoc;
        //setting the default view
        var view;
        //determine the last element and grab its id
        if ($("#faqTable tr[id]").get(0) != null) {
            firstDoc = $("#faqTable tr[id]").get(0).id;
        };
        if ($("#faqTable tr[id]").get(-1) != null) {
            lastDoc = $("#faqTable tr[id]").get(-1).id;
        };

        //grab the current category
        view = FAQ.getCatView(databaseName, category, false);

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

        $.getJSON(view, getData, function(data) {
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
            for (i in array) {
                var css;
                if (FAQ.isEven(i)) {
                    css = 'even';
                } else {
                    css = 'odd';
                };
                //$("#faqTable tbody#main").append('<tr id="' + array[i].value._id + '" data-rev="' + array[i].value._rev + '"' + css + '><td id="question">' + FAQ.textRenderer(array[i].value.question) + '<\/td><td id="answer">' + FAQ.textRenderer(array[i].value.answer) + '<\/td><td id="category">' + array[i].value.category + '<\/td><td class="actions"><a id="detail' + i.toString() + '" href="">Detail/Edit<\/a> <a id="delete' + i.toString() + '" href="">Delete<\/a><\/td><\/tr>');
                $('<tr>', {
                    "class": css,
                    "id": array[i].value._id,
                    "data-rev": array[i].value._rev
                }).appendTo('#faqTable tbody#main');
                FAQ.textRenderer(array[i].value.question, '', '<td>').attr("id", "question").appendTo('#' + array[i].value._id);
                FAQ.textRenderer(array[i].value.answer, '', '<td>').attr("id", "answer").appendTo('#' + array[i].value._id);
                FAQ.textRenderer(array[i].value.category.toString(), '', '<td>').attr("id", "category").appendTo('#' + array[i].value._id);
                $('<td class="actions"><a id="detail' + i + '" href="">Detail/Edit<\/a> <a id="delete' + i + '" href="">Delete<\/a><\/td>').appendTo('#' + array[i].value._id);
            };


            $("#faqTable tbody > tr > td a[id^='detail']").evently({
                click: function() {
                    if ($('#dialog').dialog('isOpen')) {
                        $('#dialog').dialog('close');

                    };

                    $('#dialog').empty();

                    var rowID = $('#' + this.id).parent().parent().attr('id');

                    $.getJSON('/' + databaseName + '/' + rowID, function(data) {

                        if (data._id) {
                            ///fix this to correctly render the text
                            $('#dialog').append('<div id="dialogContent" data-id="' + data._id + '" data-rev="' + data._rev + '"><p><b>Question: </b><div id="dialogQuestion">' + data.question + '</div></p><p><b>Answer: </b><div id="dialogAnswer">' + data.answer + '</div></p><p><b>Category: </b><div id="dialogCategory">' + data.category + '</div></p>');
                        };

                    });
                    $('#dialog').dialog('open');
                    return false;
                }
            });

            //event handler for the click button
            $("#faqTable tbody > tr > td a[id^='delete']").evently({
                click: function() {
                    var rowID = $('#' + this.id).parent().parent().attr('id');
                    var rowRev = $('#' + this.id).parent().parent().attr('data-rev');
                    FAQ.removeDocument(rowID, rowRev);
                    //renormalize the colors
                    return false;
                }
            });

            //handle if the next page link href was clicked
            if (activatingElement == 'nextPageLink') {
                //next clicked
                if (offset + items < totalRows) {
                    $('#nextPageLink').removeAttr('href');
                    $('#nextPageLink').attr('href', ' ');
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
                    $('#prevPageLink').attr('href', ' ');
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
                    $('#prevPageLink').attr('href', ' ');
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
                    $('#nextPageLink').attr('href', ' ');
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
                    $('#nextPageLink').attr('href', ' ');
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
                    $('#prevPageLink').attr('href', ' ');
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

        //update total items
        $('#totalItems').empty();
/*
        //get current category
        //var currentCat = new String();
        var reduceView = new String();
        reduceView = FAQ.getCatView(databaseName,$("#category").val().toLowerCase(),true);
        //grab the total items count
        $.get(reduceView,function(data) {
            var count;
            var result = $.parseJSON(data);
            if (result.rows[0]) {
                count = result.rows[0].value;
            };
            if (count != undefined || count != null) {
                $('#totalItems').append('<p> Total Count for Current Selection: ' + count + '</p>');
            }
        });*/
        //insert into 
    };

    //respond to combo box change
    $("div#nextPrev a").evently({
        click: function() {
            var elementId = this.id;
            if ($('#' + elementId).hasClass('gray')) {
                //ignore if gray
            } else {
                //use get content
                getContent($("#category").val().toLowerCase(), elementId);
                return false;
            };
            return false;
        }
    });
    
    $("#category, #rowCount").evently({
        change: function() {
            var elementId = this.id;

            if (elementId == "category" && $("#category").val() != '') {
                getContent($("#category").val().toLowerCase(), elementId);
                return false;
            } else {
                getContent($("#category").val().toLowerCase(), elementId);
                return false;
            };
            return false;
        }
     });

});