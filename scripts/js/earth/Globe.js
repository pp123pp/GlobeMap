/**
 * Created by hdl on 2017/4/26.
 */
define([
    "three",
    "OrbitControls",
    "Tween",
    "js/earth/Constant",
    "js/scene/GlobeScene",
    "js/scene/GlobeCamera",
    "js/scene/GlobeRenderer",

    "js/Event",
    "js/Utils",

    "js/earth/Tile",
    "js/earth/MathUtils",
    "js/TileGroupLevel",
    "js/Image"
],function (
    THREE,
    OrbitControls,
    TWEEN,
    Constant,
    GlobeScene,
    GlobeCamera,
    GlobeRenderer,
    Event,
    Utils,

    Tile,
    MathUtils,
    TileGroupLevel,
    Image) {
    var Globe = function (container, options) {
        Constant.globe = this;
        this.container = container;
        Constant.globe = this;
        this.MAX_LEVEL = 14; //最大的渲染级别15
        this.CURRENT_LEVEL = -1; //当前渲染等级
        this.REFRESH_INTERVAL = 300; //Globe自动刷新时间间隔，以毫秒为单位
        this.idTimeOut = null; //refresh自定刷新的timeOut的handle
        this.tiledLayer = null;
        this.scene = new GlobeScene();
        this.camera = new GlobeCamera();
        this.renderer = new GlobeRenderer(container);
        this.group = new THREE.Group();
        this.scene.add(this.group);
        //初始渲染层级为0
        this.setLevel(0);
        this.setControls();
        this.render();

        this.setBg();

        this.renderer.domElement.style.position = "relative";

        window.addEventListener('resize', this.onWindowResize, false);
    };

        Globe.prototype = {
            constructor:Globe,

            setTiledLayer: function(tiledLayer) {


                //清除定时器
                clearTimeout(this.idTimeOut);

                this.tiledLayer = tiledLayer;
                var firstLevelTileGroup = new THREE.Group();

                for (var m = 0; m <= 1; m++) {
                    for (var n = 0; n <= 1; n++) {

                        //初始化加载的层级
                        var args = {
                            level: 1,//默认加载层级为1级
                            row: m,
                            column: n,
                            url: ""
                        };
                        //根据加载层级以及行列号获取图片的URL
                        args.url = Image.getImageUrl(args.level, args.row, args.column);
                        var tile = new Tile(args);
                        firstLevelTileGroup.add(tile.mesh)
                    }
                }
                this.group.add(firstLevelTileGroup);

                this.tick();

            },

            update : function(){
                if (!this.tiledLayer || !this.scene || !this.camera) {
                    return;
                }
                //初始this.CURRENT_LEVEL === 0,即，level === 3
                var level = this.CURRENT_LEVEL+ 3;

                //最大级别的level所对应的可见TileGrids
                //获取level层级下的可见切片
                var lastLevelTileGrids = this.camera.getVisibleTilesByLevel(level);
                var tileGroupPerLevel = new TileGroupLevel(lastLevelTileGrids).TileGroup;
                this.group.add(tileGroupPerLevel);

                var globe = Constant.globe;


                if (globe) {
                    var len = globe.group.children.length;

                    for(var i = 0; i<len-1; i++){
                        var object = globe.group.children[i];
                        for(var j=0; j<object.children.length; j++){
                            var mesh = object.children[j];

                            object.remove(mesh);
                            globe.scene.remove(mesh);
                            mesh.geometry.dispose();
                            mesh.material.map.dispose();
                            mesh.material.dispose();
                        }
                        globe.group.remove(object)

                    }
                    this.group.children.slice(len-1)
                    //console.log(this.group.children)
                }
            },

            render : function () {

                var globe = Constant.globe;
                if (globe) {
                    requestAnimationFrame(globe.render);
                    //TWEEN.update();
                    globe.renderer.render(globe.scene, globe.camera);

                }

            },

            tick : function () {
                var globe = Constant.globe;
                if (globe) {
                    //globe.update();      //未完成，因此暂时不执行该语句
                    this.idTimeOut = setTimeout(globe.tick, globe.REFRESH_INTERVAL);

                }
            },


            setLevel : function (level) {
                if(level < 0) return;

                level = level > this.MAX_LEVEL ? this.MAX_LEVEL : level; //限定level的范围
                if(level !== this.CURRENT_LEVEL){
                    //根据level设定camera的坐标
                    this.camera.setCameraPosByLevel(level);
                    this.update();
                }
            },

            setControls : function () {
                this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
                this.controls.enablePan = false;
                this.controls.enableZoom = false;
                this.controls.rotateSpeed = 0.3;


                this.controls.addEventListener('start', function () {
                    var level = MathUtils.getLevelFromCamera2EarthSurface(globe.camera.position);
                    //globe.controls.zoomSpeed = Math.pow(1, level)
                    console.log(level, globe.camera.position.length() - Constant.EARTH_RADIUS)

                })


                
            },

            onWindowResize :function () {
                var globe = Constant.globe;
                if(globe){
                    globe.camera.aspect = window.innerWidth / window.innerHeight;
                    globe.camera.updateProjectionMatrix();
                    globe.renderer.setSize( window.innerWidth, window.innerHeight);
                }
            },
            
            setBg:function () {
                var r = "scripts/images/SkyBox/";
                var urls = [
                    r + "front.png", r + "back.png",
                    r + "left.png", r + "right.png",
                    r + "top.png", r + "bottom.png"
                ];

                this.scene.background = Image.setCubeTexture(urls)
            }

    };


    return Globe

});