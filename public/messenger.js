let client = io.connect('http://localhost:3000/messenger');

let message = document.getElementById("message"),
    button = document.getElementById("send"),
    leave = document.getElementById("leave"),
    messageWindow = document.getElementById("messages-window"),
    memberList = document.getElementById("member-list"),
    feedback = document.getElementById("feedback"),
    room = sessionStorage.getItem("room"),
    currentUser = sessionStorage.getItem("user"),
    title = document.getElementById("title");

title.innerHTML = room;

window.onload = async function () {
    //console.log("sending command: ",command)
    var command = sessionStorage.getItem("command");
    console.log("sending command: ",command," from ",room," as ",currentUser);
    if(command !== null){
        await client.emit(command,{room: room,user: currentUser});
        sessionStorage.setItem("socketid",await client.io.engine.id);
        console.log("socket id: ",sessionStorage.getItem("socketid"));
        sessionStorage.removeItem("command");
        return;
    }
    client.emit('updateSocket',{room: room});
    messageWindow.innerHTML = sessionStorage.getItem("message_content");
    memberList.innerHTML = sessionStorage.getItem("memberList_content");
};

window.onbeforeunload = function () {
    sessionStorage.setItem("message_content",messageWindow.innerHTML);
    sessionStorage.setItem("memberList_content",memberList.innerHTML);
}

button.addEventListener('click',function () {
    console.log("at room: ",room," user: ",currentUser," send message")
    if(!message.checkValidity()) return;
    client.emit('message',{
        room: room,
        message: message.value,
        user: currentUser
    });
    client.emit('updateHistory',{
        room: room,
        record: '<p style="text-align: left";><strong>'+currentUser+': </strong>'+message.value+'</p>'
    });
    message.value = "";
});

leave.addEventListener('click',async function () {
    client.emit('leave',{room:room,user:currentUser});
    messageWindow.innerHTML += `<p style="text-align: left";><em>User: ${currentUser} Left</em></p>`;
    await client.emit('updateHistory', {
        room: room,
        record: '<p style="text-align: left";><em>User: '+currentUser+' Left</em></p>'
    });
    await client.emit('disconnect');
    window.location = "/";
});

message.addEventListener("keypress", function () {
    client.emit('typing',{
        room: room,
        user: currentUser
    });
})

client.on('message', function (data) {
    feedback.innerHTML = "";
    var style = ' style="text-align: left;"';
    if(data.user === currentUser)
        style = ' style="text-align: right;"';
    messageWindow.innerHTML += '<p'+ style +'><strong>' + data.user + ': </strong>' + data.message + '</p>';
});

client.on('typing', function (data) {
    if(data === currentUser) return;
    feedback.innerHTML = '<p style="text-align: left";>' + data + ' typing... </p>';
})

client.on('newUser',function (newUser) {
    const userVal = (newUser === currentUser)? newUser+ ' <strong>(you)</strong>': newUser ;
    memberList.innerHTML += `<p style="text-align: left";>${userVal}</p>`;
    messageWindow.innerHTML += `<p style="text-align: left";><em>User: ${newUser} joined</em></p>`;
});

client.on('hostUser',function (newUser) {
    const userVal = newUser + ' <strong>(you)</strong>';
    memberList.innerHTML += `<p style="text-align: left";>${userVal}</p>`;
    messageWindow.innerHTML += `<p style="text-align: left";><em>User: ${newUser} created room: ${room}</em></p>`;
    client.emit('updateHistory', {
        room: room,
        record: '<p style="text-align: left";><em>User: '+newUser+' created room: '+room+'</em></p>',
        member: newUser
    });
});

client.on('renderHistory',function (data) {
    messageWindow.innerHTML += data.records;
    for(var member in data.members){
        memberList.innerHTML += '<p style="text-align: left";>'+data.members[member]+'</p>'
    }
})

client.on('updateMembers',function (members) {
    memberList.innerHTML = ""
    for(var member in members){
        var you ='';
        if(members[member]===currentUser) you = '<strong>(you)</strong>'
        memberList.innerHTML += '<p style="text-align: left";>'+members[member]+you+'</p>'
    }
})
client.on('userLeft',function (leftUser) {
    messageWindow.innerHTML += '<p style="text-align: left";><em>User: '+leftUser+' Left</em></p>'
})