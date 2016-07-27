

var app = require('express')();

// var server = require('http').Server(app);
var io = require('socket.io')();
var url = require("url");
app.io = io;



app.use(function(req, res, next) {
    res.set({
    "Access-Control-Allow-Credentials":true,
    'Access-Control-Allow-Origin':"http://10.2.153.72:3000",
    "Access-Control-Allow-Headers": "X-Requested-With",
    "Access-Control-Allow-Methods":"PUT, GET, POST, DELETE, OPTIONS"
  })
    next();
});

app.get("/run",function(req,res){

  if(!isExist(req.query.roomid)){
    res.redirect(301, 
        'http://10.2.153.72:5000/?roomid='+req.query.roomid
    );
  }else{
    res.redirect(301, 
      'http://10.2.153.72:5000/'
    );
  }
})


app.get("/shooting",function(req,res){

  if(!isExist(req.query.roomid)){
    res.redirect(301, 
        'http://10.2.153.72:5000/?roomid='+req.query.roomid
    );
  }else{
    res.redirect(301, 
      'http://10.2.153.72:5000/'
    );
  }
})


app.get("/basket",function(req,res){
  if(!isExist(req.query.roomid)){
    res.cookie('roomid',req.query.roomid,{ maxAge: 20000, path:'/'});
    res.redirect(301, 
        'http://10.2.153.72:5000/'
    );
  }else{
    res.redirect(301, 
      'http://10.2.153.72:5000/'
    );
  }
})

app.get("/enter",function(req,res){
  var arg = url.parse(req.originalUrl).query;
  console.log(111)
  console.log(arg);
  if(!isExist(req.query.roomid)){
    res.cookie('roomid', req.query.roomid);
    res.cookie('kf',req.query.kf);

    if(req.query.kf ==1){
        res.redirect(301, 
          'http://10.2.24.82:3000/?roomid='+req.query.roomid+"&kf="+req.query.kf
        );
      }else if(req.query.kf == 2){
        res.redirect(301, 
          'http://10.2.24.83:3000/?roomid='+req.query.roomid+"&kf="+req.query.kf
        )
      }else if(req.query.kf == 3){
        res.redirect(301, 
          'http://10.2.153.72:3000/?roomid='+req.query.roomid+"&kf="+req.query.kf
        )
      }else{
         res.redirect(301, 
          'http://10.2.24.83:3000/?roomid='+req.query.roomid+"&kf="+req.query.kf
        )
      }
  }else{
    res.redirect(301, 
      'http://10.2.153.72:3000/'
    );
  }

  
  
});

app.get('/', function (req, res) {
  res.send('root');
});


function isExist(roomid){
  for(var i=0;i<rooms.length;i++){
    var t = rooms[i].id;
    var s =rooms[i].connected.length;
    if(rooms[i].id == roomid && rooms[i].connected.length == maxConnect){
      return true 
    }
  }
}



// server based on socket io
var maxRoom = 2000; // max room number
var rooms = []; // room array
var maxConnect = 2; // max connection per room

io.on('connection', function (socket) {

  console.log('User connected, room num:' + rooms.length);



  socket.on('disconnect', function () {
  // delete socket or room
    for(var i=0;i<rooms.length;i++){
      for(var j=0;j<rooms[i].connected.length;j++){
        if( rooms[i].connected[j] == socket ){
          rooms[i].connected.splice(j, 1);
          if( rooms[i].connected.length == 0 ){
            rooms.splice(i,1);
            break;
          }
        }
      }
    }
    console.log('User disconnected');
  });

  // clients register room
  socket.on('registerRoom', function (data) {
    // add socket and room
    console.log("now register room");
    console.log("++++++++++++++++")
    var exist = false, room_length = rooms.length, i = 0,j;
    var _socket;
    if( room_length <= maxRoom){
      for(;i < room_length; i++){
        if(rooms[i].id == data.room_id && rooms[i].connected.length < maxConnect){
          rooms[i].connected.push(socket);
          exist = true;
          var l = rooms[i].connected.length;
          j = 0;
          for(;j<l;j++){
            _socket = rooms[i].connected[j];
            if(_socket == socket){
              _socket.emit("matched",{role:"second"});
            }else{
              _socket.emit("matched",{role:"main"});
            }
            
          }

        }
      }
      if(room_length < maxRoom && !exist){
        rooms.push({id: data.room_id, connected: [socket]});
      }
    }else{
            // server is full
        }
    });






  // server listen messages
  socket.on('req', function(data){
    var i = 0, room_length = rooms.length;
    for(;i < room_length; i++){
      var rcl = rooms[i].connected.length;
      if(rooms[i].id == data.room_id && rcl <= maxConnect && rcl >= 2){
          for(var j = 0; j < rcl; j++){
              rooms[i].connected[j].emit('res', {role: data.role});
          }
      }
    }
  });

  socket.on("onFollow",function(data){
    var i = 0, room_length = rooms.length;
    for(;i < room_length; i++){
      var rcl = rooms[i].connected.length;
      if(rooms[i].id == data.room_id && rcl <= maxConnect && rcl >= 2){
          for(var j = 0; j < rcl; j++){
            if( rooms[i].connected[j] == socket){
              rooms[i].connected[j].emit('follow', {kf: data.kf,role:"main"});
            }else{
               rooms[i].connected[j].emit('follow', {kf: data.kf,role:"second"});
            }
          }
      }
    }
  }),



  socket.on("zhan",function(data){
    var i = 0, room_length = rooms.length;
    for(;i < room_length; i++){
      var rcl = rooms[i].connected.length;
      if(rooms[i].id == data.room_id && rcl <= maxConnect && rcl >= 2){
          if(data.role == "main"){
            rooms[i].main = true;
          }else if(data.role == "second"){
            rooms[i].second = true;
          }
          if(rooms[i].main&&rooms[i].second){
            for(var j = 0; j < rcl; j++){
              rooms[i].connected[j].emit('kezhan', {});
            }
          }  
      }
    }
  });

  socket.on("completeTime",function(data){
    console.log("~~~~~~~~~~~~~~~~")
    console.log(data);
    var i = 0, room_length = rooms.length;
    for(;i < room_length; i++){
      var rcl = rooms[i].connected.length;
      if(rooms[i].id == data.room_id && rcl <= maxConnect && rcl >= 2){
          if(data.role == 1){
            rooms[i].mainTime = data.time;
            console.log("main" + rooms[i].mainTime )
          }else if(data.role == 2){
            rooms[i].secondTime = data.time;
            console.log("second"+ rooms[i].secondTime)
          }
          if(rooms[i].mainTime!==undefined&&rooms[i].secondTime!==undefined){
            for(var j = 0; j < rcl; j++){
              /**
               * return other's time
               * like  mainTime;
               */
              
              
              if( rooms[i].connected[j] == socket ){
                if(data.role ==1){
                  rooms[i].connected[j].emit('completed', {time:rooms[i].secondTime});
                  rooms[i].secondTime = 0;
                }else{
                  rooms[i].connected[j].emit('completed', {time:rooms[i].mainTime});
                  rooms[i].mainTime = 0;
                }
              }else{
                if(data.role ==1){
                  rooms[i].connected[j].emit('completed', {time:rooms[i].mainTime});
                  rooms[i].mainTime = 0;
                }else{
                  rooms[i].connected[j].emit('completed', {time:rooms[i].secondTime});
                  rooms[i].secondTime = 0;
                }
              }
            }
          }  
      }
    }
  })
});


module.exports = app;
