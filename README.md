# in-view-monitor
封装一个视图管理器组件，能在滚动时监听组件容器是否在当前视图中，执行动画效果及对应的回调方法，分2种模式
1. flush模式，在容器处于当前视窗时，将所有受管理的子组件一起显示出来
2. 非flush模式，在容器处于当前视窗时，将所有受管理的子组件逐个显示出来（即还要判断子组件是否在视窗内）

快速接入步骤
```sh
git clone https://github.com/cipengxu/in-view-monitor.git
cd in-view-monitor
npm install
npm start
```
接下来访问 [localhost:8080](http://localhost:8080/) 就可以看到效果了。
