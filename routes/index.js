var express = require("express");
var router = express.Router();

const md5 = require("blueimp-md5");
const { UserModel } = require("../db/models");
const filter = { password: 0, __v: 0 };

//注册的路由
router.post("/register", function(req, res) {
  // 读取请求参数数据
  const { username, password, type } = req.body;
  // 处理： 判断用户是否已经存在
  // 查询（根据username）
  UserModel.findOne({ username }, function(error, user) {
    if (user) {
      res.send({ code: 1, msg: "此用户已存在" });
    } else {
      new UserModel({ username, type, password: md5(password) }).save(function(
        error,
        user
      ) {
        // 持久化cookie, 浏览器会保存在本地文件
        res.cookie("userid", user._id, { maxAge: 1000 * 60 * 60 * 24 * 7 });
        // 返回包含user的json数据
        const data = { username, type, _id: user._id }; //响应数据中不能携带密码
        res.send({ code: 0, data });
      });
    }
  });
});

//登录的路由
router.post("/login", function(req, res) {
  const { username, password } = req.body;
  UserModel.findOne({ username, password: md5(password) }, filter, function(
    err,
    user
  ) {
    if (user) {
      res.cookie("userid", user._id, { maxAge: 1000 * 60 * 60 * 24 * 7 });
      res.send({ code: 0, data: user });
    } else {
      res.send({ code: 1, msg: "用户名或密码不存在" });
    }
  });
});

//更新用户信息的路由
router.post("/update", function(req, res) {
  //从请求的cookie得到userid
  const userid = req.cookies.userid;
  //如果不存在，直接返回提示信息结果
  if (!userid) {
    return res.send({ code: 1, msg: "请先登录" });
  }
  //存在，根据userid更新对应的user文档数据
  //得到提交的用户数据
  const user = req.body; //没有_id
  UserModel.findByIdAndUpdate({ _id: userid }, user, function(error, oldUser) {
    if (!oldUser) {
      //通知浏览器删除userid cookie
      res.clearCookie("userid");
      res.send({ code: 1, msg: "请先登录" });
    } else {
      const { _id, username, type } = oldUser;
      // Object.assign 后面的覆盖前面的
      const data = Object.assign({ _id, username, type }, user);
      res.send({ code: 0, data });
    }
  });
});

//获取用户信息的路由（根据用户cookie中的userid）
router.get("/user", function(req, res) {
  //从请求的cookie得到userid
  const userid = req.cookies.userid;
  console.log(userid)
  //如果不存在，直接返回提示信息结果
  if (!userid) {
    return res.send({ code: 1, msg: "请先登录" });
  }
  UserModel.findOne({ _id: userid }, filter, function(error, user) {
    res.send({ code: 0, data: user });
  });
});

module.exports = router;
