/**
 * @class Ext.grid.CellEditing
 * @extends Ext.grid.Editing
 *
 * The Ext.grid.CellEditing plugin injects editing capabilities into a GridPanel.
 *
 * The field that will be used for the editor is defined at the {@link Ext.grid.column.Column#field field}
 *
 */
Ext.define('Ext.grid.CellEditing', {
    alias: 'plugin.cellediting',
    extend: 'Ext.grid.Editing',
    requires: ['Ext.grid.CellEditor'],

    /**
     * @cfg {Number} clicksToEdit
     * <p>The number of clicks on a cell required to display the cell's editor (defaults to 2).</p>
     */
    clicksToEdit: 2,

    constructor: function() {
        this.addEvents(
            'afteredit'
        );
        this.callParent(arguments);
        this.editors = new Ext.util.MixedCollection(false, function(editor) {
            return editor.columnId;
        });
    },

    /**
     * @private
     * AbstractComponent calls destroy on all its plugins at destroy time.
     */
    destroy: function() {
        Ext.destroy(this.keyNav);
        this.callParent();
    },

    // setup event handlers for what triggers an edit
    initEditTrigger: function() {
        var me    = this,
            grid  = me.grid,
            event = me.clicksToEdit === 1 ? 'cellclick' : 'celldblclick',
            view  = grid.getView(),
            viewEl = view.el;

        me.keyNav = new Ext.util.KeyNav(viewEl, {
            enter: me.onEnterKey,
            scope: me
        });

        // View will remove the managed listener when it is destroyed
        view.mon(view, event, me.triggerEditByClick, this);
    },

    // triggers an edit by clicking or double clicking
    triggerEditByClick: function(view, cell, cellIndex, record, row, rowIndex, e) {
        var headerCt = view.headerCt,
            store    = view.store,
            header   = headerCt.getHeaderByIndex(cellIndex);
 
        this.startEdit(record, header);
    },

    /**
     * Starts editing the specified record and header.
     * @param {Ext.data.Model} record
     * @param {Ext.grid.column.Column} column
     */
    startEdit: function(record, column) {
        var me = this;
        
        if (!record) {
            return;
        }
        
        // Complete the edit now, before getting the editor's target
        // cell DOM element.  Completing the edit causes a view refresh.
        me.completeEdit();
        
        var ed   = me.getEditor(column),
            cell = me.getCell(record, column),
            value = record.get(column.dataIndex),
            grid = me.grid,
            view = grid.getView(),
            pos = view.getPosition(record, column),
            e = {
                grid: grid,
                record: record,
                field: column.dataIndex,
                value: value,
                row: pos.row,
                column: pos.column,
                cancel: false
            };

        if (ed) {
            if (me.fireEvent('beforeedit', me, e) === false || e.cancel) {
                return;
            }
            me.setActiveEditor(ed);
            me.setActiveRecord(record);
            me.setActiveColumn(column);
            
            // Defer, so we have some between view scroll to sync up the editor
            Ext.defer(ed.startEdit, 10, ed, [cell, value]);
        } else {
            // BrowserBug: WebKit & IE refuse to focus the element, rather
            // it will focus it and then immediately focus the body. This
            // temporary hack works for Webkit and IE6. IE7 and 8 are still
            // broken
            view.el.focus((Ext.isWebKit || Ext.isIE) ? 10 : false);
        }
    },

    /**
     * Complete the edit if there is an activeEditor.
     */
    completeEdit: function() {
        var activeEd = this.getActiveEditor();
        if (activeEd) {
            activeEd.completeEdit();
        }
    },

    // internal getters/setters
    setActiveEditor: function(ed) {
        this.activeEditor = ed;
    },

    getActiveEditor: function() {
        return this.activeEditor;
    },

    setActiveColumn: function(column) {
        this.activeColumn = column;
    },

    getActiveColumn: function() {
        return this.activeColumn;
    },

    setActiveRecord: function(record) {
        this.activeRecord = record;
    },

    getActiveRecord: function() {
        return this.activeRecord;
    },

    /**
     * Get an Ext.grid.CellEditor with the appropriate editing field
     * for a column.
     * @param {Ext.grid.column.Column} column
     * @returns {Ext.grid.CellEditor} editor Returns false if there is no editing field configured for the column.
     */
    getEditor: function(column) {
        var editors = this.editors,
            ed = editors.getByKey(column.id),
            field;

        if (ed) {
            return ed;
        } else {
            field = column.getEditingField();
            if (!field) {
                return false;
            }
            ed = new Ext.grid.CellEditor({
                field: column.getEditingField()
            });
            ed.columnId = column.id;
            ed.parentEl = this.grid.getEditorParent();
            // ed.parentEl should be set here.
            ed.on({
                scope: this,
                specialkey: this.onSpecialKey,
                complete: this.onEditComplete,
                canceledit: this.cancelEdit
            });
            editors.add(ed);
            return ed;
        }
    },

    /**
     * Get the cell (td) for a particular record and column.
     * @param {Ext.data.Record} record
     * @param {Ext.grid.column.Colunm} column
     * @private
     */
    getCell: function(record, column) {
        var view = this.grid.getView(),
            row  = view.getNode(record);

        return Ext.fly(row).down(column.getCellSelector());
    },

    onSpecialKey: function(ed, field, e) {
        var grid = this.grid,
            sm;
        if (e.getKey() === e.TAB) {
            sm = grid.getSelectionModel();
            if (sm.onEditorTab) {
                sm.onEditorTab(this, e);
            }
        }
    },

    onEditComplete : function(ed, value, startValue){
        var me = this,
            grid = me.grid,
            sm = grid.getSelectionModel(),
            activeColumn = me.getActiveColumn(),
            activeRecord = me.getActiveRecord(),
            dataIndex = activeColumn.dataIndex,
            row = grid.store.indexOf(activeRecord),
            col = grid.getView().headerCt.getIndexOfHeader(activeColumn),
            e = {
                grid: grid, 
                record: activeRecord,
                field: dataIndex,
                value: value,
                originalValue: startValue,
                row: row,
                col: col,
                cancel: false
            };

        me.setActiveEditor(null);
        me.setActiveColumn(null);
        me.setActiveRecord(null);
        delete sm.wasEditing;

        if (me.fireEvent('validateedit', me, e) === false || e.cancel) {
            return;
        }
        
        delete e.cancel;
        activeRecord.set(dataIndex, value);
        me.fireEvent('afteredit', me, e);
    },

    cancelEdit: function() {
        var me = this,
            viewEl = me.grid.getView().el;

        me.setActiveEditor(null);
        me.setActiveColumn(null);
        me.setActiveRecord(null);
        viewEl.focus();
    },

    /**
     * Starts editing by position (row/column)
     * @param {Object} position A position with keys of row and column.
     */
    startEditByPosition: function(position) {
        var sm = this.grid.getSelectionModel();
        if (sm.selectByPosition) {
            sm.selectByPosition(position);
        }

        var row    = position.row,
            col    = position.column,
            view   = this.grid.getView(),
            store  = view.store,
            record = store.getAt(row),
            header = view.headerCt.getHeaderByIndex(col);

        this.startEdit(record, header);
    },

    /**
     * Begin editing the currently selected cell.
     * @private
     */
    onEnterKey: function(e, t) {
        var me       = this,
            grid     = me.grid,
            selModel = grid.getSelectionModel();

        if (selModel.getCurrentPosition) {
            me.startEditByPosition(selModel.getCurrentPosition());
        }
    }
});