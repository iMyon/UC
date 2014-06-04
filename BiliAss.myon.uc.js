// ==UserScript==
// @name        BiliAss
// @namespace   Myon
// @description bilibili弹幕转换成ass字幕
// @include     *
// @author      Myon<myon.cn@gmail.com>
// @downloadURL https://github.com/iMyon/UC/raw/master/BiliAss.myon.uc.js
// @icon        http://tb.himg.baidu.com/sys/portrait/item/c339b7e2d3a1b5c4c3a8d726
// @version     0.1.4
// ==/UserScript==

var bilibili = {
  //配置信息
  config: {
    PlayResX: 1440,   //分辨率 宽
    PlayResY: 900,    //分辨率 高
    font: "微软雅黑", //字体
    font_size: 30,   //字体大小
    lineCount: 50,    //弹幕最大行数
    speed: 12,         //弹幕速度（秒），越小越快
    fixedSpeed: 4,     //顶端/底部弹幕速度（秒），越小越快
    alpha: 140,        //透明度,256为全透明，0为不透明
  },
  //初始化，添加右键菜单
  init: function(){
    addItem({
      id: "context-biliAss",
      label: "转换弹幕",
      oncommand: "bilibili.convert();"
    });
  },
  //转换函数
  //成功 写入文件
  //失败 抛出异常，弹框提醒
  //@ref init
  convert: function(){
    var xmlUrl = this.getXmlUrl();
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
            return [line.getAttribute('p').split(','), line.textContent];
          })
          //递增排序
          .sort(function(a,b){
            return parseFloat(a[0][0]) > parseFloat(b[0][0]);
          });
          try{
            //写入文件
            var filePicker = Cc["@mozilla.org/filepicker;1"]
              .createInstance(Ci.nsIFilePicker);
            filePicker.init(window, "请选择要保存字幕的文件夹", filePicker.modeGetFolder);
            if (!filePicker.show()) {
              var path = filePicker.file.path;
              var filename = content.document.title + '.ass';
              var file = path + "\\" + filename;
              writeFile(file,bilibili.parse(dsArray),true);
              alert("成功写入字幕文件：" + file);
            }
          }catch(e){
            alert("出错了！\n"+e);
          }
        }
    }
    http.send();
  },
  //获取xml弹幕网址
  getXmlUrl: function(){
    //先从window获取，如果没有（会员）则找网页节点
    var a  = null;
    var matches = null;
    for(var i=0;i<content.window.length;i++){
      if(!matches){
        a = content.window[i].location.href;
        matches = a.match(/cid=((\d)+)&/);
      }
      else{
        break;
      }
    }
    //从网页获取
    if(!(matches && matches.length !=0 )){
      //会员视频
      var bofqi = content.document.querySelector("#bofqi embed");
      if(bofqi){
        a = bofqi.getAttribute("flashvars");
        matches = a.match(/cid=(\d+)/);
      }
      //非会员视频
      else{
        bofqi = content.document.querySelector("#bofqi iframe");
        a = bofqi.getAttribute("src");
        matches = a.match(/cid=(\d+)/);
      }
    }
    if(!matches){
      alert("获取cid失败");
      throw -1;
    }
    return "http://comment.bilibili.cn/"+ matches[1] +".xml"
  },
  //转换弹幕
  //@ref convert
  //@return string
  parse: function(dsArray){
    return this.genDanmakuHeader() + this.genDanmakuEvents(dsArray);
  },

  //生成弹幕文件头部信息
  //@ref parse
  //@return string
  genDanmakuHeader: function(){
    return "[Script Info]" + "\n"
      + "ScriptType: v4.00+" + "\n"
      + "Collisions: Normal" + "\n"
      + "PlayResX: " + this.config.PlayResX + "\n"
      + "PlayResY: " + this.config.PlayResY + "\n"
      + "\n"
      + "[V4+ Styles]" + "\n"
      + "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding" + "\n"
      + "Style: Default,微软雅黑,54,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0.00,0.00,1,1,0,2,20,20,120,0" + "\n"
      + "Style: Danmaku,"+ this.config.font + "," + this.config.font_size + ",&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0.00,0.00,1,1,0,2,20,20,20,0" + "\n"
      + "\n";
  },

  //生成弹幕event主区域，解析弹幕的主函数
  //@ref parse
  //@param  dsArray xml弹幕数组
  //@return string
  genDanmakuEvents: function(dsArray){
    var preLine = 0;
    var contents = "[Events]" + "\n"
      + "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n";
    for(var i=0;i<dsArray.length;i++){
      var line = preLine +1;     //弹幕计数，用于限制弹幕行数
      dsArray[i][2] = line;
      var dsa = dsArray[i];
      var text = dsa[1];
      var layer = -3;
      var start = parseInt(dsa[0][0]);
      var end = start + this.config.speed;
      var type = 1;
      var move1 = this.config.PlayResX + text.length * this.config.font_size / 2;
      var move24 = this.config.font_size;
      var move3 = 0 - text.length * this.config.font_size / 2;
      var color = parseInt(dsa[0][3]).toString(16);
      
      //移动弹幕处理
      if(dsa[0][1] < 4){
        line = this.getLine(dsArray,i,1,start);
        //对lineCount取余，限制屏幕行数,不超过限制的话没行一条弹幕，
        //对屏幕高度取余，避免超出屏幕
        move24 = move24 * line;
      }
      //固定弹幕处理
      else if(dsa[0][1] == 4 || dsa[0][1] == 5){
        type = 2;
        layer = -2;
        move1 = this.config.PlayResX/2;
        end = start + this.config.fixedSpeed;
        //底部弹幕处理
        if(dsa[0][1] == 4){
          line = this.getLine(dsArray,i,2,start);
          move24 = this.config.PlayResY - line * this.config.font_size;
        }
        //顶部弹幕处理
        if(dsa[0][1] == 5){
          var line = this.getLine(dsArray,i,3,start);
          move24 = line * this.config.font_size;
        }
      }
      //高级弹幕直接pass
      else {
        continue;
      }

      //给array添加个line标记
      dsArray[i][2] = line;
      preLine = line;
      //抛弃超出范围的弹幕
      if (line > this.config.lineCount || line * this.config.font_size > this.config.PlayResY) continue;
      contents = contents + this.genEvent(layer,start,end,type,move1,move24,move3,color,text) + "\n";
    }
    return contents;
  },

  //获取当前应该插入字幕到第几行
  //@param dsArray  弹幕xml数组
  //@param type     弹幕类型 1滚动 2底部 3 顶部
  //@param i        dsArray下标
  //@param start    弹幕开始时间
  //@return int
  //@ref genDanmakuEvents
  getLine: function(dsArray,i,type,start){
    var line = 1;
    var lines = [];
    for(var j=i-1;j>=0;j--){
      var if1 = (dsArray[j][0][1] < 4);
      if(type == 2)
        if1 = (dsArray[j][0][1] == 4);
      if(type == 3)
        if1 = (dsArray[j][0][1] == 5);
      if(if1){
          var is_has = false;
          for(var k=0;k<lines.length;k++){
            if(lines[k][2] == dsArray[j][2]){
              is_has = true;
              break;
            }
          }
          if(is_has == false){
            lines.push(dsArray[j]);
          }
          if(lines.length==this.config.lineCount){
            break;
          }
        }
    }
    var is_lastLine = false;
    //筛选出满足可插入条件的lines
    for(var k=0;k<lines.length;k++){
      var pStart = parseFloat(lines[k][0][0]);
      //固定弹幕处理，超过存活时间则记该行为可插入行，取最小值
      if(type != 1){
        if(is_lastLine == false){
          line = lines[k][2] + 1;
          is_lastLine = true;
        }
        if(start - pStart >= this.config.fixedSpeed){
        }
        else{
          lines.splice(k,1);
          k--;
        }
      }
      //滚动弹幕处理
      //算法：在满足不重叠条件的行中选择最小的行插入
      else{
        if(is_lastLine == false){
          line = lines[k][2] + 1;
          is_lastLine = true;
        }
        //待比较弹幕首次完全显示在屏幕的时间
        var time1 = pStart + this.config.speed - this.config.speed * (this.config.PlayResX 
          - lines[k][1].length*this.config.font_size/2)/(this.config.PlayResX 
          + lines[k][1].length*this.config.font_size/2);
        //待比较弹幕完全消失在屏幕的时间
        var time2 = pStart + this.config.speed - this.config.speed * (0 
          - lines[k][1].length*this.config.font_size/2)/(this.config.PlayResX 
          + lines[k][1].length*this.config.font_size/2);
        //当前弹幕最后一刻完全显示在屏幕的时间
        var time3 = start + this.config.speed - this.config.speed 
          * (dsArray[i][1].length*this.config.font_size/2) / (this.config.PlayResX 
          + dsArray[i][1].length*this.config.font_size/2);
        if(start-time1>=0 && time2 <= time3){
        }
        else{
          lines.splice(k,1);
          k--;
        }
      }
    }
    if(lines.length){
      line = lines[0][2];
      //获得最终line
      for(var k=0;k<lines.length;k++){
        if(line > lines[k][2]){
          line = lines[k][2];
        }
      }
    }
    return line;
  },

  //生产单个event
  //@ref genDanmakuEvents
  //@param 和ass名称对应
  //@param  type 弹幕类型 1为滚动弹幕，2为固定弹幕
  //@return string
  genEvent: function(layer,start,end,type,move1,move24,move3,color,text){
    var ef = "\\move(" + move1 + ", " + move24 + ", " + move3 + ", " + move24 + ")";
    if(type == 2){
      var ef = "\\pos(" + move1 + ", " + move24 + ")";
    }
    return "Dialogue: " + layer + "," + this.formatTime(start) + "," + this.formatTime(end) 
      + ",Danmaku,,0000,0000,0000,,{" + ef + "\\c&H" + color + "\\alpha&H"+ this.config.alpha.toString(16) +"}" + text;
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
  //位数补全，补全数字前置的0
  //@param num 要补全的数字
  //@param length  总长度
  //@ref formatTime
  //@return string
  prefixInteger: function(num, length) {
    num = '' + (num ^ 0);
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
//获取文本所占像素宽度
//@warn 由于不断插入删除节点效率太低暂时弃用
//@param text 文本
//@param size 字体大小
//@return int
//@ref  genDanmakuEvents getLine
function getTextPxWidth(text,size){
  if(!size){
    size = bilibili.config.font_size;
  }
  var a = content.document.createElement('span');
  a.innerHTML = text;
  a.style = "visibility: block; white-space: nowrap;font-size:"+ size +"px;";
  content.document.body.appendChild(a);
  var length = a.offsetWidth;
  content.document.body.removeChild(a);
  return length;
}

//执行
if (window.location == "chrome://browser/content/browser.xul") {
    bilibili.init();
    document.getElementById("contentAreaContextMenu").addEventListener("popupshowing", function () {
      //满足匹配显示右键菜单，否则隐藏
      gContextMenu.showItem("context-biliAss", content.location.href.match(/www\.bilibili\.tv\/video\/av\d+/));
    }, false);
}