const { Socket } = require('socket.io');

const io = require('socket.io')(8000);

const users = new Map();

io.on('connection', socket =>{
    socket.on('new-user-joined',name =>{
            if(!users.has(socket.id)){
                users.set(socket.id, name);
                socket.join("default");
                socket.broadcast.emit('user-joined', name);
            }
        })

    socket.on('sendToBroadcast', message =>{
        socket.broadcast.emit('receiveBroadcastMessage',{message: message, username: users.get(socket.id)})
    })

    socket.on('sendimageBroadcast',result=>{
        socket.broadcast.emit('receiveImageBroadcast', {result : result , username: users.get(socket.id)});
    })



    socket.on('sendToUnicast',data=>{
        users.forEach((value,key)=>{
            if(value == data.toSend && key != socket.id){
                socket.to(key).emit('unicastReceive',{message: data.message, username: users.get(socket.id)});
            }
        })   
    })

    socket.on('sendimageUnicast', data=>{
        users.forEach((value,key)=>{
            if(value == data.toSend && key != socket.id){
                socket.to(key).emit('receiveImageUnicast',{image: data.image , username: users.get(socket.id)});
            }
        })
    })

    socket.on('joinRoom', roomName=>{   
        socket.join(roomName);
        socket.to(roomName).emit('userJoinedRoom', {roomName: roomName , username: users.get(socket.id)});
    })

    socket.on('sendToRoom', data=>{
        socket.to(data.roomName).emit('receiveRoomMessage', {message: data.message , sender: users.get(socket.id) , roomName: data.roomName});
    })

    socket.on('sendimageMulticast',data=>{
        socket.to(data.roomName).emit('receiveImageMulticast', {image : data.image , roomName: data.roomName , sender: users.get(socket.id)});
    })

    socket.on('leaveRoom', roomName=>{
        socket.leave(roomName);
        socket.to(roomName).emit('userLeftRoom', {roomName: roomName , username: users.get(socket.id)});
    })

    socket.on('disconnecting',(reason)=>{
        socket.broadcast.emit('left',{socketId: socket.id, username: users.get(socket.id)})
        for (const room of socket.rooms) {
            if (room !== socket.id && room != "default") {
              socket.to(room).emit("userLeftRoom",{roomName: room , username: users.get(socket.id)});
            }
            else{
                socket.leave(room);
            }
          }
        users.delete(socket.id);
    })

})