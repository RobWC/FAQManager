//file that contains all of the shared fuctions used in the tool
var databaseName = 'faqman';
var dataName = 'faq';

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
                        $('div#createUser').append('');
                    };
                    return false;
                },
                "Cancel": function() {
                    $(this).dialog("close");
                }
            }
        });
    },
    categoriesAsOptions: function(documentID,appendTo,options) {
    	var worker = new Worker('js/workers/categoriesAsOptions.js');
    	var data = new Object();
    	data.cmd = 'start';
    	data.documentID = documentID;
    	var stop = new Object();
		stop.cmd = 'stop';
		worker.onmessage = function(e){
			console.log(e);
			var results = e.data;
    		if (!!results) {
    			if (results instanceof Array) {
    				for (var p in results) {
    					console.log(results[p]);
    					$('#' + appendTo).append(results[p]);
    				};
        			worker.postMessage(stop);
        			if (options.toMultiSelect) {
    		   			$('#' + appendTo).multiselect({noneSelectedText:'Select Categories'}).multiselectfilter();
    		   			$('#' + appendTo).removeClass('hidden');
        			};
    			};
    		} else {
    			console.log('else');
    			worker.postMessage(stop);
    		};
		};
    	worker.postMessage(data);
    },
    checkPermissions: function(database,options){
    	//determine what the current permissions are for the current database
    	var returnResults = {
    		admins: false,
    		readers: false
    	};
    	//check the users current groups
    	//return an object if they have read or write permissions
    	$.getJSON('/'+database+'/_security', function(data){
    		var adminsRoles = data.admins.roles;
    		var adminsNames = data.admins.names;
    		var readersRoles = data.readers.roles;
    		var readersNames = data.readers.names;
    		$.getJSON('/_session', function(data){
    			var currentUserName = data.userCtx.name;
    			var currentUserRoles = data.userCtx.roles;
    			//check roles
    			//admins
    			if (adminsRoles == [] && adminsNames == []) {
    				returnResults.admins = true;
    			} else {
        			var i, x;
    				for (i in adminsRoles) {
        				for (x in currentUserRoles) {
        					if (adminsRoles[i] == currentUserRoles[x]) {
            					returnResults.admins = true;
            				} else if (currentUserRoles[x] == '_admin'){
            					returnResults.admins = true;
            				};
        				};
        			};
        			//reset var
        			i = 0;
        			x = 0;
        			//check against admin names
        			for (i in adminsNames) {
        				if (adminsNames[i] == currentUserName) {
        					returnResults.admins = true;
        				}
        			}
    			}
    			//check roles
    			//readers
    			if (readersRoles == [] && readersNames == []) {
					returnResults.readers = true;
    			} else {
    				var i, x;
        			for (i in readersRoles) {
        				for (x in currentUserRoles) {
        					if (readersRoles[i] == currentUserRoles[x]) {
            					returnResults.readers = true;
            				};
        				};
        			};
        			//reset var
        			i = 0;
        			x = 0;
        			//check against admin names
        			for (i in readersNames) {
        				if (readersNames[i] == currentUserName) {
        					returnResults.readers = true;
        				}
        				
        			}
    			}
    			if (typeof(options.callback) !== "function") {
    				//no callback
    			} else {
    				options.callback(returnResults,options.id,options.documentID,options.documentRev);
    			}
    		});
    	});
		return returnResults;
    },
    setupAdminLinks: function(){
        //setup handlers
    	$("a#addCategory").click(function(){
    		if ($('#category-dialog').dialog('isOpen')) {
                $('#category-dialog').dialog('close');
            };
            $('#category-dialog').dialog('open');
            return false;
    	});
    	
        $("a#addRecord").click(function() {
                if ($('#dialog').dialog('isOpen')) {
                    $('#dialog').dialog('close');
                };
                $("div#dialogCategory dialog-cat-sel").empty();
                //add categories
                var options = new Object();
	   			options.toMultiSelect = true;
	   			//populate the categories
	   			FAQ.categoriesAsOptions('','dialog-cat-sel',options);
                $('#dialog').dialog('open');
                return false;
         });  
    },
    setupManagement: function(){
        $("#management-links").append('<a id="addRecord" href=""><img src="images/icons/add-item.png" /></a>',
        							  '<a id="addCategory" href=""><img src="images/icons/category.png" /></a>').fadeIn('slow');
    },
    setupSearch: function(){
        $("#search-area").append('<label class="search-text ui-widget">Search: </label>').fadeIn('slow');
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
            $('#scroll-content').height($(window).height());
            $('#scroll-content').toggleClass('overflow');
        });
        $('#query').val('');
    },
    handleSubmit: function() {
    	console.log('handle submit');
        var queryValue = $("#query").val();
        var queryToStore = new Object();
        queryToStore.type = 'query';
        queryToStore.query = queryValue;
        
        var options = new Object();
        options.error = function() { alert('Could not save document!')};
        
        //delete no results
        $('#scrollie #no-results').remove();
        
        $('#details').fadeOut('slow',function(){
            $('#details').empty();
            $('#details').fadeIn();
            $('#scrollie').fadeOut('slow',function(){
                $('#scrollie').empty();
                $('#scrollie').fadeIn();
              //$.couch.db('queries-store').saveDoc(queryToStore, options);
                //save search query in the queries dd
                
                $.getJSON('/' + dataName + '/_fti/_design/search/complete?q=' + queryValue, function(data) {
                	console.log('making query');
                    var rows = new Array();
                    rows = data.rows;
                    if (rows == undefined || rows == null || rows.length == 0) {
                        $("#scrollie").append($('<div/>',{id:'no-results'}).append('No Results Found'));
                    } else {
                        var i;
                        for (i in rows){
                            var newRecord = new Record(rows[i].id);
                            newRecord.refreshData();
                            if (i == 0) {
                                $('#scrollie').append(newRecord.toArticle().addClass('first'));
                            } else if (i == (rows.length - 1)) {
                                $('#scrollie').append(newRecord.toArticle().addClass('last'));
                            } else {
                                $('#scrollie').append(newRecord.toArticle());
                            };
                        };
                        //check to see if overflow is enabled
                        if ($('#scroll-content').hasClass('overflow')) {
                        	//overflow is enabled do nothing
                        } else {
                        	//enable overflow
                        	$('#scroll-content').height($(window).height());
                            $('#scroll-content').toggleClass('overflow');
                        }
                    }
               });  
            });
        });
        
        
        
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
    textRenderer: function(text,highlight,wrapElement,minimize) {
        //returns a jQuery object
    	//keeps old usage (if minimized is not specified then force minimization
    	if ((!!minimize || minimize == '')&& minimize != false) {
    		minimize = true;
    	};
        
        //replace specific patternss
        var patterns = {
            "<":"&lt;",
            ">":"&gt;",
            
            "\n":"<br>"//respect carrage returns
        };
        
        /*
         
         I need to create a way to do loops for specific elements. Here is what I want to add.
         
         Bullets - '*'
         numbered list - '
         highlight
         bold
         underline
         italic
         
        */
        function cleanup(string, pattern, replace) {
                var re = new RegExp(pattern,"gi");
                var searchString = string;
                var replacementString = replace;
                
                var matchArray;
                var resultString = new String();
                var first=0;var last=0;
                var firstUl = true;
                
                // find each match{
            	//simple search and replace
            	while((matchArray = re.exec(searchString)) != null) {
                    last = matchArray.index;
                    // get all of string up to match, concatenate
                    resultString += searchString.substring(first, last);
                    // add matched, with class
                    resultString += replacementString;
                    first = re.lastIndex;
                };
                
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
            jQtext.html(cleanup(jQtext.html(), key, patterns[key]));
        };
        
        if (highlight) {
            //extract the html from the string
            var tempHtml = jQtext.html();
            //loop and search through it for the highlight string
            //highlight the string
            //return the modified HTML
            jQtext.html(this.textRendererSearch(tempHtml,highlight));
        };
        
        if (!!jQtext.html() && minimize) {
            //minimize text
            if (text.length > 250) {
                var fulltext = jQtext.html();
                var mintext = jQtext.html().slice(0,250);
                var exp = $('<div id="expand">...</div>');
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
    },
    getUserStatus: function(){
    	$.getJSON("/_session",function(data,textStatus,jqXHR){
        	return data;
    	});
    	
    }
};