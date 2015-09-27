var Preload = function(game){};

Preload.prototype = {

	preload: function(){ 
        this.game.load.image("p1_jump", "assets/p1_jump.png");
        this.game.load.image("flyFly1", "assets/flyFly1.png");
        this.game.load.image("weight", "assets/weight.png");
        this.game.load.image("slimeWalk1", "assets/slimeWalk1.png");
        this.game.load.physics("sprite_physics", "assets/sprite_physics.json");
	},

	create: function(){
		this.game.state.start("Main");
	}
}