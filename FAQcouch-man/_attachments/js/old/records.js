//On startup for document
    
jQuery(document).ready(function($){
  
  var databaseName = 'faqman';
  
  ///add category information
  $("div#categories").empty();
  $("div#categories").append('<ol id="selectable"/>');
  $.getJSON('_view/categories?reduce=false', function(data) {
      var array = data.rows;
      $.each(array, function(i, item) {
          $("div#categories ol").append('<li class="ui-state-default">' + array[i].key + '</li>');
      });
  });
  $('#selectable').selectable();

  $("#createButton").evently({
  click: function(){
      if ($("#question").val() != '' && $("#answer").val() != '' && $("#category").val() != '') {
        var newItem = new Object();
        newItem.category = new Array();
        newItem.question = $("#question").val();
        newItem.answer = $("#answer").val();
        //pull all categories
        $.each($('#categories ol li.ui-selected'), function(i,item){
          newItem.category.push($(item).text());
        });
        if (newItem.category.length == 0 || newItem.category == [] || newItem.category == null) {
            newItem.category.push('None');
        };
        console.log(newItem);
        $.couch.db(databaseName).saveDoc(newItem);
        $("#question").val('');
        $("#answer").val('');
        //clear categories
        $('#categories ol li.ui-selected').removeClass('ui-selected');
        $("#success").show("slow").delay(2000);
        $("#success").hide("slow");
      } else {
        $("#nodata").show("slow").delay(2000);
        $("#nodata").hide("slow");
      };
    }
  });
  $("#addCategoryButt").evently({
    click: function() {
      $.getJSON('_view/categories/', function(data){
        var array = data.rows;
        var completeHtml = new String();
        completeHtml = '<select id="categoryAdd" name="category"><option value=""></option>'
        $.each(array, function(i, item){
          completeHtml = completeHtml + '<option value="' + array[i].key + '">'+ array[i].key + '</option>'
        });
        $("#addCategoryDiv").append(completeHtml + '</select><br>');
      });
    }
  });

});
//handle events
