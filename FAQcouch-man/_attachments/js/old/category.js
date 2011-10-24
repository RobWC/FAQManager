//On startup for document
/*
 * THIS FILE CONTAINS OLD BROKEN SHIT PLEASE DO NOT USE THE COUCH (.COUCH.) 
 */
jQuery(document).ready(function($) {

    //set the database name for the application. This needs to be fixed. So it will be automatic.
    var databaseName = 'faqman';

    //just incase you need to do something on startup
    //setup dialogs
    $('#deleteDialog').dialog({
	autoOpen: false,
	closeOnEscape: true,
	resizable: false,
	modal: true,
	buttons: {
	    Ok: function(info) {
				
		var catName = $('#deleteDialog #catData').attr("data-cat-name");
		var catID = $('#deleteDialog #catData').attr("data-id");
		var catRev = $('#deleteDialog #catData').attr("data-rev");

		$.getJSON('/' + databaseName + '/_design/' + catName.toLowerCase() +  '/_view/listmembers', function(data){
		  //delete the category from all documents
		  var array = data.rows;
		  $.each(array, function(i,item){
		      $.ajax({
			url: '/' + databaseName + '/_design/FAQcouch/_update/remove_cat/' + array[i].value._id + '?category=' + catName.toLowerCase(),
			type: 'PUT',
			contentType: 'application/json',
			success: function () {
			  console.log('deleted cat from document');
			}
		      });
		    });
		});
		//delete the view
		  //get the view's rev
		$.getJSON('/' + databaseName + '/_design/' + catName.toLowerCase(), function(data){
		  var rev = data._rev;
		  //detete the view  
		  $.ajax({
		      type: "DELETE",
		      url: '/' + databaseName + '/_design/' + catName.toLowerCase() + '?rev=' + rev ,
		      contentType: 'application/json',
		      success: function(){
			      //pop up little window saying its deleted
			      console.log('view deleted');
		      }
		  });
		});
		//detete the cat document
		FAQ.removeDocument(catID,catRev);
		//$('#' + catID).fadeOut('slow');
		$('#deleteDialog #catData').remove();
		$(this).dialog("close");
	    },
	    Cancel: function() {
		$('#deleteDialog #catData').remove();
		$(this).dialog("close");
	    }
	}
    });

    //setup event handlers
    $("#createButton").evently({
	click: function() {
	    if ($("#category").val() != '') {

		//create error handler
		var options = new Object();
		options.error = function() {
		    alert('failed to create category');
		};

		var newItem = new Object();
		//fix the name
		newItem.categoryName = $("#category").val();
		newItem.type = 'category';
		$.couch.db(databaseName).saveDoc(newItem, options);

		var data = new Object();
		data._id = '_design/' + newItem.categoryName.toLowerCase();
		data.views = {
			listmembers : {
				map:'"function(doc) {if (doc.category == \\"' + newItem.categoryName + '\\") {emit(doc._id, doc);} else if (doc.category.length != null) {var i;for (i in doc.category) {if (doc.category[i] == \\"' + newItem.categoryName + '\\") {emit(doc._id, doc)}}}}"}}}'
			
			}
		};

		$("#category").val('');
		//add view here

		$.couch.db(databaseName).saveDoc(data, options);

		//say it worked.
		$("#addSuccess").show("slow").delay(2000);
		$("#addSuccess").hide("slow");
	    } else {
		$("#addName").show("slow").delay(2000);
		$("#addName").hide("slow");
	    };
	    drawCategories();
	    return false;
	}
    });

    function drawCategories() {
	$.getJSON('_view/categories?reduce=false', function(data) {
	    var array = data.rows;
	    $('#categoryList tr[id]').fadeOut("slow").remove();
	    var count = 0;
	    $.each(array, function(i, item) {
		var css;
		if (FAQ.isEven(i)) {
		    css = 'even';
		} else {
		    css = 'odd';
		};
		$("#categoryList tbody").append('<tr id="' + array[i].value._id + '" class="' + css + '" data-rev="' + array[i].value._rev + '" data-category="' + array[i].key.toLowerCase() + '" data-cat-name="' + array[i].key + '"><td>' + array[i].key + '</td><td><a id="delete' + i + '" href="">Delete</a></td></tr>');
		count++;
	    });

	    $("#categoryList tbody > tr > td a[id^='delete']").evently({
		click: function() {
		var catFullName = $('#' + this.id).parent().parent().attr('data-cat-name');
		var catName = $('#' + this.id).parent().parent().attr('data-category');
		var catID = $('#' + this.id).parent().parent().attr('id');
		var catRev = $('#' + this.id).parent().parent().attr('data-rev');
		var dataSend = {
		    "category": catName
		};
		//append name to dialog
		$('#deleteDialog').append($('<p>',{"id":'catData',"data-rev":catRev,"data-id":catID,"data-cat-name":catFullName, "text":'Are you sure you want to delete ' + catFullName + '?'}));
		//append id to dialog
		$('#deleteDialog').dialog("open");
		//alert the user of this action
		return false;
		}
	    });
	});
    };

    //do inital cat draw
    drawCategories();

});