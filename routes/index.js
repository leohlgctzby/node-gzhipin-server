var express = require("express");
var router = express.Router();

const md5 = require("blueimp-md5");
const { UserModel, ChatModel } = require("../db/models");
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
  console.log(userid);
  //如果不存在，直接返回提示信息结果
  if (!userid) {
    return res.send({ code: 1, msg: "请先登录" });
  }
  UserModel.findOne({ _id: userid }, filter, function(error, user) {
    res.send({ code: 0, data: user });
  });
});

//获取用户列表（根据用户类型）
router.get("/userlist", function(req, res) {
  const { type } = req.query;
  UserModel.find({ type }, filter, function(error, users) {
    res.send({ code: 0, data: users });
  });
});

/*
获取当前用户所有相关聊天信息列表
*/
router.get("/msglist", function(req, res) {
  // 获取cookie 中的userid
  const userid = req.cookies.userid;
  // 查询得到所有user 文档数组
  UserModel.find(function(err, userDocs) {
    // 用对象存储所有user 信息: key 为user 的_id, val 为name 和header 组成的user 对象
    const users = {}; // 对象容器
    userDocs.forEach(doc => {
      users[doc._id] = { username: doc.username, header: doc.header };
    });

    // 跟上面作用一样，累加
    // const users = userDocs.reduce((users, user) => {
    //   users[user._id] = { username: user.username, header: user.header };
    //   return users
    // }, {})
    /*
  查询userid 相关的所有聊天信息
  参数1: 查询条件，或者的关系
  参数2: 过滤条件
  参数3: 回调函数
  */
    ChatModel.find(
      { $or: [{ from: userid }, { to: userid }] },
      filter,
      function(err, chatMsgs) {
        // 返回包含所有用户和当前用户相关的所有聊天消息的数据
        res.send({ code: 0, data: { users, chatMsgs } });
      }
    );
  });
});

/*
修改指定消息为已读
*/
router.post("/readmsg", function(req, res) {
  // 得到请求中的from 和to
  const from = req.body.from;
  const to = req.cookies.userid;
  /*
更新数据库中的chat 数据
参数1: 查询条件
参数2: 更新为指定的数据对象
参数3: 是否1 次更新多条, 默认只更新一条
参数4: 更新完成的回调函数
*/
  ChatModel.update(
    { from, to, read: false },
    { read: true },
    { multi: true },//不只改一条记录
    function(err, doc) {
      console.log("/readmsg", doc);
      res.send({ code: 0, data: doc.nModified }); // 更新的数量
    }
  );
});

module.exports = router;
