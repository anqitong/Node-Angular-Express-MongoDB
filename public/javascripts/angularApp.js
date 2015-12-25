"use strict";

var myModule = angular
  .module('myApp', [
    'ngResource',
     'ngRoute',
    'ngSanitize',
    'ui.bootstrap',
    'ui.router'
  ]);

//factory for persisting data
myModule.factory('characters', ['$http', function($http){
   var o = {
    characters: []
  };
   o.getAll = function() {
    return $http.get('/characters').success(function(data){
      angular.copy(data, o.characters);
    });
  };
  o.create = function(character) {
  return $http.post('/characters', character).success(function(data){
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


//controller for displaying the list of chracters
myModule.controller('MainCtrl', [
  '$scope',
  'characters',
  '$http',
  function($scope, characters) {   
  $scope.characters = characters.characters;  
  
  $scope.addCharacter = function(){
    if(!$scope.name || $scope.name === '') { return; }
    /*$scope.characters.push({
      name: $scope.name, 
      breed: $scope.breed,
      comments: [
        {author: 'Joe', body: 'Cool post!'},
        {author: 'Bob', body: 'Great idea but everything is wrong!'}
      ]
    });*/
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
      controller: 'CharactersCtrl'
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
    });
  $urlRouterProvider.otherwise('home');
}]);


//characters controller
myModule.controller('CharactersCtrl', [
'$scope',
'$stateParams',
'characters',
'$http',
function($scope, $stateParams, characters, $http){
  $scope.character = characters.characters[$stateParams.id];
  $scope.addComment = function(){
    if($scope.body === '') { return; }
    $scope.character.comments.push({
      body: $scope.body,
      author: 'user'    
    });
    $scope.body = '';
  };

  $scope.editCharacter = function(characterID, character){         
     return $http.put('/savechanges/' + characterID,character);
  };
}]);










myModule.controller('QuestionsCtrl', function($scope, questions) {
	/*$scope.questions = [
		{ number: 1, text: "Lorem ipsum?" }
	];*/
	$scope.questions = questions;


	$scope.currentQuestion = {
		"number": "",
		"text": ""
	};

	$scope.addQuestion =  function() {
		$scope.questions.push({"number": $scope.currentQuestion.number, "text": $scope.currentQuestion.text});
		//$scope.questions.push($scope.currentQuestion);
	};
});

var questService = myModule.service('questionsService', ['$q', '$timeout', '$route', function($q, $timeout, $route) {	
   	this.resolveQuestions = function() {
   		console.log("");
   		var deferred = $q.defer();
   		$timeout(function() {
   			deferred.resolve(
   				[ {   "number": "0", 	"text": "Quest0"  }  ]
   			);
   		}, 500);

   	return deferred.promise;
   	};

}]);


//http://localhost:8081/app/#/questions
myModule.config(function($locationProvider, $routeProvider) {
	//$locationProvider.html5Mode(true);
    $routeProvider
      .when('/questions', {
        templateUrl: 'views/questions.html',
        controller: 'QuestionsCtrl'  ,
        resolve: {
          questions: function(questionsService) {
            return questionsService.resolveQuestions();
          }
        }
      })
      .when('/questions/:questionId', {
        templateUrl: 'views/question.html',
        controller: 'QuestionCtrl'  /*,
        resolve: {
          question: function(questionsService) {
            return questionsService.resolveCurrentQuestion();
          }
        }*/
      })
      .otherwise({
        redirectTo: '/'
      });
  });
