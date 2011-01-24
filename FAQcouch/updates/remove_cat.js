function(doc, req) {
    //get the category to delete
    var category = req.query.category;
    var erased = 0;
    //get the categorys from the document
    var docCategories = doc.category;
    //loop through and find the category
    for (i in docCategories) {
        if (docCategories[i] == category) {
            //if matched then remove it from the array
            docCategories.splice(i,1);
            erased = erased + 1;
        }
    }
        //if category is empty then leave it blank
    //save changes
    //respond that the cat was removed
    
    return [doc, erased + ' erased'];
}