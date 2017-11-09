/**
 * Created by hdl on 2017/4/27.
 */
define(["three"], function(THREE) {
    //Bing地图
    var BingTiledLayer = function() {
        THREE.Object3D.call(this);
    };
    BingTiledLayer.prototype = new THREE.Object3D();
    BingTiledLayer.prototype.constructor = BingTiledLayer;


    return BingTiledLayer;
})