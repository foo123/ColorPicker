/**
* ColorPicker
* https://github.com/foo123/ColorPicker
* @version 2.2.0
*
* adapted from:
* http://www.eyecon.ro/colorpicker/
*      Color Picker by Stefan Petre www.eyecon.ro (MIT and GPL)
**/
!function(root, name, factory) {
"use strict";
if ('object' === typeof exports)
    // CommonJS module
    module.exports = factory();
else if ('function' === typeof define && define.amd)
    // AMD. Register as an anonymous module.
    define(function(req) {return factory();});
else
    root[name] = factory();
}('undefined' !== typeof self ? self : this, 'ColorPicker', function(undef) {
"use strict";

var HAS = Object.prototype.hasOwnProperty, ATTR = 'getAttribute',
    SET_ATTR = 'setAttribute', DEL_ATTR = 'removeAttribute',
    toString = Object.prototype.toString,
    Min = Math.min, Max = Math.max, Round = Math.round, Floor = Math.floor,
    trim_re = /^\s+|\s+$/g,
    trim = String.prototype.trim
        ? function(s) {return s.trim();}
        : function(s) {return s.replace(trim_re,'');}
    ,
    COMMAS = /\s*,\s*/g, ID = 0
;

// helpers
function is_array(o)
{
    return '[object Array]' === toString.call(o);
}

function extend(o1, o2)
{
    for (var k in o2)
    {
        if (HAS.call(o2,k))
            o1[k] = o2[k];
    }
    return o1;
}

function $id(id)
{
    return document.getElementById(id);
}

function getViewport()
{
    var m = document.compatMode == 'CSS1Compat';
    return {
        l : window.pageXOffset || (m ? document.documentElement.scrollLeft : document.body.scrollLeft) || 0,
        t : window.pageYOffset || (m ? document.documentElement.scrollTop : document.body.scrollTop) || 0,
        w : window.innerWidth || (m ? document.documentElement.clientWidth : document.body.clientWidth),
        h : window.innerHeight || (m ? document.documentElement.clientHeight : document.body.clientHeight)
    };
}

function isChildOf(parentEl, el, container)
{
    if (parentEl === el) return true;
    if (parentEl.contains) return parentEl.contains(el);
    if (parentEl.compareDocumentPosition) return !!(parentEl.compareDocumentPosition(el) & 16);
    var prEl = el.parentNode;
    while (prEl && prEl !== container)
    {
        if (prEl === parentEl) return true;
        prEl = prEl.parentNode;
    }
    return false;
}

function hasClass(el, className)
{
    return el.classList
        ? el.classList.contains(className)
        : -1 !== (' ' + el.className + ' ').indexOf(' ' + className + ' ')
    ;
}
function addClass(el, className)
{
    if (!hasClass(el, className))
    {
        if (el.classList) el.classList.add(className);
        else el.className = '' === el.className ? className : el.className + ' ' + className;
    }
}
function removeClass(el, className)
{
    if (el.classList) el.classList.remove(className);
    else el.className = trim((' ' + el.className + ' ').replace(' ' + className + ' ', ' '));
}

function addEvent(el, type, handler)
{
    if (el.attachEvent) el.attachEvent('on'+type, handler);
    else el.addEventListener(type, handler, false);
}
function removeEvent(el, type, handler)
{
    // if (el.removeEventListener) not working in IE11
    if (el.detachEvent) el.detachEvent('on'+type, handler);
    else el.removeEventListener(type, handler, false);
}
function triggerEvent(el, type)
{
    var ev;
    if (document.createEvent)
    {
        ev = document.createEvent('HTMLEvents');
        ev.initEvent(type, true, false);
        el.dispatchEvent(ev);
    }
    else if (document.createEventObject)
    {
        ev = document.createEventObject();
        el.fireEvent('on' + type, ev);
    }
}
function live(selector, event, cb, ctx)
{
    var handler = function(e) {
        var found = false, el = e.target || e.srcElement;
        while (el && !(found = hasClass(el,selector))) el = el.parentElement;
        if (found) cb.call(el, e);
    };
    addEvent(ctx||document, event, handler);
    return handler;
}

function hex2rgb(hex)
{
    hex = parseInt( hex, 16 );
    return [((hex >> 16) & 255), ((hex >> 8) & 255), (hex & 255)];
}
function rgb2hsb(rgb)
{
    var h = 0, s = 0, b = 0,
        rr = rgb[0], rg = rgb[1], rb = rgb[2],
        min = Min(rr, rg, rb), max = Max(rr, rg, rb),
        delta = max - min
    ;
    b = max;
    if (max != 0) { }
    s = max != 0 ? 255 * delta / max : 0;
    if (s != 0)
    {
        if (rr === max)
            h = (rg - rb) / delta;
        else if (rg === max)
            h = 2 + (rb - rr) / delta;
        else
            h = 4 + (rr - rg) / delta;
    }
    else
    {
        h = -1;
    }
    h *= 60;
    if (h < 0) h += 360;
    s *= 100/255;
    b *= 100/255;
    return [Round(h), Round(s), Round(b)];
}
function hsb2rgb(hsb)
{
    var r, g, b,
        h = Round(hsb[0]),
        s = Round(hsb[1]*255/100),
        v = Round(hsb[2]*255/100)
    ;
    if (s === 0)
    {
        r = g = b = v;
    }
    else
    {
        var t1 = v,
            t2 = (255-s)*v/255,
            t3 = (t1-t2)*(h%60)/60
        ;
        if (h == 360) h = 0;
        if (h < 60) { r=t1; b=t2; g=t2+t3 }
        else if (h < 120) { g=t1; b=t2; r=t1-t3 }
        else if (h < 180) { g=t1; r=t2; b=t2+t3 }
        else if (h < 240) { b=t1; r=t2; g=t1-t3 }
        else if (h < 300) { b=t1; g=t2; r=t2+t3 }
        else if (h < 360) { r=t1; g=t2; b=t1-t3 }
        else { r=0; g=0; b=0 }
    }
    return [Round(r), Round(g), Round(b)];
}
function rgb2hex(rgb)
{
    var hex = [
        rgb[0].toString(16),
        rgb[1].toString(16),
        rgb[2].toString(16)
    ];
    if (1 === hex[0].length) hex[0] = '0' + hex[0];
    if (1 === hex[1].length) hex[1] = '0' + hex[1];
    if (1 === hex[2].length) hex[2] = '0' + hex[2];
    return hex[0]+hex[1]+hex[2];
}
function fix_hex(hex)
{
    hex = '#' === hex.charAt(0) ? hex.slice(1) : hex;
    var len = 6 - hex.length;
    if (len > 0)
    {
        if (3 === len)
            // shorthand notation
            hex = hex.charAt(0)+hex.charAt(0)+hex.charAt(1)+hex.charAt(1)+hex.charAt(2)+hex.charAt(2);
        else
            hex = new Array(len+1).join('0') + hex;
    }
    return hex;
}
function parse_hsl(hsl, is_hsla)
{
    if (hsl.substr)
        hsl = hsl.slice(is_hsla ? 5 : 4, -1).split(COMMAS).map(trim);
    var opacity = is_hsla ? typecast.opacity(hsl[3]) : null;
    return [typecast.hsb[0](hsl[0]), typecast.hsb[1](hsl[1]), typecast.hsb[2](hsl[2]), opacity];
}
function parse_rgb(rgb, is_rgba)
{
    if (rgb.substr)
        rgb = rgb.slice(is_rgba ? 5 : 4, -1).split(COMMAS).map(trim);
    var opacity = is_rgba ? typecast.opacity(rgb[3]) : null;
    return [typecast.rgb[0](rgb[0]), typecast.rgb[1](rgb[1]), typecast.rgb[2](rgb[2]), opacity];
}
function int(v)
{
    return parseInt(v, 10) || 0;
}
function float(v)
{
    return parseFloat(v, 10) || 0;
}
function clamp(m, M, type)
{
    return 'function' === typeof type
    ? function(x) {
        x = type(x);
        return x > M ? M : (x < m ? m : x);
    }
    : function(x) {
        return x > M ? M : (x < m ? m : x);
    };
}
function match(p)
{
    return function(x) {return p.test(x);};
}

/*function parseHTML( html )
{
  // http://youmightnotneedjquery.com/
  var tmp = document.implementation.createHTMLDocument();
  tmp.body.innerHTML = html;
  return tmp.body.children;
}*/

function offset(el)
{
    // http://stackoverflow.com/a/4689760/3591273
    var box = el.getBoundingClientRect(),
        body = document.body,
        win = window,
        clientTop  = body.clientTop  || 0,
        clientLeft = body.clientLeft || 0,
        scrollTop  = win.pageYOffset || body.scrollTop,
        scrollLeft = win.pageXOffset || body.scrollLeft,
        top  = box.top  + scrollTop  - clientTop,
        left = box.left + scrollLeft - clientLeft;
    return {top: top, left: left, width: el.offsetWidth, height: el.offsetHeight };
}

function tpl(id)
{
    return '<div id="'+id+'" class="colorpicker">\
    <div id="'+id+'_satur_bright" class="colorpicker_satur_bright"><div id="'+id+'_satur_bright_indic"></div></div>\
    <div id="'+id+'_hue" class="colorpicker_hue"><div id="'+id+'_hue_indic" class="colorpicker_indic"></div></div>\
    <div id="'+id+'_opacitys" class="colorpicker_opacity"><div id="'+id+'_opacity_indic" class="colorpicker_indic"></div><div class="colorpicker_opacity_transparent"></div></div>\
    <div class="colorpicker_new_color colorpicker_transparent">\
    <button id="'+id+'_new_color" class="colorpicker_color colorpicker_save"></button>\
    </div>\
    <div class="colorpicker_current_color colorpicker_transparent">\
    <button id="'+id+'_current_color" class="colorpicker_color colorpicker_restore"></button>\
    </div>\
    <div class="colorpicker_field" data-field="opacity">\
    <input id="'+id+'_opacity" class="colorpicker_field_input" type="text" maxlength="3" size="3" value=""/><span class="colorpicker_increment"></span>\
    <div class="colorpicker_field_back"></div>\
    </div>\
    <div class="colorpicker_field" data-field="hex">\
    <input id="'+id+'_hex" class="colorpicker_field_input" type="text" maxlength="6" size="6" value=""/>\
    <div class="colorpicker_field_back"></div>\
    </div>\
    <div class="colorpicker_field" data-field="rgb.0">\
    <input id="'+id+'_rgb_0" class="colorpicker_field_input" type="text" maxlength="3" size="3" value=""/><span class="colorpicker_increment"></span>\
    <div class="colorpicker_field_back"></div>\
    </div>\
    <div class="colorpicker_field" data-field="rgb.1">\
    <input id="'+id+'_rgb_1" class="colorpicker_field_input" type="text" maxlength="3" size="3" value=""/><span class="colorpicker_increment"></span>\
    <div class="colorpicker_field_back"></div>\
    </div>\
    <div class="colorpicker_field" data-field="rgb.2">\
    <input id="'+id+'_rgb_2" class="colorpicker_field_input" type="text" maxlength="3" size="3" value=""/><span class="colorpicker_increment"></span>\
    <div class="colorpicker_field_back"></div>\
    </div>\
    <div class="colorpicker_field" data-field="hsb.0">\
    <input id="'+id+'_hsb_0" class="colorpicker_field_input" type="text" maxlength="3" size="3" value=""/><span class="colorpicker_increment"></span>\
    <div class="colorpicker_field_back"></div>\
    </div>\
    <div class="colorpicker_field" data-field="hsb.1">\
    <input id="'+id+'_hsb_1" class="colorpicker_field_input" type="text" maxlength="3" size="3" value=""/><span class="colorpicker_increment"></span>\
    <div class="colorpicker_field_back"></div>\
    </div>\
    <div class="colorpicker_field" data-field="hsb.2">\
    <input id="'+id+'_hsb_2" class="colorpicker_field_input" type="text" maxlength="3" size="3" value=""/><span class="colorpicker_increment"></span>\
    <div class="colorpicker_field_back"></div>\
    </div>\
    <button id="'+id+'_submit" class="colorpicker_submit colorpicker_save"></button>\
    </div>';
}

var typecast = {

'opacity': function(o){var o = Floor(float(o)*100)/100; return 0 > o ? 0 : (1 < o ? 1 : o);}
,'hsb': [clamp(0, 360, int), clamp(0, 100, int), clamp(0, 100, int)]
,'rgb': [clamp(0, 255, int), clamp(0, 255, int), clamp(0, 255, int)]

};

var validate = {

'hex': match(/^[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]$/i)

};

function set(model, key, value)
{
    var ret = true, t, v, i, l;
    if (typecast[key])
    {
        t = typecast[key];
        if (is_array(t))
        {
            for (i=0,l=t.length; i<l; i++)
                value[i] = t[i](value[i]);
        }
        else
        {
            value = t(value);
        }
    }
    if (validate[key])
    {
        v = validate[key];
        if (is_array(v))
        {
            for (i=0,l=v.length; i<l; i++)
            {
                if (!v[i](value[i]))
                {
                    ret = false;
                    break;
                }
            }
        }
        else if (!v(value))
        {
            ret = false;
        }
        if (ret)
        {
            model[key] = value;
        }
    }
    return ret;
}

function set_color(model, color, opacity)
{
    var c, ret = false;

    if (null != opacity)
    {
        model.opacity = typecast.opacity(opacity);
        ret = true;
    }

    if (!!color)
    {
        if (is_array(color))
        {
            if (3 < color.length)
            {
                opacity = color[3];
                color = color.slice(0, 3);
            }
            if (set(model, 'rgb', color))
            {
                if (null != opacity) model.opacity = typecast.opacity(opacity);
                update_model(model, 'rgb');
                ret = true;
            }
        }
        else if (color.substr)
        {
            if ('rgba' === color.slice(0, 4))
            {
                c = parse_rgb(color, true);
                model.rgb = [c[0],c[1],c[2]];
                model.opacity = typecast.opacity(c[ 3 ]);
                update_model(model, 'rgb');
                ret = true;
            }
            else if ('rgb' === color.slice(0, 3))
            {
                c = parse_rgb(color);
                model.rgb = [c[0],c[1],c[2]];
                update_model(model, 'rgb');
                ret = true;
            }
            else if ('hsla' === color.slice(0, 4))
            {
                c = parse_hsl(color, true);
                model.hsb = [c[0],c[1],c[2]];
                model.opacity = typecast.opacity(c[ 3 ]);
                update_model(model, 'hsb');
                ret = true;
            }
            else if ('hsl' === color.slice(0, 3))
            {
                c = parse_hsl(color);
                model.hsb = [c[0],c[1],c[2]];
                update_model(model, 'hsb');
                ret = true;
            }
            else
            {
                if (set(model, 'hex', fix_hex(color)))
                {
                    update_model(model, 'hex');
                    ret = true;
                }
            }
        }
    }
    return ret;
}

function get_color(model, format)
{
    if ('rgba' === format) return 'rgba('+model.rgb[0]+','+model.rgb[1]+','+model.rgb[2]+','+model.opacity+')';
    else if ('rgb' === format) return 'rgb('+model.rgb[0]+','+model.rgb[1]+','+model.rgb[2]+')';
    else if ('hsla' === format) return 'hsla('+model.hsb[0]+','+model.hsb[1]+'%,'+model.hsb[2]+'%,'+model.opacity+')';
    else if ('hsl' === format) return 'hsl('+model.hsb[0]+','+model.hsb[1]+'%,'+model.hsb[2]+'%)';
    return '#'+model.hex;
}

function update_model(model, key)
{
    if ('hsb' === key)
    {
        model.rgb = hsb2rgb(model.hsb);
        model.hex = rgb2hex(model.rgb)
    }
    else if ('rgb' === key)
    {
        model.hsb = rgb2hsb(model.rgb);
        model.hex = rgb2hex(model.rgb)
    }
    else if ('hex' === key)
    {
        model.rgb = hex2rgb(model.hex);
        model.hsb = rgb2hsb(model.rgb);
    }
}

function update_ui(model, ui, all)
{
    var rgb = model.rgb, hsb = model.hsb, opacity = model.opacity, hex = model.hex,
        rgba_color = 'rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+','+opacity+')',
        hue_color = 'rgb('+hsb2rgb([hsb[0],100,100]).join(',')+')';
    ui.opacity.value = Floor(100*opacity);
    ui.indic_opac.style.left = String(Min(150, Max(0, 150-150*opacity)))+'px';
    ui.hsb[0].value = hsb[0];
    ui.hsb[1].value = hsb[1];
    ui.hsb[2].value = hsb[2];
    ui.rgb[0].value = rgb[0];
    ui.rgb[1].value = rgb[1];
    ui.rgb[2].value = rgb[2];
    ui.hex.value = hex;
    ui.hue.style.backgroundColor = hue_color;
    ui.indic_sb.style.top = String(150*(100-hsb[2])/100)+'px';
    ui.indic_sb.style.left = String(150*hsb[1]/100)+'px';
    ui.indic_hue.style.top = String(148-148*hsb[0]/360)+'px';
    ui.color_new.style.backgroundColor = rgba_color;
    if (all) ui.color_current.style.backgroundColor = rgba_color;
}

function update_element(colorselector, input, color, trigger)
{
    var is_input = colorselector === input;
    if (colorselector)
    {
        colorselector.selectedColor = color;
        colorselector.style.backgroundColor = color;
        if (is_input) input.value = color;
        if (trigger) triggerEvent(colorselector, trigger);
        if (is_input && 'change' !== trigger) triggerEvent(input, 'change');
    }
    if (input && !is_input)
    {
        input.value = color;
        triggerEvent(input, 'change');
    }
}

function dummy() {}

function defaults(options)
{
    return extend({
        input: null,
        selector: null,
        format: 'rgba',
        color: 'ffffff',
        opacity: 1.0,
        changeEvent: 'colorchange',
        bindEvent: 'click',
        onSelect: dummy,
        onBeforeShow: dummy,
        onShow: dummy,
        onHide: dummy,
        livePreview: true
    }, options || {});
}

function ColorPicker(el, options)
{
    var self = this, prev_color, id, ui,
        bind_increment = 0, down_increment, move_increment, up_increment,
        bind_hue = 0, down_hue, move_hue, up_hue,
        bind_opac = 0, down_opac, move_opac, up_opac,
        bind_selector = 0, down_selector, move_selector, up_selector,
        show, hide, hide_on_esc_key,
        model, fields, format, colorChange,
        colorselector = null, input = null, current = null,
        livehandlers = []
    ;

    if (!(self instanceof ColorPicker)) return new ColorPicker(el, options);

    hide_on_esc_key = function(ev) {
        // ESC key pressed
        if (27 === ev.keyCode) return hide(true);
    };
    hide = function hide(ev) {
        var target = true === ev ? true : ev.target || ev.srcElement;
        if (
            hasClass(ui, 'colorpicker-visible') &&
            ((true === target) || (target !== el && !isChildOf(ui, target, ui)))
        )
        {
            removeClass(ui,'colorpicker-visible');
            removeEvent(document, 'keyup', hide_on_esc_key);
            removeEvent(document, 'mousedown', hide);
            removeEvent(document, 'touchstart', hide);
            options.onHide(self);
        }
    };
    show = function show(ev) {
        if (!hasClass(ui,'colorpicker-visible'))
        {
            options.onBeforeShow(self);
            var target = ev.target || ev.srcElement, pos = offset(target), viewPort = getViewport(),
                top = pos.top + pos.height, left = pos.left
            ;
            if (top + ColorPicker.HEIGHT > viewPort.t + viewPort.h) top -= pos.height + ColorPicker.HEIGHT;
            if (top < viewPort.t) top = viewPort.t;
            if (left + ColorPicker.WIDTH > viewPort.l + viewPort.w) left -= ColorPicker.WIDTH;
            if (left < viewPort.l) left = viewPort.l;
            ui.style.left = left+'px';
            ui.style.top = top+'px';
            addClass(ui,'colorpicker-visible');
            addEvent(document, 'keyup', hide_on_esc_key);
            addEvent(document, 'mousedown', hide);
            addEvent(document, 'touchstart', hide);
            options.onShow(self);
        }
        return false;
    };
    down_increment = function(ev) {
        if (bind_increment) return;
        ev.preventDefault();
        var target = ev.target || ev.srcElement,
            wrapper = target.parentNode,
            field = wrapper.children[0],
            type = wrapper[ATTR]('data-field'),
            key = 'opacity' === type ? type : type.slice(0, 3)
        ;
        current = {
            el: wrapper,
            field: field,
            type: type,
            key: key,
            index: 'opacity' === type ? null : int(type.slice(-1)),
            max: 'opacity' === type ? 100 : ('hsb.0' === type ? 360 : ('hsb' === key ? 100 : 255)),
            val: int(field.value),
            y: ev.changedTouches && ev.changedTouches.length ? ev.changedTouches[0].pageY : ev.pageY
        };
        addClass(wrapper,'colorpicker_slider'); field.focus();
        bind_increment = 1;
        addEvent(document, 'mouseup', up_increment);
        addEvent(document, 'mousemove', move_increment);
        addEvent(document, 'touchend', up_increment);
        addEvent(document, 'touchcancel', up_increment);
        addEvent(document, 'touchmove', move_increment);
    };
    move_increment = function(ev) {
        ev.preventDefault();
        var key = current.key, index = current.index, pageY = ev.changedTouches && ev.changedTouches.length ? ev.changedTouches[0].pageY : ev.pageY;
        if ('opacity' === key) model[key] = typecast[key](Max(0, Min(current.max, int(current.val + pageY - current.y)))/100);
        else model[key][index] = Max(0, Min(current.max, int(current.val + pageY - current.y)));
        if (options.livePreview)
        {
            update_model(model, key);
            update_ui(model, fields);
        }
        return false;
    };
    up_increment = function(ev) {
        ev.preventDefault();
        removeEvent(document, 'mouseup', up_increment);
        removeEvent(document, 'mousemove', move_increment);
        removeEvent(document, 'touchend', up_increment);
        removeEvent(document, 'touchcancel', up_increment);
        removeEvent(document, 'touchmove', move_increment);
        update_model(model, current.key);
        update_ui(model, fields);
        removeClass(current.el,'colorpicker_slider'); current.field.focus();
        bind_increment = 0; current = null;
        return false;
    };
    down_hue = function(ev) {
        if (bind_hue) return;
        ev.preventDefault();
        var target = ev.target || ev.srcElement;
        current = {y: offset(target).top};
        bind_hue = 1;
        addEvent(document, 'mouseup', up_hue);
        addEvent(document, 'mousemove', move_hue);
        addEvent(document, 'touchend', up_hue);
        addEvent(document, 'touchcancel', up_hue);
        addEvent(document, 'touchmove', move_hue);
    };
    move_hue = function(ev) {
        ev.preventDefault();
        var pageY = ev.changedTouches && ev.changedTouches.length ? ev.changedTouches[0].pageY : ev.pageY;
        model.hsb[0] = Round(360*(148 - Max(0,Min(148,(pageY - current.y))))/148);
        if (options.livePreview)
        {
            update_model(model, 'hsb');
            update_ui(model, fields);
        }
        return false;
    };
    up_hue = function(ev) {
        ev.preventDefault();
        removeEvent(document, 'mouseup', up_hue);
        removeEvent(document, 'mousemove', move_hue);
        removeEvent(document, 'touchend', up_hue);
        removeEvent(document, 'touchcancel', up_hue);
        removeEvent(document, 'touchmove', move_hue);
        update_model(model, 'hsb');
        update_ui(model, fields);
        bind_hue = 0; current = null;
        return false;
    };
    down_opac = function(ev) {
        if (bind_opac) return;
        ev.preventDefault();
        var target = ev.target || ev.srcElement;
        current = {x: offset(target).left};
        bind_opac = 1;
        addEvent(document, 'mouseup', up_opac);
        addEvent(document, 'mousemove', move_opac);
        addEvent(document, 'touchend', up_opac);
        addEvent(document, 'touchcancel', up_opac);
        addEvent(document, 'touchmove', move_opac);
    };
    move_opac = function(ev) {
        ev.preventDefault();
        var pageX = ev.changedTouches && ev.changedTouches.length ? ev.changedTouches[0].pageX : ev.pageX;
        model.opacity = typecast.opacity((150 - Max(0, Min(150, pageX - current.x)))/150);
        if (options.livePreview)
        {
            update_ui(model, fields);
        }
        return false;
    };
    up_opac = function(ev) {
        ev.preventDefault();
        removeEvent(document, 'mouseup', up_opac);
        removeEvent(document, 'mousemove', move_opac);
        removeEvent(document, 'touchend', up_opac);
        removeEvent(document, 'touchcancel', up_opac);
        removeEvent(document, 'touchmove', move_opac);
        update_model(model, 'opacity');
        update_ui(model, fields);
        bind_opac = 0; current = null;
        return false;
    };
    down_selector = function(ev) {
        if (bind_selector) return;
        ev.preventDefault();
        var target = (ev.target || ev.srcElement);
        current = offset(target);
        bind_selector = 1;
        addEvent(document, 'mouseup', up_selector);
        addEvent(document, 'mousemove', move_selector);
        addEvent(document, 'touchend', up_selector);
        addEvent(document, 'touchcancel', up_selector);
        addEvent(document, 'touchmove', move_selector);
    };
    move_selector = function(ev) {
        ev.preventDefault();
        var pageX = ev.changedTouches && ev.changedTouches.length ? ev.changedTouches[0].pageX : ev.pageX,
            pageY = ev.changedTouches && ev.changedTouches.length ? ev.changedTouches[0].pageY : ev.pageY;
        model.hsb[1] = Round(100*(Max(0,Min(150,(pageX - current.left))))/150);
        model.hsb[2] = Round(100*(150 - Max(0,Min(150,(pageY - current.top))))/150);
        if (options.livePreview)
        {
            update_model(model, 'hsb');
            update_ui(model, fields);
        }
        return false;
    };
    up_selector = function(ev) {
        ev.preventDefault();
        removeEvent(document, 'mouseup', up_selector);
        removeEvent(document, 'mousemove', move_selector);
        removeEvent(document, 'touchend', up_selector);
        removeEvent(document, 'touchcancel', up_selector);
        removeEvent(document, 'touchmove', move_selector);
        update_model(model, 'hsb');
        update_ui(model, fields);
        bind_selector = 0; current = null;
        return false;
    };

    self.dispose = function() {
        self.ui = null;
        if (!hasClass(ui,'colorpicker-flat')) removeEvent(el, options.bindEvent, show);
        for (var i=0; i<livehandlers.length; i++) removeEvent(livehandlers[i].el, livehandlers[i].event, livehandlers[i].handler);
        livehandlers = [];
        if (ui.parentNode) ui.parentNode.removeChild(ui);
    };
    self.setColor = function(color, opacity) {
        if (set_color(model, color, opacity))
            update_ui(model, fields, true);
    };
    self.getColor = function(fmt) {
        return get_color(model, fmt || format);
    };
    self.value = function(color, opacity) {
        if (arguments.length)
        {
            if (set_color(model, color, opacity))
                update_ui(model, fields, true);
        }
        else
        {
            return get_color(model, format);
        }
    };

    options = defaults(options);

    format = el[ATTR]('data-color-format') || options.format || 'rgba';
    colorChange = el[ATTR]('data-color-change') || options.changeEvent;
    colorselector = !!el[ATTR]('data-color-selector') ? $id(el[ATTR]('data-color-selector')) : (options.selector || (hasClass(el,'colorpicker-selector') ? el : null));
    input = !!el[ATTR]('data-color-input') ? $id(el[ATTR]('data-color-input')) : (options.input || ('input' === (el.tagName||'').toLowerCase() ? el : null));

    id = options.id || 'colorpicker_ui_' + (++ID);

    var wrap = document.createElement('div');
    wrap.innerHTML = tpl(id);
    wrap.style.display = 'none';
    document.body.appendChild(wrap);
    ui = $id(id);

    model = {
     opacity: 1.0
    ,hsb: [0, 0, 0]
    ,rgb: [0, 0, 0]
    ,hex: '000000'
    };

    fields = {
     opacity: $id(id+'_opacity')
    ,hsb: [$id(id+'_hsb_0'),$id(id+'_hsb_1'),$id(id+'_hsb_2')]
    ,rgb: [$id(id+'_rgb_0'),$id(id+'_rgb_1'),$id(id+'_rgb_2')]
    ,hex: $id(id+'_hex')
    ,hue: $id(id+'_satur_bright')
    ,indic_opac: $id(id+'_opacity_indic')
    ,indic_hue: $id(id+'_hue_indic')
    ,indic_sb: $id(id+'_satur_bright_indic')
    ,color_new: $id(id+'_new_color')
    ,color_current: $id(id+'_current_color')
    };
    fields.indic_opac.style.left = '0px';
    fields.indic_hue.style.top = '0px';
    fields.indic_sb.style.left = '0px';
    fields.indic_sb.style.top = '0px';

    livehandlers.push({el:ui, event:'touchstart', handler:live('colorpicker_satur_bright', 'touchstart', down_selector, ui)});
    livehandlers.push({el:ui, event:'touchstart', handler:live('colorpicker_hue', 'touchstart', down_hue, ui)});
    livehandlers.push({el:ui, event:'touchstart', handler:live('colorpicker_opacity', 'touchstart', down_opac, ui)});
    livehandlers.push({el:ui, event:'touchstart', handler:live('colorpicker_increment', 'touchstart', down_increment, ui)});
    livehandlers.push({el:ui, event:'mousedown', handler:live('colorpicker_satur_bright', 'mousedown', down_selector, ui)});
    livehandlers.push({el:ui, event:'mousedown', handler:live('colorpicker_hue', 'mousedown', down_hue, ui)});
    livehandlers.push({el:ui, event:'mousedown', handler:live('colorpicker_opacity', 'mousedown', down_opac, ui)});
    livehandlers.push({el:ui, event:'mousedown', handler:live('colorpicker_increment', 'mousedown', down_increment, ui)});
    livehandlers.push({el:ui, event:'change', handler:live('colorpicker_field_input', 'change', function() {
        var field = this,
            wrapper = field.parentNode,
            type = wrapper[ATTR]('data-field'),
            key = 'opacity' === type || 'hex' === type ? type : type.slice(0, 3),
            index = 'opacity' === type || 'hex' === type ? null : int(type.slice(-1))
        ;
        if ('opacity' === key) model[key] = typecast[key](int(field.value)/100);
        else if ('hex' === key) set(model, 'hex', fix_hex(field.value));
        else model[key][index] = typecast[key][index](field.value);
        if (options.livePreview)
        {
            update_model(model, key);
            update_ui(model, fields);
        }
    }, ui)});
    livehandlers.push({el:ui, event:'click', handler:live('colorpicker_save', 'click', function() {
        prev_color = model.rgb.slice().concat(model.opacity);
        update_ui(model, fields, true);
        if (hide) hide(true);
        update_element(colorselector, input, get_color(model, format), colorChange);
    }, ui)});
    livehandlers.push({el:ui, event:'click', handler:live('colorpicker_restore', 'click', function() {
        model.rgb = prev_color.slice(0, 3);
        model.opacity = prev_color[3];
        update_model(model, 'rgb');
        update_ui(model, fields);
    }, ui)});

    self.ui = ui;
    set_color(model, el[ATTR]('data-color') || options.color, el[ATTR]('data-opacity') || options.opacity);
    prev_color = model.rgb.slice().concat(model.opacity);
    update_ui(model, fields, true);

    if (hasClass(el,'colorpicker-flat'))
    {
        addClass(ui,'colorpicker-flat'); ui.style.display = 'block';
        el.appendChild(ui);
    }
    else
    {
        document.body.appendChild(ui);
        addEvent(el, options.bindEvent, show);
        update_element(colorselector, input, get_color(model, format));
    }
    document.body.removeChild(wrap); wrap = null;

    if (hasClass(el,'colorpicker-light')) addClass(ui,'colorpicker-light');
    if (hasClass(el,'colorpicker-dark')) addClass(ui,'colorpicker-dark');
    if (hasClass(el,'colorpicker-transition-fade')) addClass(ui,'colorpicker-transition-fade');
    if (hasClass(el,'colorpicker-transition-slide')) addClass(ui,'colorpicker-transition-slide');
}
ColorPicker.VERSION = '2.2.0';
ColorPicker.WIDTH = 343;
ColorPicker.HEIGHT = 195;
return ColorPicker;
});