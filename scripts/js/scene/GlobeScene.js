/**
 * Created by hdl on 2017/4/26.
 */
define(["three"],function (THREE) {
    var globeScene = function () {
        THREE.Scene.call(this)
    };


    globeScene.prototype = Object.create(THREE.Scene.prototype);
    globeScene.prototype.constructor = globeScene;

    return globeScene
});