//file that contains all of the shared fuctions used in the tool
var databaseName = new String('faq');

function Record(_id) {
    this.question = "";
    this.answer = "";
    this._rev = "";
    this._id = "";
    this.category = new Array();
    //check if ID was submitted
    //if one was then use get data
    //if one wasn't used then set everything to empty
    if (_id != '' || _id != null || _id != undefined) {
        var returned = $.ajax({url:'/' + databaseName + '/' + _id,type:"GET",async:false}).responseText;
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
        var returned = $.ajax({url:'/' + databaseName + '/' + id,type:"GET",async:false}).responseText;
        //set data
        var data = $.parseJSON(returned);
        this.answer = data.answer;
        this.category = data.category;
        this._rev = data._rev;
        this.question = data.question;
        this._id = data._id;
        return 0;
    },
    toArticle: function() {
        //take the document and return it as an HTML element as an article
        var article  = $('<article>',{"id":this._id,"class":"record","data-rev":this._rev})
                        .append($('<div id="question"/>').text(this.question))
                        .append($('<div id="answer"/>').text(this.answer))
                        .append($('<div id="category"/>').text(this.category))
                        .append(
                            $('<footer/>').append(
                                $('<nav/>').append(
                                    $('<ul/>')
                                    .append($('<li id="edit"/>')
                                        .append($('<a id="edit_action" href=""/>')
                                                .append('<img src="/img/edit.png"/>')
                                            )
                                        )
                                    .append($('<li id="detail"/>')
                                        .append($('<a id="detail_action" href=""/>')
                                                .append('<img src="/img/detail.png"/>')
                                            )
                                        )
                                    .append($('<li id="delete"/>')
                                        .append($('<a id="delete_action" href=""/>')
                                                .append('<img src="/img/del.png"/>')
                                            )
                                        )
                                    )
                                )
                            );
        return article;
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
                    console.log(evt);
                    exp.click(expand);
                    min.click(minimize);
                }
                var minimize = function(evt) {
                    jQtext.html(mintext);
                    jQtext.append(exp);
                    //evt.stopPropagation();
                    //evt.stopImmediatePropigation();
                    evt.preventDefault();
                    console.log(evt);
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