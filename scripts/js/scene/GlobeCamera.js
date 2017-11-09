/**
 * Created by hdl on 2017/4/26.
 */
define([
    "three",
    "Projector",
    "Tween",
    "js/earth/MathUtils",
    "js/earth/Constant",
    "js/TileGrid",
    "js/Utils"
],function (
    THREE,
    Projector,
    TWEEN,
    MathUtils,
    Constant,
    TileGrid,
    Utils
) {
    var GlobeCamera = function () {
        THREE.PerspectiveCamera.call(this, 60, Constant.SCREEN_WIDTH / Constant.SCREEN_HEIGHT, 1, 200000000.0);

        this.updateProjectionMatrix()
    };
    GlobeCamera.prototype = Object.create(THREE.PerspectiveCamera.prototype);
    GlobeCamera.prototype.constructor = GlobeCamera;

    //根据传入的level，调整camera.position，以观察到该层级 setLevel
    GlobeCamera.prototype.setCameraPosByLevel = function(level){
        if (level < 0) {
            return;
        }
        var pOld = this.position;

        if (pOld.x === 0 && pOld.y === 0 && pOld.z === 0) {
            //当缩放层级为0时(初始阶段)
            //初始设置camera
            this.position.set(0, 0, 14198820);
            this.updateProjectionMatrix()
        } else {

            //当缩放层级不为0时
            //当前缩放层级中，视点到表面的距离
            var length2SurfaceNow = MathUtils.getLengthFromCamera2EarthSurface(Constant.globe.CURRENT_LEVEL);
            //即将到达的下一层级到表面的距离
            var length2Surface = MathUtils.getLengthFromCamera2EarthSurface(level);
            //两个缩放级别之间的距离
            var deltaLength = length2SurfaceNow - length2Surface;
            //视线方向
            var dir = this.getWorldDirection();
            dir.setLength(deltaLength);
            pOld.add(dir);
            this.position.set(pOld.x, pOld.y, pOld.z);
            this.updateProjectionMatrix()
        }
        Constant.globe.CURRENT_LEVEL = level;



    };


    /**
     * 算法，一个切片需要渲染需要满足如下三个条件:
     * 1.至少要有一个点在Canvas中可见
     * 2.NDC面积足够大
     * 3.形成的NDC四边形是顺时针方向
     */
    //获取level层级下的可见切片
    //options:projView
    GlobeCamera.prototype.getVisibleTilesByLevel = function(level) {
        var result = [];

        //level = 0,1,2,3时，循环次数为：0,1,3，7
        //大于或等于4时，循环10次
        var LOOP_LIMIT = Math.min(10, Math.pow(2, level) - 1);

        var mathOptions = {
            maxSize: Math.pow(2, level)
        };

        //根据该中心切片的行列号，分别左右遍历，其他可见的切片
        function handleRow(centerRow, centerColumn) {
            var result = [];
            //根据level和行列号获取该切片
            var grid = new TileGrid(level, centerRow, centerColumn); // {level:level,row:centerRow,column:centerColumn};
            //获取该切片的信息，可见的顶点数，切片的面积等
            var visibleInfo = this.getTileVisibleInfo(grid.level, grid.row, grid.column);
            var isRowCenterVisible = Utils.checkIsVisible(visibleInfo);
            if (isRowCenterVisible) {
                //如果该切片可见
                grid.visibleInfo = visibleInfo;
                //则将该切片加入到result中
                result.push(grid);

                //向左遍历至不可见
                var leftLoopTime = 0; //向左循环的次数
                var leftColumn = centerColumn;
                var visible;
                while (leftLoopTime < LOOP_LIMIT) {
                    leftLoopTime++;
                    //获取在某一level周边position的切片(地形缓冲)
                    grid = MathUtils.getTileGridByBrother(level, centerRow, leftColumn, MathUtils.LEFT, mathOptions);
                    leftColumn = grid.column;
                    visibleInfo = this.getTileVisibleInfo(grid.level, grid.row, grid.column);
                    visible = Utils.checkIsVisible(visibleInfo);
                    if (visible) {
                        grid.visibleInfo = visibleInfo;
                        result.push(grid);
                    } else {
                        break;
                    }
                }

                //向右遍历至不可见
                var rightLoopTime = 0; //向右循环的次数
                //初始化为当前切片的中心点坐标
                var rightColumn = centerColumn;
                while (rightLoopTime < LOOP_LIMIT) {
                    rightLoopTime++;
                    grid = MathUtils.getTileGridByBrother(level, centerRow, rightColumn, MathUtils.RIGHT, mathOptions);
                    rightColumn = grid.column;
                    visibleInfo = this.getTileVisibleInfo(grid.level, grid.row, grid.column);
                    visible = Utils.checkIsVisible(visibleInfo);
                    if (visible) {
                        grid.visibleInfo = visibleInfo;
                        result.push(grid);
                    } else {
                        break;
                    }
                }
            }
            return result;
        }

        //计算当前可见范围内的中心点坐标(屏幕中心的NDC坐标为(0, 0))
        var verticalCenterInfo = this.getGeographicByNDC(0, 0);
        //根据经纬度和层级获取当前瓦片的索引(返回层级和行列号),
        var centerGrid = MathUtils.getTileGridByGeo(verticalCenterInfo.lon, verticalCenterInfo.lat, level);
        //获取到上下文
        var handleRowThis = handleRow.bind(this);

        var rowResult = handleRowThis(centerGrid.row, centerGrid.column);
        result = result.concat(rowResult);

        //循环向下处理至不可见
        var bottomLoopTime = 0; //向下循环的次数
        var bottomRow = centerGrid.row;
        var grid;
        while (bottomLoopTime < LOOP_LIMIT) {
            bottomLoopTime++;
            grid = MathUtils.getTileGridByBrother(level, bottomRow, centerGrid.column, MathUtils.BOTTOM, mathOptions);
            bottomRow = grid.row;
            rowResult = handleRowThis(grid.row, grid.column);
            if (rowResult.length > 0) {
                result = result.concat(rowResult);
            } else {
                //已经向下循环到不可见，停止向下循环
                break;
            }
        }

        //循环向上处理至不可见
        var topLoopTime = 0; //向上循环的次数
        var topRow = centerGrid.row;
        while (topLoopTime < LOOP_LIMIT) {
            topLoopTime++;
            grid = MathUtils.getTileGridByBrother(level, topRow, centerGrid.column, MathUtils.TOP, mathOptions);
            topRow = grid.row;
            rowResult = handleRowThis(grid.row, grid.column);
            if (rowResult.length > 0) {
                result = result.concat(rowResult);
            } else {
                //已经向上循环到不可见，停止向上循环
                break;
            }
        }

        return result;
    };

    //options:projView
    //获取该切片的可见信息，包括切片的经纬度范围，各个顶点的经纬度，面积，切片的宽高，可见的顶点数
    GlobeCamera.prototype.getTileVisibleInfo = function(level, row, column) {

        var result = {

            //左下角
            lb: {
                lon: null,
                lat: null,
                verticeInWorld: null,
                verticeInNDC: null,
                visible: false
            },
            //左上角
            lt: {
                lon: null,
                lat: null,
                verticeInWorld: null,
                verticeInNDC: null,
                visible: false
            },
            //右上角
            rt: {
                lon: null,
                lat: null,
                verticeInWorld: null,
                verticeInNDC: null,
                visible: false
            },
            //右下角
            rb: {
                lon: null,
                lat: null,
                verticeInWorld: null,
                verticeInNDC: null,
                visible: false
            },
            Egeo: null,
            //初始化切片的四个顶点的可见数为0
            visibleCount: 0,
            //是否为顺时针方向
            clockwise: false,
            //切片的宽
            width: null,
            //切片的高
            height: null,
            //切片的面积
            area: null
        };


        //根据切片的level、row、column计算该切片所覆盖的经纬度区域的范围,以经纬度表示返回结果
        result.Egeo = MathUtils.getTileGeographicEnvelopByGrid(level, row, column);
        //最小经度
        var tileMinLon = result.Egeo.minLon;
        //最大经度
        var tileMaxLon = result.Egeo.maxLon;
        //最小维度
        var tileMinLat = result.Egeo.minLat;
        //最大维度
        var tileMaxLat = result.Egeo.maxLat;

        //左下角
        result.lb.lon = tileMinLon;
        result.lb.lat = tileMinLat;
        //经纬度转笛卡尔
        result.lb.verticeInWorld = MathUtils.geographicToCartesianCoord(result.lb.lon, result.lb.lat);
        //笛卡尔转NDC
        result.lb.verticeInNDC = this.convertVerticeFromWorldToNDC(result.lb.verticeInWorld);
        //根据NDC判断该点是否可见
        result.lb.visible = Utils.isVisibleInCanvasFromNDC(result.lb.verticeInNDC);
        if (result.lb.visible) {
            result.visibleCount++;
        }

        //左上角
        result.lt.lon = tileMinLon;
        result.lt.lat = tileMaxLat;
        result.lt.verticeInWorld = MathUtils.geographicToCartesianCoord(result.lt.lon, result.lt.lat);
        result.lt.verticeInNDC = this.convertVerticeFromWorldToNDC(result.lt.verticeInWorld);
        result.lt.visible = Utils.isVisibleInCanvasFromNDC(result.lt.verticeInNDC);
        if (result.lt.visible) {
            result.visibleCount++;
        }

        //右上角
        result.rt.lon = tileMaxLon;
        result.rt.lat = tileMaxLat;
        result.rt.verticeInWorld = MathUtils.geographicToCartesianCoord(result.rt.lon, result.rt.lat);
        result.rt.verticeInNDC = this.convertVerticeFromWorldToNDC(result.rt.verticeInWorld);
        result.rt.visible = Utils.isVisibleInCanvasFromNDC(result.rt.verticeInNDC);
        if (result.rt.visible) {
            result.visibleCount++;
        }

        //右下角
        result.rb.lon = tileMaxLon;
        result.rb.lat = tileMinLat;
        result.rb.verticeInWorld = MathUtils.geographicToCartesianCoord(result.rb.lon, result.rb.lat);
        result.rb.verticeInNDC = this.convertVerticeFromWorldToNDC(result.rb.verticeInWorld);
        result.rb.visible = Utils.isVisibleInCanvasFromNDC(result.rb.verticeInNDC);
        if (result.rb.visible) {
            result.visibleCount++;
        }

        //顺序为：以左下角为起点，顺时针旋转
        var ndcs = [result.lb.verticeInNDC, result.lt.verticeInNDC, result.rt.verticeInNDC, result.rb.verticeInNDC];
        //计算方向
        var vector03 = ndcs[3].sub(ndcs[0]);
        vector03.z = 0;
        var vector01 = ndcs[1].sub(ndcs[0]);
        vector01.z = 0;
        //计算一个向量与另一个向量的叉乘
        var cross = vector03.cross(vector01);
        result.clockwise = cross.z > 0;

        var width = window.innerWidth;
        var height = window.innerHeight;


        //计算面积，此处计算的是投影到屏幕上的长度
        //由于投影到球上是存在弧度的，因此这里所求的值为近似解（存在误差）
        var topWidth = Math.sqrt(Math.pow(ndcs[1].x - ndcs[2].x, 2) + Math.pow(ndcs[1].y - ndcs[2].y, 2)) * width / 2;
        var bottomWidth = Math.sqrt(Math.pow(ndcs[0].x - ndcs[3].x, 2) + Math.pow(ndcs[0].y - ndcs[3].y, 2)) * width / 2;
        //计算上下两条边的宽，然后取平均值
        result.width = Math.floor((topWidth + bottomWidth) / 2);
        var leftHeight = Math.sqrt(Math.pow(ndcs[0].x - ndcs[1].x, 2) + Math.pow(ndcs[0].y - ndcs[1].y, 2)) * height / 2;
        var rightHeight = Math.sqrt(Math.pow(ndcs[2].x - ndcs[3].x, 2) + Math.pow(ndcs[2].y - ndcs[3].y, 2)) * height / 2;
        //计算左右两条边的高，然后取平均值
        result.height = Math.floor((leftHeight + rightHeight) / 2);
        //计算最终结果
        result.area = result.width * result.height;

        return result;
    };


    //点变换: World->NDC
    //世界坐标转标准化设备坐标
    GlobeCamera.prototype.convertVerticeFromWorldToNDC = function(verticeInWorld) {

        var verticeInNDC = new THREE.Vector3().copy(verticeInWorld);

        return verticeInNDC.project(this);
    };

    //计算当前NDC坐标所代表的经纬度
    GlobeCamera.prototype.getGeographicByNDC = function(ndcX, ndcY) {
        var pickResults = this.getPickCartesianCoordInEarthByNDC(ndcX, ndcY);
        var pIntersect = pickResults[0];

        //获取到相交点的经纬度
        //笛卡尔转经纬度 以角度表示
        var lonlat = MathUtils.cartesianCoordToGeographic(pIntersect);
        var lon = lonlat[0];
        var lat = lonlat[1];
        return {
            lon: lon,
            lat: lat
        }
    };

    //射线拾取，并返回交点的三维坐标(传入的参数为NDC坐标)
    GlobeCamera.prototype.getPickCartesianCoordInEarthByNDC = function(ndcX, ndcY) {


        var result = [];

        var raycaster = new THREE.Raycaster();
        var mouse = new THREE.Vector2(ndcX, ndcY);

        raycaster.setFromCamera(mouse, this);

        //获取直线与地球的交点，并排序
        var intersects = raycaster.intersectObjects(Constant.globe.scene.children[0].children, true);

        if(intersects.length === 0){
            result = [];
        } else if(intersects.length === 1){
            result = [intersects[0].point]
        } else if(intersects.length === 2){
            result = [intersects[0].point, intersects[1].point];
        }

        return result;









    };










    return GlobeCamera
})