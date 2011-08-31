function(doc, req) {
    //grab the category name
    var category = req.query.category;
    var views = new Object();
    if (doc.views == null || doc.views == undefined) {
        doc.views = {'test':''};
    }
    views = doc.views;
    //create the view string
    //add the view to the map //fix /
    //var view = '{"_id":"_design/' + category.toLowerCase() + '","views": {"' + category.toLowerCase() + '": { "map": "function(doc) {if (doc.category == \\"' + category + '\\") {emit(doc._id, doc);} else if (doc.category.length != null) {var i;for (i in doc.category) {if (doc.category[i] == \\"' + category + '\\") {emit(doc._id, doc)}}}}"}}}';
    views[category.toLowerCase()] = {
        map: '"function(doc) {if (doc.category == \\"' + category + '\\") {emit(doc._id, doc);} else if (doc.category.length != null) {var i;for (i in doc.category) {if (doc.category[i] == \\"' + category + '\\") {emit(doc._id, doc)}}}}"}}}',
        reduce: '_count'
        };
    //doc.views = views;
    //return success
    if (doc.views.test == '') {
        delete doc.views.test;
    };
    doc.views = views;
    return [doc,'Created'];
}