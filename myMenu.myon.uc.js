// ==UserScript==
// @charset     UTF-8
// @name        myMenu
// @namespace   Myon
// @description 右键菜单增强自用版
// @include     chrome://browser/content/browser.xul
// @author      Myon<myon.cn@gmail.com>
// @downloadURL https://github.com/iMyon/UC/raw/master/myMenu.myon.uc.js
// @homePage    https://github.com/iMyon/UC/blob/master/myMenu.myon.uc.js   
// @icon        http://tb.himg.baidu.com/sys/portrait/item/c339b7e2d3a1b5c4c3a8d726
// @version     0.2.1
// ==/UserScript==

//规则
//lable为菜单文本
//url中的{id}在运行时自动由选中数字文本替换
var rules = [
  {
    attr:{
      label: "bilibili"
    },
    url: "http://www.bilibili.com/video/av{id}"
  },
  {
    attr:{
      label: "pixiv"
    },
    url: "http://www.pixiv.net/member_illust.php?mode=medium&illust_id={id}"
  },
  {
    attr:{
      label: "nico"
    },
    url: "http://www.nicovideo.jp/watch/sm{id}"
  }
];

var menus = {
  init: function(){
    var cacm = document.getElementById("contentAreaContextMenu");
    if (!cacm) return;
    var menu = $Element({
      id: "myMenu",
      label: "博麗大結界"
    },"menu");
    var menupopup = $Element({},"menupopup");
    for(let i=0;i<this.rules.length;i++){
      let item = $Element(this.rules[i].attr);
      (function(item,url){
        item.addEventListener("command",function(e){
          var where = (e.type == "click" && e.button == 1) ? "tabshifted" : "tab";
          var openUrl = url.replace("{id}",(""+content.getSelection()).match(/\d+/)[0]);
          var that = gContextMenu;
          var doc = that ? that.target.ownerDocument : '';
          openUILinkIn(openUrl, where, null, null, doc.documentURIObject);
          closeMenus(e.target);
        });
      })(item,this.rules[i].url);
      menupopup.appendChild(item);
    }
    menu.appendChild(menupopup);
    cacm.insertBefore(menu,document.getElementById("context-sendimage"));
  },
  rules: rules
};

//github短网址
var githubShortUrl = {
  init: function(){
    var cacm = document.getElementById("contentAreaContextMenu");
    if (!cacm) return;
    var e = $Element({
      id: "context-githubShortUrl",
      label: "copy shortUrl",
      oncommand: "githubShortUrl.copy(event);"
    });
    cacm.insertBefore(e,document.getElementById("context-sendimage"));
  },
  //请求git.io获取短网址并复制
  copy: function(e){
    var http = new XMLHttpRequest();
    var url = "http://git.io/create";
    var params = "url=" + encodeURIComponent(content.location.href);;
    http.open("POST", url, true);

    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    http.setRequestHeader("Content-length", params.length);
    http.setRequestHeader("Connection", "close");

    http.onreadystatechange = function() {
        if(http.readyState == 4 && http.status == 200) {
            Components.classes['@mozilla.org/widget/clipboardhelper;1']
              .createInstance(Components.interfaces.nsIClipboardHelper)
                .copyString("http://git.io/" + http.responseText);
        }
    }
    http.send(params);
  }
};

//添加到右键菜单
function $Element(option,name = "menuitem"){
  var item = document.createElement(name);
  for(var key in option){
    item.setAttribute(key, option[key]);
  }
  return item;
}

//各种初始化
if (window.location == "chrome://browser/content/browser.xul") {
    menus.init();
    githubShortUrl.init();
    document.getElementById("contentAreaContextMenu").addEventListener("popupshowing", function () {
      var c = content.getSelection() + "";
      //满足匹配显示右键菜单，否则隐藏
      gContextMenu.showItem("myMenu", gContextMenu.isTextSelected 
        && c.match(/^(\s*)(av|sm)?\d+(\s*)$/) );
      gContextMenu.showItem("context-githubShortUrl", content.location.href.match(/github.com/));
    }, false);
}