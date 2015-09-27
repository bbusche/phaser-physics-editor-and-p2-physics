var Main = function(game){

};

Main.prototype = {

	create: function() {

		var me = this;

		me.timesHit = 0;

		//Set the background colour to blue
		me.game.stage.backgroundColor = '#9b59b6';

		//Start the P2 Physics Engine
		me.game.physics.startSystem(Phaser.Physics.P2JS);

	    //Set the gravity
		me.game.physics.p2.gravity.y = 4000;

		//Create a random generator
		var seed = Date.now();
		me.random = new Phaser.RandomDataGenerator([seed]);

		//This is expensive
		me.game.physics.p2.setImpactEvents(true);

		//Create collision groups
	    me.playerCollisionGroup = me.game.physics.p2.createCollisionGroup();
	    me.blockCollisionGroup = me.game.physics.p2.createCollisionGroup();
	    me.weightCollisionGroup = me.game.physics.p2.createCollisionGroup();
	    me.slimeCollisionGroup = me.game.physics.p2.createCollisionGroup();
	    me.flyCollisionGroup = me.game.physics.p2.createCollisionGroup();

	    //Create a groups to hold the enemies and load their hit areas
	    me.weights = game.add.group();
	    me.weights.enableBody = true;
	    me.weights.physicsBodyType = Phaser.Physics.P2JS;
	    me.weights.createMultiple(40, 'weight');

	    me.weights.forEach(function(child){
	        child.body.clearShapes();
			child.body.loadPolygon('sprite_physics', 'weight');
	    }, me);   

	    me.slimes = game.add.group();
	    me.slimes.enableBody = true;
	    me.slimes.physicsBodyType = Phaser.Physics.P2JS;
	    me.slimes.createMultiple(40, 'slimeWalk1');

	    me.slimes.forEach(function(child){
	        child.body.clearShapes();
			child.body.loadPolygon('sprite_physics', 'slimeWalk1');
	    }, me);   

	    me.flys = game.add.group();
	    me.flys.enableBody = true;
	    me.flys.physicsBodyType = Phaser.Physics.P2JS;
	    me.flys.createMultiple(40, 'flyFly1');	

	    me.flys.forEach(function(child){
	        child.body.clearShapes();
			child.body.loadPolygon('sprite_physics', 'flyFly1');
	    }, me);    

	    //This is required so that the groups will collide with the world bounds
	    me.game.physics.p2.updateBoundsCollisionGroup();

		//Create the player, block and rope
		me.createPlayer();
		me.createBlock();
		me.createRope();

		//Create the score label
		me.createScore();

		//Spawn enemies every 300ms
		me.timer = game.time.events.loop(300, function(){
			me.spawnEnemyLeft();
			me.spawnEnemyRight();
		});

	},

	update: function() {

		var me = this;

		//Update the position of the rope
		me.drawRope();

	},

	gameOver: function(){
		this.game.state.start('GameOver');
	},

	createPlayer: function(){

		var me = this;

		//Add the player to the game
		me.player = me.game.add.sprite(200, 400, 'p1_jump');

		//Enable P2 Physics
        me.game.physics.p2.enable([me.player]);

        //Get rid of current bounding box
        me.player.body.clearShapes();

        //Add our Physics Editor bounding shape
		me.player.body.loadPolygon('sprite_physics', 'p1_jump');

		//Uncomment following line to show hit area
		//me.player.body.debug = true;

		//Define the players collision group and make it collide with the block and enemies
		me.player.body.setCollisionGroup(me.playerCollisionGroup);
		me.player.body.collides([me.blockCollisionGroup, me.weightCollisionGroup, me.slimeCollisionGroup, me.flyCollisionGroup], me.playerCollision, me);

	},

	playerCollision: function(){
		
		var me = this;

		if(!me.hitCooldown){
			me.hitCooldown = true;
			me.timesHit++;
			me.scoreLabel.text = me.timesHit; 	

			me.game.time.events.add(1000, function(){
				me.hitCooldown = false;
			}, me);
		}	

	},

	createBlock: function(){

		var me = this;

		//Define our block using bitmap data rather than an image sprite
		var blockShape = me.game.add.bitmapData(me.game.world.width, 200);

		blockShape.ctx.rect(0, 0, me.game.world.width, 200);
		blockShape.ctx.fillStyle = '000';
		blockShape.ctx.fill();

		//Create a new sprite using the bitmap data
		me.block = me.game.add.sprite(0, 0, blockShape);

		//Enable P2 Physics and set the block not to move
		me.game.physics.p2.enable(me.block);
		me.block.body.static = true;
		me.block.anchor.setTo(0, 0);

		//Enable clicking on block and trigger a function when it is clicked
		me.block.inputEnabled = true;
		me.block.events.onInputDown.add(me.changeRope, this);

		//Enable the blocks collisions
		me.block.body.setCollisionGroup(me.blockCollisionGroup);
		me.block.body.collides([me.playerCollisionGroup]);

	},

	createRope: function(){

		var me = this;
   
   		//We're using bitmap data again to draw our rope
	    me.bmd = game.add.bitmapData(me.game.world.width, me.game.world.height);

	    me.bmd.ctx.beginPath();
	    me.bmd.ctx.lineWidth = "4";
	    me.bmd.ctx.strokeStyle = "#ffffff";
	    me.bmd.ctx.stroke();

	    //Create a new sprite using the bitmap data
	    me.line = game.add.sprite(0, 0, me.bmd); 

	    //Keep track of where the rope is anchored
	    me.ropeAnchorX = (me.block.world.x + 500);
	    me.ropeAnchorY = (me.block.world.y + me.block.height);

	    //Create a spring between the player and block to act as the rope
		me.rope = me.game.physics.p2.createSpring(me.block, me.player, 200, 10, 3, [-(me.block.world.x + 500), -(me.block.world.y + me.block.height)]);
		
		//Draw a line from the player to the block to visually represent the spring
		me.line = new Phaser.Line(me.player.x, me.player.y, (me.block.world.x + 500), (me.block.world.y + me.block.height));

	},

	changeRope: function(sprite, pointer){

		var me = this;

		//Remove last spring
		me.game.physics.p2.removeSpring(me.rope);

		//Create new spring at pointer x and y
		me.rope = me.game.physics.p2.createSpring(me.block, me.player, 200, 10, 3, [-pointer.x, -pointer.y]);
		me.ropeAnchorX = pointer.x;
		me.ropeAnchorY = pointer.y

	},

	drawRope: function(){

		var me = this;

		//Change the bitmap data to reflect the new rope position
		me.bmd.clear();
		me.bmd.ctx.beginPath();
		me.bmd.ctx.beginPath();
		me.bmd.ctx.moveTo(me.player.x, me.player.y);
		me.bmd.ctx.lineTo(me.ropeAnchorX, me.ropeAnchorY);
		me.bmd.ctx.lineWidth = 4;
		me.bmd.ctx.stroke();
		me.bmd.ctx.closePath();
		me.bmd.render();

	},

	spawnEnemyLeft: function(){

		var me = this;

		//Spawn a new enemy on the left and give it a random velocity
		var enemyToSpawn = me.random.integerInRange(1,3);

		if(enemyToSpawn == 1){
	        var enemy = me.slimes.getFirstDead();
	        enemy.body.setCollisionGroup(me.slimeCollisionGroup);
		}
		else if (enemyToSpawn == 2){
	        var enemy = me.flys.getFirstDead();
	        enemy.body.data.gravityScale = 0.1;
	        enemy.body.setCollisionGroup(me.flyCollisionGroup);

		}
		else {
	        var enemy = me.weights.getFirstDead();
	        enemy.body.data.gravityScale = 1.5;
	        enemy.body.setCollisionGroup(me.weightCollisionGroup);
		}

        enemy.reset(1, 600);
     	enemy.body.velocity.x = me.random.integerInRange(100, 800);
     	enemy.body.velocity.y = -me.random.integerInRange(1500, 2500);
     	enemy.lifespan = 4000;

        enemy.body.collides([me.slimeCollisionGroup, me.weightCollisionGroup, me.flyCollisionGroup, me.playerCollisionGroup]);

	},

	spawnEnemyRight: function(){

		var me = this;

		//Spawn a new enemiesmy on the left and give it a random velocity
		var enemyToSpawn = me.random.integerInRange(1,3);

		if(enemyToSpawn == 1){
	        var enemy = me.slimes.getFirstDead();
	        enemy.body.setCollisionGroup(me.slimeCollisionGroup);
		}
		else if (enemyToSpawn == 2){
	        var enemy = me.flys.getFirstDead();
	        enemy.body.data.gravityScale = 0.1;
	        enemy.body.setCollisionGroup(me.flyCollisionGroup);
		}
		else {
	        var enemy = me.weights.getFirstDead();
	        enemy.body.data.gravityScale = 1.5;
	        enemy.body.setCollisionGroup(me.weightCollisionGroup);
		}

		//Spawn a new enemy on the left and give it a random velocity
        enemy.reset(me.game.world.width, 600);
     	enemy.body.velocity.x = -me.random.integerInRange(100, 800);
     	enemy.body.velocity.y = -me.random.integerInRange(1500, 2500);
     	enemy.lifespan = 4000;

        enemy.body.collides([me.slimeCollisionGroup, me.weightCollisionGroup, me.flyCollisionGroup, me.playerCollisionGroup]);

	},

	createScore: function(){

		var me = this;

		var scoreFont = "100px Arial";

		me.scoreLabel = me.game.add.text((me.game.world.centerX), 100, "0", {font: scoreFont, fill: "#fff"}); 
		me.scoreLabel.anchor.setTo(0.5, 0.5);
		me.scoreLabel.align = 'center';

	}

};