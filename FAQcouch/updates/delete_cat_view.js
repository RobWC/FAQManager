function(doc, req) {
    //grab the category name
    var category = req.query.category;
    var views = new Object();
    if (doc.views == null || doc.views == undefined) {
        doc.views = {'test':''};
        return [doc, 'View not found'];
    } else {
        delete doc.views[category.toLowerCase()];
        return [doc,'deleted'];
    }
}