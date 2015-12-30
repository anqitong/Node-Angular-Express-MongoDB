var express = require('express');
var passport = require('passport');
var jwt = require('express-jwt');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;

var mongoose = require('mongoose');
var Character = mongoose.model('Character');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');
var auth = jwt({secret: 'SECRET', userProperty: 'payload'});


router.get('/characters', function(req, res, next) {
  Character.find(function(err, characters){
    if(err){ return next(err); }
    res.json(characters);
  });       
});

router.get('/comments', function(req, res, next) {
    Comment.find(function(err, comments){
    if(err){ return next(err); }
    res.json(comments);
  });  
});

router.post('/characters', function(req, res, next) {
  var character = new Character(req.body);
  character.save(function(err, post){
    if(err){ return next(err); }
    res.json(character);
  });
});

router.param('character', function(req, res, next, id) {
  var query = Character.findById(id);

  query.exec(function (err, character){
    if (err) { return next(err); }
    if (!character) { return next(new Error('can\'t find character')); }

    req.character = character;
    return next();
  });
});

router.param('comment', function(req, res, next, id) {
  var query = Comment.findById(id);

  query.exec(function (err, comment){
    if (err) { return next(err); }
    if (!comment) { return next(new Error('can\'t find comment')); }

    req.comment = comment;
    return next();
  });
});

router.get('/characters/:character', function(req, res) {
  res.json(req.character);   
});

router.post('/characters/:id/comments', function(req, res, next) {
  var comment = new Comment(req.body);   
  //comment.author = req.payload.username;       
  comment.save(function(err, comment){
    if(err){ res.send(err); }          
    Character.findOne({_id:comment.character},function(err,charac){
      if(err){res.send(err);}
      charac.comments.push(comment);  
      charac.save(function(err, post) {  
        if(err){ res.send(err); }
        res.json(comment);
      });
    });      
  });  
});


 router.delete('/delete/:id', function(req, res, next) {     
    Character.remove({_id: req.params.id}, 
    	function(err, movie) {
    		if (err) {
      		return res.send(err);
    		}
    		res.json({ message: 'Successfully deleted' });
		});
});


 router.delete('/deleteComment/:id', function(req, res, next) {     
    Comment.remove({_id: req.params.id}, 
      function(err, comment) {
        if (err) {
          return res.send(err);
        }
        res.json({ message: 'Successfully deleted' });
    });
});


//get character for the edit form
 router.get('/edit/:character', function(req, res) {
  res.json(req.character);
});

//PUT to update a blob by ID
 router.put('/savechanges/:id',function(req, res) {
 	console.log("ID is "+req.params.id);
	   Character.findOne({_id:req.params.id},function(err,charac){
            if(err)
                return res.send(err);

           for(prop in req.body){
                charac[prop]=req.body[prop];
           }

            // save the character
            charac.save(function(err) {
                if (err)
                   return res.send(err);                     
                res.json({ message: 'Character updated!' });
            });            
        });
	});

 router.put('/characters/:comment/upvote', function(req, res, next) {
  console.log("ici");
  req.comment.upvote(function(err, comm){
    if (err) { return next(err); }
    res.json(comm);
  });
});

 router.post('/register', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  var user = new User();

  user.username = req.body.username;

  user.setPassword(req.body.password)

  user.save(function (err){
    if(err){ return next(err); }

    return res.json({token: user.generateJWT()})
  });
});

 router.post('/login', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  passport.authenticate('local', function(err, user, info){
    if(err){ return next(err); }

    if(user){
      return res.json({token: user.generateJWT()});
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
});