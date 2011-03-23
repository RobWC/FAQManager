//On startup for document
jQuery(document).ready(function($){

  //set the database name for the application. This needs to be fixed. So it will be automatic.
  var databaseName = 'faq';
  
  //just incase you need to do something on startup
  
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
        
        var data = '{"_id":"_design/' + newItem.categoryName.toLowerCase() + '","views": {"' + newItem.categoryName.toLowerCase() + '": { "map": "function(doc) {if (doc.category == \\"' + newItem.categoryName + '\\") {emit(doc._id, doc);} else if (doc.category.length != null) {var i;for (i in doc.category) {if (doc.category[i] == \\"' + newItem.categoryName + '\\") {emit(doc._id, doc)}}}}"}}}';
        
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
    $.getJSON('_view/categories/', function(data){
        var array = data.rows;
        $('#categoryList tr[id]').fadeOut("slow").remove();
        $.each(array, function(i, item){
            $("#categoryList tbody").append('<tr id="' + array[i].value._id + '" data-rev="' + array[i].value._rev + '" data-category="' + array[i].key.toLowerCase() + '"><td>' + array[i].key + '</td><td><a id="delete' + i + '" href="">Delete</a></td></tr>');
        });
        
        $("#categoryList tbody > tr > td a[id^='delete']").evently({
          click: function() {
            //alert the user of this action
            var catName = $('#' + this.id).parent().parent().attr('data-category');
            var catID = $('#' + this.id).parent().parent().attr('id');
            var catRev = $('#' + this.id).parent().parent().attr('data-rev');
            var dataSend = { "category": catName };
            
            $.getJSON('/' + databaseName + '/_design/' + catName.toLowerCase() +  '/_view/' + catName.toLowerCase(), function(data){
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
            $.ajax({
                type: "DELETE",
                url: '/' + databaseName + '/' + catID + '?rev=' + catRev,
                success: function(){
                        //pop up little window saying its deleted
                        $('#' + catID).fadeOut('slow');
                }
            });
            return false;            
          }
        });
    });
  };
  
  //do inital cat draw
  drawCategories();
  
});
function removeDocument(id,rev){
    jQid = '#'+ id
    jQuery.ajax({
        type: "DELETE",
        url: '/' + databaseName + '/' + id + '?rev=' + rev,
        success: function(){
                //pop up little window saying its deleted
                jQuery(jQid).fadeOut('slow');
        }
    });
    //remove clicked element
    return false;
};