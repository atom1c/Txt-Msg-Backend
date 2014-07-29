var TxtMsgApp = angular.module("TxtMsgApp", ['luegg.directives']);

/*
 * Wraps socket.io
 * Credit to: http://www.html5rocks.com/en/tutorials/frameworks/angular-websockets/
 */
TxtMsgApp.factory('socket', function ($rootScope) {
    var socket = io.connect();
    return {
        on: function (eventName, callback) {
            socket.on(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            })
        }
    };
});

TxtMsgApp.factory("MsgServ", ['$rootScope', 'Auth', 'socket', function ($rootScope, Auth, socket) {
    var MsgServ = {};
    MsgServ.newMsg = "";
    MsgServ.outMsg = "";
    MsgServ.inMsg = "";
    MsgServ.joined = false;

    MsgServ.msgStr = function (strMsg, user) {
        return {"text": Auth.msgPrefix + strMsg, "date": new Date(), "user": user};
    }
    MsgServ.sendStr = function (strMsg) {
        this.send(this.msgStr(strMsg, Auth.currentUser));
    }
    MsgServ.send = function (msg) {
        this.outMsg = msg;
        $rootScope.$broadcast("SENDMSG");
        socket.emit("MSGSEND", this.outMsg);
        this.notifyNewMsg(msg);
    };
    MsgServ.receive = function (msg) {
        this.inMsg = msg;
        $rootScope.$broadcast("RECVMSG");
        this.notifyNewMsg(msg);
    };
    MsgServ.notifyNewMsg = function (msg) {
        this.newMsg = msg;
        $rootScope.$broadcast("NEWMSG");
    };

    socket.on("MSG", function (data) {
        MsgServ.receive(data);
    });

    socket.on("ERROR", function (data) {
        alert(data.msg);
    });

    socket.emit("JOINSEND", Auth.currentUser, function () {
        MsgServ.joined = true;
        Console.log("Joined.");
    });

    return MsgServ;
}]);

//Placeholder auth service
TxtMsgApp.factory("Auth", ['$rootScope', function ($rootScope) {
    var Auth = {};
    Auth.msgPrefix = "Eakjb: ";
    Auth.users = [
        {username: "Eakjb"},
        {username: "R4Rman"},
        {username: "Notch"},
        {username: "AdventurerH"}
    ];
    Auth.currentUser = Auth.users[0];
    return Auth;
}]);

TxtMsgApp.controller('FormCtrl', ['$scope', 'MsgServ', function ($scope, MsgServ) {
    $scope.data = {};
    $scope.send = function (data) {
        MsgServ.sendStr(data.txt);
        data.txt = "";
    };
}]);

TxtMsgApp.controller('MsgAreaCtrl', ['$scope', 'MsgServ', function ($scope, MsgServ) {
    $scope.chats = [];
    $scope.$on("NEWMSG", function (e) {
        $scope.chats.push(MsgServ.newMsg);
    });
}]);

TxtMsgApp.controller('UserListCtrl', ['$scope', 'Auth', function ($scope, Auth) {
    $scope.users = Auth.users;
}]);