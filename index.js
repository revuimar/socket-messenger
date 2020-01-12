const express = require('express');
const socketio  = require('socket.io');

const port = 3000;
const app = express();
const bodyParser = require('body-parser')
const es6Renderer = require('express-es6-template-engine');

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.engine('html', es6Renderer);
app.set('views', './public');
app.set('view engine', 'html');

let server = app.listen(port,()=> console.log(`server listening on ${port}!`));

let io = socketio(server);
let nsp = io.of('/messenger');

app.get('/',function (req, res, next) {
    res.render('index')
});

app.get('/messenger',function (req,res){
        res.render('messenger')

});
app.post('/evaluation',function (req,res) {
    let userName = req.query.u;
    let chatRoom = req.query.r;
    console.log(roomExists(chatRoom));
    if(!roomExists(chatRoom)){
        return res.json('create')
    }
    else if(isUsernameAvaliable(chatRoom,userName)){
        return res.json('join')
    }
    else{
        return res.json('error')
    }
});

app.post('/socket',function (req,res) {
    let requestedSocket = req.query.s;
    if(requestedSocket === undefined){
        return res.json({error: "no socket id given!"});
    }

    if(nsp.sockets['/messenger#'+requestedSocket]!==undefined){
        return res.json(nsp.sockets[requestedSocket]);
    }

    res.json({error: "socket does not exist!"});
});


let history = {};
let rooms = [];

function isUsernameAvaliable(room, userName)
{
    console.log(nsp.adapter.rooms[room])
    for (var socketId in nsp.adapter.rooms[room].sockets) {
        if (nsp.sockets[socketId].username === userName) {
            return false;
        }
    }
    return true;
}

function roomExists(room) {
    console.log(room, " room status: ", nsp.adapter.rooms[room])
    console.log("all rooms", nsp.adapter.rooms)
    if (nsp.adapter.rooms[room] === undefined) {
        return false
    }
    return true;
}

nsp.on("connection", function (socket) {
    console.log("connection made with client: ", socket.id);
    nsp.emit('roomList',rooms);

    socket.on('create',function (data) {
        console.log(rooms.indexOf(data.room));
        console.log("room created");
        socket.join(data.room);
        socket.in(data.room).username = data.user;
        nsp.to(data.room).emit('hostUser',data.user);
        history[data.room] = {records: '',members: []};
        rooms.push(data.room);
        console.log("sending broadcast")
        nsp.emit('roomList',rooms);
    });

    socket.on('join',function (data) {
        console.log("room joined");
        socket.join(data.room);
        socket.in(data.room).username = data.user;
        nsp.to(socket.id).emit('renderHistory',history[data.room]);
        nsp.to(data.room).emit('newUser',data.user);
        history[data.room].members.push(data.user);
        history[data.room].records += '<p style="text-align: left";><em>User: '+data.user+' joined</em></p>'
    });
    socket.on('message',function (data) {
        console.log("sending message");
        console.log("user: ",data.user,"send: ",data.room)
        nsp.to(data.room).emit('message',data)
    })
    socket.on('typing', function (data) {
        console.log("keypress detected");
        console.log("user: ",data.user,"send: ",data.room)
        nsp.to(data.room).emit('typing',data.user)
    })
    socket.on('updateHistory',function (data) {
        if(data.member !== undefined){
            history[data.room].members.push(data.member);
        }
        if(history[data.room]!== undefined) {
            history[data.room].records += data.record;
        }
        console.log(data.record);
    })
    socket.on('leave',function (data) {
        console.log(JSON.stringify(data));
        socket.leave(data.room,function (res) {
            console.log(res);
        });
        console.log("before",history[data.room].members)
        history[data.room].members.splice(history[data.room].members.indexOf(data.user), 1);
        console.log("after",history[data.room].members)
        if(!roomExists(data.room)){
            console.log("deleting history");
            delete history[data.room];
            rooms.splice(rooms.indexOf(data.room), 1);
        }
        else{
            console.log("updating members");
            nsp.to(data.room).emit('updateMembers',history[data.room].members);
            nsp.to(data.room).emit('userLeft',data.user);
        }

    });
    socket.on('disconnect',function () {
        socket.disconnect();
    });
    socket.on('updateSocket',function (data) {
        console.log("update socket",nsp.adapter.rooms[data.room]);
        socket.join(data.room);
    })
} );



