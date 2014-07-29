var express = require('express');
var app = express();

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + server.address().port);
});

var io = require('socket.io')(server);

app.use("/", express.static(__dirname + '/public'));

app.set("userlist", []);

io.on('connection', function (socket) {
    socket.on('JOINSEND', function (data) {
        console.log("User join: " + data.username);
        if (app.get("userlist").indexOf(data.user) > -1) {
            socket.emit("ERROR", {"msg": "User already in database"})
        } else {
            app.get("userlist").push(data);
            socket.broadcast.emit("USERUPDATE", app.get("userlist"));
        }
    });

    socket.on('MSGSEND', function (data) {
        if (app.get("userlist").indexOf(data.user) < -1) {
            socket.emit("ERROR", {"msg": "User not in database"})
        } else {
            socket.broadcast.emit("MSG", data);
        }
    });

    socket.on('DISCONNECTSEND', function (data) {
        if (app.get("userlist").indexOf(data.user) < -1) {
            socket.emit("ERROR", {"msg": "User not in database"})
        } else {
            app.set("userlist", app.get("userlist").splice(app.get("userlist").indexOf(data), 1));
            socket.broadcast.emit("USERUPDATE", app.get("userlist"));
        }
    });
});