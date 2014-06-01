// ==UserScript==
// @name        myMenu
// @namespace   Myon
// @description 右键菜单增强自用版
// @include     *
// @author      Myon<myon.cn@gmail.com>
// @downloadURL 
// @updateURL   
// @icon        http://tb.himg.baidu.com/sys/portrait/item/c339b7e2d3a1b5c4c3a8d726
// @version     0.1
// ==/UserScript==

//右键打开avXXX对应的b站网页
var openBilibili = {
  init: function(){
    addItem({
      id: "context-openBilibili",
      label: "open bilibili",
      oncommand: "openBilibili.open(event);"
    });
  },
  open: function(e){
    var url = "http://www.bilibili.tv/video/";
    var where = (e.type == "click" && e.button == 1) ? "tabshifted" : "tab";
    url += content.getSelection();
    var that = gContextMenu;
    var doc = that ? that.target.ownerDocument : '';
    openUILinkIn(url, where, null, null, doc.documentURIObject);
    closeMenus(e.target);
  }
};

//github短网址
var githubShortUrl = {
  init: function(){
    addItem({
      id: "context-githubShortUrl",
      label: "copy shortUrl",
      oncommand: "githubShortUrl.copy(event);"
    });
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
function addItem(option){
  var cacm = document.getElementById("contentAreaContextMenu");
    if (!cacm) return;
  var item = document.createElement("menuitem");
  for(var key in option){
    item.setAttribute(key, option[key]);
  }
  cacm.insertBefore(item,document.getElementById("context-sendimage"));
}

//各种初始化
if (window.location == "chrome://browser/content/browser.xul") {
    openBilibili.init();
    githubShortUrl.init();
    document.getElementById("contentAreaContextMenu").addEventListener("popupshowing", function () {
      var c = content.getSelection() + "";
      //满足匹配显示右键菜单，否则隐藏
      gContextMenu.showItem("context-openBilibili", gContextMenu.isTextSelected 
        && c.match(/av\d+/));
      gContextMenu.showItem("context-githubShortUrl", content.location.href.match(/github.com/));
    }, false);
}