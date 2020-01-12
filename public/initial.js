//let socket = io.connect('http://localhost:3000/messenger');
let client = io.connect('http://localhost:3000/messenger');
//export {client};
Math.floor(1 + Math.random() * 100);


let userName = document.getElementById("userName"),
    chatRoom = document.getElementById("chatRoom"),
    button = document.getElementById("join"),
    errorContainer = document.getElementById("error-container"),
    chatRooms = document.getElementById("chatRooms");

window.onload = function () {
    userName.value = "user" + Math.floor(1 + Math.random() * 100);
};

button.addEventListener('click',async function () {
    //setUp()
    const command = await fetch(`/evaluation?u=${userName.value}&r=${chatRoom.value}`, {method: "POST"})
        .then(res => res.json())
    console.log(command);
    console.log(userName.checkValidity(),chatRoom.checkValidity());
    if(command === "error"){
        errorContainer.innerHTML = `<p>User with name ${userName.value} is already a member of ${chatRoom.value}</p>`;
        userName.setCustomValidity("Invalid!");
        return;
    }else userName.setCustomValidity("");
    if(userName.value.indexOf(' ') >= 0) {
        errorContainer.innerHTML = `<p>Whitespaces not allowed!</p>`;
        userName.setCustomValidity("Invalid!");
    }else userName.setCustomValidity("");
    if(chatRoom.value.indexOf(' ') >= 0){
        errorContainer.innerHTML = `<p>Whitespaces not allowed!</p>`;
        chatRoom.setCustomValidity("Invalid!");
    }else chatRoom.setCustomValidity("");
    if(!userName.checkValidity()){
        return;
    }
    if(!chatRoom.checkValidity()){
        return;
    }

        window.sessionStorage.setItem("user",userName.value);
        window.sessionStorage.setItem("room",chatRoom.value);
        window.sessionStorage.setItem("command",command);
        client.emit('disconnect');
        window.location = ("/messenger");

});

function pasteRoom(element) {
    console.log("recorded event",element);
    chatRoom.value = element;
}

client.on('roomList',function (roomList) {
    console.log("recieved broadcast");
    chatRooms.innerHTML = '';
    for(let item in roomList){
        chatRooms.innerHTML += `<p onclick="pasteRoom('${roomList[item]}')">${roomList[item]}</p>`;
    }
});

