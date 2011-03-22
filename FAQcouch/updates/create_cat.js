function(doc, req) {
    //grab the category name
    var category = req.query.category;
    doc.categoryName = category;
    doc.type = 'category';
    return ['tester'];
}