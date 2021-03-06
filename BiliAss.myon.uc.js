// ==UserScript==
// @charset     UTF-8
// @name        BiliAss
// @namespace   Myon
// @description bilibili弹幕转换成ass字幕
// @include     chrome://browser/content/browser.xul
// @author      Myon<myon.cn@gmail.com>
// @downloadURL https://github.com/iMyon/UC/raw/master/BiliAss.myon.uc.js
// @icon        http://tb.himg.baidu.com/sys/portrait/item/c339b7e2d3a1b5c4c3a8d726
// @version     1.3.1
// ==/UserScript==

var bilibili = {
  //配置信息
  config: {
    PlayResX: 1440,   //分辨率 宽
    PlayResY: 900,    //分辨率 高
    font: "微软雅黑", //字体
    bold: true,       //是否加粗
    font_size: 30,    //字体大小
    lineCount: 50,    //弹幕最大行数
    speed: 12,         //滚动弹幕驻留时间（秒），越小越快
    fixedSpeed: 4,     //顶端/底部弹幕驻留时间（秒），越小越快
    alpha: 140,        //透明度,256为全透明，0为不透明
    saveFolder: ""    //默认保存文件夹，为空则每次都弹出选择框
  },
  //初始化，添加右键菜单
  init: function(){
    //初始化配置
    this.config.alpha = this.prefixInteger(this.config.alpha.toString(16),2);
    if(this.config.font_size*this.config.lineCount > this.config.PlayResY){
      this.config.lineCount = ~~(this.config.PlayResY/this.config.font_size);
    }
    //添加菜单
    var cacm = document.getElementById("contentAreaContextMenu");
    if (!cacm) return;
    var menu = $Element({
      id: "context-biliAss",
      class: "menu-iconic",
      image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACt0lEQVQ4jY3STUtqbRTG8ftjlNI3EISoWZMwNYRq0CaJJtGgwCizl4mDEF/KJLaiEQkmNdoREjSJoEmhA8mikMCJDhIaFGzcKZa7jP8ZxHl8OAfOOResyeK+f6wFS4hfoigKBoOBw8ND/t83Go2YTCZ+ff9burq6qFQq+P1+VFVFCCFsNhs+n49kMkksFvszMjU1xfHxMeVymenpaSqVCna7HV3X8fv9f59ACCEmJydRFAWn00k6nSYYDBIIBP7t888sLCwwNzeHx+NhZWWFdDr9ZyCTyWC1Wunv78dsNjMxMYHX6yWRSLC9vU0kEsHtdmOxWHA4HEiS1AGz2Szd3d3Y7XYURSGXy5HL5cjn89zd3XF9fU2hUOD09BSv18vi4iIul4v5+flvRJZlTCYT5+fnfH5+UiqV+Pj4AEDTNNrtNre3t1SrVUqlEsFg8L8SQggRj8cZGxvj4eGBy8tLTCYT+XweTdN4e3vj+fmZnp4eNjY2eH9/x+l0EgqFSCaT30AqlWJgYIByuczLywsXFxfous7X1xeNRoNms0k2m6VardJqtRgaGmJpaYlUKvUNxGIxrFYrxWKRdrtNrVbj6emJ+/t7VFWlWCzSbDZptVo0Gg3MZjNra2udCWRZZnR0lEKhQK1Wo91uk0gkMBgMDA8P43A4qNVq6LqOpmkYjUY8Hk8HiMfj2Gw2MpkMuq5Tr9ep1+sUi0Wurq7QNI3X11darRZnZ2f09vayurrK3t5eZwWLxYLP52Nzc5NAIMD+/j5HR0ccHBywu7tLOBzG7XbT19eHy+VCVVV2dna+gcfHRwYHBwmHwwSDQWZnZ5EkCYvFwsjICJIkMT4+jiRJzMzMEA6HOTk5YXl5uXNMNzc3rK+vk0wmiUajRCIR/H4/oVCIra0tZFkmHo8TjUaRZZlEIoEQQvwAsj8XY0w5f7sAAAAASUVORK5CYII=",
      label: "转换弹幕"
    },"menu");
    var menupopup = $Element({},"menupopup");
    var m_convert = $Element({
      label: "当前视频",
      oncommand: "bilibili.convert();"
    });
    var m_converts = $Element({
      label: "合集视频",
      oncommand: "bilibili.converts();"
    });
    menupopup.appendChild(m_convert);
    menupopup.appendChild(m_converts);
    menu.appendChild(menupopup);
    cacm.insertBefore(menu,document.getElementById("context-sendimage"));
  },
  //转换函数
  //成功 写入文件
  //失败 抛出异常，弹框提醒
  //@param  uc    视频链接或者cid  如果不填则自动获取
  //@param  path 保存路径，如果不填则弹窗选择
  //@param  filename  文件名   如果不填则取网页标题
  //@param  回调函数
  //@ref init, converts
  convert: function(uc,path,filename,callback){
    if(!uc) uc = gContextMenu.linkURL;
    //获取filename
    if(!filename){
      if(gContextMenu.linkURL){
        //请求网页获取标题
        try{
          this.getTitle(uc, function(title){
            filename = title + '.ass';
            bilibili.getXmlUrl(xmlCallback,uc);
          });
        }catch(e){
          alert(e);
        }
      }
      else{
        filename = content.document.querySelector(".info h1,.info h2").title + '.ass';
        this.getXmlUrl(xmlCallback,uc);
      }
    }
    else{
      this.getXmlUrl(xmlCallback,uc);
    }
    function xmlCallback(xmlUrl){
      if(!xmlUrl){
        throw -1;
      }
      var http = new XMLHttpRequest();
      var url = xmlUrl;
      http.open("GET", url, true);

      http.onreadystatechange = function() {
          if(http.readyState == 4 && http.status == 200) {
            var ds = http.responseXML.getElementsByTagName('d');
            //将dom collection对象存入数组
            var dsArray = Array.apply(Array, ds).map(function (line) {
              return [line.getAttribute('p').split(','), line.innerHTML];
            })
            //递增排序
            .sort(function(a,b){
              return parseFloat(a[0][0]) > parseFloat(b[0][0]);
            });
            try{
              if(!path){
                //判断配置目录是否存在，如果存在则不弹出选择框
                var promise = OS.File.exists(bilibili.config.saveFolder);
                promise.then(function onFulfill(aExists) {
                  if (aExists) {
                    path = bilibili.config.saveFolder;
                  }
                  else{
                    var filePicker = Cc["@mozilla.org/filepicker;1"]
                      .createInstance(Ci.nsIFilePicker);
                    filePicker.init(window, "请选择要保存字幕的文件夹", filePicker.modeGetFolder);
                    if (!filePicker.show()) {
                      path = filePicker.file.path;
                    }
                    else{
                      throw "获取路径失败";
                    }
                  }
                  filename = filename.replace(/\\|\:|\>|\<|\||\"|\*|\?|\//g," ");
                  var file = OS.Path.join(path,filename);
                  writeFile(file,bilibili.parse(dsArray),true);
                  callback && callback(file);
                });
              }
              else{
                //过滤win下文件名特殊字符
                filename = filename.replace(/\\|\:|\>|\<|\||\"|\*|\?|\//g," ");
                var file = OS.Path.join(path,filename);
                writeFile(file,bilibili.parse(dsArray),true);
                callback && callback(file);
              }
              
            }catch(e){
              alert("出错了！\n"+e);
            }
          }
      };
      http.send();
    }      
  },
  //转换合集函数
  //@param url 视频链接
  //@ref init
  converts : function(url){
    if(!url) url = gContextMenu.linkURL;
    if(!url) url = content.location.href;

    var matches = url.match(/av(\d+)/);
    if(matches){
      var aid = matches[1];
      //获取列表并调用convert转换全部
      var http = new XMLHttpRequest();
      var url = "http://www.bilibili.com/widget/getPageList?aid=" + aid;
      http.open("GET", url, true);
      http.onreadystatechange = function() {
        if(http.readyState == 4 && http.status == 200) {
          var jsonA = JSON.parse(http.responseText);
          if(jsonA.length){
            //选择路径
            var filePicker = Cc["@mozilla.org/filepicker;1"]
              .createInstance(Ci.nsIFilePicker);
            filePicker.init(window, "请选择要保存字幕的文件夹", filePicker.modeGetFolder);
            if (!filePicker.show()) {
              var path = filePicker.file.path;
            }
            else{
              throw "获取路径失败";
            }
            for(var i=0; i<jsonA.length; i++){
              bilibili.convert(jsonA[i].cid, path, jsonA[i].page + "." + jsonA[i].pagename + ".ass");
            }
          }
          else{
            alert("获取cid失败");
            throw -1;
          }
        }
        else if(http.readyState == 4) {
          alert("获取cid失败，请尝试到视频页面转换");
        }
      }
      http.send();
    }
  },
  //获取xml弹幕网址
  //@param uc  视频网址或cid，留空的话取当前网页链接
  //@param callback 获取xml后的回调函数
  getXmlUrl: function(callback,uc){
    //判断传入的是否是cid
    if(String(uc).match(/^\d+$/)){
      var xml = "http://comment.bilibili.com/"+ uc +".xml";
      callback(xml);
      return;
    }
    //获取当前窗口的xml
    if(!uc){
      //先从window获取，如果没有（会员）则找网页节点
      var a  = null;
      var matches = null;
      for(let i=0;i<content.window.length;i++){
        if(!matches){
          a = content.window[i].location.href;
          matches = a.match(/cid=((\d)+)&/);
        }
        else{
          break;
        }
      }
      //从网页获取
      if(!(matches && matches.length !==0 )){
        //会员视频
        var bofqi = content.document.querySelector("#bofqi embed");
        if(bofqi){
          a = bofqi.getAttribute("flashvars");
          matches = a.match(/cid=(\d+)/);
        }
        //非会员视频
        else{
          bofqi = content.document.querySelector("#bofqi iframe");
          if(bofqi){
            a = bofqi.getAttribute("src");
            matches = a.match(/cid=(\d+)/);
          }
        }
      }
      if(!matches){
        // alert("获取cid失败");
        // throw -1;
      }
      else{
        var xml = "http://comment.bilibili.com/"+ matches[1] +".xml";
        callback(xml);
        return;
      }
      
    }
    uc = uc ? uc : content.location.href;
    //api获取xml
    var matches = uc.match(/av(\d+)/);
    if(matches){
      var aid = matches[1];
      var http = new XMLHttpRequest();
      var uc = "http://www.bilibili.com/widget/getPageList?aid=" + aid;
      http.open("GET", uc, true);
      http.onreadystatechange = function() {
        if(http.readyState == 4 && http.status == 200) {
          var jsonA = JSON.parse(http.responseText);
          if(jsonA.length){
            var cid = jsonA[0].cid;
            var xml = "http://comment.bilibili.com/"+ cid +".xml";
            callback(xml);
          }
          else{
            alert("获取cid失败");
            throw -1;
          }
        }
        else if(http.readyState == 4) {
          alert("获取cid失败，请尝试到视频页面转换");
        }
      }
      http.send();
    }
  },
  //获取链接所对应网页的title
  //param url   链接网址
  //param callback  回调函数（带一个title参数）
  getTitle: function(url,callback){
    var http = new XMLHttpRequest();
    http.open("GET", url, true);
    http.responseType = "document";
    http.onreadystatechange = function() {
      if(http.readyState == 4 && http.status == 200) {
        try{
          //网页获取title
          let title = http.response.querySelector(".info h2").title;
          callback(title);
        }catch(e){
          //使用b站接口获取title
          bilibili.getTitleByApi(url.match(/av(\d+)/)[1], url.match(/index_(\d+)/) ? url.match(/index_(\d+)/)[1] : 1, callback);
        }
      }
      else if(http.readyState == 4 && http.status != 200){
        bilibili.getTitleByApi(url.match(/av(\d+)/)[1], url.match(/index_(\d+)/) ? url.match(/index_(\d+)/)[1] : 1, callback);
      }
    }
    http.send();
  },
  //从api获取av的标题
  //@param av       av号
  //@param page     页数
  //@param callback 回调函数
  //@ref   getTitle
  getTitleByApi: function(av, page = 1, callback){
    var http = new XMLHttpRequest();
    var url = "http://api.bilibili.com/view?type=json&appkey=03fc8eb101b091fb&id=" + av + "&page=" + page;
    http.open("GET", url, true);
    http.onreadystatechange = function(){
      if(http.readyState == 4 && http.status == 200) {
        try{
          callback(JSON.parse(http.responseText).title);
        }
        catch(e){
          alert("获取title失败，随机生成文件名");
          callback(new Date());
        }
      }
    }
    http.send();
  },
  //转换弹幕 获取字幕文件的最终文本
  //@ref convert
  //@return string
  parse: function(dsArray){
    return (this.genDanmakuHeader() + this.genDanmakuEvents(dsArray))
      .replace(/&lt;/ig, '<')
      .replace(/&gt;/ig, '>')
      .replace(/&amp;/ig, '&');
  },

  //生成字幕文件头部信息
  //@ref parse
  //@return string
  genDanmakuHeader: function(){
    return "\ufeff"
      + "[Script Info]" + "\n"
      + "ScriptType: v4.00+" + "\n"
      + "Collisions: Normal" + "\n"
      + "PlayResX: " + this.config.PlayResX + "\n"
      + "PlayResY: " + this.config.PlayResY + "\n"
      + "\n"
      + "[V4+ Styles]" + "\n"
      + "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding" + "\n"
      + "Style: Default,微软雅黑,54,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0.00,0.00,1,1,0,2,20,20,120,0" + "\n"
      + "Style: Danmaku,"+ this.config.font + "," + this.config.font_size + ",&H"+ this.config.alpha +"FFFFFF,&H"+ this.config.alpha +"FFFFFF,&H"+ this.config.alpha +"000000,&H"+ this.config.alpha +"000000,"+ ~~this.config.bold +",0,0,0,100,100,0.00,0.00,1,1,0,2,20,20,20,0" + "\n"
      + "\n";
  },

  //生成字幕event主区域，脚本最关键的函数
  //@ref parse
  //@param  dsArray xml弹幕数组
  //@return string
  genDanmakuEvents: function(dsArray){
    var contents = "[Events]" + "\n"
      + "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n";
    //保存lineCount大小的数组
    //每个元素保存最后一次出现在行数下标+1的dsArray元素
    //lineRecords[type][dsaArray[num]] type:0 滚动 1 顶部 2底部
    var lineRecords = [Array(this.config.lineCount)
      ,Array(this.config.lineCount)
      ,Array(this.config.lineCount)];

    for(let i=0;i<dsArray.length;i++){
      var dsa = dsArray[i];
      var text = dsa[1];
      var layer = -3;
      var type = 1;
      var start = ~~(dsa[0][0]);
      var end = start + this.config.speed;
      var move1 = this.config.PlayResX + text.length * this.config.font_size / 2;
      var move24 = this.config.font_size;
      var move3 = 0 - text.length * this.config.font_size / 2;
      var color = this.prefixInteger((~~dsa[0][3]).toString(16),6)
        .replace(/(.{2})(.{2})(.{2})/,"$3$2$1");

      //获取字幕插入的行
      var line = this.getLine(dsa,lineRecords,~~dsa[0][1]);
      //抛弃超出范围的弹幕
      if(line === Infinity) continue;

      line++; //数组下标+1

      //移动弹幕处理
      if(dsa[0][1] < 4){
        move24 = move24 * line;
      }
      //固定弹幕处理
      else if(dsa[0][1] == 4 || dsa[0][1] == 5){
        type = 2;
        layer = -2;   //字幕置于稍高层
        move1 = this.config.PlayResX/2;
        end = start + this.config.fixedSpeed;
        //底部弹幕处理
        if(dsa[0][1] == 4){
          move24 = this.config.PlayResY - (line-1) * this.config.font_size;
        }
        //顶部弹幕处理
        if(dsa[0][1] == 5){
          move24 = line * this.config.font_size;
        }
      }
      //高级弹幕直接pass
      else {
        continue;
      }

      contents = contents + this.genEvent(layer,start,end,type,move1,move24,move3,color,text) + "\n";
    }
    return contents;
  },

  //获取当前字幕应该第几行-1（数组下标）
  //@param dsa      dsArray数组元素
  //@param type     弹幕类型 1-3滚动 4底部 5顶部
  //@param lineRecords  记录每行最后一次弹幕元素的数组
  //@return int
  //@ref genDanmakuEvents
  getLine: function(dsa,lineRecords,type){
    let start = parseFloat(dsa[0][0]);
    //滚动弹幕
    if(type <= 3){
      for(let i=0;i<lineRecords[0].length;i++){
        if(lineRecords[0][i] === undefined){
          lineRecords[0][i] = dsa;
          return i;
        }
        let pStart = parseFloat(lineRecords[0][i][0][0]);
        let danmakuLength = lineRecords[0][i][1].length * this.config.font_size;

        //待比较弹幕首次完全显示在屏幕的时间
        let time1 = pStart + this.config.speed * danmakuLength/(this.config.PlayResX + danmakuLength);
        //待比较弹幕完全消失在屏幕的时间
        let time2 = pStart + this.config.speed;
        //当前弹幕最后一刻完全显示在屏幕的时间
        danmakuLength = dsa[1].length * this.config.font_size;
        let time3 = start + this.config.speed * this.config.PlayResX / (this.config.PlayResX + danmakuLength);
        if(start>=time1 && time3 >= time2){
          //覆盖原来的
          lineRecords[0][i] = dsa;
          return i;
        }
      }
    }
    //底部弹幕和顶部弹幕
    if(type === 4 || type === 5){
      if(type === 4) var tempNum = 1;
      if(type === 5) var tempNum = 2;
      for(let i=0;i<lineRecords[tempNum].length;i++){
        if(lineRecords[tempNum][i] === undefined){
          lineRecords[tempNum][i] = dsa;
          return i;
        }

        let pStart = parseFloat(lineRecords[tempNum][i][0][0]);
        if(start - pStart >= this.config.fixedSpeed){
          lineRecords[tempNum][i] = dsa;
          return i;
        }
      }
    }
    //返回无穷大
    return Infinity;
  },

  //生产单个event
  //@ref    genDanmakuEvents
  //@param  和ass格式的参数对应
  //@param  type 弹幕类型 1为滚动弹幕，2为固定弹幕
  //@return string
  genEvent: function(layer,start,end,type,move1,move24,move3,color,text){
    var ef = "\\move(" + move1 + ", " + move24 + ", " + move3 + ", " + move24 + ")";
    if(type == 2){
      ef = "\\pos(" + move1 + ", " + move24 + ")";
    }
    return "Dialogue: " + layer + "," + this.formatTime(start) + "," + this.formatTime(end) 
      + ",Danmaku,,0000,0000,0000,,{" + ef + "\\c&H" + color  +"}" + text;
  },
  //格式化字幕开始和结束时间0:00:00.00
  //@param seconds 秒
  //@ref  genDanmakuEvents
  //@return string
  formatTime: function(seconds){
    var cs = ~~(100 * (seconds - ~~seconds));
    var ss = seconds % 60;
    var mm = ~~(seconds/60) % 60;
    var hh = ~~(seconds/60/60);
    return hh + ":" + this.prefixInteger(mm, 2) + ":" +
      this.prefixInteger(ss, 2) + '.' + this.prefixInteger(cs, 2);
  },
  //位数补全，前置补全0到指定位数
  //@param num 要补全的数字，可以是int型或string型
  //@param length  补全后总长度
  //@ref formatTime genDanmakuEvents
  //@return string
  prefixInteger: function(num, length) {
    num = '' + num;
    return Array(length + 1 - num.length).join('0') + num;
  }
};
function writeFile(filepath, data, override) {
  data = parseUtf8(data);
  try {
    let outputFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
    outputFile.initWithPath(filepath);
    let foStream = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
    let val = override ? 32 : 16;
    foStream.init(outputFile, 2 | 8 | val, 438, 0);
    foStream.write(data, data.length);
    foStream.close();
  } catch (e) {
    alert("error:" + e); 
  }
}

function parseUtf8(str) {
  var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
  converter.charset = "UTF-8";
  return converter.ConvertFromUnicode(str);
}

//生成菜单元素
//@param option  元素属性
//@param tagName 元素类型
function $Element(option,tagName = "menuitem"){
  var item = document.createElement(tagName);
  for(var key in option){
    item.setAttribute(key, option[key]);
  }
  return item;
}

//执行
if (window.location == "chrome://browser/content/browser.xul") {
    bilibili.init();
    document.getElementById("contentAreaContextMenu").addEventListener("popupshowing", function () {
      //满足匹配显示右键菜单，否则隐藏
      gContextMenu.showItem("context-biliAss",
        content.location.href.match(/www\.bilibili\.(tv|com)\/video\/av\d+/) ||
        content.location.href.match(/bilibili\.kankanews\.com\/video\/av\d+/) ||
        gContextMenu.linkURL.match(/www\.bilibili\.(tv|com)\/video\/av\d+/) ||
        gContextMenu.linkURL.match(/bilibili\.kankanews\.com\/video\/av\d+/)
      );
    }, false);
}
