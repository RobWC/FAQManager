function(doc) {
    if (doc.category == "None") {
        emit(doc._id, doc);
    } else if (doc.category.length != null) {
        var i;
        for (i in doc.category) {
            if (doc.category[i] == "None") {
                emit(doc._id, doc);
            }
        }
    }
}