function(doc) {
  if (doc.categoryName) {
    emit(doc.categoryName,doc);
  }
}