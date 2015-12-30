"use strict";

var myModule = angular
  .module('myApp', [
    'ngResource',
     'ngRoute',
    'ngSanitize',
    'ui.bootstrap',
    'ui.router'
  ]);


myModule.factory('auth', ['$http', '$window', function($http, $window){
   var auth = {};

   auth.saveToken = function (token){
    $window.localStorage['asmundr-token'] = token;
  };

  auth.getToken = function (){
    return $window.localStorage['asmundr-token'];
  };

  auth.isLoggedIn = function(){
    var token = auth.getToken();
    if(token){
    var payload = JSON.parse($window.atob(token.split('.')[1]));
    return payload.exp > Date.now() / 1000;
    } else {
      return false;
    }
  };

  auth.currentUser = function(){
    if(auth.isLoggedIn()){
      var token = auth.getToken();
      var payload = JSON.parse($window.atob(token.split('.')[1]));

      return payload.username;
    }
  };

  auth.register = function(user){
    return $http.post('/register', user).success(function(data){
      auth.saveToken(data.token);
    });
  };

  auth.logIn = function(user){
    return $http.post('/login', user).success(function(data){
      auth.saveToken(data.token);
    });
  };

  auth.logOut = function(){
    $window.localStorage.removeItem('asmundr-token');
  };

  return auth;
}]);



//factory of characters for persisting data
myModule.factory('characters', ['$http', 'auth', function($http, auth){
   var o = {
    characters: []
  };
   o.getAll = function() {
    return $http.get('/characters').success(function(data){
      angular.copy(data, o.characters);
    });
  };
  o.create = function(character) {
  return $http.post('/characters', character)
    .success(function(data){
    o.characters.push(data);
  });
};
 o.deleteCharacter = function(characterID){  
   return $http.delete('/delete/'+characterID)
          .success(function() {                
              $scope.items.splice($scope.items.indexOf(characterID), 1);
          })
          .error(function(err) {
                console.log('Error: ' + err);
          });   
 };
 o.get = function(id) {
  return $http.get('/characters/' + id).then(function(res){
    return res.data;
  });
};

  return o;
}]);



//factory of comments for persisting data
myModule.factory('comments', ['$http', 'auth', function($http, auth){
   var o = {
    comments: []
  };
   o.getAll = function() {
    return $http.get('/comments').success(function(data){
      angular.copy(data, o.comments);
    });
  };
  o.create = function(comment) {
  return $http.post('/characters/:id/comments', comment).success(function(data){
    o.comments.push(data);
    });  
  };
  o.deleteComment = function(commentID){  
   return $http.delete('/deleteComment/'+commentID)
          .success(function() {                
              $scope.items.splice($scope.items.indexOf(commentID), 1);
          })
          .error(function(err) {
                console.log('Error: ' + err);
          });   
 };
   /*o.get = function(id) {
    return $http.get('/characters/'+id).then(function(res){
      return res.data;
    });
  };*/
  o.upvote = function(comment) {
  return $http.put('/characters/' + comment._id + '/upvote', null, 
    {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    })
    .success(function(data){
      comment.upvotes += 1;
    });
  };
  return o;
}]);




//controller for displaying the list of chracters
myModule.controller('MainCtrl', [
  '$scope',
  'characters',
  '$http',
  'auth',
  function($scope, characters) {   
  $scope.characters = characters.characters;  
  //$scope.isLoggedIn = auth.isLoggedIn;
  $scope.addCharacter = function(){
    if(!$scope.name || $scope.name === '') { return; }    
    characters.create({
       name: $scope.name, 
       breed: $scope.breed,
       gender: $scope.gender, 
       age: $scope.age,
      });
    $scope.name = '';
    $scope.breed = '';
    $scope.gender = '';
    $scope.age = '';
  };
  $scope.deleteCharacter = function(characterID){       
    characters.deleteCharacter(characterID);    
  };


}]);


//ui-router
myModule.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('home', {
      url: '/home',
      templateUrl: '/home.html',
      controller: 'MainCtrl',
      resolve: {
        postPromise: ['characters', function(characters){
        return characters.getAll();
        }]
      }
    })
    .state('characters', {
      url: '/characters/{id}',
      templateUrl: '/characters.html',
      controller: 'CharactersCtrl',    
      resolve: {
        postPromise: ['comments', function(comments){
        return comments.getAll();
        }]
      }
    })
    .state('delete', {
      url: '/delete/{id}',
      templateUrl: '/delete.html',
      controller: 'MainCtrl'
    })
    .state('edit', {
      url: '/edit/{id}',
      templateUrl: '/edit.html',
      controller: 'CharactersCtrl'
    })
    .state('comments', {
      url: '/comments',
      templateUrl: '/comments.html',
      controller: 'CharactersCtrl',
      resolve: {
        postPromise: ['comments', function(comments){
        return comments.getAll();
        }]
      } 
    })
    .state('deleteComment', {
      url: '/deleteComment/{id}',
      templateUrl: '/deleteComment.html',
      controller: 'CharactersCtrl'
    })
    .state('about', {
      url: '/about',
      templateUrl: '/about.html',      
    })
    .state('login', {
      url: '/login',
      templateUrl: '/login.html',
     controller: 'AuthCtrl',
      /*onEnter: ['$state', 'auth', function($state, auth){
        if(auth.isLoggedIn()){
          $state.go('home');
        }
      }]*/
    })
    .state('register', {
      url: '/register',
      templateUrl: '/register.html',
      controller: 'AuthCtrl',
      /*onEnter: ['$state', 'auth', function($state, auth){
        if(auth.isLoggedIn()){
          $state.go('home');
        }
      }]*/
    });
  $urlRouterProvider.otherwise('home');
}]);


//characters controller
myModule.controller('CharactersCtrl', [
'$scope',
'$stateParams',
'characters',
'$http',
'comments',
'auth',
function($scope, $stateParams, characters, $http, comments){
  $scope.character = characters.characters[$stateParams.id];
  $scope.comments = comments.comments;  
  //$scope.isLoggedIn = auth.isLoggedIn;
  $scope.addComment = function(){
    if($scope.body === '') { return; }
    /*$scope.character.comments.push({
      body: $scope.body,
      author: 'user'    
    });   */
    comments.create({
       body: $scope.body,               
       author: 'user',
       character: $scope.character
      });
    $scope.body = '';    
  };
  $scope.editCharacter = function(characterID, character){         
     return $http.put('/savechanges/' + characterID,character);
  };
  $scope.filterComments = function(characterID) {
    var relatedComments = [];
    var arr = $scope.comments;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].character == characterID) {
        relatedComments.push(arr[i]);
      }
    }
    return relatedComments;    
  };
  $scope.deleteComment = function(commentID){       
    comments.deleteComment(commentID);    
  };
  $scope.incrementUpvotes = function(comment) {
  comments.upvote(comment);
};
}]);



myModule.controller('AuthCtrl', [
'$scope',
'$state',
'auth',
function($scope, $state, auth){
  $scope.user = {};

  $scope.register = function(){
    auth.register($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };

  $scope.logIn = function(){
    auth.logIn($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };

  auth.logOut = function(){
    $window.localStorage.removeItem('asmundr-token');
  };

}]);

myModule.controller('NavCtrl', [
  '$scope',
  'auth',
  function($scope, auth){
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.currentUser = auth.currentUser;
    $scope.logOut = auth.logOut;
  }
]);