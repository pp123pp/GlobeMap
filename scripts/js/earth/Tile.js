/**
 * Created by hdl on 2017/4/14.
 */
define([
    "three",
    "js/earth/Constant",
    "js/earth/MathUtils",
    "js/Image"
    ],
    function(
        THREE,
        Constant,
        MathUtils,
        Image
        ) {
        //args中包含level、row、column、url即可
        var Tile = function(args) {
            if (args) {

                this.level = 0;
                this.row = 0;
                this.column = 0;
                this.url = args.url;
                this.minLon = null;
                this.minLat = null;
                this.maxLon = null;
                this.maxLat = null;
                this.minX = null;
                this.minY = null;
                this.maxX = null;
                this.maxY = null;

                this.createVerticeData(args)
            }
        };

        Tile.prototype.constructor = Tile;
        Tile.prototype.createVerticeData = function(args) {
            if (!args) {
                return;
            }
            // 根据传入的切片的层级以及行列号信息设置切片的经纬度范围 以及设置其纹理
            this.setTileInfo(args);
            this.handleGlobeTile();

        };

        //处理球面的切片
        Tile.prototype.handleGlobeTile = function() {
            if (this.level < Constant.BASE_LEVEL) {
                //当缩放层级较低时,能看到地球的大部分地区，为防止投影失真,采用较大的分段数构建球体
                var changeLevel = Constant.BASE_LEVEL - this.level;
                //该层级下，每行，每列均有segment个切片
                this.segment = Math.pow(2, changeLevel);
            } else {
                this.segment = 1;
            }
            this.handleTile();
        };

        // 根据传入的切片的层级以及行列号信息设置切片的经纬度范围 以及设置其纹理
        Tile.prototype.setTileInfo = function(args) {


            this.level = args.level;
            this.row = args.row;
            this.column = args.column;

            //经纬度范围
            // 根据切片的level、row、column计算该切片所覆盖的经纬度区域的范围,以经纬度表示返回结果
            var Egeo = MathUtils.getTileGeographicEnvelopByGrid(this.level, this.row, this.column);
            this.minLon = Egeo.minLon;
            this.minLat = Egeo.minLat;
            this.maxLon = Egeo.maxLon;
            this.maxLat = Egeo.maxLat;
            // 将以角度表示的经纬度转换为投影坐标
            var minCoord = MathUtils.degreeGeographicToWebMercator(this.minLon, this.minLat);
            var maxCoord = MathUtils.degreeGeographicToWebMercator(this.maxLon, this.maxLat);
            //投影坐标范围
            this.minX = minCoord[0];
            this.minY = minCoord[1];
            this.maxX = maxCoord[0];
            this.maxY = maxCoord[1];


        };

        Tile.prototype.handleTile = function() {
            this.visible = true;
            var vertices = [];
            var indices = [];
            var textureCoords = [];

            //X方向每个切片的长度
            var deltaX = (this.maxX - this.minX) / this.segment;
            //Y方向每个切片的长度
            var deltaY = (this.maxY - this.minY) / this.segment;
            //level不同设置的半径也不同
            var levelDeltaR = 0; //this.level * 100;
            //对WebMercator投影进行等间距划分格网
            var mercatorXs = []; //存储从最小的x到最大x的分割值
            var mercatorYs = []; //存储从最大的y到最小的y的分割值
            var textureSs = []; //存储从0到1的s的分割值
            var textureTs = []; //存储从1到0的t的分割值
            var i, j;

            for (i = 0; i <= this.segment; i++) {
                //mercatorXs ： 每个切片左下角的X的投影坐标
                mercatorXs.push(this.minX + i * deltaX);
                //mercatorYs ： 每个切片右上角的Y的投影坐标
                mercatorYs.push(this.maxY - i * deltaY);
                var b = i / this.segment;
                textureSs.push(b);
                textureTs.push(1 - b);
            }
            //从左上到右下遍历填充vertices和textureCoords:从最上面一行开始自左向右遍历一行，然后再以相同的方式遍历下面一行
            for (i = 0; i <= this.segment; i++) {
                for (j = 0; j <= this.segment; j++) {
                    var merX = mercatorXs[j];
                    var merY = mercatorYs[i];
                    //将投影坐标x、y转换成以角度表示的经纬度
                    var lonlat = MathUtils.webMercatorToDegreeGeographic(merX, merY);
                    //将角度表示的经纬度转换为笛卡尔空间直角坐标系中的x、y、z
                    var p = MathUtils.geographicToCartesianCoord(lonlat[0], lonlat[1], Constant.EARTH_RADIUS + levelDeltaR).toArray();
                    vertices = vertices.concat(p); //顶点坐标
                    textureCoords = textureCoords.concat(textureSs[j], textureTs[i]); //纹理坐标
                }
            }

            //从左上到右下填充indices
            //添加的点的顺序:左上->左下->右下->右上
            //0 1 2; 2 3 0;
            /*对于一个面从外面向里面看的绘制顺序
             */
            for (i = 0; i < this.segment; i++) {
                for (j = 0; j < this.segment; j++) {
                    var idx0 = (this.segment + 1) * i + j;
                    var idx1 = (this.segment + 1) * (i + 1) + j;
                    var idx2 = idx1 + 1;
                    var idx3 = idx0 + 1;
                    indices = indices.concat(idx0, idx1, idx2); // 0 1 2
                    indices = indices.concat(idx2, idx3, idx0); // 2 3 0
                }
            }

            var infos = {
                vertices: vertices,
                indices: indices,
                textureCoords: textureCoords
            };

            this.setBuffers(infos);
        };

        Tile.prototype.setBuffers = function (infos) {
            this.material = new THREE.MeshBasicMaterial({
                map:Image.setTexture(this.url, true),
                transparent : true
            });

            this.geometry = new THREE.BufferGeometry();
            var vertices = new Float32Array(infos.vertices);
            var indices = new Uint32Array(infos.indices);
            var texCoords = new Float32Array(infos.textureCoords);

            this.geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
            this.geometry.setIndex( new THREE.BufferAttribute( indices, 1 ) );
            this.geometry.addAttribute( 'uv', new THREE.BufferAttribute( texCoords, 2 ));

            this.mesh = new THREE.Mesh(this.geometry, this.material);
        };

        return Tile;
    });