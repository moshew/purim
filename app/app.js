// script.js

// create the module and name it app
// also include ngRoute for all our routing needs
var app = angular.module('app', ['ngRoute', 'ngAnimate', 'ngMaterial', 'ngMdIcons', 'angucomplete-alt']);
//var domain = 'http://areport-myfirsttestapp.rhcloud.com/';
//var domain = 'http://isra-net.co.il/~moridimt/';
var domain = 'http://purim-sagol.com/';

// configure our routes
app.config(function ($routeProvider) {
    $routeProvider

        .when('/', {
            templateUrl: 'pages/home.html',
            controller: 'mainController'
        })

        .when('/login', {
            templateUrl: 'pages/login.html',
            controller: 'loginController'
        })

        .when('/top3', {
            templateUrl: 'pages/top3.html',
            controller: 'top3Controller'
        })

        .when('/results', {
            templateUrl: 'pages/results.html',
            controller: 'top3Controller'
        })

        .when('/rating', {
            templateUrl: 'pages/rating.html',
            controller: 'ratingController'
        });
});

app.config(function ($mdThemingProvider) {
    $mdThemingProvider
        .theme('default')
        .primaryPalette('deep-orange') //#ff5722
        .accentPalette('pink')
        .warnPalette('red')
        .backgroundPalette('blue-grey')
});

app.factory('dataShare', function ($http, $location, $timeout) {
    var service = {};
    var pagePromise = null;
    service.data = false;
    service.id = -1;
    service.groups = [];
    service.results = [1,2];
    service.loop = false;

    service.get = function () {
        return this.data;
    };

    service.changePage = function (data, path) {
        this.data = data;
        if (data.hasOwnProperty('id')) {
            this.id = data.id;
            this.groups = data.groups;
            if (data.id != -1) {
                this.loop = true;
                this.loopResults();
            }
        }
        $location.path(path);
        $timeout.cancel(pagePromise);
        pagePromise = $timeout(function () {
            $location.path('');
            service.loop = false;
        }, 5 * 60 * 1000);
    }

    service.loadResults = function () {
        $http.jsonp(domain + 'results.php?callback=JSON_CALLBACK')
            .success(function (data2) {
                service.results = data2;
            });
    }

    service.loopResults = function () {
        $timeout(function () {
            service.loadResults();
            if (service.loop) service.loopResults();
        }, 30 * 1000);
    }
    return service;
});

app.controller('mainController', function ($scope, $http, $location, dataShare) {
    $scope.zoom_factor = window.innerHeight / 5.59;
    $scope.dataShare = dataShare;
    $scope.loading = false;
    $scope.i_width = window.innerWidth;
    $scope.i_height = window.innerHeight;
    $scope.enter = function () {
        $scope.loading = true;
        $http.jsonp(domain+'login.php?callback=JSON_CALLBACK')
            .success(function (data) {
                $scope.loading = false;
                path = (data.id==-1)?'login':'top3';
                dataShare.changePage(data, path);
            });
    };
});

app.controller('loginController', function ($scope, $http, $location, $mdDialog, dataShare) {
    $scope.zoom_factor = window.innerHeight / 5.59;
    $scope.dataShare = dataShare;
    $scope.loginSate = 'code';
    $scope.message = 'הקש את קוד המשתמש לכניסה';
    $scope.value = '';
    $scope.index = 0;
    $scope.fills = [{ value: true }, { value: true }, { value: true }, { value: true }, { value: true }];

    $scope.press = function (val) {
        if (val == 'r') {
            if ($scope.index > 0) {
                $scope.index--;
                $scope.value = $scope.value.slice(0, -1);
            }
            else return;
        }
        else {
            $scope.value += val;
        }

        if ($scope.loginSate == 'code') {
            $scope.fills[$scope.index].value = !($scope.fills[$scope.index].value);
        }

        if (val != 'r') $scope.index++;

        if ($scope.loginSate == 'code' && $scope.index == 5) {
            $http.jsonp(domain+'login.php?callback=JSON_CALLBACK&id=' + $scope.value)
            .success(function (data) {
                refresh();
                if (data.id != -1) dataShare.changePage(data, 'top3');
            });

        } else if ($scope.loginSate == 'phone' && $scope.index == 10) {
            $scope.sendCodeScreen = true;
            $scope.loginLoading = true;
            $http.jsonp(domain+'send_code.php?callback=JSON_CALLBACK&phone=' + $scope.value)
            .success(function (data) {
                $scope.loginLoading = false;
            });
        }
    };

    $scope.sendCode = function () {
        refresh();
        $scope.loginSate = ($scope.loginSate == 'code') ? 'phone' : 'code';
        $scope.message = ($scope.loginSate == 'code') ? 'הקש את קוד המשתמש לכניסה' : 'הכנס מספר ווטסאפ למשלוח קוד';
    };

    refresh = function () {
        $scope.value = '';
        $scope.index = 0;
        $scope.fills = [{ value: true }, { value: true }, { value: true }, { value: true }, { value: true }];
    };
});

app.controller('top3Controller', function ($scope, $http, $location, dataShare) {
    $scope.zoom_factor = window.innerHeight / 5.59;
    //$scope.zoom_factor = window.innerHeight / 6.67;
    $scope.dataShare = dataShare;
    if (dataShare.id==-1) $location.path('');
    dataShare.loadResults();

    $scope.value = '';
    $scope.image_state = '_disabled';


    $scope.press = function (val) {
        if (val == 'd') {
            $scope.value='';
            $scope.image_state = '_disabled';
        }
        else if ($scope.value.length == 2) return;
        else $scope.value += val;

        if ($scope.value.length == 2) {
            $scope.test1 = dataShare.groups;
            if (dataShare.groups.indexOf($scope.value) != -1) {
               $scope.image_state = '';
            }
        }
    };

    $scope.next = function () {
        if ($scope.image_state == '') {
            $http.jsonp(domain+'rate.php?callback=JSON_CALLBACK&id=' + dataShare.id + '&groupId=' + $scope.value)
                .success(function (data) {
                    $scope.value = '';
                    $scope.image_state = '_disabled';
                    dataShare.changePage(data, 'rating');
                });
        }
    };

    $scope.results = function () {
        $location.path('results')
    };

    $scope.back = function () {
        $location.path('top3')
    };
});

app.controller('ratingController', function ($scope, $http, $location, dataShare) {
    $scope.zoom_factor = window.innerHeight / 5.59;
    $scope.dataShare = dataShare;
    if (dataShare.id==-1) $location.path('');

    $scope.r1 = dataShare.data.r1;
    $scope.r2 = dataShare.data.r2;

    $scope.rate = function () {
        $http.jsonp(domain+'rate.php?callback=JSON_CALLBACK&id=' + dataShare.id + '&groupId=' + dataShare.data.groupId+'&r1='+$scope.r1+'&r2='+$scope.r2)
            .success(function (data) {
                dataShare.changePage(data, 'top3');
            });
    }
});
