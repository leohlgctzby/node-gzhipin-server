const md5 = require('blueimp-md5');
// 使用mongoose 操作mongodb 的测试文件
// 1. 连接数据库
// 1.1. 引入mongoose
const mongoose = require('mongoose')
// 1.2. 连接指定数据库(URL 只有数据库是变化的)
mongoose.connect('mongodb://localhost:27017/gzhipin_test')
// 1.3. 获取连接对象
const conn = mongoose.connection
// 1.4. 绑定连接完成的监听(用来提示连接成功)
conn.on('connected', function(){
  console.log('数据库连接成功!!!')
})
// 2. 得到对应特定集合的Model
// 2.1. 字义Schema(描述文档结构)
const userSchema = mongoose.Schema({
  username: {type: String, required: true}, // 用户名
  password: {type: String, required: true}, // 密码
  type: {type: String, required: true}, // 用户类型: dashen/laoban
  header: {type: String}
})
// 2.2. 定义Model(与集合对应, 可以操作集合)
const UserModel = mongoose.model('user', userSchema)
// 3. 通过Model 或其实例对集合数据进行CRUD 操作
// 3.1. 通过Model 实例的save()添加数据
function testSave() {
  const userModel = new UserModel({username: 'bob', password: md5('234'), type: 'laoban'})
  userModel.save(function(error, user){
    console.log('save(', error,user)
  })
}
// testSave() 
// 3.2. 通过Model 的find()/findOne()查询多个或一个数据
function testFind() {
  UserModel.find(function(error, users){
    console.log('find()', error, users)
  })

  UserModel.findOne({_id:'5c32c5805e32f4522c23fa7c'}, function(error, user) {
    console.log('findOne()', error, user)
  })
}
testFind()
// 3.3. 通过Model 的findByIdAndUpdate()更新某个数据
// 3.4. 通过Model 的remove()删除匹配的数据
