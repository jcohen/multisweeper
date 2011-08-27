var uuid = require('node-uuid');

var MineSweeper = exports.MineSweeper = function(model) {
  if (model != undefined) {
    this.uuid = model.uuid;
    this.width = model.width;
    this.height = model.height;
    this.board = model.board;
    this.revealed = model.revealed;
  } else {
    this.uuid = uuid();
    this.width = 10;
    this.height = 10;
    this.revealed = 0;
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

MineSweeper.prototype.placeFlag = function(x,y) {
  if (this.validSquare(x,y)) {
    if (this.board[x][y] < MineSweeper.REVEAL_MODIFIER) {
      if (this.hasBomb(x,y)) {
        this.board[x][y] = MineSweeper.BOMB_AND_FLAG;
      } else {
        this.board[x][y] = MineSweeper.FLAG;
      }
    }
  }
}

MineSweeper.prototype.clearFlag = function(x,y) {
  if (this.validSquare(x,y)) {
    if (this.board[x][y] === MineSweeper.BOMB_AND_FLAG) {
      this.board[x][y] = MineSweeper.BOMB;
    } else if (this.board[x][y] === MineSweeper.FLAG) {
      //restore flag count..
      var count = 0;
      for(var i=x-1; i<=x+1; i++) {
        for(var j=y-1; j<=y+1; j++) {
          if (this.board[i][j] === MineSweeper.BOMB || this.board[i][j] === MineSweeper.BOMB_AND_FLAG) {
            count += 1;
          }
        }
      }
      this.board[x][y] = count;
    }
  }
}

MineSweeper.prototype.revealTile = function(x,y) {
  if (this.validSquare(x,y)) {
    if(this.hasBomb(x,y)) {
      return false;
    }
    if (this.board[x][y] === MineSweeper.EMPTY) { //empty
      this.board[x][y] += MineSweeper.REVEAL_MODIFIER;
      this.revealed += 1;
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
      if (this.board[x][y] < MineSweeper.REVEAL_MODIFIER) {
        this.board[x][y] += MineSweeper.REVEAL_MODIFIER;
        this.revealed += 1;
      }
    }
    return true;
  }
  return false;
}

MineSweeper.prototype.hasBomb = function(x,y) {
  if (this.validSquare(x,y)) {
    return this.board[x][y] === MineSweeper.BOMB || this.board[x][y] === MineSweeper.BOMB_AND_FLAG;
  }
  return false;
}

MineSweeper.prototype.random = function(max) {
  return Math.floor(Math.random()*max);
};

MineSweeper.prototype.validSquare = function(x,y) {
  return x >= 0 && x < this.height && y >= 0 && y < this.width;
};

MineSweeper.prototype.over = function() {
    return (this.revealed + MineSweeper.BOMB_COUNT) >= (this.width*this.height);
}

MineSweeper.BOMB_COUNT = 5;
MineSweeper.EMPTY = 0;
MineSweeper.BOMB = -1;
MineSweeper.FLAG = -2;
MineSweeper.BOMB_AND_FLAG = -3;
MineSweeper.REVEAL_MODIFIER = 10;

MineSweeper.prototype.state = function() {
  var lines = [];
  for(var i=0;i<this.height;i++) {
    var line = [];
    for(var j=0;j<this.width;j++){
      var x = this.board[i][j];
      if (x >= MineSweeper.REVEAL_MODIFIER) {
        x -= MineSweeper.REVEAL_MODIFIER;
      }
      if (this.board[i][j] >= MineSweeper.REVEAL_MODIFIER) {
        line[line.length] = x;
      } else if (this.board[i][j] === MineSweeper.FLAG || this.board[i][j] === MineSweeper.BOMB_AND_FLAG) {
        line[line.length] = 'F';
      } else {
        line[line.length] = '.';
      }
    }
    lines[lines.length] = {"line": line};
  }
  return lines;
}

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
      } else if (x === MineSweeper.BOMB_AND_FLAG) {
        line += '+';
      } else if (x === MineSweeper.FLAG) {
        line += 'F';
      } else if (x >= MineSweeper.REVEALED) {
        line += '.';
      } else {
        line += x;
      }
      if (this.board[i][j] >= MineSweeper.REVEAL_MODIFIER) {
        view += x;
      } else if (this.board[i][j] === MineSweeper.FLAG || this.board[i][j] === MineSweeper.BOMB_AND_FLAG){
        view += 'F';
      } else {
        view += '.';
      }
    }
    console.log(line + " -"+i+"- " + view);
  }
  console.log("Revealed:" + this.revealed);
}
