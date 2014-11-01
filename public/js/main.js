var BuildingView = Backbone.View.extend({
	initialize: function(){
		// console.log('Set building:');
		// console.log('width : ' + this.model.get('X'));
		// console.log('height : ' + this.model.get('Y'));
		// console.log('left : ' + this.model.get('x'));
		// console.log('top : ' + this.model.get('y'));
		this.$el.css({
			width : this.model.get('X'),
			height : this.model.get('Y'),
			left : this.model.get('x'),
			top : this.model.get('y')
		});
	}
})

var Building = Backbone.Model.extend({
	defaults: {
		X : null,
		Y : null,
		Z : 1,
		x : null,
		y : null,
		z : 0,
		growRatio : .6,
		index : null
	},
	initialize: function(){
		this.on('add', this.build, this);
	},
	build: function(){
		new BuildingView({model : this, el : $('<div class="building" />').appendTo('body')});
	},
	step: function(){
		if(Math.random() < this.get('growRatio')) console.log('grow');
	}
});

var Buildings = Backbone.Collection.extend({
	model: Building,
	comparator: 'index'
});

var Neighborhood = Backbone.Model.extend({
	defaults: {
		buildings : new Buildings(),
		buildRatio : 1,
		spreadRatio : .01,
		minX : 3,
		minY : 3,
		minZ : 5,
		maxX : 10,
		maxY : 10,
		maxZ : 200,
		x : null,
		y : null,
		buildIndex : 0
	},
	initialize: function(){
		var X = ('X', Math.floor(Math.random() * (this.get('maxX') - this.get('minX') + 1)) + this.get('minX'));
		var Y = ('Y', Math.floor(Math.random() * (this.get('maxY') - this.get('minY') + 1)) + this.get('minY'));
		var x = -_.random(X);
		var y = -_.random(Y);
		this.get('buildings').add({
			index : 0,
			X : X,
			Y : Y,
			x : x,
			y : y
		});
		for(p = 0; p < (X + 2) * (Y + 2); p++ ) positions.push({ x: (x - 1) + Math.floor(p - (X + 2) * Math.floor(p / (X + 2))), y: (y - 1) + Math.floor(p / (X + 2)) });
	},
	build: function(){
		var X = ('X', Math.floor(Math.random() * (this.get('maxX') - this.get('minX') + 1)) + this.get('minX'));
		var Y = ('Y', Math.floor(Math.random() * (this.get('maxY') - this.get('minY') + 1)) + this.get('minY'));
		var buildingData = this.getAdjacentPosition(X,Y);
		var x = buildingData.x;
		var y = buildingData.y;
		var index = buildingData.index;
		if(!x || !y || !index){
			//console.log('not fit');
			this.set('buildIndex', this.get('buildIndex') + 1);
			this.build();
		}else{
			this.get('buildings').add({
				index : index,
				X : X,
				Y : Y,
				x : x,
				y : y
			});
			for(p = 0; p < (X + 2) * (Y + 2); p++ ) positions.push({ x: (x - 1) + Math.floor(p - (X + 2) * Math.floor(p / (X + 2))), y: (y - 1) + Math.floor(p / (X + 2)) });
		}
	},
	getAdjacentPosition: function(X,Y){
		var data = { x: null, y: null, index: null};
		var buildings = this.get('buildings').where({ index : this.get('buildIndex') });
		buildings.forEach(function(building){
			var adjacents = [];
			// top + bottom
			for(p = 0; p < building.get('X') + X + 2; p++ ){
				adjacents.push({ x: building.get('x') - 1 - X + p, y: building.get('y') - 1 - Y });
				adjacents.push({ x: building.get('x') - 1 - X + p, y: building.get('y') + building.get('Y') + 1 });
			}
			// left + right
			for(p = 0; p < building.get('Y') + Y + 2; p++ ){
				adjacents.push({ x: building.get('x') - 1 - X, y: building.get('y') - 1 - Y + p });
				adjacents.push({ x: building.get('x') + building.get('X') + 1, y: building.get('y') - 1 - Y + p });
			}
			console.log(adjacents.length)
			_.shuffle(adjacents).forEach(function(adjacent){
				var fits = true;
				for(p = 0; p < X * Y; p++ ){
					if(positions.findWhere({ x: adjacent.x + Math.floor(p - X * Math.floor(p / X)), y: adjacent.y + Math.floor(p / X) })) return fits = false;
				}
				if(fits) return data = { x: adjacent.x, y: adjacent.y, index: (building.get('index') + 1) };
			});
		});
		return data;
	},
	step: function(){
		//console.log('neighborhood step');
		if(Math.random() < this.get('buildRatio')) this.build();
		this.get('buildings').each(function(building){
			_.bind(building.step, building)();
		});
	}
});

var Position = Backbone.Model.extend({
	defaults: {
		x : null,
		y : null
	}
});
var Positions = Backbone.Collection.extend({
	model: Position
});
var Neighborhoods = Backbone.Collection.extend({
	model: Neighborhood
});

var City = Backbone.Model.extend({
	defaults: {
		crons : 0,
		neighborhoods : new Neighborhoods()
	},
	initialize: function(){
		var neighborhoods = this.get('neighborhoods');
		if(!neighborhoods.length) neighborhoods.add({x: 0, y: 0});
	},
	step: function(cron){
		if(isNaN(cron) || parseInt(Number(cron)) !== cron || isNaN(parseInt(cron, 10))) cron = 1;
		this.set('crons', this.get('crons') + cron);
		console.log('--- step ---')
		this.get('neighborhoods').each(function(neighborhood){
			_.bind(neighborhood.step, neighborhood)();
			//if(Math.random() < neighborhood.get('spreadRatio')) console.log('spread');
		});
	}
});


var positions = new Positions();
var city = new City();
$(window).bind('click', _.bind(city.step, city));
