/**
*
* Color Picker Widget
* https://github.com/foo123/colorpicker
* adapted from: http://www.eyecon.ro/colorpicker/
*      Color Picker by Stefan Petre www.eyecon.ro (MIT and GPL)
*/
!function( root, name, factory ) {
"use strict";
if ( 'object' === typeof exports )
    // CommonJS module
    module.exports = factory( );
else if ( 'function' === typeof define && define.amd )
    // AMD. Register as an anonymous module.
    define(function( req ) { return factory( ); });
else
    root[name] = factory( );
}(this, 'ColorPicker', function( undef ) {
"use strict";

var Min = Math.min, Max = Math.max, Round = Math.round,
    is_array = $.isArray, extend = $.extend,
    COMMAS = /\s*,\s*/g, __id = 0, $ = jQuery;

function getViewport( ) 
{
    var m = document.compatMode == 'CSS1Compat';
    return {
        l : window.pageXOffset || (m ? document.documentElement.scrollLeft : document.body.scrollLeft),
        t : window.pageYOffset || (m ? document.documentElement.scrollTop : document.body.scrollTop),
        w : window.innerWidth || (m ? document.documentElement.clientWidth : document.body.clientWidth),
        h : window.innerHeight || (m ? document.documentElement.clientHeight : document.body.clientHeight)
    };
}

function isChildOf( parentEl, el, container ) 
{
    if ( parentEl === el ) return true;
    if ( parentEl.contains ) return parentEl.contains( el );
    if ( parentEl.compareDocumentPosition ) return !!(parentEl.compareDocumentPosition(el) & 16);
    var prEl = el.parentNode;
    while ( prEl && prEl !== container ) 
    {
        if ( prEl === parentEl ) return true;
        prEl = prEl.parentNode;
    }
    return false;
}

function hex2rgb( hex ) 
{
    hex = parseInt( hex, 16 );
    return [((hex >> 16) & 255), ((hex >> 8) & 255), (hex & 255)];
}
function rgb2hsb( rgb ) 
{
    var h = 0, s = 0, b = 0,
        rr = rgb[0], rg = rgb[1], rb = rgb[2],
        min = Min( rr, rg, rb ), max = Max( rr, rg, rb ),
        delta = max - min
    ;
    b = max;
    if ( max != 0 ) { }
    s = max != 0 ? 255 * delta / max : 0;
    if ( s != 0 ) 
    {
        if ( rr === max ) 
            h = (rg - rb) / delta;
        else if ( rg === max ) 
            h = 2 + (rb - rr) / delta;
        else 
            h = 4 + (rr - rg) / delta;
    } 
    else 
    {
        h = -1;
    }
    h *= 60;
    if ( h < 0 ) h += 360;
    s *= 100/255;
    b *= 100/255;
    return [Round(h), Round(s), Round(b)];
}
function hsb2rgb( hsb ) 
{
    var r, g, b,
        h = Round( hsb[0] ),
        s = Round( hsb[1]*255/100 ),
        v = Round( hsb[2]*255/100 )
    ;
    if ( s === 0 ) 
    {
        r = g = b = v;
    } 
    else 
    {
        var t1 = v,
            t2 = (255-s)*v/255,
            t3 = (t1-t2)*(h%60)/60
        ;
        if ( h == 360 ) h = 0;
        if ( h < 60 ) { r=t1; b=t2; g=t2+t3 }
        else if ( h < 120 ) { g=t1; b=t2; r=t1-t3 }
        else if ( h < 180 ) { g=t1; r=t2; b=t2+t3 }
        else if ( h < 240 ) { b=t1; r=t2; g=t1-t3 }
        else if ( h < 300 ) { b=t1; g=t2; r=t2+t3 }
        else if ( h < 360 ) { r=t1; g=t2; b=t1-t3 }
        else { r=0; g=0; b=0 }
    }
    return [Round(r), Round(g), Round(b)];
}
function rgb2hex( rgb ) 
{
    var hex = [
        rgb[0].toString(16),
        rgb[1].toString(16),
        rgb[2].toString(16)
    ];
    if ( 1 === hex[0].length ) hex[0] = '0' + hex[0];
    if ( 1 === hex[1].length ) hex[1] = '0' + hex[1];
    if ( 1 === hex[2].length ) hex[2] = '0' + hex[2];
    return hex[0]+hex[1]+hex[2];
}
function fix_hex( hex ) 
{
    hex = '#' === hex.charAt(0) ? hex.slice(1) : hex;
    var len = 6 - hex.length;
    if ( len > 0 )
    {
        if ( 3 === len )
            // shorthand notation
            hex = hex.charAt(0)+hex.charAt(0)+hex.charAt(1)+hex.charAt(1)+hex.charAt(2)+hex.charAt(2);
        else
            hex = new Array(len+1).join('0') + hex;
    }
    return hex;
}
function parse_hsl( hsl, is_hsla )
{
    if ( hsl.substr )
        hsl = hsl.slice( is_hsla ? 5 : 4, -1 ).split( COMMAS );
    var opacity = is_hsla ? typecast.opacity(hsl[3]) : null;
    return [typecast.hsb[0](hsl[0]), typecast.hsb[1](hsl[1]), typecast.hsb[2](hsl[2]), opacity];
}
function parse_rgb( rgb, is_rgba )
{
    if ( rgb.substr )
        rgb = rgb.slice( is_rgba ? 5 : 4, -1 ).split( COMMAS );
    var opacity = is_rgba ? typecast.opacity(rgb[3]) : null;
    return [typecast.rgb[0](rgb[0]), typecast.rgb[1](rgb[1]), typecast.rgb[2](rgb[2]), opacity];
}
function int( v )
{
    return parseInt(v, 10);
}
function float( v )
{
    return parseFloat(v, 10);
}
function clamp( m, M, type )
{
    return 'function' === typeof type
    ? function( x ) {
        x = type( x );
        return x > M ? M : (x < m ? m : x);
    }
    : function( x ) {
        return x > M ? M : (x < m ? m : x);
    };
}
function match( p )
{
    return function( x ) {
        return p.test( x );
    };
}

function tpl( id ) 
{
    return '<div id="'+id+'" class="w-colorpicker">\
    <button class="w-colorpicker_satur_bright"><div></div></button>\
    <button class="w-colorpicker_hue"><div></div></button>\
    <div class="w-colorpicker_new_color w-colorpicker_transparent">\
    <button class="w-colorpicker_color"></button>\
    </div>\
    <div class="w-colorpicker_current_color w-colorpicker_transparent">\
    <button class="w-colorpicker_color"></button>\
    </div>\
    <div class="w-colorpicker_field" data-field="hex">\
    <input id="'+id+'_hex" type="text" maxlength="6" size="6" value=""/>\
    <div class="w-colorpicker_field_back"></div>\
    </div>\
    <div class="w-colorpicker_field" data-field="rgb.0">\
    <input id="'+id+'_rgb_0" type="text" maxlength="3" size="3" value=""/><span></span>\
    <div class="w-colorpicker_field_back"></div>\
    </div>\
    <div class="w-colorpicker_field" data-field="rgb.1">\
    <input id="'+id+'_rgb_1" type="text" maxlength="3" size="3" value=""/><span></span>\
    <div class="w-colorpicker_field_back"></div>\
    </div>\
    <div class="w-colorpicker_field" data-field="rgb.2">\
    <input id="'+id+'_rgb_2" type="text" maxlength="3" size="3" value=""/><span></span>\
    <div class="w-colorpicker_field_back"></div>\
    </div>\
    <div class="w-colorpicker_field" data-field="hsb.0">\
    <input id="'+id+'_hsb_0" type="text" maxlength="3" size="3" value=""/><span></span>\
    <div class="w-colorpicker_field_back"></div>\
    </div>\
    <div class="w-colorpicker_field" data-field="hsb.1">\
    <input id="'+id+'_hsb_1" type="text" maxlength="3" size="3" value=""/><span></span>\
    <div class="w-colorpicker_field_back"></div>\
    </div>\
    <div class="w-colorpicker_field" data-field="hsb.2">\
    <input id="'+id+'_hsb_2" type="text" maxlength="3" size="3" value=""/><span></span>\
    <div class="w-colorpicker_field_back"></div>\
    </div>\
    <button class="w-colorpicker_submit"></button>\
    </div>';
}

var typecast = {

'opacity': clamp(0.0, 1.0, float)
,'hsb': [clamp(0, 360, int), clamp(0, 100, int), clamp(0, 100, int)]
,'rgb': [clamp(0, 255, int), clamp(0, 255, int), clamp(0, 255, int)]

};

var validate = {

'hex': match(/^[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]$/i)

};

function set( model, key, value )
{
    var ret = true, t, v, i, l;
    if ( typecast[key] )
    {
        t = typecast[key];
        if ( is_array( t ) )
        {
            for(i=0,l=t.length; i<l; i++)
                value[i] = t[i]( value[i] );
        }
        else
        {
            value = t( value );
        }
    }
    if ( validate[key] )
    {
        v = validate[key];
        if ( is_array( v ) )
        {
            for(i=0,l=v.length; i<l; i++)
            {
                if ( !v[i]( value[i] ) )
                {
                    ret = false;
                    break;
                }
            }
        }
        else if ( !v(value) )
        {
            ret = false;
        }
        if ( ret )
        {
            model[key] = value;
        }
    }
    return ret;
}

function set_color( model, color, opacity )
{
    var c, ret = false;
    
    if ( null != opacity )
    {
        model.opacity = typecast.opacity( opacity );
        ret = true;
    }
    
    if ( !!color )
    {
        if ( is_array( color ) )
        {
            if ( 3 < color.length )
            {
                opacity = color[ 3 ];
                color = color.slice(0, 3);
            }
            if ( set(model, 'rgb', color) )
            {
                if ( null != opacity ) model.opacity = typecast.opacity( opacity );
                update_model( model, 'rgb' );
                ret = true;
            }
        }
        else if ( color.substr )
        {
            if ( 'rgba' === color.slice(0, 4) )
            {
                c = parse_rgb( color, true );
                model.rgb = [c[0],c[1],c[2]];
                model.opacity = typecast.opacity( c[ 3 ] );
                update_model( model, 'rgb' );
                ret = true;
            }
            else if ( 'rgb' === color.slice(0, 3) )
            {
                c = parse_rgb( color );
                model.rgb = [c[0],c[1],c[2]];
                update_model( model, 'rgb' );
                ret = true;
            }
            else if ( 'hsla' === color.slice(0, 4) )
            {
                c = parse_hsl( color, true );
                model.hsb = [c[0],c[1],c[2]];
                model.opacity = typecast.opacity( c[ 3 ] );
                update_model( model, 'hsb' );
                ret = true;
            }
            else if ( 'hsl' === color.slice(0, 3) )
            {
                c = parse_hsl( color );
                model.hsb = [c[0],c[1],c[2]];
                update_model( model, 'hsb' );
                ret = true;
            }
            else
            {
                if ( set(model, 'hex', fix_hex( color )) )
                {
                    update_model( model, 'hex' );
                    ret = true;
                }
            }
        }
    }
    return ret;
}

function get_color( model, format )
{
    if ( 'rgba' === format ) return 'rgba('+model.rgb[0]+','+model.rgb[1]+','+model.rgb[2]+','+model.opacity+')';
    else if ( 'rgb' === format ) return 'rgb('+model.rgb[0]+','+model.rgb[1]+','+model.rgb[2]+')';
    else if ( 'hsla' === format ) return 'hsla('+model.hsb[0]+','+model.hsb[1]+'%,'+model.hsb[2]+'%,'+model.opacity+')';
    else if ( 'hsl' === format ) return 'hsl('+model.hsb[0]+','+model.hsb[1]+'%,'+model.hsb[2]+'%)';
    return '#'+model.hex;
}

function update_model( model, key )
{
    if ( 'hsb' === key )
    {
        model.rgb = hsb2rgb( model.hsb );
        model.hex = rgb2hex( model.rgb )
    }
    else if ( 'rgb' === key )
    {
        model.hsb = rgb2hsb( model.rgb );
        model.hex = rgb2hex( model.rgb )
    }
    else if ( 'hex' === key )
    {
        model.rgb = hex2rgb( model.hex );
        model.hsb = rgb2hsb( model.rgb );
    }
}

function update_ui( model, fields, all )
{
    var rgba_color = 'rgba('+model.rgb[0]+','+model.rgb[1]+','+model.rgb[2]+','+model.opacity+')',
        hue_color = 'rgb('+hsb2rgb([model.hsb[0],100,100]).join(',')+')';
    fields.hsb[0].val( model.hsb[0] );
    fields.hsb[1].val( model.hsb[1] );
    fields.hsb[2].val( model.hsb[2] );
    fields.rgb[0].val( model.rgb[0] );
    fields.rgb[1].val( model.rgb[1] );
    fields.rgb[2].val( model.rgb[2] );
    fields.hex.val( model.hex );
    fields.hue[0].style.backgroundColor = hue_color;
    fields.indic_sb[0].style.top = (150*(100-model.hsb[2])/100)+'px';
    fields.indic_sb[0].style.left = (150*model.hsb[1]/100)+'px';
    fields.indic_hue[0].style.top = (148-148*model.hsb[0]/360)+'px';
    fields.color_new[0].style.backgroundColor = rgba_color;
    if ( all ) fields.color_current[0].style.backgroundColor = rgba_color;
}

function update_element( $el, is_input, is_colorselector, color, trigger )
{
    if ( is_input ) $el.val( color );
    if ( is_colorselector ) $el.css( 'background-color', color );
    $el.prop( 'selectedColor', color );
    if ( trigger ) $el.trigger( trigger );
}

function dummy( ){ }

function defaults( options )
{
    return extend({
        bindEvent: 'click',
        changeEvent: 'colorchange',
        onShow: dummy,
        onBeforeShow: dummy,
        onHide: dummy,
        format: 'rgba',
        color: 'ff0000',
        opacity: 1.0,
        livePreview: true
    }, options || {});
}

function ColorPicker( el, options )
{
    var self = this, prev_color, id, $el, $ui,
        bind_increment = 0, down_increment, move_increment, up_increment,
        bind_hue = 0, down_hue, move_hue, up_hue,
        bind_selector = 0, down_selector, move_selector, up_selector,
        show, hide, hide_on_esc_key,
        model, fields, format, colorChange,
        is_colorselector = false, is_input = false
    ;
    
    if ( !(self instanceof ColorPicker) ) return new ColorPicker(el, options);
    
    hide_on_esc_key = function( ev ) {
        // ESC key pressed
        if ( 27 === ev.keyCode ) hide( true );
    };
    hide = function hide( ev ) {
        if ( $ui.hasClass('w-colorpicker-visible') && 
            ( true === ev || 
                (ev.target !== el[0] && !isChildOf($ui[0], ev.target, $ui[0]))
            ) 
            ) 
        {
            if ( false !== options.onHide( self ) ) $ui.removeClass('w-colorpicker-visible');
            $(document).unbind('keyup', hide_on_esc_key).unbind('mousedown', hide);
        }
    };
    show = function show( ev ) {
        if ( !$ui.hasClass('w-colorpicker-visible') )
        {
            options.onBeforeShow( self );
            var pos = $(this).offset( ), viewPort = getViewport( ), 
                top = pos.top + this.offsetHeight, left = pos.left
            ;
            if ( top + 176 > viewPort.t + viewPort.h ) top -= this.offsetHeight + 176;
            if ( left + 356 > viewPort.l + viewPort.w ) left -= 356;
            $ui.css({left: left+'px', top: top+'px'});
            if ( false !== options.onShow( self ) ) $ui.addClass('w-colorpicker-visible');
            $(document).bind('keyup', hide_on_esc_key).bind('mousedown', hide);
        }
        return false;
    };
    down_increment = function( ev ) {
        if ( bind_increment ) return;
        var el = this,
            wrapper = $(el.parentNode).addClass('w-colorpicker_slider'),
            field = wrapper.find('input').focus( ),
            type = wrapper.attr('data-field'),
            key = type.slice(0, 3),
            current = {
                el: wrapper,
                field: field,
                type: type,
                key: key,
                index: int(type.slice(-1)),
                max: type === 'hsb.0' ? 360 : ('hsb' === key ? 100 : 255),
                val: int(field.val()),
                y: ev.pageY
            }
        ;
        bind_increment = 1;
        $(document)
        .bind('mouseup', current, up_increment)
        .bind('mousemove', current, move_increment)
        ;
    };
    move_increment = function( ev ) {
        var key = ev.data.key, index = ev.data.index;
        model[key][index] = Max(0, Min(ev.data.max, int(ev.data.val + ev.pageY - ev.data.y)));
        if ( options.livePreview )
        {
            update_model( model, key );
            update_ui( model, fields );
        }
        return false;
    };
    up_increment = function( ev ) {
        $(document).unbind('mouseup', up_increment).unbind('mousemove', move_increment);
        bind_increment = 0;
        update_model( model, ev.data.key );
        update_ui( model, fields );
        ev.data.el.removeClass('w-colorpicker_slider').find('input').focus( );
        return false;
    };
    down_hue = function( ev ){
        if ( bind_hue ) return;
        var current = {
            y: $(this).offset().top
        };
        bind_hue = 1;
        $(document)
        .bind('mouseup', current, up_hue)
        .bind('mousemove', current, move_hue)
        ;
    };
    move_hue = function( ev ) {
        model.hsb[0] = Round(360*(148 - Max(0,Min(148,(ev.pageY - ev.data.y))))/148);
        if ( options.livePreview )
        {
            update_model( model, 'hsb' );
            update_ui( model, fields );
        }
        return false;
    };
    up_hue = function( ev ) {
        $(document).unbind('mouseup', up_hue).unbind('mousemove', move_hue);
        bind_hue = 0;
        update_model( model, 'hsb' );
        update_ui( model, fields );
        return false;
    };
    down_selector = function( ev ) {
        if ( bind_selector ) return;
        var current = {
            pos: $(this).offset()
        };
        bind_selector = 1;
        $(document)
        .bind('mouseup', current, up_selector)
        .bind('mousemove', current, move_selector)
        ;
    };
    move_selector = function( ev ) {
        model.hsb[1] = Round(100*(Max(0,Min(150,(ev.pageX - ev.data.pos.left))))/150);
        model.hsb[2] = Round(100*(150 - Max(0,Min(150,(ev.pageY - ev.data.pos.top))))/150);
        if ( options.livePreview )
        {
            update_model( model, 'hsb' );
            update_ui( model, fields );
        }
        return false;
    };
    up_selector = function( ev ) {
        $(document).unbind('mouseup', up_selector).unbind('mousemove', move_selector);
        bind_selector = 0;
        update_model( model, 'hsb' );
        update_ui( model, fields );
        return false;
    };
    
    
    self.dispose = function( ) {
        $.removeData( el, 'ColorPicker' );
        self.ui = null;
        $ui.remove( );
    };
    self.setColor = function( color, opacity ) {
        if ( set_color( model, color, opacity ) )
            update_ui( model, fields, true );
    };
    self.getColor = function( fmt ) {
        return get_color( model, fmt || format );
    };
    self.value = function( color, opacity ) {
        if ( arguments.length )
        {
            if ( set_color( model, color, opacity ) )
                update_ui( model, fields, true );
        }
        else
        {
            return get_color( model, format );
        }
    };
    
    options = defaults( options );
    
    $el = $(el);
    $.data( el, 'ColorPicker', self );
    
    format = $el.attr('data-color-format') || options.format || 'rgba';
    colorChange = $el.attr('data-color-change') || options.changeEvent;
    is_colorselector = $el.hasClass('w-colorselector');
    is_input = $el.is('input,textarea');
    
    id = options.id || 'colorpicker_ui_' + (++__id);
    
    $ui = $( tpl( id ) );
    
    model = {
     opacity: 1.0
    ,hsb: [0, 0, 0]
    ,rgb: [0, 0, 0]
    ,hex: '000000'
    };
    
    fields = {
     hsb: [$ui.find('#'+id+'_hsb_0'),$ui.find('#'+id+'_hsb_1'),$ui.find('#'+id+'_hsb_2')]
    ,rgb: [$ui.find('#'+id+'_rgb_0'),$ui.find('#'+id+'_rgb_1'),$ui.find('#'+id+'_rgb_2')]
    ,hex: $ui.find('#'+id+'_hex')
    ,hue: $ui.find('.w-colorpicker_satur_bright')
    ,indic_hue: $ui.find('.w-colorpicker_hue div')
    ,indic_sb: $ui.find('.w-colorpicker_satur_bright div')
    ,color_new: $ui.find('.w-colorpicker_new_color > button')
    ,color_current: $ui.find('.w-colorpicker_current_color > button')
    };
    
    $ui
    .on('mousedown', '.w-colorpicker_satur_bright', down_selector)
    .on('mousedown', '.w-colorpicker_hue', down_hue)
    .on('mousedown', '[data-field] > span', down_increment)
    .on('click', '.w-colorpicker_new_color,.w-colorpicker_submit', function( ){
        update_ui( model, fields, true );
        prev_color = model.rgb.slice( );
        if ( hide ) hide( true );
        update_element( $el, is_input, is_colorselector, get_color( model, format ), colorChange );
    })
    .on('click', '.w-colorpicker_current_color', function( ){
        set_color( model, prev_color );
        update_ui( model, fields, true );
    })
    ;
    
    self.ui = $ui;
    set_color( model, $el.attr('data-color') || options.color, $el.attr('data-opacity') || options.opacity );
    prev_color = model.rgb.slice( );
    update_ui( model, fields, true );

    if ( $el.hasClass('w-colorpicker-flat') ) 
    {
        $ui.addClass('w-colorpicker-flat').appendTo( $el ).show( );
    } 
    else 
    {
        $ui.appendTo( document.body );
        $el.bind( options.bindEvent, show );
        update_element( $el, is_input, is_colorselector, get_color( model, format ) );
    }
    
    if ( $el.hasClass('w-colorpicker-light') ) $ui.addClass('w-colorpicker-light');
    if ( $el.hasClass('w-colorpicker-dark') ) $ui.addClass('w-colorpicker-dark');
    if ( $el.hasClass('w-colorpicker-transition-fade') ) $ui.addClass('w-colorpicker-transition-fade');
    if ( $el.hasClass('w-colorpicker-transition-slide') ) $ui.addClass('w-colorpicker-transition-slide');
}

$.ColorPicker = ColorPicker;
$.fn.ColorPicker = function( options ) {
    var args = arguments;
    var return_value = this;
    this.each(function( ){
        var el = this, colorpicker = $.data( el, 'ColorPicker' );
        if ( !colorpicker )
        {
            new ColorPicker( el, options );
        }
        else if ( 'dispose' === options )
        {
            colorpicker.dispose( );
        }
        else if ( 'value' === options )
        {
            if ( args.length > 1 )
            {
                // set value
                colorpicker.value( args[1] );
            }
            else
            {
                // get value
                return_value = colorpicker.value( );
                return false;
            }
        }
    });
    return return_value;
};

return ColorPicker;
});