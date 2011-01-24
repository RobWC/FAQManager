function(doc) {
    if (doc.category && doc.question && doc.answer) {
        emit(doc._id, doc);
    };
}