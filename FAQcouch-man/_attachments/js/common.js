//file that contains all of the shared fuctions used in the tool
var databaseName = new String('faqman');
var dataName = new String('faq');

function Record(_id) {
    if (_id != null || _id != undefined) {
        this._id = _id;  
    } else {
        this._id = "";
    };
};

Record.prototype = {
    constructor: Record,
    refreshData: function(){
    	var self = this;
        //used to set all of the properties by giving the object the ID
        var id = this._id;
    	if (!!id && id != "") {
            var returned = $.ajax({url:'/' + dataName + '/' + id,type:"GET",async:false}).responseText;
        //set data
            var data = JSON.parse(returned);
            self.answer = data.answer;
            self.category = data.category;
            self._rev = data._rev;
            self.question = data.question;
            self._id = data._id;
            //new fields
            //lets populate these if unknown
            self.creationDate = data.creationDate;
            self.lastUpdateDate = data.lastUpdateDate;
            self.creatorUser = data.creatorUser;
            self.lastUpdateUser = data.lastUpdateUser;
            delete data;
        } else {
        	//not creating _rev as that needs to come AFTER the document is saved
        	self.answer = new String();
        	self.category = new Array();
        	self.question = new String();
        	self._id = new String();
            $.getJSON("/_uuids",function(data,textStatus,jqXHR){
    			self._id = data.uuids[0];
    		});
            //new fields
            $.getJSON("/_session",function(data,textStatus,jqXHR){
            	var currentUser = data.userCtx.name;
                self.creationDate = Math.round(new Date().getTime()/1000.0);
                self.lastUpdateDate =  Math.round(new Date().getTime()/1000.0);
                self.creatorUser = currentUser;
                self.lastUpdateUser = currentUser;
        	});
            
        };
        
        return 0;
    },
    save: function() {
    	var self = this;
    	//see if ID is set
    	//if its set then update the record
    	//if it is not set then create a new record
    	if (!!self._id && self._id != "") {
    		//update the record
			$.getJSON("/_session",function(data,textStatus,jqXHR){
	         	var currentUser = data.userCtx.name;
	             self.creationDate = self.creationDate || Math.round(new Date().getTime()/1000.0);
	             self.lastUpdateDate =  Math.round(new Date().getTime()/1000.0);
	             self.creatorUser = self.creatorUser || currentUser;
	             self.lastUpdateUser = currentUser;
	             var recordAsObject = self.toObject();
	     		$.ajax({url:"/" + dataName + "/" + self._id, type:"PUT", data: JSON.stringify(recordAsObject), dataType: "JSON",
	     			success: function(data,statusText,jqXHR){
	     				self._rev = data.rev;
	     			}
	     		});
         	});
			
    	};
    },
    toArticle: function() {
        //take the document and return it as an HTML element as an article
        var article  = $('<article>',{"id":this._id,"class":"record","data-rev":this._rev})
                        .append($('<div id="question"/>').append(FAQ.textRenderer('Q: ' + this.question, '', '<div/>')))
                        .append($('<div id="answer"/>').append(FAQ.textRenderer('A: ' + this.answer, '', '<div/>')))
                        .append($('<div>', {id:"category"}).text('Category: ' + this.category.toString()))
                        .append(
                            $('<footer/>').append(
                                $('<nav/>').append(
                                    $('<ul/>')
                                    .append($('<li id="detail"/>')
                                        .append($('<button id="detail_button" class="infoButton">Detail</button>').button()))
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
            record.refreshData();
            $('#details').append(record.toAside());
            $('#div-aside-panel').show("slide",{direction:"left"},500);
            return false;
        });
        return article;
    },
    toAside: function(){
        //create a new aside object and make it float out of the panel
       var aside = $('<aside/>',{id:"detail-panel",class:"aside-panel"})
                        .append($('<div/>',{id:"div-aside-panel", class:"starting-aside"}).attr('data-id', this._id)
                        		.append($('<div/>',{id:'aside-question'}).addClass('aside-question').append(FAQ.textRenderer('Q: ' + this.question, '', '<div/>')))
                        		.append($('<div/>',{id:'aside-answer'}).addClass('aside-answer').append(FAQ.textRenderer('A: ' + this.answer, '', '<div/>')))
                        		.append($('<div/>',{id:'aside-category'})
                        				.text('Category: ' + this.category).addClass('aside-category')
                        		).append($('<footer class="aside-footer"/>').append(
	                                $('<nav/>').append(
	                                    $('<ul id="list"/>')
	                                )
	                            )
                        ));
       var editWindow = $($('<div/>',{id:'aside-edit-div'})
    		   				.append($('<div/>',{id:'aside-edit-q-div',text:'Question: '})
    		   						.append($('<textarea/>',{id:'edit-q-textarea',text:this.question}))
    		   				)
    		   				.append($('<div/>',{id:'aside-edit-a-div',text:'Answer: '})
    		   						.append($('<textarea/>',{id:'edit-a-textarea',text:this.answer}))
    		   				)
    		   				.append($('<div/>',{id:'aside-edit-c-div',text:'Category: '})
    		   						.append($('<select/>',{id:'ed-cat-sel', size:'5', name:'ed-cat-sel', class:'hidden', multiple:'multiple'}))
    		   				)
    		   				.append($('<div/>',{id:'aside-edit-footer-div'})
    		   						.append($('<footer class="aside-edit-footer"/>').append(
    		                                $('<nav/>').append(
    		                                    $('<ul id="list"/>')
    		                                    		.append($('<li id="save"/>').append($('<button id="save_button" class="infoButton">Save</button>').button()))
    		                                    		.append($('<li id="cancel"/>').append($('<button id="cancel_button" class="infoButton">Cancel</button>').button()))
    	    		   								)
    	    		   							)
    		                                )
    		   							)
    		   			);
      
       var options = new Object();
       options.id = 'aside #list';
       options.documentID = this._id;
       options.documentRev = this._rev;
       options.originalAside = aside;
       options.callback = function(testAdmins,id,documentID,documentRev) {
    	   if (testAdmins.admins) {
        	   $(id).append($('<li id="edit"/>')
              			.append($('<button id="edit_button" class="infoButton">Edit</button>').button()));
        	   $(id).append($('<li id="delete"/>')
      					.append($('<button id="delete_button" class="infoButton">Delete</button>').button()));
        	   $(id).append($('<li id="close"/>')
     					.append($('<button id="close_button" class="infoButton">Close</button>').button()));
        	   	//add in the actions for edit and delete
        	   $(id + ' #close').click(function(event){
		            $('#div-aside-panel').hide("slide",{direction:"left"},500); 
        	   });
        	   $(id + ' #edit').click(function(event){
        		   $('#div-aside-panel').flip({
        			   	direction:'lr',
        			   	content: editWindow,
	    		   		onEnd: function(){
	    		   			//make this faster
	    		   			var options = new Object();
	    		   			options.toMultiSelect = true;
	    		   			FAQ.categoriesAsOptions(documentID,'ed-cat-sel',options);
	    		   			$('#save').click(function(event){
	    		   				//save attempted
	    		   				//call something in the record object to save this
	    		   				var id = $('#div-aside-panel').attr('data-id');
	    		   				var record = new Record(id);
	    		   				record.refreshData();
	    		   				//grab data
	    		   				record.question = $('#edit-q-textarea').val();
	    		   				record.answer = $('#edit-a-textarea').val();
	    		   				//empty array first and only accept new 
	    		   				record.category.length = 0;
	    		   				$.each($('#ed-cat-sel option[selected="selected"]'),function(index,value){
	    		   					record.category.push($(value).attr('value'));
	    		   				});
	    		   				record.save();
	    		   				$('#div-aside-panel').hide("slide",{direction:"left"},500);
	    		   				var prevArticleID = $('#' + id + ' + article').attr('id');
	    		   				$('#' + id).fadeOut('fast');
	    		   				$('#' + id).remove();
	    		   				$('#' + prevArticleID).before(record.toArticle().fadeIn('slow'));
	    		   			});
		    		   		$('#cancel').click(function(event){
		    		      	   //close edit window load the aside instead
		    		            $('#div-aside-panel').hide("slide",{direction:"left"},500);
		    		        });
	    		   		}
        		   });
        	   });
        	   $(id + ' #delete').click(function(event){
        		   var docID = documentID;
        		   var docRev = documentRev;
        		   console.log(documentID);
        		   $('body').append($('<div/>',{id:"delete-confirm",title:'Are you sure you want to delete?'})
        				   				.append('<p><span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 20px 0;"></span>This entry will be permenently deleted and can not be undone. Are you sure you want to continue?</p>')
        		   					);
        		   $('#delete-confirm').dialog({
        			   resizable: false,
        			   height: 240,
        			   width: 300,
        			   modal: true,
        			   buttons: {
        				   "Delete Entry": function(){
        	        		   //close aside, remove from list, remove from DB
		    		           $('#div-aside-panel').hide("slide",{direction:"left"},500);
		    		           $('#scrollie #' + docID).fadeOut("slow");
		    		           //make a delete action in Record!!
		    		           $.ajax({
		    		        	   type: 'DELETE',
		    		        	   url: "/" + dataName + "/" + documentID + '?rev=' + documentRev,
		    		        	   processData: true,
		    		           		success: function(data,textStatus, jqXHR){
		    		           			console.log(data);
		    		           		}
		    		           })
        					   $(this).dialog("close");
		    		           $('#delete-confirm').remove();
        				   },
        				   Cancel: function() {
        					   $(this).dialog("close");
        				   }
        			   }
        		   });
        		   //find the document ID
        		   //pop up a message "Do you want to delete this?"
        		   //if ok then delete
        		   //close aside, remove from list, remove from DB
        	   });
        	   //edit
        	   //flip detail pain and then offer a dialog to edit the content (question, answer, category)
        	   //check save
        	   //return positive feedback, possibly cake?
        	   //flip back to refreshed content, refresh search result
    	   };
       };
       FAQ.checkPermissions(dataName,options);
        //add footer, add edit/delete button
        return aside;
    },
    toObject: function() {
        //returns object containing all of the data at the root element
        this.data = {
            answer: this.answer,
            question: this.question,
            category: this.category,
            creationDate: this.creationDate,
        	lastUpdateDate: this.lastUpdateDate,
        	creatorUser: this.creatorUser,
        	lastUpdateUser: this.lastUpdateUser
        };
        
        if (this._rev != undefined) {
            this.data._rev = this._rev;
        };
        
        if (this._id != undefined) {
            this.data._id = this._id;
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
    			if (results.length > 1) {
    				for (var p in results) {
    					document.getElementById(appendTo).innerHTML += results[p];
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
        $("a#addRecord").click(function() {
                if ($('#dialog').dialog('isOpen')) {
                    $('#dialog').dialog('close');
                };
                $("div#dialogCategory").empty();
                //add categories
                $("div#dialogCategory").append($('<select/>',{id:'dialog-cat-sel', size:'5', name:'ed-cat-sel', class:'hidden', multiple:'multiple'}));
                var options = new Object();
	   			options.toMultiSelect = true;
	   			//populate the categories
	   			FAQ.categoriesAsOptions('','dialog-cat-sel',options);
	   			/*
                $("div#dialogCategory").append('<ol id="selectable"/>');
                $.getJSON('/' + dataName + '/_design/FAQcouch/_view/categories?reduce=false', function(data) {
                    var array = data.rows;
                    $.each(array, function(i, item) {
                        $("div#dialogCategory ol").append('<li class="ui-state-default">' + array[i].key + '</li>');
                    });
                });
                $('#selectable').selectable();
    			*/
                $('#dialog').dialog('open');
                return false;
            }
        );  
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
                    newRecord.refreshData();
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
    textRenderer: function(text,highlight,wrapElement,minimize) {
        //returns a jQuery object
    	//keeps old usage (if minimized is not specified then force minimization
    	if (!!minimize) {
    		minimize = true;
    	}
        
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