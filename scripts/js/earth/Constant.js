define(["three"],function (THREE) {
    var Constant = {

        globe:null,
        BASE_LEVEL: 6, //渲染的基准层级
        MAX_LEVEL:15,
        EARTH_RADIUS: 6378137,  //地球半径
        MAX_PROJECTED_COORD: 20037508.3427892,  //赤道半周长
        SCREEN_WIDTH : window.innerWidth,
        SCREEN_HEIGHT : window.innerHeight,

        object : new THREE.Mesh(new THREE.SphereBufferGeometry( 6378137,32, 32 ))


    };
    return Constant
});