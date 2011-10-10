$(document).ready(function() {
    //pull stats
    var databasename = 'faq';
    var dataName = 'faq';
    
    //setup login
    var loginOptions = new Object();
    loginOptions.success = function(data) {
        $("#management-links").empty();
        $("#search-area").empty();
        //check groups
        if (data.userCtx.roles.length > 0) {
            var i;
            for (i in data.userCtx.roles) {
                console.log(data.userCtx.roles[i]);

                if (data.userCtx.roles[i] == 'dns-sbu-ple' || data.userCtx.roles[i] == '_admin') {
                    FAQ.setupManagement();
                    FAQ.setupSearch();
                    FAQ.setupAdminLinks();
                    //add user dialog
                    //password management
                } else if (data.userCtx.roles[i] == 'dns-sbu-plm') {
                    FAQ.setupSearch();
                    FAQ.setupAdminLinks();
                    //add user dialog
                    //password management
                } else if (data.userCtx.roles[i] == 'dns-sbu-pmm') {
                    FAQ.setupSearch();
                } else {
                    //hide everything
                    $("#management-links").empty().fadeOut('slow');
                    $("#search-area").empty().fadeOut('slow');
                };

                if (data.userCtx.roles[i] == '_admin') {
                    $("#management-links").append('<a id="addUser" href="">Add User </a>').fadeIn('slow');
                    FAQ.createUser('body');
                };
            };
        };
    };
    
     $("#mylogin").couchLogin({
        loggedIn: function(userCtx) {
            //setup actions for user
            $.couch.session(loginOptions);
        },
        loggedOut: function() {
            //remove actions from user
            $("#management-links").empty().fadeOut('slow');
            $("#search-area").empty().fadeOut('slow');
        }
    });
    
    //setup dialogs
    $('#save-dialog').dialog({
        autoOpen: false,
        closeOnEscape: true,
        resizable: false,
        modal: true,
        buttons: {
            Ok: function() {
                $(this).dialog("close");
                $('#dialog').dialog("close");
            }
        }
    });

    $('#login-dialog').dialog({
        autoOpen: false,
        closeOnEscape: true,
        minWidth: 700,
        resizable: false,
        buttons: {
            "Login": function() {
                //do login post
                $.ajax({
                    url: '/_session',
                    type: 'POST',
                    data: ({
                        username: $('input #username').val(),
                        password: $('input #password').val()
                    }),
                    success: function(data) {
                        console.log(data);
                    }
                });
            },
            "Clear": function() {
                $('#login-form input').val('');
            }
        }
    });

    $('#dialog').dialog({
        autoOpen: false,
        closeOnEscape: true,
        minWidth: 700,
        resizable: false,
        buttons: {
            "Save Changes": function() {
                //define content
                var documentUpdate = new Record();
                documentUpdate.refreshData();
                //grab question content
                if ($('#dialogContent #dialogQuestion textarea').val() && $('#dialogContent #dialogQuestion textarea').val() != '' && $('#dialogContent #dialogQuestion textarea').val() != null) {
                    documentUpdate.question = $('#dialogContent #dialogQuestion textarea').val();
                } else if ($('#dialogContent #dialogQuestion').text() && ($('#dialogContent #dialogQuestion textarea').val() == '' || $('#dialogContent #dialogQuestion textarea').val() == undefined)) {
                    documentUpdate.question = $('#dialogContent #dialogQuestion').text();
                } else {
                    //unable to save question as it is blang
                };
                //grab answer
                if ($('#dialogContent #dialogAnswer textarea').val() && $('#dialogContent #dialogAnswer textarea').val() != '' && $('#dialogContent #dialogAnswer textarea').val() != null) {
                    documentUpdate.answer = $('#dialogContent #dialogAnswer textarea').val();
                } else if ($('#dialogContent #dialogAnswer').text() && ($('#dialogContent #dialogAnswer textarea').val() == '' || $('#dialogContent #dialogAnswer textarea').val() == undefined)) {
                    documentUpdate.answer = $('#dialogContent #dialogAnswer').text();
                } else {
                    //unable to save answer as it is blang
                };
                //var categories
                if ($('div#dialogCategory ol#selectable li.ui-selected').length != 0) {
                    $('div#dialogCategory ol#selectable li.ui-selected').each(function(index) {
                        documentUpdate.category.push($(this).text());
                    });
                } else {
                    documentUpdate.category.push('None');
                };
                //set user and time
                //grab user data
                //grab time                
                documentUpdate._rev = $('#dialogContent').attr('data-rev');
                documentUpdate._id = $('#dialogContent').attr('data-id');
                //send the final updatee
                var options = new Object();
                options.error = function() {
                    alert('unable to save update');
                };
                documentUpdate.save();
                console.log(documentUpdate);
                $('#save-dialog').dialog("open");
                //refresh source line
                //select element by id
                //empty question
                //fade in update of each
                $('#dialogContent #dialogAnswer textarea').val('');
                $('#dialogContent #dialogQuestion textarea').val('');
                $('div#dialogCategory ol#selectable li.ui-selected').removeClass('ui-selected');
            },
            "Clear": function() {
                $('#dialog div#dialogContent div#dialogQuestion textarea').val('');
                $('#dialog div#dialogContent div#dialogAnswer textarea').val('');
                $('div#dialogCategory ol#selectable li.ui-selected').removeClass('ui-selected');
            },
            "Cancel": function() {
                $(this).dialog("close");
            }
        }
    });
    
});