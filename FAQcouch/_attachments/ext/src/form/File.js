/**
 * @class Ext.form.File
 * @extends Ext.form.Text

A file upload field which has custom styling and allows control over the button text and other
features of {@link Ext.form.Text text fields} like {@link Ext.form.Text#emptyText empty text}.
It uses a hidden file input element behind the scenes to allow user selection of a file and to
perform the actual upload during {@link Ext.form.Basic#submit form submit}.

Because there is no secure cross-browser way to programmatically set the value of a file input,
the standard Field `setValue` method is not implemented. The `{@link #getValue}` method will return
a value that is browser-dependent; some have just the file name, some have a full path, some use
a fake path.

#Example Usage:#

    Ext.create('Ext.form.FormPanel', {
        renderTo: Ext.getBody(),
        width: 500,
        frame: true,
        title: 'Upload a Photo',
        bodyPadding: 10,

        items: [{
            xtype: 'filefield',
            name: 'photo',
            fieldLabel: 'Photo',
            labelWidth: 50,
            msgTarget: 'side',
            allowBlank: false,
            anchor: '100%',
            buttonText: 'Select Photo...'
        }],

        buttons: [{
            text: 'Upload',
            handler: function() {
                var form = this.up('form').getForm();
                if(form.isValid()){
                    form.submit({
                        url: 'photo-upload.php',
                        waitMsg: 'Uploading your photo...',
                        success: function(fp, o) {
                            Ext.Msg.alert('Success', 'Your photo "' + o.result.file + '" has been uploaded.');
                        }
                    });
                }
            }
        }]
    });

 * @constructor
 * Create a new File field
 * @param {Object} config Configuration options
 * @xtype filefield
 * @markdown
 * @docauthor Jason Johnston <jason@sencha.com>
 */
Ext.define("Ext.form.File", {
    extend: 'Ext.form.Text',
    alias: ['widget.filefield', 'widget.fileuploadfield'],
    alternateClassName: ['Ext.form.FileUploadField', 'Ext.ux.form.FileUploadField'],
    uses: ['Ext.button.Button', 'Ext.layout.component.form.File'],

    /**
     * @cfg {String} buttonText The button text to display on the upload button (defaults to
     * 'Browse...').  Note that if you supply a value for {@link #buttonCfg}, the buttonCfg.text
     * value will be used instead if available.
     */
    buttonText: 'Browse...',

    /**
     * @cfg {Boolean} buttonOnly True to display the file upload field as a button with no visible
     * text field (defaults to false).  If true, all inherited Text members will still be available.
     */
    buttonOnly: false,

    /**
     * @cfg {Number} buttonMargin The number of pixels of space reserved between the button and the text field
     * (defaults to 3).  Note that this only applies if {@link #buttonOnly} = false.
     */
    buttonMargin: 3,

    /**
     * @cfg {Object} buttonCfg A standard {@link Ext.button.Button} config object.
     */

    /**
     * @event change
     * Fires when the underlying file input field's value has changed from the user
     * selecting a new file from the system file selection dialog.
     * @param {Ext.ux.form.FileUploadField} this
     * @param {String} value The file value returned by the underlying file input field
     */

    /**
     * @property fileInputEl
     * @type {Ext.core.Element}
     * A reference to the invisible file input element created for this upload field. Only
     * populated after this component is rendered.
     */

    /**
     * @property button
     * @type {Ext.button.Button}
     * A reference to the trigger Button component created for this upload field. Only
     * populated after this component is rendered.
     */

    /**
     * @cfg {String} fieldBodyCls
     * An extra CSS class to be applied to the body content element in addition to {@link #fieldBodyCls}.
     * Defaults to 'x-form-file-wrap' for file upload field.
     */
    fieldBodyCls: Ext.baseCSSPrefix + 'form-file-wrap',


    // private
    readOnly: true,
    componentLayout: 'filefield',

    // private
    onRender: function() {
        var me = this,
            inputEl;

        me.callParent(arguments);

        me.createButton();
        me.createFileInput();

        inputEl = me.inputEl;
        inputEl.dom.removeAttribute('name'); //name goes on the fileInput, not the text input
        if (me.buttonOnly) {
            inputEl.setDisplayed(false);
        }
    },

    /**
     * @private
     * Creates the custom trigger Button component. The fileInput will be inserted into this.
     */
    createButton: function() {
        var me = this;
        me.button = Ext.widget('button', Ext.apply({
            renderTo: me.bodyEl,
            text: me.buttonText,
            cls: Ext.baseCSSPrefix + 'form-file-btn',
            preventDefault: false,
            ownerCt: me,
            style: me.buttonOnly ? '' : 'margin-left:' + me.buttonMargin + 'px'
        }, me.buttonCfg));
    },

    /**
     * @private
     * Creates the file input element. It is inserted into the trigger button component, made
     * invisible, and floated on top of the button's other content so that it will receive the
     * button's clicks.
     */
    createFileInput : function() {
        var me = this;
        me.fileInputEl = me.button.el.createChild({
            name: me.getName(),
            cls: Ext.baseCSSPrefix + 'form-file-input',
            tag: 'input',
            type: 'file',
            size: 1
        }).on('change', me.onFileChange, me);
    },

    /**
     * @private Event handler fired when the user selects a file.
     */
    onFileChange: function() {
        var me = this;
        me.lastValue = null; // force change event to get fired even if the user selects a file with the same name
        Ext.form.File.superclass.setValue.call(me, me.fileInputEl.dom.value);
    },

    /**
     * Overridden to do nothing
     * @hide
     */
    setValue: Ext.emptyFn,

    reset : function(){
        this.fileInputEl.remove();
        this.createFileInput();
        this.callParent();
    },

    onDisable: function(){
        var me = this;
        me.callParent();
        me.fileInputEl.dom.disabled = true;
        me.button.disable();
    },

    onEnable: function(){
        var me = this;
        me.callParent();
        me.fileInputEl.dom.disabled = false;
        me.button.enable();
    },

    isFileUpload: function() {
        return true;
    },

    getFileInput: function() {
        return this.fileInputEl.dom;
    },

    onDestroy: function(){
        Ext.destroyMembers(this, 'fileInputEl', 'button');
        this.callParent();
    }


});
