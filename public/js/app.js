var TxtMsgApp = angular.module("TxtMsgApp", ['ngRoute', 'luegg.directives']);

TxtMsgApp.run(['$rootScope', '$location', 'Auth', function ($rootScope, $location, Auth) {
    /**$rootScope.$on( "$routeChangeStart", function(event, next, current) {
        if (!Auth.isLoggedIn()) {
            if (next.templateUrl!="views/view_login.html") {
                $location.path("/login");
            }
        }
    });*/
    $rootScope.$watch(function () {
        return $location.path();
    }, function (newValue, oldValue) {
        Auth.managePath(newValue);
    });
}]);

TxtMsgApp.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.
            when('/login', {
                templateUrl: 'views/view_auth.html',
                controller: 'LoginCtrl'
            }).
            when('/chat', {
                templateUrl: 'views/view_chat.html',
                controller: 'ChatCtrl'
            }).
            otherwise({
                redirectTo: '/login'
            });
    }]);

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
    MsgServ.users = [];

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
    MsgServ.getUsers = function () {
        return MsgServ.users;
    };

    socket.on("MSG", function (data) {
        MsgServ.receive(data);
    });

    socket.on("ERROR", function (data) {
        alert(data.msg);
    });

    socket.on("USERUPDATE", function (data) {
        MsgServ.users = data;
    });

    socket.emit("JOINSEND", Auth.currentUser, function () {
        MsgServ.joined = true;
    });

    return MsgServ;
}]);

//Placeholder auth service
TxtMsgApp.factory("Auth", ['$rootScope', '$location', function ($rootScope, $location) {
    var Auth = {};

    Auth.msgPrefix = "";
    Auth.currentUser = null;
    Auth.status = "Unknown";

    Auth.isLoggedIn = function () {
        return Auth.currentUser != null;
    }
    Auth.managePath = function (path) {
        if (!Auth.isLoggedIn()) {
            Auth.status = "Unauthorized";
            if (path != '/login') $location.path('/login');
        } else {
            Auth.status = "Authorized";
        }
    }
    Auth.setUser = function (user) {
        if (user != null && user.username != null && user.username != "") {
            Auth.msgPrefix = user.username + ": ";
            Auth.currentUser = user;
        } else {
            Auth.msgPrefix = "";
            Auth.currentUser = null;
        }
    }
    return Auth;
}]);

TxtMsgApp.controller('ChatCtrl', function () {
});
TxtMsgApp.controller('LoginCtrl', ['$scope', '$location', 'Auth', function ($scope, $location, Auth) {
    $scope.submit = function (data, valid) {
        if (valid) {
            Auth.setUser({"username": data.username, "loginDate": new Date()});
            $location.path('/chat');
        }
    }
    $scope.authStatus = Auth.status;
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

TxtMsgApp.controller('UserListCtrl', ['$scope', 'MsgServ', function ($scope, MsgServ) {
    $scope.getUsers = MsgServ.getUsers;
}]);