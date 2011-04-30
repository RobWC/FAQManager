//file that contains all of the shared fuctions used in the tool
var FAQ = {
    //used to delete a document from the grid view
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
        
        if (category == 'none') {
            view = '/' + databaseName + '/_design/FAQcouch/_view/none_category?reduce=false';
        } else if (category != '') {
            view = '/' + databaseName + '/_design/' + category.toLowerCase() + '/_view/' + category.toLowerCase();
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
            "\n":"<br>" //respect carrage returns
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