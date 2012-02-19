// These are only globals for debugging. To be removed.
var myPath,
	map,
	start,
	end,
	context,

// Some useful globals. Change these values to alter the look/feel/behaviour.
	DRAW_PATH_INTERVAL = 20,
	TILE_SIZE = 3,
	WALL_THRESHOLD = 0.005;

function main() {
	var canvas = document.createElement('canvas'),

		size = TILE_SIZE,
		x = Math.floor(window.innerWidth / size),
		y = Math.floor(window.innerHeight / size);
		
	
	map = new Map({
		tileSize: size,
		xTiles: x,
		yTiles: y,
		wallThreshold: WALL_THRESHOLD
	});
	
	map.doTerrain(0.9, 0.1, 0.05);
	
	
	start = [0, 0];
	end = [x-1, y-1];

	canvas.width = size * x;
	canvas.height = size * y;
	
	context = canvas.getContext('2d');
	
	document.body.appendChild(canvas);
	
	addListeners(canvas);
	
	myPath = new PathFinder(map);
	
	myPath.draw(context);
	
	var sTime = Date.now();
	
	var myRoute = myPath.find(start, end, '', context);
	
	var eTime = Date.now();
	
	console.log('Found the route in', eTime - sTime, 'ms.');
	
	myPath.drawRoute(myRoute, context);
	
}


function Map(props) {
	
	this.map = [];
	
	this.options = {
		tileSize: 10,
		xTiles: 10,
		yTiles: 20,
		wallThreshold: 0.5
	};
	
	for(var i in props) {
		this.options[i] = props[i];
	}
	
	
	this.initialize = function() {
		var i = 0,
			j,
			numX = this.options.xTiles,
			numY = this.options.yTiles,
			current,
			random,
			m = Math,
			tile,
			walls = this.options.wallThreshold;
			
		for(i; i < numX; ++i) {
			
			current = [];
			
			for(j = 0; j < numY; ++j) {
				
				random = m.random();
				
				tile = random < walls ? 1 : 0.1;
				
				// tile = random;
				
				// tile = random < walls ? 1 : random*(walls);
				
				current.push(tile);
				
			}
			
			this.map.push(current);
			
		}
	};
	
	this.getPeakNeighbours = function(peak, max) {
		var x = peak.x,
			y = peak.y,
			out = [];
		
		
		// top
		if(this.map[x][y-1] && this.map[x][y-1] < max) {
			out.push({
				x: x,
				y: y-1
			});
		}
		
		// bottom
		if(this.map[x][y+1] && this.map[x][y+1] < max) {
			out.push({
				x: x,
				y: y+1
			});
		}
		
		// left
		if(this.map[x-1] && this.map[x-1][y] && this.map[x-1][y] < max) {
			out.push({
				x: x-1,
				y: y
			});
		}
		
		// right
		if(this.map[x+1] && this.map[x+1][y] && this.map[x+1][y] < max) {
			out.push({
				x: x+1,
				y: y
			});
		}
		
		// // top left
		// 		if(this.map[x-1] && this.map[x-1][y-1]) {
		// 			out.push({
		// 				x: x-1,
		// 				y: y-1
		// 			});
		// 		}
		// 		
		// 		// bottom left
		// 		if(this.map[x-1] && this.map[x-1][y+1]) {
		// 			out.push({
		// 				x: x-1,
		// 				y: y+1
		// 			});
		// 		}
		// 		
		// 		// top right
		// 		if(this.map[x+1] && this.map[x+1][y-1]) {
		// 			out.push({
		// 				x: x+1,
		// 				y: y-1
		// 			});
		// 		}
		// 		
		// 		// bottom right
		// 		if(this.map[x+1] && this.map[x+1][y+1]) {
		// 			out.push({
		// 				x: x+1,
		// 				y: y+1
		// 			});
		// 		}
		
		return out;
	};
	
	this.doTerrain = function(max, min, decrement) {
		var x, y,
			peaks = [];
		
		
		for(x = 0; x < this.map.length; ++x) {
			
			for(y = 0; y < this.map[x].length; ++y) {
				
				if(this.map[x][y] >= max) {
					peaks.push({
						x: x,
						y: y
					});
				}	
			}
		}
		
		
		for(var i = 0, il = peaks.length; i < il; ++i) {
			var neighbours = this.getPeakNeighbours(peaks[i], max);
			
			for(var n = 0; n < neighbours.length; ++n) {
				this.map[neighbours[n].x][neighbours[n].y] = max - decrement;
			}
			
		}
		
		if(max > min) {
			max = max - decrement;
			arguments.callee.call(this, max, min, decrement);
		}
		
	};
	
	this.initialize();
	
}


function PathFinder(map) {
	
	this.map = map;
	this.grid = null;
	this.result = null;
	
	this.heuristics = {
		manhattan: function(ax, ay, bx, by) {
			var abs = Math.abs,
				result = ( abs(ax - bx) + abs(ay - by) );
				
			return result;
		},
		chebyshev: function(ax, ay, bx, by) {
			var abs = Math.abs;
			return Math.max( abs(ax - bx), abs(ay - by) )
		}
	};
	
	
	this.draw = function(context) {
		var y = 0, x,
			map = this.map.map,
			opts = this.map.options,
			tileSize = opts.tileSize,
			xTiles = opts.xTiles,
			yTiles = opts.yTiles,
			colour;
		
		for(x = 0; x < xTiles; ++x) {
			for(y = 0; y < yTiles; ++y) {
				if(x === start[0] && y === start[1]) {
					context.fillStyle = '#f00';
				}
				else {
					//context.fillStyle = (map[x][y] === 0 ? '#aaa' : '#000');
					context.fillStyle = 'rgba(0,0,0,' + map[x][y] + ')';
				}
				
				context.fillRect(x*tileSize, y*tileSize, tileSize, tileSize);
			}
		}
	};
	
	this.drawRoute = function(route, context) {
		var size = this.map.options.tileSize,
			that = this,
			i = 0;
		
		context.fillStyle = 'rgba(255, 0, 0, 0.5)';
		
		var int = setInterval(function() {
			that.drawSingle(route[i].x*size, route[i].y*size, size, context);
			++i;
			
			if(i === route.length) {
				clearInterval(int);
			}
		}, DRAW_PATH_INTERVAL);
	};
	
	this.drawSingle = function(x, y, size, context) {
		context.fillRect(x, y, size, size);
	};
	
	this.gridify = function(map) {
		
		var obj;
		
		this.grid = [];
		
		for(var i = 0, il = this.map.map.length; i < il; ++i) {
			
			this.grid[i] = [];
			
			for(var j = 0, jl = this.map.map[i].length; j < jl; ++j) {
				
				obj = {
					x: i,
					y: j,
					f: 0,
					g: 0,
					h: 0,
					visted: false,
					closed: false,
					parent: null,
					value: this.map.map[i][j]
				};
				
				this.grid[i].push(obj);
				
			}
			
		}
		
	};
	
	this.getNeighbours = function(current, heuristic) {
		var grid = this.grid,
			out = [],
			x = current.x,
			y = current.y;
		
		// left
		if(grid[x-1] && grid[x-1][y]) {
			grid[x-1][y].weight += 10;
		    out.push(grid[x-1][y]);
	    }
	
		// right
	    if(grid[x+1] && grid[x+1][y]) {
			grid[x+1][y].weight += 10;
		    out.push(grid[x+1][y]);
	    }
	
		// bottom
	    if(grid[x][y-1]) {
			grid[x][y-1].weight += 10;
		    out.push(grid[x][y-1]);
	    }
		
		// top
	    if(grid[x][y+1]) {
			grid[x][y+1].weight += 10;
		    out.push(grid[x][y+1]);
	    }
		
		if(heuristic === 'chebyshev') {
			// top left
			if(grid[x-1] && grid[x-1][y-1]) {
				grid[x-1][y-1].weight += 14;
				out.push(grid[x-1][y-1]);
			}
			
			// top right
			if(grid[x+1] && grid[x+1][y-1]) {
				grid[x+1][y-1].weight += 14;
				out.push(grid[x+1][y-1]);
			}
			
			// bottom left
			if(grid[x-1] && grid[x-1][y+1]) {
				grid[x-1][y+1].weight += 14;
				out.push(grid[x-1][y+1]);
			}
			
			// bottom right
			if(grid[x+1] && grid[x+1][y+1]) {
				grid[x+1][y+1].weight += 14;
				out.push(grid[x+1][y+1]);
			}
		}
		
	
	
	    return out;
	};
	
	this.find = function(start, end, h, context) {
		
		// Set the heuristic function
		heuristic = this.heuristics[h] || this.heuristics.manhattan;
		
		// If the map hasn't been made into a nice collection of descriptive
		// objects yet, make it so.
		this.gridify(this.map);
		
		// Find the start & end point within our grid.
		start = this.grid[start[0]][start[1]];
		end = this.grid[end[0]][end[1]];
		
		var open = [],
			current,
			neighbours,
			numNeighbours,
			currentNeighbour,
			lowest, i, il,
			
			g, isBest;
		
		open.push(start);
		
		while( (il = open.length) && il > 0 ) {
			
			low = 0;
			
			for(i = 0; i < il; ++i) {
				if(open[i].f < open[low].f) {
					low = i;
				}
			}
			
			current = open[low];
			
			if(current === end) {
				// found the end point, so log the path and return
				var c = current,
					ret = [];
					
				while(c.parent) {
					ret.push(c);
					c = c.parent;
				}
				return ret.reverse();
			}
			
			// remove current tile from the open list
			open.splice(low, 1);
			
			// mark current tile as closed
			current.closed = true;
			
			
			// Get current tile's neighbours
			neighbours = this.getNeighbours(current, h);
			
			numNeighbours = neighbours.length;
			
			// Loop through all current's neighbouring tiles, and determine the 
			// closest one to the end goal.
			for(i = 0; i < numNeighbours; ++i) {
				
				currentNeighbour = neighbours[i];
				
				// If we've already looked at this neighbouring tile, or it's
				// a wall, then move on to the next one.
				if(currentNeighbour.closed || currentNeighbour.value === 1) {
					continue;
				}
				
				// g will be the distance from start node to current node.
				g = currentNeighbour.g + 1;
				isBest = false;
				
				// If we've not visted this tile before, calc the heuristic for
				// this tile and push it into the collection of open tiles.
				if(!currentNeighbour.visted) {
					isBest = true;
					currentNeighbour.h = heuristic(currentNeighbour.x, currentNeighbour.y, end.x, end.y);
					
					// give weight to the heuristic by multiplying the `h` value by
					// the alpha value of the current tile
					currentNeighbour.h *= currentNeighbour.value;
					
					currentNeighbour.visted = true;
					open.push(currentNeighbour);
				}
				
				else {
					isBest = true;
				}
				
				
				if(isBest) {
					currentNeighbour.parent = current;
					currentNeighbour.g = g;
					currentNeighbour.f = currentNeighbour.g + currentNeighbour.h;
					
					context.fillStyle = 'rgba(0,255,0, 0.2)';
					context.fillRect(currentNeighbour.x*TILE_SIZE, currentNeighbour.y*TILE_SIZE, TILE_SIZE, TILE_SIZE);
				}
				
			}
			
		}
		
		throw new Error('Cannot find route');
	};
	
}


function addListeners(element) {
	element.addEventListener('click', canvasClick, false);
}

function canvasClick(e) {
	var x = e.pageX,
		y = e.pageY,
		point;
				
	x = Math.floor(x/map.options.tileSize);
	y = Math.floor(y/map.options.tileSize);
	
	point = map.map[x][y];
	
	
	start = end;
	end = [x, y];
	
	var route = myPath.find(start, end, '', context);
	myPath.drawRoute(route, context);
}