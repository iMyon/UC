#externalvideoplayer
[ywzhaiqi/ExternalVideoPlayer](https://github.com/ywzhaiqi/userChromeJS/tree/master/ExternalVideoPlayer)的一个修改版本，在b站弹出外部播放器后自动加载弹幕。
  
依赖脚本：[BiliAss](https://github.com/iMyon/UC/blob/master/BiliAss.myon.uc.md)，两个同时安装才能生效  
  
[安装脚本](https://github.com/iMyon/UC/raw/master/externalvideoplayer.myon.uc.js)


###播放器限定  
只支持`有命令行字幕参数`的播放器，比如`mpc-hc`，`potPlayer`不支持字幕参数，如果是非`mpc-hc`播放器可以自己搜索播放器的`命令行字幕参数`，然后搜索脚本的`/sub`，替换成自己的参数。  
###测试环境  
只在`mpc-hc`下进行了测试
