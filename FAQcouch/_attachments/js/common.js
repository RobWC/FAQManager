//file that contains all of the shared fuctions used in the tool
var FAQ = {
    //used to delete a document from the grid view
    removeDocument: function(id, rev) {
        jQid = '#' + id
        jQuery.ajax({
            type: "DELETE",
            url: '/' + databaseName + '/' + id + '?rev=' + rev,
            success: function() {
                //pop up little window saying its deleted
                jQuery(jQid).fadeOut('slow');
            }
        });
        //remove clicked element
        return false;
    },
    //used to determine if the row is even or odd
    isEven: function(value) {
        if (value % 2 == 0) {
            return true;
        } else {
            return false;
        };
        return false;
    },
    getCatView: function(databaseName,category,reduce) {
        var reduceString;
        var view;
        if (reduce == null || reduce == undefined) {
            reduceString = '?reduce=false';
        } else if (reduce == true) {
            reduceString = '';
        } else if (reduce == false) {
            reduceString = '?reduce=false';
        }
        
        if (category == 'none') {
            view = '/' + databaseName + '/_design/FAQcouch/_view/none_category?reduce=false';
        } else if (category != '') {
            view = '/' + databaseName + '/_design/' + category.toLowerCase() + '/_view/' + category.toLowerCase() + reduceString;
        } else {
            //default already set
            view = '_view/questions_list' + reduceString;
        };
        //returns the correct view
        return view;
    }
};