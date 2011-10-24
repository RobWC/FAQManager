//file that contains all of the shared fuctions used in the tool
var databaseName = 'faqman';
var dataName = 'faq';

function Category(categoryName) {
	if (!!name) {
		this.categoryName = categoryName;
	} else {
		this.categoryName = '';
	}
};

Category.prototype = {
	constructor: Category,
	refreshData: function() {
		//reload that category
		var self = this;
		var id = this._id;
		//get category data
		//fill out in this object
	},
	saveNew: function(options) {
		var self = this;
		//save the current category
		//if its new create the views as well
		//if its not new then just save the questions
		$.getJSON("/_session",function(data,textStatus,jqXHR){
            self.creationDate = self.creationDate || Math.round(new Date().getTime()/1000.0);
            self.lastUpdateDate =  Math.round(new Date().getTime()/1000.0);
            self.creatorUser = self.creatorUser || data.userCtx.name;
            self.lastUpdateUser = self.currentUser || data.userCtx.name;
            var recordAsObject = self.toObject();
            $.getJSON("/_uuids",function(data,textStatus,jqXHR){
    			self._id = data.uuids[0];
    			$.ajax({url:"/" + dataName + "/" + self._id, type:"PUT", data: JSON.stringify(recordAsObject), dataType: "JSON",
         			success: function(data,statusText,jqXHR){
         				self._rev = data.rev;
        				console.log(data);
        				//create view
        				var newView = new Object();
        				newView._id = '_design/' + self.categoryName.toLowerCase();
        				newView.views = {
        					listmembers : {
        						map: 'function(doc) {if (doc.category == "' + self.categoryName + '") {emit(doc._id, doc);} else if (doc.category.length != null) {var i;for (i in doc.category) {if (doc.category[i] == "' + self.categoryName + '") {emit(doc._id, doc)}}}}'        					}
        				};
        				$.ajax({url:"/" + dataName + "/" + newView._id, type:"PUT", data: JSON.stringify(newView), dataType: "JSON",
        	     			success: function(data,statusText,jqXHR){
        	     				//if success execute callback
        	     				if (false && options.callback) {
        	     					options.callback(true);
        	     				} else {
        	     					options.callback(false);
        	     				};
        	     				console.log(data);
        	     			}
        				});
         			}
         		});
    		});
		});
	},
	toObject: function() {
		//return the category to an object
		this.data = {
			categoryName: this.categoryName,
			type: 'category',
			creationDate: this.creationDate,
        	lastUpdateDate: this.lastUpdateDate,
        	creatorUser: this.creatorUser,
        	lastUpdateUser: this.lastUpdateUser
		};
        
        if (!!this._rev) {
            this.data._rev = this._rev;
        };
        
        if (!!this._id) {
            this.data._id = this._id;
        };
        return this.data;
	}
};

function Record(_id) {
    if (!!_id) {
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
    	if (!!self._id) {
    		//update the record
			$.getJSON("/_session",function(data,textStatus,jqXHR){
	            self.creationDate = self.creationDate || Math.round(new Date().getTime()/1000.0);
	            self.lastUpdateDate =  Math.round(new Date().getTime()/1000.0);
	            self.creatorUser = self.creatorUser || data.userCtx.name;
	            self.lastUpdateUser = self.currentUser || data.userCtx.name;
	            var recordAsObject = self.toObject();
	     		$.ajax({url:"/" + dataName + "/" + self._id, type:"PUT", data: JSON.stringify(recordAsObject), dataType: "JSON",
	     			success: function(data,statusText,jqXHR){
	     				self._rev = data.rev;
	    				console.log(data);
	     			}
	     		});
         	});
			
    	};
    },
    toArticle: function() {
        //take the document and return it as an HTML element as an article
    	
    	var tempDate, month, lastUpdateDateFormatted;
    	if (!!this.lastUpdateDate) {
    		tempDate = new Date(this.lastUpdateDate * 1000);
        	month = tempDate.getMonth() + 1;
        	lastUpdateDateFormatted = month + '/' + tempDate.getDate() + '/' + tempDate.getFullYear() + ' ' + tempDate.getHours() + ':' + tempDate.getMinutes();
    	} else {
    		lastUpdateDateFormatted = 'Original';
    	};
    	/*
    	var articleView = {
    			id: this._id,
    			rev: this._rev,
    			question: FAQ.textRenderer('Q: ' + this.question, '', '<div/>').,
    			answer: FAQ.textRenderer('A: ' + this.answer, '', '<div/>'),
    			category: 'Category: ' + this.category.toString(), 
    			lastupdate: 'Last Updated: ' + lastUpdateDateFormatted
    	};
		var articleTemplate = '<article id={{id}} class="record" data-rev={{rev}}>\
		<div id="question">{{question}}</div>\
		<div id="answer">{{answer}}</div>\
		<div id="category">{{category}}</div>\
		<div id="last-update">{{lastupdate}}</div>\
		<footer>\
			<nav>\
				<ul>\
					<li id="detail">\
						<button id="detail_button" class="infoButton">Detail</button>\
					</li>\
				</ul>\
			</nav>\
		</article>';
		var article = $($.mustache(articleTemplate,articleView))
    	*/
    	var article  = $('<article>',{"id":this._id,"class":"record","data-rev":this._rev})
                        .append($('<div id="question"/>').append(FAQ.textRenderer('Q: ' + this.question, '', '<div/>',true)))
                        .append($('<div id="answer"/>').append(FAQ.textRenderer('A: ' + this.answer, '', '<div/>',true)))
                        .append($('<div>', {id:"category"}).text('Category: ' + this.category.toString()))
                        .append($('<div/>',{id:'last-update'}).append('Last Updated: ' + lastUpdateDateFormatted))
                        .append(
                            $('<footer/>').append(
                            		$('<nav/>').append(
                            		$('<ul/>').append(
                            				$('<li id="detail"/>')
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
                        		.append($('<div/>',{id:'aside-question'}).addClass('aside-question').append(FAQ.textRenderer('Q: ' + this.question, false, '<div/>',false)))
                        		.append($('<div/>',{id:'aside-answer'}).addClass('aside-answer').append(FAQ.textRenderer('A: ' + this.answer, false, '<div/>',false)))
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
    		   						.append($('<textarea/>',{id:'edit-q-textarea', class: 'aside-edit',text:this.question}))
    		   				)
    		   				.append($('<div/>',{id:'aside-edit-a-div',text:'Answer: '})
    		   						.append($('<textarea/>',{id:'edit-a-textarea', class: 'aside-edit',text:this.answer}))
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
        
        if (!!this._rev) {
            this.data._rev = this._rev;
        };
        
        if (!!this._id) {
            this.data._id = this._id;
        };
        return this.data;
    }
};