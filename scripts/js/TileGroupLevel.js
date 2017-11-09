/**
 * Created by hdl on 2017/5/29.
 */
define([
    "three",
    "js/Image",
    "js/earth/Tile"
    ],
    function (
        THREE,
        Image,
        Tile) {
    /**
     *存储每一级的所有瓦片
     * @param tileGrids     每一级的所有可见瓦片信息(level,row, col)
     * @constructor
     */
    var TileGroupLevel = function (tileGrids) {
        this.TileGroup = new THREE.Group();

        this.addTiles(tileGrids)
    };

    TileGroupLevel.prototype.constructor = TileGroupLevel;

    TileGroupLevel.prototype.addTiles = function (tileGrids) {

        for(var i=0, len = tileGrids.length;i<len; i++){
            var args = {
                level : tileGrids[i].level,
                row : tileGrids[i].row,
                column : tileGrids[i].column,
                url : ""
            };
            args.url = Image.getImageUrl(tileGrids[i].level, tileGrids[i].row, tileGrids[i].column);
            var tile = new Tile(args);


            this.TileGroup.add(tile.mesh)
        }


    };

    return TileGroupLevel
});