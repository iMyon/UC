#BiliAss
转换b站弹幕为ass文件  
[安装脚本](https://github.com/iMyon/UC/raw/master/BiliAss.myon.uc.js)  

喜欢user脚本的，可以安装[tiansh](https://github.com/tiansh/)的[us-danmaku](https://github.com/tiansh/us-danmaku)

###生效页面
满足`http://www.bilibili.tv/video/avXXX`形式的网页

###使用说明
####配置说明
编辑脚本开头的config修改配置

```javascript  
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
}
```

在`生效页面`打开右键菜单，选择`转换弹幕`  
选择弹幕存放的文件夹

###致谢
* xml分析来自：[[搬运压制] BILIBILI站弹幕内容地址解析策略](http://9ch.co/t17836,1-1.html)  
* ass字幕格式照搬[Niconvert](https://github.com/muzuiget/niconvert)，省去了我研究ass字幕格式的时间  
* 写文件函数来自行客的[FireSpider](https://github.com/linusyu/FireSpider)
