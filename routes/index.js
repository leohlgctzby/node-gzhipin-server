var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

//用户注册的路由
router.post('/register', function(rep, res){
  console.log('register')
  const {username, password} = rep.body
  if(username=='admin'){
    res.send({code: 1, msg: '此用户已存在'})
  } else {
    res.send({code: 0, data: {_id: 'abc', username, password}})
  }
})

module.exports = router;
