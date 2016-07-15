/**
 * css文件px和rem单位互换
 *
 * settings: {
 *   mode: 'px2rem' or 'rem2px',
 *   ie8fix: true,
 *   border: true,
 *   baseFont: 16,
 *   designWidth: 640,
 *   media: true
 * }
 */
'use strict';

var RemTransform = function (option) {
  var baseFont = option.baseFont || 16,
    designWidth = option.designWidth || 320,
    border = option.border || 1,
    useMedia = option.media || true,
    ie8 = option.ie8 || false;

  //创建media query
  function _createMedia() {
    var tmp = '';
    var tpl = '@media only screen and (max-width: <%=screenWidth%>px), only screen and (max-device-width:<%=screenWidth%>px) {\n' +
      'html,body {\n' +
      'font-size:<%=fontSize%>px;\n' +
      '}\n' +
      '}\n';
    var screens = [1080, 960, 800, 720, 640, 600, 540, 480, 414, 400, 375, 360, 320, 240];
    for (var i = 0; i < screens.length; i++) {
      tmp += (tpl.replace(/\<%\=screenWidth%\>/g, screens[i]).replace('<%=fontSize%>', (screens[i] / designWidth) * baseFont));
    }
    return tmp;
  }

  //获取rem值
  function _getRem(px, index) {
    var reg = new RegExp("[0-9]+([.]{1}[0-9]+){0,1}px", "g"), rem = px;
    var tmp = px.match(reg);
    if (tmp && tmp.length) {
      tmp = tmp.map(function (item) { return item.substring(0, item.length - 2) });
    }
    for (var i = 0; i < tmp.length; i++) {
      if (Number(tmp[i]) === 0 || px.indexOf(tmp[i] + 'px') < 0) {
        continue;//0不做处理,数字后面不是px不做处理
      }
      rem = rem.replace(tmp[i] + 'px', (Number(tmp[i]) / baseFont) + 'rem');
    }
    return rem;
  }

  //获取px值
  function _getPx(rem) {
    var reg = new RegExp("[0-9]+([.][0-9]+)?", "g"), px = rem;
    var tmp = rem.match(reg);
    for (var i = 0; i < tmp.length; i++) {
      px = px.replace(tmp[i] + 'rem', (Number(tmp[i]) * baseFont) + 'px');
    }
    return px;
  }

  //末尾自动添加分号
  function _addSemicolon(str) {
    var reg = new RegExp(/([0-9]+)([^;{}])?}/g);
    return str.replace(reg, "$1$2;}");
  }

  function _filterBorder(str) {
    if (str.substr(-6) === 'border'
      || str.substr(-12) === 'border-width'
      || str.substr(-10) === 'border-top'
      || str.substr(-11) === 'border-left'
      || str.substr(-12) === 'border-right'
      || str.substr(-13) === 'border-bottom'
      || str.substr(-13) === 'border-radius'
    ) {
      return true;
    }
    return false;
  }

  //将px转换成rem
  function changeToRem(input) {
    var after = '', tmp = [],
      reg = new RegExp(":[^:]*px([^;/])*;", "g"),
      before = _addSemicolon(input);
    var pxArray = before.match(reg);
    if (!pxArray) {
      return;
    }
    for (var i = 0; i < pxArray.length; i++) {
      tmp = before.split(pxArray[i]);
      if (border && _filterBorder(tmp[0])) {
        continue;
      }
      after += tmp[0];
      if (ie8) {
        after += pxArray[i];
        after += tmp[0].substr(Math.max(tmp[0].lastIndexOf(';'), tmp[0].lastIndexOf('{')) + 1);
      }
      var rem = _getRem(pxArray[i], i);
      after += rem;
      before = before.replace(tmp[0], '').replace(pxArray[i], '');
    }
    if (useMedia) {
      return _createMedia() + after + before;
    } else {
      return after + before;
    }
  }

  //rem转px
  function changeToPx(input) {
    var after = '', tmp = [], reg = new RegExp(":.*rem", "g"), before = input;
    var pxArray = before.match(reg);
    if (!pxArray) {
      return;
    }
    for (var i = 0; i < pxArray.length; i++) {
      tmp = before.split(pxArray[i]);
      after += tmp[0] + _getPx(pxArray[i], baseFont);
      before = before.replace(tmp[0], '').replace(pxArray[i], '');
    }
    return after + before;
  }

  return {
    px2rem: changeToRem,
    rem2px: changeToPx
  };
};

module.exports = function (content, file, settings) {
  if (!file.isCssLike) {
    return fis.log.error("px2rem plugin can only process css like file!");
  }

  var transform = new RemTransform(settings);
  var result = settings.mode && settings.mode === 'rem2px' ? transform.rem2px(content) : transform.px2rem(content);
  return result || "/** atm3-postprocessor-px2rem: return nothing, maybe this is a mixin file */";
};