import React from 'react';
import Shape from '../components/Shape/Shape';
import defaults from './defaults';

const AppContext = React.createContext();

export const app = {
	isGameOver: false,
	start: true,
	timer: 0,
	lastUpdated: 0,
	maxSpeed: 20,
	speed: 20,
	floatTime: 30,
	currentShape: null,
	currentScore: 0,
	gridCollision:[],
	gridColor:[],
	currentShape: null,
	nextShape: new Shape('s'),
	currentPosition:{
		x: 0,
		y: 0,
	},
	gridSizeX: 10,
	gridSizeY: 20,
	
	startNewGame: () => {
		for(let key in defaults){
			app[key] = defaults[key];
		}
		app.createGridArray();
	},
	
	updateTimer: () => {
		app.timer++
	},
	
	updateCurrentShape: (Shape) => {
		app.currentShape = Shape
	},
	
	createGridArray: () => {
		let gridColor = [];
		let gridCollision = [];
		for(let i = 0; i < app.gridSizeY; i++){
			let rowCollision = [];
			let rowColor = [];
			for(let j = 0; j < app.gridSizeX; j++){
				rowCollision.push(0);
				rowColor.push('BACKGROUND');
			}
			gridCollision.push(rowCollision);
			gridColor.push(rowColor);
		}
		app.gridCollision = Object.assign([], gridCollision);
		app.gridColor = Object.assign([], gridColor);
	},
	
	updateGridColor: () => {
		let shape = app.currentShape.getShape();
		let gridColor = [];

		for(let i = 0; i < app.gridSizeY; i++){
			let rowColor = [];
			for(let j = 0; j < app.gridSizeX; j++){

				let rows = shape.length;
				let cols = shape[0].length;
				
				let y = i - app.currentShape.currentPosition.y;
				let x = j - app.currentShape.currentPosition.x;
				
				if( y >= 0 && y < rows && x >= 0 && x < cols && shape[y][x] === 1) {
					rowColor.push(app.currentShape.color);
				} else {
					if(app.gridCollision[i][j] === 1){	
						rowColor.push(app.gridColor[i][j]);
					} else {
						rowColor.push('BACKGROUND');
					}
				}
				
			}
			gridColor.push(rowColor);
			
		}
		app.gridColor = Object.assign([], gridColor);

	},
	
	updatePosition: () => {
		
		let shape = app.currentShape.getShape();
		console.log(shape)
		let rows = shape.length;
		let cols = shape[0].length;
		let newPosition = app.currentShape.getPosition();
		let duration = app.timer - app.lastUpdated;
		if(duration > app.speed){
			
			app.checkForCollision();
			app.checkForRowMatches();
			app.checkForGameOver();
			
			if(app.isGameOver) return;
			
			if(app.currentShape.canControl == true) {
				newPosition.y++;
				app.currentShape.currentPosition = Object.assign({}, newPosition);
			}
			
			app.lastUpdated = app.timer;
		} 
	},
	
	speedUp: (bool) => {
		app.speed = bool ? app.maxSpeed/15 : app.maxSpeed;
	},
	
	updatePositionOnInput: (input) => {
		if(app.currentShape.canControl == false) return;

		let shape = app.currentShape.getShape();
		let rows = shape.length;
		let cols = shape[0].length;
		let newPosition = {
			y:app.currentShape.getPosition().y,
			x:app.currentShape.getPosition().x,
		}
		switch(input){
			
			case 'ArrowUp':
				app.rotateShape();
				break;
			
			case 'ArrowLeft':
				if(app.canMoveLeft(newPosition)) newPosition.x--;
				break;
				
			case 'ArrowRight':
				if(app.canMoveRight(newPosition)) newPosition.x++;
				break;
				
			default:
				break;
		}
		
		for(let y = 0; y < rows; y++){
			for(let x = 0; x < cols; x++){
				let i = y + newPosition.y;
				let j = x + newPosition.x;
				if(shape[y][x] == 1 && j >= app.gridSizeX) newPosition--;
			}
		}
		
		app.currentShape.currentPosition = Object.assign({}, newPosition);
	},
	
	canMoveLeft: (currentPosition) => {
		let shape = app.currentShape.getShape();
		
		for(let y = 0; y < shape.length; y++){
			for(let x = 0; x < shape[0].length; x++){
				let i = y + currentPosition.y;
				let j = x + currentPosition.x;
				if(shape[y][x] == 1 && j - 1 < 0) return false;
				if(shape[y][x] == 1 && app.gridCollision[i][j - 1] == 1) return false;
			}
		}
		return true;
	},
	
	canMoveRight: (currentPosition) => {
		let shape = app.currentShape.getShape();
		
		for(let y = 0; y < shape.length; y++){
			for(let x = 0; x < shape[0].length; x++){
				let i = y + currentPosition.y;
				let j = x + currentPosition.x;
				if(shape[y][x] == 1 && j + 1 >= app.gridSizeX) return false;
				if(shape[y][x] == 1 && app.gridCollision[i][j + 1] == 1) return false;
			}
		}
		
		return true;
	},
	
	rotateShape: () => {
		
		app.currentShape.rotate();
		let shape = app.currentShape.getShape();
		
		let rows = shape.length;
		let cols = shape[0].length;
		
		const { currentPosition } = app.currentShape;
		
		for(let y = 0; y < shape.length; y++){
			
			for(let x = 0; x < shape[0].length; x++){
				
				let i = y + currentPosition.y;
				
				let j = x + currentPosition.x;
				
				if(shape[y][x] == 1 && (i >= app.gridSizeY || j >= app.gridSizeX) ) {
					app.currentShape.undoRotate();
					return;
				}
				
				if(shape[y][x] == 1 && (j < 0) ) {
					app.currentShape.undoRotate();
					return;
				}
				
				if(app.gridCollision[i][j] == 1 && shape[y][x] == 1) {
					app.currentShape.undoRotate();
					return;
				}
				
			}
			
		}
	},
	
	checkForCollision: () => {
		let shape = app.currentShape.getShape();
		let rows = shape.length;
		let cols = shape[0].length;
		
		const { currentPosition } = app.currentShape;
		
		if(app.collidedWithFloor(currentPosition.y, currentPosition.x,shape) || app.checkObjectCollsion(currentPosition.y, currentPosition.x)){
			app.handleCollision(currentPosition.y,currentPosition.x);
		}
	},
	
	collidedWithFloor: (y, x, shape) => {
		let ylimit = y + shape.length;
		let xlimit = x + shape[0].length;
		for(let i = y; (i < app.gridSizeY) && (i < ylimit); i++){
			for(let j = x; (j < app.gridSizeX) &&  (j < xlimit); j++){
				let shapeComponent = shape[i - y][j - x];
				let gridComponent = i + 1;
				if(shapeComponent == 1 && gridComponent >= app.gridSizeY) {
					return true;
				}
			}
		}
		return false;
	},
	
	checkObjectCollsion: (y, x) => {
		let shape = app.currentShape.getShape();
		let ylimit = y + shape.length;
		let xlimit = x + shape[0].length;
		
		
		let grid = app.gridCollision
		
		for(let i = y; (i < app.gridSizeY - 1) && (i < ylimit); i++){
			for(let j = x; (j < app.gridSizeX) &&  (j < xlimit); j++){
				if(app.gridSizeY && shape[i-y][j-x] == 1 && app.gridCollision[i + 1][j] == 1) return true
			}
		}
		return false;
	},
	
	handleCollision: (y,x) => {
		
		app.currentShape.canControl = false;
		let shape =  app.currentShape.getShape();
		
		for(let i = y; i < app.gridSizeY && i < shape.length + y; i++){
			for(let j = x; j < app.gridSizeX &&  j < shape[0].length + x; j++){
				if(shape[i-y][j-x] == 1) {
					app.gridCollision[i][j] = 1;
					app.gridColor[i][j] = shape.color;
				}
			}
		}
	},
	
	spawnNewShape: () => {
		app.currentShape = app.nextShape;
		app.nextShape = new Shape();
	},
	
	shiftGridDown: (end) => {
		if(end === 0){
			for(let j = 0; j < app.gridSizeX; j++){
				app.gridCollision[0][j] = 0;
				app.gridColor[0][j] = 'BACKGROUND';
			}
			return;
		}
		
		for(let i = end; i > 0; i--){
			for(let j = 1; j < app.gridSizeX; j++){
				app.gridCollision[i][j] = app.gridCollision[i - 1][j];
				app.gridColor[i][j] = 	app.gridColor[i - 1][j];
			}
		}
	},
	
	checkForRowMatches: () => {
		let multiplier = -1;
		let shouldUpdateScore = false;
		
		for(let i = 0; i < app.gridSizeY; i++){
			let filledSpaces = 0;
			for(let j = 0; j < app.gridSizeX; j++){
				if(app.gridCollision[i][j] === 1) filledSpaces++;
			}
			
			if(filledSpaces == app.gridSizeX){
				shouldUpdateScore = true;
				multiplier++;
				app.shiftGridDown(i);
			}
			
		}
		
		if(shouldUpdateScore) app.currentScore += 1000 * Math.pow(2, multiplier);
	},
	
	checkForGameOver: () => {
		if(app.gridCollision[0][3] === 1 ||
				app.gridCollision[0][4] === 1 ||
				app.gridCollision[0][5] === 1 ||
				app.gridCollision[0][6]=== 1){
				app.isGameOver = true;			
		}
	}
}

const defaultOptions = Object.assign({}, app);

export default AppContext;