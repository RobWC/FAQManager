/**
 * @author Ed Spencer
 * @class Ext.data.HasManyAssociation
 * @extends Ext.data.Association
 * 
 * <p>Represents a one-to-many relationship between two models. Usually created indirectly via a model definition:</p>
 * 
<pre><code>
Ext.regModel('Product', {
    fields: [
        {name: 'id',      type: 'int'},
        {name: 'user_id', type: 'int'},
        {name: 'name',    type: 'string'}
    ]
});

Ext.regModel('User', {
    fields: [
        {name: 'id',   type: 'int'},
        {name: 'name', type: 'string'}
    ],
    
    hasMany: {model: 'Product', name: 'products'}
});
</pre></code>
* 
 * <p>Above we created Product and User models, and linked them by saying that a User hasMany Products. This gives
 * us a new function on every User instance, in this case the function is called 'products' because that is the name
 * we specified in the association configuration above.</p>
 * 
 * <p>This new function returns a specialized {@link Ext.data.Store Store} which is automatically filtered to load
 * only Products for the given model instance:</p>
 * 
<pre><code>
//first, we load up a User with id of 1
var user = Ext.ModelMgr.create({id: 1, name: 'Ed'}, 'User');

//the user.products function was created automatically by the association and returns a {@link Ext.data.Store Store}
//the created store is automatically scoped to the set of Products for the User with id of 1
var products = user.products();

//we still have all of the usual Store functions, for example it's easy to add a Product for this User
products.add({
    name: 'Another Product'
});

//saves the changes to the store - this automatically sets the new Product's user_id to 1 before saving
products.sync();
</code></pre>
 * 
 * <p>The new Store is only instantiated the first time you call products() to conserve memory and processing time,
 * though calling products() a second time returns the same store instance.</p>
 * 
 * <p><u>Custom filtering</u></p>
 * 
 * <p>The Store is automatically furnished with a filter - by default this filter tells the store to only return
 * records where the associated model's foreign key matches the owner model's primary key. For example, if a User
 * with ID = 100 hasMany Products, the filter loads only Products with user_id == 100.</p>
 * 
 * <p>Sometimes we want to filter by another field - for example in the case of a Twitter search application we may
 * have models for Search and Tweet:</p>
 * 
<pre><code>
var Search = Ext.regModel('Search', {
    fields: [
        'id', 'query'
    ],

    hasMany: {
        model: 'Tweet',
        name : 'tweets',
        filterProperty: 'query'
    }
});

Ext.regModel('Tweet', {
    fields: [
        'id', 'text', 'from_user'
    ]
});

//returns a Store filtered by the filterProperty
var store = new Search({query: 'Sencha Touch'}).tweets();
</code></pre>
 * 
 * <p>The tweets association above is filtered by the query property by setting the {@link #filterProperty}, and is
 * equivalent to this:</p>
 * 
<pre><code>
var store = new Ext.data.Store({
    model: 'Tweet',
    filters: [
        {
            property: 'query',
            value   : 'Sencha Touch'
        }
    ]
});
</code></pre>
 */
Ext.define('Ext.data.HasManyAssociation', {
    extend: 'Ext.data.Association',
    requires: ['Ext.util.Inflector'],
    
    /**
     * @cfg {String} foreignKey The name of the foreign key on the associated model that links it to the owner
     * model. Defaults to the lowercased name of the owner model plus "_id", e.g. an association with a where a
     * model called Group hasMany Users would create 'group_id' as the foreign key.
     */
    
    /**
     * @cfg {String} name The name of the function to create on the owner model. Required
     */
    
    /**
     * @cfg {Object} storeConfig Optional configuration object that will be passed to the generated Store. Defaults to 
     * undefined.
     */
    
    /**
     * @cfg {String} filterProperty Optionally overrides the default filter that is set up on the associated Store. If
     * this is not set, a filter is automatically created which filters the association based on the configured 
     * {@link #foreignKey}. See intro docs for more details. Defaults to undefined
     */
    
    /**
     * @cfg {Boolean} autoLoad True to automatically load the related store from a remote source when instantiated.
     * Defaults to <tt>false</tt>.
     */
    
    constructor: function(config) {
        var me = this,
            ownerProto,
            name;
            
        me.callParent(arguments);
        
        me.name = me.name || Ext.util.Inflector.pluralize(me.associatedName.toLowerCase());
        
        ownerProto = me.ownerModel.prototype;
        name = me.name;
        
        Ext.applyIf(me, {
            storeName : name + "Store",
            foreignKey: me.ownerName.toLowerCase() + "_id"
        });
        
        ownerProto[name] = me.createStore();
    },
    
    /**
     * @private
     * Creates a function that returns an Ext.data.Store which is configured to load a set of data filtered
     * by the owner model's primary key - e.g. in a hasMany association where Group hasMany Users, this function
     * returns a Store configured to return the filtered set of a single Group's Users.
     * @return {Function} The store-generating function
     */
    createStore: function() {
        var that            = this,
            associatedModel = that.associatedModel,
            storeName       = that.storeName,
            foreignKey      = that.foreignKey,
            primaryKey      = that.primaryKey,
            filterProperty  = that.filterProperty,
            autoLoad        = that.autoLoad,
            storeConfig     = that.storeConfig || {};
        
        return function() {
            var me = this,
                config, filter,
                modelDefaults = {};
                
            if (me[storeName] === undefined) {
                if (filterProperty) {
                    filter = {
                        property  : filterProperty,
                        value     : me.get(filterProperty),
                        exactMatch: true
                    };
                } else {
                    filter = {
                        property  : foreignKey,
                        value     : me.get(primaryKey),
                        exactMatch: true
                    };
                }
                
                modelDefaults[foreignKey] = me.get(primaryKey);
                
                config = Ext.apply({}, storeConfig, {
                    model        : associatedModel,
                    filters      : [filter],
                    remoteFilter : false,
                    modelDefaults: modelDefaults
                });
                
                me[storeName] = Ext.create('Ext.data.Store', config);
                if (autoLoad) {
                    me[storeName].load();
                }
            }
            
            return me[storeName];
        };
    },
    
    /**
     * Read associated data
     * @private
     * @param {Ext.data.Model} record The record we're writing to
     * @param {Ext.data.Reader} reader The reader for the associated model
     * @param {Object} associationData The raw associated data
     */
    read: function(record, reader, associationData){
        var store = record[this.name](),
            inverse;
    
        store.add(reader.read(associationData).records);
    
        //now that we've added the related records to the hasMany association, set the inverse belongsTo
        //association on each of them if it exists
        inverse = this.associatedModel.prototype.associations.findBy(function(assoc){
            return assoc.type === 'belongsTo' && assoc.associatedName === record.$className;
        });
    
        //if the inverse association was found, set it now on each record we've just created
        if (inverse) {
            store.data.each(function(associatedRecord){
                associatedRecord[inverse.instanceName] = record;
            });
        }
    }
});