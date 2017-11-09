/**
 * Created by hdl on 2017/4/26.
 */
define(["three", "js/Event"],function (THREE, Event) {
    var GlobeRenderer = function (container) {
        THREE.WebGLRenderer.call(this, {antialias:true});
        this.setClearColor(0xffffff);
        this.setSize(window.innerWidth, window.innerHeight);
        this.setPixelRatio( window.devicePixelRatio );
        container.appendChild(this.domElement);

        Event.bindEvents(this.domElement);
    };
    GlobeRenderer.prototype = Object.create(THREE.WebGLRenderer.prototype);
    GlobeRenderer.prototype.constructor = GlobeRenderer;


    return GlobeRenderer
});