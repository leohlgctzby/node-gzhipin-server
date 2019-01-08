var express = require('express');
var router = express.Router();

const md5 = require('blueimp-md5')
const {UserModel} = require('../db/models')

// /* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });

// //用户注册的路由
// router.post('/register', function(req, res){
//   console.log('register')
//   const {username, password} = req.body
//   if(username=='admin'){
//     res.send({code: 1, msg: '此用户已存在'})
//   } else {
//     res.send({code: 0, data: {_id: 'abc', username, password}})
//   }
// })

//注册的路由
router.post('/register', function(req, res){
  // 读取请求参数数据
  const {username, password, type} = req.body
  // 处理： 判断用户是否已经存在
  // 查询（根据username）
  UserModel.findOne({username}, function(error, user) {
    if(user) {
      res.send({code: 1, msg: '此用户已存在'})
    } else {
      new UserModel({username, type, password: md5(password)}).save(function(error, user) {
        // 持久化cookie, 浏览器会保存在本地文件
        res.cookie('userid', user._id, {maxAge: 1000*60*60*24*7}) 
        // 返回包含user的json数据
        const data = { username, type, _id: user._id} //响应数据中不能携带密码
        res.send({code: 0, data})
      })
    }
  })
})

module.exports = router;
