function(head, req) {
  var options = new Object();
      options.success = function(data){
        emit(data);/*
        $("#management-links").append('<a id="addRecord" href="">Add Records </a>').fadeIn('slow');
        $("#management-links").append('<a href="category.html">Add Category </a>').fadeIn('slow');
        $("#management-links").append('<a href="list.html">FAQ by Category</a>').fadeIn('slow');*/
      };
      $.couch.session(options);  
};