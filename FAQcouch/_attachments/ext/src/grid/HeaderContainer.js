/**
 * @class Ext.grid.HeaderContainer
 * @extends Ext.container.Container
 *
 * Container which holds headers and is docked at the top or bottom of a TablePanel.
 * The HeaderContainer drives resizing/moving/hiding of columns within the TableView.
 * As headers are hidden, moved or resized the headercontainer is responsible for
 * triggering changes within the view.
 *
 * @xtype headercontainer
 */
Ext.define('Ext.grid.HeaderContainer', {
    extend: 'Ext.container.Container',
    uses: [
        'Ext.grid.ColumnLayout',
        'Ext.grid.column.Column',
        'Ext.menu.Menu',
        'Ext.menu.CheckItem',
        'Ext.menu.Separator',
        'Ext.grid.HeaderResizer',
        'Ext.grid.HeaderReorderer'
    ],

    alias: 'widget.headercontainer',

    cls: Ext.baseCSSPrefix + 'grid-header-ct',
    dock: 'top',

    /**
     * @cfg {Number} weight
     * HeaderContainer overrides the default weight of 0 for all docked items to 100.
     * This is so that it has more priority over things like toolbars.
     */
    weight: 100,
    defaultType: 'gridcolumn',
    /**
     * @cfg {Number} defaultWidth
     * Width of the header if no width or flex is specified. Defaults to 100.
     */
    defaultWidth: 100,
    
    
    sortAscText: 'Sort Ascending',
    sortDescText: 'Sort Descending',
    sortClearText: 'Clear Sort',
    columnsText: 'Columns',
    
    lastHeaderCls: Ext.baseCSSPrefix + 'column-header-last',
    firstHeaderCls: Ext.baseCSSPrefix + 'column-header-first',
    headerOpenCls: Ext.baseCSSPrefix + 'column-header-open',
    
    lastCellCls: Ext.baseCSSPrefix + 'grid-cell-last',
    firstCellCls: Ext.baseCSSPrefix + 'grid-cell-first',
    
    // private; will probably be removed by 4.0
    triStateSort: false,
    
    ddLock: false,
    
    dragging: false,

    /**
     * <code>true</code> if this HeaderContainer is in fact a group header which contains sub headers.
     * @type Boolean
     * @property isGroupHeader
     */

    /**
     * @cfg {Boolean} sortable
     * Provides the default sortable state for all Headers within this HeaderContainer.
     * Also turns on or off the menus in the HeaderContainer. Note that the menu is
     * shared across every header and therefore turning it off will remove the menu
     * items for every header.
     */
    sortable: true,

    initComponent: function() {
        var me = this;
            
        me.headerCounter = 0;
        me.plugins = me.plugins || [];

        // TODO: Pass in configurations to turn on/off dynamic
        //       resizing and disable resizing all together

        // Only set up a Resizer and Reorderer for the topmost HeaderContainer.
        // Nested Group Headers are themselves HeaderContainers
        if (!me.isHeader) {
            me.resizer   = new Ext.grid.HeaderResizer();
            me.reorderer = new Ext.grid.HeaderReorderer();
            me.plugins.push(me.reorderer, me.resizer);
        }

        // Base headers do not need a box layout
        if (me.isHeader && !me.items) {
            me.layout = 'auto';
        } else {
            me.layout = {
                type: 'gridcolumn',
                availableSpaceOffset: me.availableSpaceOffset,
                align: 'stretchmax',
                resetStretch: true
            };
        }
        me.defaults = me.defaults || {};
        Ext.applyIf(me.defaults, {
            width: me.defaultWidth,
            triStateSort: me.triStateSort,
            sortable: me.sortable
        });
        me.callParent();
        me.addEvents(
            /**
             * @event headerresize
             * @param {Ext.grid.HeaderContainer} ct
             * @param {Ext.grid.column.Column} header
             * @param {Number} width
             */
            'headerresize',
            
            /**
             * @event headerclick
             * @param {Ext.grid.HeaderContainer} ct
             * @param {Ext.grid.column.Column} header
             * @param {Ext.EventObject} e
             * @param {HTMLElement} t
             */
            'headerclick',
            
            /**
             * @event headerclick
             * @param {Ext.grid.HeaderContainer} ct
             * @param {Ext.grid.column.Column} header
             * @param {Ext.EventObject} e
             * @param {HTMLElement} t
             */
            'headertriggerclick',
            
            /**
             * @event headermove
             * @param {Ext.grid.HeaderContainer} ct
             * @param {Ext.grid.column.Column} header
             * @param {Number} fromIdx
             * @param {Number} toIdx
             */
            'headermove',
            /**
             * @event headerhide
             * @param {Ext.grid.HeaderContainer} ct
             * @param {Ext.grid.column.Column} header
             */
            'headerhide',
            /**
             * @event headershow
             * @param {Ext.grid.HeaderContainer} ct
             * @param {Ext.grid.column.Column} header
             */
            'headershow',
            /**
             * @event sortchange
             * @param {Ext.grid.HeaderContainer} ct
             * @param {Ext.grid.column.Column} header
             * @param {String} direction
             */
            'sortchange'
        );
    },

    onDestroy: function() {
        Ext.destroy(this.resizer, this.reorderer);
        this.callParent();
    },

    // Invalidate column cache on add
    // We cannot refresh the View on every add because this method is called
    // when the HeaderDropZone moves Headers around, that will also refresh the view
    onAdd: function(c) {
        var me = this;
        if (!c.headerId) {
            c.headerId = 'h' + (++me.headerCounter);
        }
        me.callParent(arguments);
        me.purgeCache();
    },

    // Invalidate column cache on remove
    // We cannot refresh the View on every remove because this method is called
    // when the HeaderDropZone moves Headers around, that will also refresh the view
    onRemove: function(c) {
        var me = this;
        me.callParent(arguments);
        me.purgeCache();
    },

    afterRender: function() {
        this.callParent();
        var store   = this.up('[store]').store,
            sorters = store.sorters,
            first   = sorters.first(),
            hd;

        if (first) {
            hd = this.down('gridcolumn[dataIndex=' + first.property  +']');
            if (hd) {
                hd.setSortState(first.direction, false, true);
            }
        }
    },

    afterLayout: function() {
        if (!this.isHeader) {
            var me = this,
                topHeaders = me.query('>gridcolumn:not([hidden])'),
                viewEl;

            me.callParent(arguments);

            if (topHeaders.length) {
                topHeaders[0].el.radioCls(me.firstHeaderCls);
                topHeaders[topHeaders.length - 1].el.radioCls(me.lastHeaderCls);
                // Maintain First and Last cell cls
                // TODO: move to prepareData
                if (me.view && me.view.rendered) {
                    viewEl = me.view.el;
                    viewEl.select('.'+me.firstCellCls).removeCls(me.firstCellCls);
                    viewEl.select('.'+me.lastCellCls).removeCls(me.lastCellCls);
                    viewEl.select(topHeaders[0].getCellSelector()).addCls(me.firstCellCls);
                    viewEl.select(topHeaders[topHeaders.length - 1].getCellSelector()).addCls(me.lastCellCls);
                }
            }
        }
    },

    onHeaderShow: function(header) {
        // Pass up to the GridSection
        var me = this,
            gridSection = me.ownerCt,
            menu = me.getMenu(),
            topItems, topItemsVisible,
            colCheckItem,
            itemToEnable,
            len, i;

        if (menu) {

            colCheckItem = menu.down('menucheckitem[headerId=' + header.id + ']');
            if (colCheckItem) {
                colCheckItem.setChecked(true, true);
            }

            // There's more than one header visible, and we've disabled some checked items... re-enable them
            topItems = menu.query('#columnItem>menucheckitem[checked]');
            topItemsVisible = topItems.length;
            if ((me.getVisibleGridColumns().length > 1) && me.disabledMenuItems && me.disabledMenuItems.length) {
                if (topItemsVisible == 1) {
                    Ext.Array.remove(me.disabledMenuItems, topItems[0]);
                }
                for (i = 0, len = me.disabledMenuItems.length; i < len; i++) {
                    itemToEnable = me.disabledMenuItems[i];
                    itemToEnable[itemToEnable.menu ? 'enableCheckChange' : 'enable']();
                }
                if (topItemsVisible == 1) {
                    me.disabledMenuItems = topItems;
                } else {
                    me.disabledMenuItems = [];
                }
            }
        }

        // Only update the grid UI when we are notified about base level Header shows;
        // Group header shows just cause a layout of the HeaderContainer
        if (!header.isGroupHeader) {
            if (me.view) {
                me.view.onHeaderShow(me, header, true);
            }
            if (gridSection) {
                gridSection.onHeaderShow(me, header);
            }
        }
        me.fireEvent('headershow', me, header);

        // The header's own hide suppresses cascading layouts, so lay the headers out now
        me.doLayout();
    },

    onHeaderHide: function(header, suppressLayout) {
        // Pass up to the GridSection
        var me = this,
            gridSection = me.ownerCt,
            menu = me.getMenu(),
            colCheckItem,
            itemsToDisable,
            itemToDisable,
            len, i;

        if (menu) {

            // If the header was hidden programmatically, sync the Menu state
            colCheckItem = menu.down('menucheckitem[headerId=' + header.id + ']');
            if (colCheckItem) {
                colCheckItem.setChecked(false, true);
            }

            // Find what to disable. If only one top level item remaining checked, we have to disable stuff.
            itemsToDisable = menu.query('#columnItem>menucheckitem[checked]');
            if ((itemsToDisable.length == 1)) {
                if (!me.disabledMenuItems) {
                    me.disabledMenuItems = [];
                }

                // If down to only one column visible, also disable any descendant checkitems
                if ((me.getVisibleGridColumns().length == 1) && itemsToDisable[0].menu) {
                    itemsToDisable = itemsToDisable.concat(itemsToDisable[0].menu.query('menucheckitem[checked]'));
                }

                len = itemsToDisable.length;
                // Disable any further unchecking at any level.
                for (i = 0; i < len; i++) {
                    itemToDisable = itemsToDisable[i];
                    if (!Ext.Array.contains(me.disabledMenuItems, itemToDisable)) {
                        itemToDisable[itemToDisable.menu ? 'disableCheckChange' : 'disable']();
                        me.disabledMenuItems.push(itemToDisable);
                    }
                }
            }
        }

        // Only update the UI when we are notified about base level Header hides;
        if (!header.isGroupHeader) {
            if (me.view) {
                me.view.onHeaderHide(me, header, true);
            }
            if (gridSection) {
                gridSection.onHeaderHide(me, header);
            }

            // The header's own hide suppresses cascading layouts, so lay the headers out now
            if (!suppressLayout) {
                me.doLayout();
            }
        }
        me.fireEvent('headerhide', me, header);
    },

    /**
     * Temporarily lock the headerCt. This makes it so that clicking on headers
     * don't trigger actions like sorting or opening of the header menu. This is
     * done because extraneous events may be fired on the headers after interacting
     * with a drag drop operation.
     * @private
     */
    tempLock: function() {
        this.ddLock = true;
        Ext.Function.defer(function() {
            this.ddLock = false;
        }, 200, this);
    },

    onHeaderResize: function(header, w, suppressFocus) {
        this.tempLock();
        if (this.view && this.view.rendered) {
            this.view.onHeaderResize(header, w, suppressFocus);
        }
        this.fireEvent('headerresize', this, header, w);
    },

    onHeaderClick: function(header, e, t) {
        this.fireEvent("headerclick", this, header, e, t);
    },

    onHeaderTriggerClick: function(header, e, t) {
        // generate and cache menu, provide ability to cancel/etc
        if (this.fireEvent("headertriggerclick", this, header, e, t) !== false) {
            this.showMenuBy(t, header);
        }
    },

    showMenuBy: function(t, header) {
        var menu = this.getMenu(),
            ascItem  = menu.down('#ascItem'),
            descItem = menu.down('#descItem'),
            sortableMth;

        menu.activeHeader = menu.ownerCt = header;
        // TODO: remove coupling to Header's titleContainer el
        header.titleContainer.addCls(this.headerOpenCls);

        // enable or disable asc & desc menu items based on header being sortable
        sortableMth = header.sortable ? 'enable' : 'disable';
        if (ascItem) {
            ascItem[sortableMth]();
        }
        if (descItem) {
            descItem[sortableMth]();
        }
        menu.showBy(t);
    },

    // remove the trigger open class when the menu is hidden
    onMenuDeactivate: function() {
        var menu = this.getMenu();
        // TODO: remove coupling to Header's titleContainer el
        menu.activeHeader.titleContainer.removeCls(this.headerOpenCls);
    },

    moveHeader: function(fromIdx, toIdx) {

        // An automatically expiring lock
        this.tempLock();
        this.onHeaderMoved(this.move(fromIdx, toIdx), fromIdx, toIdx);
    },

    purgeCache: function() {
        // Delete column cache - column order has changed.
        delete this.gridDataColumns;

        // Menu changes when columns are moved. It will be recreated.
        if (this.menu) {
            this.menu.destroy();
            delete this.menu;
        }
    },

    onHeaderMoved: function(header, fromIdx, toIdx) {
        var gridSection = this.ownerCt;
        if (gridSection) {
            gridSection.onHeaderMove(this, header, fromIdx, toIdx);
        }
        this.fireEvent("headermove", this, header, fromIdx, toIdx);
    },

    /**
     * Gets the menu (and will create it if it doesn't already exist)
     * @private
     */
    getMenu: function() {
        if (!this.menu) {
            this.menu = new Ext.menu.Menu({
                items: this.getMenuItems(),
                listeners: {
                    deactivate: this.onMenuDeactivate,
                    scope: this
                }
            });
        }
        return this.menu;
    },

    /**
     * Returns an array of menu items to be placed into the shared menu
     * across all headers in this header container.
     * @returns {Array} menuItems
     */
    getMenuItems: function() {
        var me = this,
            menuItems = [{
                itemId: 'columnItem',
                text: me.columnsText,
                cls: Ext.baseCSSPrefix + 'cols-icon',
                menu: me.getColumnsMenu(this)
            }];

        if (me.sortable) {
            menuItems.unshift({
                itemId: 'ascItem',
                text: me.sortAscText,
                cls: 'xg-hmenu-sort-asc',
                handler: me.onSortAscClick,
                scope: me
            },{
                itemId: 'descItem',
                text: me.sortDescText,
                cls: 'xg-hmenu-sort-desc',
                handler: me.onSortDescClick,
                scope: me
            },'-');
        }
        return menuItems;
    },

    // sort asc when clicking on item in menu
    onSortAscClick: function() {
        var menu = this.getMenu(),
            activeHeader = menu.activeHeader;

        activeHeader.setSortState('ASC');
    },

    // sort desc when clicking on item in menu
    onSortDescClick: function() {
        var menu = this.getMenu(),
            activeHeader = menu.activeHeader;

        activeHeader.setSortState('DESC');
    },

    /**
     * Returns an array of menu CheckItems corresponding to all immediate children of the passed Container which have been configured as hideable.
     */
    getColumnsMenu: function(headerContainer) {
        var menuItems = [],
            i = 0,
            item,
            items = headerContainer.query('>gridcolumn[hideable]'),
            itemsLn = items.length,
            menuItem;

        for (; i < itemsLn; i++) {
            item = items[i];
            menuItem = Ext.create('Ext.menu.CheckItem', {
                text: item.text,
                checked: !item.hidden,
                hideOnClick: false,
                headerId: item.id,
                menu: item.isGroupHeader ? this.getColumnsMenu(item) : undefined,
                checkHandler: this.onColumnCheckChange,
                scope: this
            });
            if (itemsLn === 1) {
                menuItem.disabled = true;
            }
            menuItems.push(menuItem);

            // If the header is ever destroyed - for instance by dragging out the last remaining sub header,
            // then the associated menu item must also be destroyed.
            item.on({
                destroy: Ext.Function.bind(menuItem.destroy, menuItem)
            });
        }
        return menuItems;
    },

    onColumnCheckChange: function(checkItem, checked) {
        var header = Ext.getCmp(checkItem.headerId);
        header[checked ? 'show' : 'hide']();
    },

    /**
     * Get the columns used for generating a template via TableChunker.
     * Returns an array of all columns and their
     *  - dataIndex
     *  - align
     *  - width
     *  - id
     *  @private
     */
    getColumnsForTpl: function(flushCache) {
        var cols    = [],
            headers   = this.getGridColumns(flushCache),
            headersLn = headers.length,
            i = 0,
            header;

        for (; i < headersLn; i++) {
            header = headers[i];
            cols.push({
                dataIndex: header.dataIndex,
                align: header.align,
                width: header.hidden ? 0 : header.getDesiredWidth(),
                id: header.id
            });
        }
        return cols;
    },

    /**
     * Returns the number of <b>grid columns</b> descended from this HeaderContainer.
     * Group Columns are HeaderContainers. All grid columns are returned, including hidden ones.
     */
    getColumnCount: function() {
        return this.getGridColumns().length;
    },

    /**
     * Gets the full width of all columns that are visible.
     */
    getFullWidth: function(flushCache) {
        var fullWidth = 0,
            headers     = this.getVisibleGridColumns(flushCache),
            headersLn   = headers.length,
            i         = 0;

        for (; i < headersLn; i++) {
            if (!isNaN(headers[i].width)) {
                // use headers getDesiredWidth if its there
                if (headers[i].getDesiredWidth) {
                    fullWidth += headers[i].getDesiredWidth();
                // if injected a diff cmp use getWidth
                } else {
                    fullWidth += headers[i].getWidth();
                }
            }
        }
        return fullWidth;
    },

    // invoked internally by a header when not using triStateSorting
    clearOtherSortStates: function(activeHeader) {
        var headers   = this.getGridColumns(),
            headersLn = headers.length,
            i         = 0,
            oldSortState;

        for (; i < headersLn; i++) {
            if (headers[i] !== activeHeader) {
                oldSortState = headers[i].sortState;
                // unset the sortstate and dont recurse
                headers[i].setSortState(null, true);
                //if (!silent && oldSortState !== null) {
                //    this.fireEvent('sortchange', this, headers[i], null);
                //}
            }
        }
    },

    /**
     * Returns an array of the <b>visible<b> columns in the grid. This goes down to the lowest column header
     * level, and does not return <i>grouped</i> headers which contain sub headers.
     * @param {Boolean} refreshCache If omitted, the cached set of columns will be returned. Pass true to refresh the cache.
     * @returns {Array}
     */
    getVisibleGridColumns: function(refreshCache) {
        return Ext.ComponentQuery.query(':not([hidden])', this.getGridColumns(refreshCache));
    },

    /**
     * Returns an array of all columns which map to Store fields. This goes down to the lowest column header
     * level, and does not return <i>grouped</i> headers which contain sub headers.
     * @param {Boolean} refreshCache If omitted, the cached set of columns will be returned. Pass true to refresh the cache.
     * @returns {Array}
     */
    getGridColumns: function(refreshCache) {
        var me = this,
            result = refreshCache ? null : me.gridDataColumns;

        // Not already got the column cache, so collect the base columns
        if (!result) {
            me.gridDataColumns = result = [];
            me.cascade(function(c) {
                if ((c !== me) && !c.isGroupHeader) {
                    result.push(c);
                }
            });
        }

        return result;
    },
    
    /**
     * Get the index of a leaf level header regardless of what the nesting
     * structure is.
     */
    getIndexOfHeader: function(header) {
        var columns = this.getGridColumns();
        return Ext.Array.indexOf(columns, header);
    },
    
    /**
     * Get a leaf level header by index regardless of what the nesting
     * structure is.
     */
    getHeaderByIndex: function(index) {
        var columns = this.getGridColumns();
        return columns[index];
    },

    /**
     * Maps the record data to base it on the header id's.
     * This correlates to the markup/template generated by
     * TableChunker.
     */
    prepareData: function(data, rowIdx, record, view) {
        var obj       = {},
            headers   = this.getGridColumns(),
            headersLn = headers.length,
            colIdx    = 0,
            header, value,
            metaData,
            g = this.up('tablepanel'),
            store = g.store;

        for (; colIdx < headersLn; colIdx++) {
            metaData = {
                tdCls: '',
                style: ''
            };
            header = headers[colIdx];
            value = data[header.dataIndex];

            // When specifying a renderer as a string, it always resolves
            // to Ext.util.Format
            if (Ext.isString(header.renderer)) {
                header.renderer = Ext.util.Format[header.renderer];
            }

            if (Ext.isFunction(header.renderer)) {
                value = header.renderer.call(
                    header.scope || this.ownerCt,
                    value,
                    // metadata per cell passing an obj by reference so that
                    // it can be manipulated inside the renderer
                    metaData,
                    record,
                    rowIdx,
                    colIdx,
                    store,
                    view
                );
            }

            // <debug>
            if (metaData.css) {
                // This warning attribute is used by the compat layer
                obj.cssWarning = true;
                metaData.tdCls = metaData.css;
                delete metaData.css;
            }
            // </debug>
            obj[header.id+'-modified'] = record.isModified(header.dataIndex) ? Ext.baseCSSPrefix + 'grid-dirty-cell' : Ext.baseCSSPrefix + 'grid-clean-cell';
            obj[header.id+'-tdCls'] = metaData.tdCls;
            obj[header.id+'-tdAttr'] = metaData.tdAttr;
            obj[header.id+'-style'] = metaData.style;
            obj[header.id] = value;
        }
        return obj;
    },

    expandToFit: function(header) {
        if (this.view) {
            this.view.expandToFit(header);
        }
    }
});
