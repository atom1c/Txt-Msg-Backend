var TxtMsgApp = angular.module("TxtMsgApp", ['luegg.directives']);

TxtMsgApp.factory("MsgServ", ['$rootScope', 'Auth', function ($rootScope, Auth) {
    var MsgServ = {};
    MsgServ.newMsg = "";
    MsgServ.outMsg = "";
    MsgServ.msgStr = function (strMsg) {
        return {"text": Auth.msgPrefix + strMsg, "date": new Date()};
    }
    MsgServ.sendStr = function (strMsg) {
        this.send(this.msgStr(strMsg));
    }
    MsgServ.send = function (msg) {
        this.outMsg = msg;
        $rootScope.$broadcast("SENDMSG");
        this.notifyNewMsg(msg);
    };
    MsgServ.notifyNewMsg = function (msg) {
        this.newMsg = msg;
        $rootScope.$broadcast("NEWMSG");
    };
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