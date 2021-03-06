/**
 * @class Ext.chart.Labels
 *
 * Labels is a mixin whose methods are appended onto the Series class. Labels is an interface with methods implemented
 * in each of the Series (Pie, Bar, etc) for label creation and label placement.
 *
 * The methods implemented by the Series are:
    
    <ul>
    <li><b>onCreateLabel(storeItem, item, i, display)</b> Called each time a new label is created.
    The arguments of the method are:
      <ul>
      <li><em>storeItem</em> The element of the store that is related to the label sprite.</li>
      <li><em>item</em> The item related to the label sprite. An item is an object containing the position of the shape
      used to describe the visualization and also pointing to the actual shape (circle, rectangle, path, etc).</li>
      <li><em>i</em> The index of the element created (i.e the first created label, second created label, etc)</li>
      <li><em>display</em> The display type. May be <b>false</b> if the label is hidden</li>
      </ul>
    </li>
    <li><b>onPlaceLabel(label, storeItem, item, i, display, animate)</b> Called for updating the position of the label.
    The arguments of the method are:
        <ul>
        <li><em>label</em> The sprite label.</li>
        <li><em>storeItem</em> The element of the store that is related to the label sprite</li>
        <li><em>item</em> The item related to the label sprite. An item is an object containing the position of the shape
    used to describe the visualization and also pointing to the actual shape (circle, rectangle, path, etc).</li>
        <li><em>i</em> The index of the element to be updated (i.e. whether it is the first, second, third from the labelGroup)</li>
        <li><em>display</em> The display type. May be <b>false</b> if the label is hidden.</li>
        <li><em>animate</em> A boolean value to set or unset animations for the labels.</li>
        </ul>
    </li>
    </ul>
  
 */
Ext.define('Ext.chart.Labels', {

    /* Begin Definitions */

    requires: ['Ext.draw.Color'],
    
    /* End Definitions */

    /**
     * @cfg {String} labelDisplay
     * Specifies the presence and position of labels for each pie slice. Either "rotate", "middle", "insideStart",
     * "insideEnd", "outside", "over", "under", or "none" to prevent label rendering.
     */

    /**
     * @cfg {String} labelColor
     * The color of the label text
     */

    /**
     * @cfg {String} labelField
     * The name of the field to be displayed in the label
     */

    /**
     * @cfg {Number} labelMinMargin
     * Specifies the minimum distance from a label to the origin of the visualization.
     * This parameter is useful when using PieSeries width variable pie slice lengths.
     * Default value is 50.
     */

    /**
     * @cfg {String} labelFont
     * The font used for the labels
     */

    /**
     * @cfg {String} labelOrientation
     * Either "horizontal" or "vertical"
     */

    /**
     * @cfg {Function} labelRenderer
     * Optional function for formatting the label into a displayable value
     * @param v
     */

    //@private a regex to parse url type colors.
    colorStringRe: /url\s*\(\s*#([^\/)]+)\s*\)/,
    
    //@private the mixin constructor. Used internally by Series.
    constructor: function(config) {
        var me = this;
        me.label = Ext.applyIf(me.label || {},
        {
            display: "none",
            color: "#000",
            field: "name",
            minMargin: 50,
            font: "11px Helvetica, sans-serif",
            orientation: "horizontal",
            renderer: function(v) {
                return v;
            }
        });

        if (me.label.display !== 'none') {
            me.labelsGroup = me.chart.surface.getGroup(me.seriesId + '-labels');
        }
    },

    //@private a method to render all labels in the labelGroup
    renderLabels: function() {
        var me = this,
            chart = me.chart,
            gradients = chart.gradients,
            gradient,
            items = me.items,
            animate = chart.animate,
            config = me.label,
            display = config.display,
            color = config.color,
            field = [].concat(config.field),
            group = me.labelsGroup,
            store = me.chart.store,
            len = store.getCount(),
            ratio = items.length / len,
            i, count, j, 
            k, gradientsCount = (gradients || 0) && gradients.length,
            colorStopTotal, colorStopIndex, colorStop,
            item, label, storeItem,
            sprite, spriteColor, spriteBrightness, labelColor,
            Color = Ext.draw.Color,
            colorString;

        if (display == 'none') {
            return;
        }

        for (i = 0, count = 0; i < len; i++) {
            for (j = 0; j < ratio; j++) {
                item = items[count];
                label = group.getAt(count);
                storeItem = store.getAt(i);

                if (!item && label) {
                    label.hide(true);
                }

                if (item && field[j]) {
                    if (!label) {
                        label = me.onCreateLabel(storeItem, item, i, display, j, count);
                    }
                    me.onPlaceLabel(label, storeItem, item, i, display, animate, j, count);

                    //set contrast
                    if (config.contrast && item.sprite) {
                        sprite = item.sprite;
                        colorString = sprite._to && sprite._to.fill || sprite.attr.fill;
                        spriteColor = Color.fromString(colorString);
                        //color wasn't parsed property maybe because it's a gradient id
                        if (colorString && !spriteColor) {
                            colorString = colorString.match(me.colorStringRe)[1];
                            for (k = 0; k < gradientsCount; k++) {
                                gradient = gradients[k];
                                if (gradient.id == colorString) {
                                    //avg color stops
                                    colorStop = 0; colorStopTotal = 0;
                                    for (colorStopIndex in gradient.stops) {
                                        colorStop++;
                                        colorStopTotal += Color.fromString(gradient.stops[colorStopIndex].color).getGrayscale();
                                    }
                                    spriteBrightness = (colorStopTotal / colorStop) / 255;
                                    break;
                                }
                            }
                        }
                        else {
                            spriteBrightness = spriteColor.getGrayscale() / 255;
                        }
                        labelColor = Color.fromString(label.attr.color || label.attr.fill).getHSL();
                        
                        labelColor[2] = spriteBrightness > 0.5? 0.2 : 0.8;
                        label.setAttributes({
                            fill: String(Color.fromHSL.apply({}, labelColor))
                        }, true);
                    }
                }
                count++;
            }
        }
        me.hideLabels(count);
    },

    //@private a method to hide labels.
    hideLabels: function(index) {
        var labelsGroup = this.labelsGroup, len;
        if (labelsGroup) {
            len = labelsGroup.getCount();
            while (len-->index) {
                labelsGroup.getAt(len).hide(true);
            }
        }
    }
});