/**
 * Created by hdl on 2017/4/27.
 */
define([
    "three",
    "js/earth/Constant"
    ],
function (
    THREE,
    Constant
) {
    var Event = {

        bindEvents: function(canvas) {
            if (!(canvas instanceof HTMLCanvasElement)) return;

            window.addEventListener("mousewheel", this.onMouseWheel.bind(this));

        },

        onMouseWheel: function(event) {
            var globe = Constant.globe;
            if (!globe) return;

            var deltaLevel = 0;
            var delta;
            if (event.wheelDelta) {
                delta = event.wheelDelta;
                deltaLevel = parseInt(delta / 120);
            }
            //根据鼠标滚轮的滑动距离，调整当前的可见层级
            var newLevel = globe.CURRENT_LEVEL + deltaLevel;

            newLevel = Math.max( 0, Math.min( Constant.MAX_LEVEL, newLevel ) );
            globe.setLevel(newLevel);
        },

        onWindowResize :function (camera, renderer) {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();

            renderer.setSize( window.innerWidth, window.innerHeight);
        }
    };
    return Event
});