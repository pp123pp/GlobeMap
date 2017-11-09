/**
 * Created by hdl on 2017/4/27.
 */
define([], function() {
    //存储每一个单独的瓦片信息
    var TileGrid = function (level, row, column) {
        this.level = level;
        this.row = row;
        this.column = column;
    };

    TileGrid.prototype._requireMath = function(){
        return require("js/earth/MathUtils");
    };


    //获取到该切片的左边的切片
    TileGrid.prototype.getLeft = function() {
        var MathUtils = this._requireMath();
        return MathUtils.getTileGridByBrother(this.level, this.row, this.column, MathUtils.LEFT);
    };
    //获取到该切片的右边的切片
    TileGrid.prototype.getRight = function() {
        var MathUtils = this._requireMath();
        return MathUtils.getTileGridByBrother(this.level, this.row, this.column, MathUtils.RIGHT);
    };
    //获取到该切片的上边的切片
    TileGrid.prototype.getTop = function() {
        var MathUtils = this._requireMath();
        return MathUtils.getTileGridByBrother(this.level, this.row, this.column, MathUtils.TOP);
    };
    //获取到该切片的下边的切片
    TileGrid.prototype.getBottom = function() {
        var MathUtils = this._requireMath();
        return MathUtils.getTileGridByBrother(this.level, this.row, this.column, MathUtils.BOTTOM);
    };
    //获取到该切片的父切片
    TileGrid.prototype.getParent = function() {
        var MathUtils = this._requireMath();
        return MathUtils.getTileGridAncestor(this.level - 1, this.level, this.row, this.column);
    };
    //获取祖先切片
    TileGrid.prototype.getAncestor = function(ancestorLevel) {
        var MathUtils = this._requireMath();
        return MathUtils.getTileGridAncestor(ancestorLevel, this.level, this.row, this.column);
    };

    return TileGrid;
})