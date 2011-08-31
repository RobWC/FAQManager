//file that contains all of the shared fuctions used in the tool
var databaseName = new String('faqman');
var dataName = new String('faq');

function Record(_id) {
    this.question = "";
    this.answer = "";
    this._rev = "";
    if (_id != null || _id != undefined) {
        this._id = _id;  
    } else {
        this._id = "";
    };
    this.category = new Array();
    //check if ID was submitted
    //if one was then use get data
    //if one wasn't used then set everything to empty
    if (_id != '' || _id != null || _id != undefined) {
        var returned = $.ajax({url:'/' + dataName + '/' + _id,type:"GET",async:false}).responseText;
        //set data
        var data = $.parseJSON(returned);
        this.answer = data.answer;
        this.category = data.category;
        this._rev = data._rev;
        this.question = data.question;
        this._id = data._id;
    };
};

Record.prototype = {
    constructor: Record,
    refreshData: function(id){
        //used to set all of the properties by giving the object the ID
        if (id != undefined) {
            var returned = $.ajax({url:'/' + databaseName + '/' + id,type:"GET",async:false}).responseText;
        //set data
            var data = $.parseJSON(returned);
            this.answer = data.answer;
            this.category = data.category;
            console.log(this.category);
            this._rev = data._rev;
            this.question = data.question;
            this._id = data._id;
            //new fields
            this.creationDate = data.creationDate;
            this.lastUpdateDate = data.lastUpdateDate;
            this.creatorUser = data.creatorUser;
            this.lastUpdateUser = data.lastUpdateUser;
        } else {
            this.answer = new String();
            this.category = new Array();
            this._rev = new String();
            this.question = new String();
            this._id = new String();
            //new fields
            this.creationDate = Math.round(new Date().getTime()/1000.0);
            this.lastUpdateDate = data.lastUpdateDate;
            this.creatorUser = data.creatorUser;
            this.lastUpdateUser = data.lastUpdateUser;
            
        };
        
        return 0;
    },
    toArticle: function() {
        //take the document and return it as an HTML element as an article
        var article  = $('<article>',{"id":this._id,"class":"record","data-rev":this._rev})
                        .append($('<div id="question"/>').text('Q: ' + this.question))
                        .append($('<div id="answer"/>').text('A: ' + this.answer))
                        .append($('<div>', {id:"category"}).text('Category: ' + this.category.toString()))
                        .append(
                            $('<footer/>').append(
                                $('<nav/>').append(
                                    $('<ul/>')
                                    .append($('<li id="edit"/>')
                                        .append($('<a id="edit_action" href="">Edit</a>')))
                                    .append($('<li id="detail"/>')
                                        .append($('<a id="detail_action" href="">Detail</a>')))
                                    .append($('<li id="delete"/>')
                                        .append($('<a id="delete_action" href="">Delete</a>')))
                                    )
                                )
                            );
        //attach event ot detail
        $('#detail',article).click(function(event){
            $('#div-aside-pane').hide("slide",{direction:"right"},500);
            //do this as a callback
            $('#details').empty();
            var articleID = $(article).attr('id');
            //grab the id of this article
            //create a record
            //create an aside from the record
            //show it om the column to the right
            var record = new Record(articleID);
            $('#details').append(record.toAside());
            $('#div-aside-panel').show("slide",{direction:"left"},500);
            return false;
        });
        return article;
    },
    toAside: function(){
        //create a new aside object and make it float out of the panel
       var aside = $('<aside/>',{id:"detail-panel",class:"aside-panel"})
                        .append($('<div/>',{id:"div-aside-panel",text:this.question, class:"starting-aside"}));
        
        return aside;
    },
    toObject: function() {
        //returns object containing all of the data at the root element
        this.data = {
            answer: this.answer,
            question: this.question,
            category: this.category,
            _rev: this._rev,
            _id: this._id
        };
        return this.data;
    }
};

var FAQ = {
    createUser: function(elementToAppendTo) {
        //fix this to pull the groups dynamically
        var adminDialog = $('<div>',{"id":"createUser", "title":"Add User"})
                                .append($('<form>',{"id":"addUserForm","class":"addUserForm"})
                                    .append($('<input>',{"id":"username","type":"text"}).before('<label>Username:</label>')).append('<br>')
                                    .append($('<input>',{"id":"password","type":"password"}).before('<label>Password:</label>')).append('<br>')
                                    .append($('<input>',{"id":"password-confirm","type":"password"}).before('<label>Confirm Password:</label>')).append('<br>')
                                    .append($('<select>',{"id":"group", "class":"selectable"}).append($('<option>',{"id":"group-dns-sbu-ple","value":"dns-sbu-ple","text":"DNS SBU PLE"}),$('<option>',{"id":"group-dns-sbu-plm","value":"dns-sbu-plm","text":"DNS SBU PLM"}),$('<option>',{"id":"group-dns-sbu-pmm","value":"dns-sbu-pmm","text":"DNS SBU PMM"})).before('<label>Group:</label>')).append('<br>')
                                );
        $(elementToAppendTo).append(adminDialog);
        $("#addUser").click(function(){
            $('#createUser').dialog("open");
            return false;
        });
        $('#createUser').dialog({
            autoOpen: false,
            closeOnEscape: true,
            minWidth: 500,
            resizable: false,
            buttons: {
                "Create User": function() {
                    //create user
                    //validate both passwords match
                    ////
                    if ($('input#password').val() === $('input#password-confirm').val()) {
                        //do add user thing
                        var name = $('input#username').val();
                        var pass = $('input#password').val();
                        var roles = new Array($('select#group').val());
                        $.couch.signup({"name" : name, "roles" : roles}, pass, {
                            success : function() {
                                //close the existing dialog
                                //popup a dialog to say this has succedded
                                $('body').append('<div title="User Created" id="create-user-dialog">User ' + $('input#username').val() + ' was successfully created in group ' + $('select#group').val() + '</>');
                                $('#createUser').dialog("close");
                                $("#create-user-dialog").dialog({
                                    modal: true,
                                    resizable: false,
                                    buttons: {
                                        Ok: function(){
                                            $(this).dialog("close");
                                            $('#create-user-dialog').remove();
                                        }
                                    } 
                                });
                            }
                        });
                    } else {
                        $('div#createUser').append('')
                    };
                    return false;
                },
                "Cancel": function() {
                    $(this).dialog("close");
                }
            }
        });
    },
    setupAdminLinks: function(){
        //setup handlers
        $("a#addRecord").evently({
            click: function() {
                if ($('#dialog').dialog('isOpen')) {
                    $('#dialog').dialog('close');
                };
                $("div#dialogCategory").empty();
                $("div#dialogCategory").append('<ol id="selectable"/>');
                $.getJSON('/' + dataName + '/_design/FAQcouch/_view/categories?reduce=false', function(data) {
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
    },
    setupManagement: function(){
        $("#management-links").append('<a id="addRecord" href="">Add Records </a>').fadeIn('slow');
        $("#management-links").append('<a href="category.html">Add Category </a>').fadeIn('slow');
        $("#management-links").append('<a href="list.html">FAQ by Category</a>').fadeIn('slow');  
    },
    setupSearch: function(){
        $("#search-area").append('<label class="ui-widget">Search: </label>').fadeIn('slow');
        $("#search-area").append('<input id="query" width="400" class="ui-widget">').fadeIn('slow');
        $("#search-area").append('<button id="submit" class="ui-widget">Submit</button>').fadeIn('slow');
        $("#search-area").append('<button id="clear" class="ui-widget">Clear</button>').fadeIn('slow',function(){
            
            $("button#submit").button();
            $("button#submit").click(function(){
                FAQ.handleSubmit();        
            });
            
            $("button#clear").button();
            $("button#clear").click(function(){
                FAQ.clearSearchResults();
            });
            
            $('#query').keypress(function(event) {
                if (event.which == 13) {
                    FAQ.handleSubmit();        
                } else if (event.which == 27) {
                    //this doesnt quite work oh well fuck it
                   FAQ.clearSearchResults();
                };
            });
            
        });
    },
    clearSearchResults: function() {
        $('#details').fadeOut('slow',function(){
            $('#details').empty();
            $('#details').fadeIn();
        });
        $('#scrollie').fadeOut('slow',function(){
            $('#scrollie').empty();
            $('#scrollie').fadeIn();
            $('#scrollie').toggleClass('overflow');
        });
        $('#query').val('');
    },
    handleSubmit: function() {
        var queryValue = $("#query").val();
        var queryToStore = new Object();
        queryToStore.type = 'query';
        queryToStore.query = queryValue;
        
        var options = new Object();
        options.error = function() { alert('Could not save document!')};
        
        //$.couch.db('queries-store').saveDoc(queryToStore, options);
        //save search query in the queries dd
        
        $.getJSON('/' + dataName + '/_fti/_design/search/complete?q=' + queryValue, function(data) {
            var rows = new Array();
            rows = data.rows;
            if (rows == undefined || rows == null || rows.length == 0) {
                $("#scrollie").append('No Results Found');
            } else {
                var i;
                for (i in rows){
                    var newRecord = new Record(rows[i].id);
                    if (i == 0) {
                        $('#scrollie').append(newRecord.toArticle().addClass('first'));
                    } else if (i == (rows.length - 1)) {
                        $('#scrollie').append(newRecord.toArticle().addClass('last'));
                    } else {
                        $('#scrollie').append(newRecord.toArticle());
                    };
                };
                $('#scrollie').toggleClass('overflow');
            }
       });  
    },
    //used to delete a document from the grid view
    newEmptyDocument: function() {
        var document = {
            question: '',
            answer: '',
            category: new Array(),
            _rev: '',
            _id: ''
        };
        return document;
    },
    removeDocument: function(id, rev) {
        jQid = '#' + id
        jQuery.ajax({
            type: "DELETE",
            url: '/' + databaseName + '/' + id + '?rev=' + rev,
            success: function() {
                //pop up little window saying its deleted
                jQuery(jQid).fadeOut('slow');
            }
        });
        //remove clicked element
        return false;
    },
    //used to determine if the row is even or odd
    isEven: function(value) {
        if (value % 2 == 0) {
            return true;
        } else {
            return false;
        };
        return false;
    },
    getCatView: function(databaseName,category,reduce) {
        var reduceString;
        var view;
        if (reduce == null || reduce == undefined) {
            reduceString = '?reduce=false';
        } else if (reduce == true) {
            reduceString = '';
        } else if (reduce == false) {
            reduceString = '?reduce=false';
        }

        category = category.replace("\/", "%2F");
        
        if (category == 'none') {
            view = '/' + databaseName + '/_design/FAQcouch/_view/none_category?reduce=false';
        } else if (category == 'Show All') {
            view = '_view/questions_list' + reduceString;
        } else if (category != '') {
            view = '/' + databaseName + '/_design/' + category.toLowerCase() + '/_view/listmembers';
        } else {
            //default already set
            view = '_view/questions_list' + reduceString;
        };
        //returns the correct view
        return view;
    },
    textRenderer: function(text,highlight,wrapElement) {
        //returns a jQuery object
        
        //replace specific patternss
        var patterns = {
            "<":"&lt;",
            ">":"&gt;",
            "\n":"<br>"//respect carrage returns
        };
        
        /*
         
         I need to create a way to do loops for specific elements. Here is what I want to add.
         
         Bullets - '#*'
         numbered list - '
         highlight
         bold
         underline
         italic
         
        */
        function shoe(string, pattern, replace) {
                var re = new RegExp(pattern,"gi");
                var searchString = string;
                var replacementString = replace;
                
                var matchArray;
                var resultString = new String();
                var first=0;var last=0;
                
                // find each match
                while((matchArray = re.exec(searchString)) != null) {
                    last = matchArray.index;
                    // get all of string up to match, concatenate
                    resultString += searchString.substring(first, last);
                    // add matched, with class
                    resultString += replacementString;
                    first = re.lastIndex;
                }
                // finish off string
                if (searchString != null) {
                   resultString += searchString.substring(first,searchString.length);
                };
                // insert into page    
            return resultString;
        };
        
        var jQtext = $(wrapElement, {"html": text });
        
        //itterate of the pattern
        for (key in patterns) {
            jQtext.html(shoe(jQtext.html(), key, patterns[key]));
        };
        
        if (highlight) {
            //extract the html from the string
            var tempHtml = jQtext.html();
            //loop and search through it for the highlight string
            //highlight the string
            //return the modified HTML
            jQtext.html(this.textRendererSearch(tempHtml,highlight));
        };
        
        if (jQtext.html() != null) {
            //minimize text
            if (text.length > 250) {
                var fulltext = jQtext.html();
                var mintext = jQtext.html().slice(0,250);
                var exp = $('<a href="#expand">...</a>');
                var min = $('<a href="#min">X</a>');
                var expand = function(evt) {
                    jQtext.html(fulltext);
                    jQtext.append(min);
                    //evt.stopPropagation();
                    //evt.stopImmediatePropigation();
                    evt.preventDefault();
                    exp.click(expand);
                    min.click(minimize);
                }
                var minimize = function(evt) {
                    jQtext.html(mintext);
                    jQtext.append(exp);
                    //evt.stopPropagation();
                    //evt.stopImmediatePropigation();
                    evt.preventDefault();
                    exp.click(expand);
                    min.click(minimize);
                }
                exp.click(expand);
                min.click(minimize);
                jQtext.html(mintext);
                jQtext.append(exp);
            }    
        }
        return jQtext;  
    },
    textRendererSearch: function(text,searchQuery) {
        // get pattern
        var re = new RegExp(searchQuery,"gi");
        var searchString = text;
        
        var matchArray;
        var resultString = new String();
        var first=0;var last=0;
        
        // find each match
        while((matchArray = re.exec(searchString)) != null) {
            last = matchArray.index;
            // get all of string up to match, concatenate
            resultString += searchString.substring(first, last);
            // add matched, with class
            resultString += "<span class='found'>" + matchArray[0] + "</span>";
            first = re.lastIndex;
        }
        // finish off string
        resultString += searchString.substring(first,searchString.length);
        //resultString += "</pre>";
        // insert into page
        return resultString;  
    }
};