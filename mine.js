var MineSweeper = exports.MineSweeper = function() {
    this.BOMB_COUNT = 30;
    this.EMPTY = 0;
    this.BOMB = -1;
    this.FLAG = -2;

    this.width = 10;
    this.height = 10;
    this.board = new Array(this.height);
    for (i=0;i<this.height;i++) {
      this.board[i] = new Array(this.width);
      for (j=0;j<this.width;j++) {
        this.board[i][j] = this.EMPTY;
      }
    }
    var placed = 0;
    while (placed<this.BOMB_COUNT) {
      this.placeMine(this.random(this.height),this.random(this.width));
      placed++;
    }
};

MineSweeper.prototype.placeMine = function(x, y) {
  if (this.board[x][y] != this.BOMB) {
    this.board[x][y] = this.BOMB;
    for(i=x-1; i<=x+1; i++) {
      for(j=y-1; j<=y+1; j++) {
        if (this.validSquare(i,j) && this.board[i][j] != this.BOMB) {
          this.board[i][j] += 1;
        }
      }
    }
  }
};

MineSweeper.prototype.random = function(max) {
  return Math.floor(Math.random()*max);
};

MineSweeper.prototype.validSquare = function(x,y) {
  return x >= 0 && x < this.height && y >= 0 && y < this.width;
};

//debug 
MineSweeper.prototype.display = function() {
  for(i=0;i<this.height;i++) {
    line = '';
    for(j=0;j<this.width;j++){ 
      if (this.board[i][j] === this.BOMB) {
        line += '*';
      } else {
        line += this.board[i][j];
      }
    }
    console.log(line);
  }
}
