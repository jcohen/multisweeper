var uuid = require('node-uuid');

var MineSweeper = exports.MineSweeper = function() {
  this.uuid = uuid();
  this.width = 10;
  this.height = 10;
  this.board = new Array(this.height);
  for (i=0;i<this.height;i++) {
    this.board[i] = new Array(this.width);
    for (j=0;j<this.width;j++) {
      this.board[i][j] = MineSweeper.EMPTY;
    }
  }
  var placed = 0;
  while (placed<MineSweeper.BOMB_COUNT) {
    this.placeMine(this.random(this.height),this.random(this.width));
    placed++;
  }
};

MineSweeper.prototype.placeMine = function(x, y) {
  if (this.board[x][y] != MineSweeper.BOMB) {
    this.board[x][y] = MineSweeper.BOMB;
    for(i=x-1; i<=x+1; i++) {
      for(j=y-1; j<=y+1; j++) {
        if (this.validSquare(i,j) && this.board[i][j] != MineSweeper.BOMB) {
          this.board[i][j] += 1;
        }
      }
    }
  }
};

MineSweeper.prototype.revealTile = function(x,y) {
  if (this.validSquare(x,y)) {
    if(this.hasBomb(x,y)) {
      return false;
    }
    if (this.board[x][y] === MineSweeper.EMPTY) { //empty
      this.board[x][y] += MineSweeper.REVEAL_MODIFIER;
      for(var i=x-1; i<=x+1; i++) {
        for(var j=y-1; j<=y+1; j++) {
          if (i==x && y==j) {
            continue;
          }
          if (this.validSquare(i,j) && this.board[i][j] < MineSweeper.REVEAL_MODIFIER && 
              this.board[i][j] != MineSweeper.FLAG) {
                this.revealTile(i,j);
          }
        }
      }
    } else {
      this.board[x][y] += MineSweeper.REVEAL_MODIFIER;
    }
    return true;
  }
  return false;
}

MineSweeper.prototype.hasBomb = function(x,y) {
  if (this.validSquare(x,y)) {
    return this.board[x][y] === MineSweeper.BOMB;
  }
  return false;
}

MineSweeper.prototype.random = function(max) {
  return Math.floor(Math.random()*max);
};

MineSweeper.prototype.validSquare = function(x,y) {
  return x >= 0 && x < this.height && y >= 0 && y < this.width;
};

MineSweeper.BOMB_COUNT = 15;
MineSweeper.EMPTY = 0;
MineSweeper.BOMB = -1;
MineSweeper.FLAG = -2;
MineSweeper.REVEAL_MODIFIER = 10;


//debug 
MineSweeper.prototype.display = function() {
  for(var i=0;i<this.height;i++) {
    line = '';
    view = '';
    for(var j=0;j<this.width;j++){ 
      var x = this.board[i][j];
      if (x >= MineSweeper.REVEAL_MODIFIER) {
        x -= MineSweeper.REVEAL_MODIFIER;
      }
      if (x === MineSweeper.BOMB) {
        line += '*';
      } else if (x >= MineSweeper.REVEALED) {
        line += '.';
      } else {
        line += x;
      }
      if (this.board[i][j] >= MineSweeper.REVEAL_MODIFIER) {
        view += x;
      } else {
        view += '.';
      }
    }
    console.log(line + " -"+i+"- " + view);
  }
}
