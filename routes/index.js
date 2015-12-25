var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;

var mongoose = require('mongoose');
var Character = mongoose.model('Character');
var Comment = mongoose.model('Comment');

router.get('/characters', function(req, res, next) {
  Character.find(function(err, characters){
    if(err){ return next(err); }
    res.json(characters);
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

  query.exec(function (err, post){
    if (err) { return next(err); }
    if (!character) { return next(new Error('can\'t find character')); }

    req.character = character;
    return next();
  });
});

router.get('/characters/:character', function(req, res) {
  res.json(req.character);
});

router.post('/characters/:character/comments', function(req, res, next) {
  var comment = new Comment(req.body);
  comment.character = req.character;

  comment.save(function(err, comment){
    if(err){ return next(err); }

    req.character.comments.push(comment);
    req.character.save(function(err, post) {
      if(err){ return next(err); }

      res.json(comment);
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