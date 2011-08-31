function(doc, req) {
    //grab the category name
    //create the view string
    //add the view to the map
    //return success
    var category = req.query.category;
    doc.categoryName = category;
    doc.type = 'category';
    return ['tester'];
}