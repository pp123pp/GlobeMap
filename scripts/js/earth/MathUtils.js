/**
 * Created by hdl on 2017/4/26.
 */
define(["three", "js/earth/Constant", "js/TileGrid"],function (THREE, Constant, TileGrid) {
    var MathUtils = {
        LEFT_TOP: "LEFT_TOP",
        RIGHT_TOP: "RIGHT_TOP",
        LEFT_BOTTOM: "LEFT_BOTTOM",
        RIGHT_BOTTOM: "RIGHT_BOTTOM",
        LEFT: "LEFT",
        RIGHT: "RIGHT",
        TOP: "TOP",
        BOTTOM: "BOTTOM"
    };

    //根据切片的level、row、column计算该切片所覆盖的投影区域的范围(以米为单位)（计算投影坐标）
    MathUtils.getTileWebMercatorEnvelopeByGrid=function (level, row, column) {
        //地球的半周长
        var k = Constant.MAX_PROJECTED_COORD;

        //此处的计算为最简化的计算，存在误差，计算的整体思想为：
        /*以地球的赤道圈为例，地球的赤道圈总长度为2k，在
        * level层级下，赤道圈上排列的瓦片数为var number = Math.pow(2, level)个，
        * 赤道被平均分为（2 * k / number）份
        * 由于瓦片为正方向（未投影前），因此，在level层级下，每个瓦片的所代表的实际投影长度为：
        * var gridSize = 2 * k / Math.pow(2, level);*/

        //gridSize ： 在level层级下每个切片的边长所代表的实际的投影长度
        var gridSize = 2 * k / Math.pow(2, level);
        //该切片左下角以米为单位的X坐标
        var leftBottomX = -k + column * gridSize;
        //该切片右上角以米为单位的X坐标
        var rightTopX = leftBottomX + gridSize;
        //该切片右上角以米为单位的Y坐标
        var rightTopY = k - row * gridSize;
        //该切片左下角以米为单位的Y坐标
        var leftBottomY = rightTopY - gridSize;

        return{
            "minX": leftBottomX,
            "minY": leftBottomY,
            "maxX": rightTopX,
            "maxY": rightTopY
        };

    };
    /**
     * 将投影坐标x转换为以弧度表示的经度
     * @param x 投影坐标x
     * @return {Number} 返回的经度信息以弧度表示
     */
    MathUtils.webMercatorXToRadianLog = function(x) {
        //webMercator反投影X坐标
        return x / Constant.EARTH_RADIUS;
    };
    /**
     * 将投影坐标y转换为以弧度表示的纬度（反投影Y坐标）
     * @param y 投影坐标y
     * @return {Number} 返回的纬度信息以弧度表示
     */
    MathUtils.webMercatorYToRadianLat = function(y) {
        //web墨卡托反投影Y
        var a = y / Constant.EARTH_RADIUS;
        var b = Math.pow(Math.E, a);
        var c = Math.atan(b);
        return 2 * c - Math.PI / 2;

    };

    /**
     * 将投影坐标x转换为以角度表示的经度
     * @param x 投影坐标x
     * @return {*} 返回的经度信息以角度表示
     */
    MathUtils.webMercatorXToDegreeLog = function(x) {

        //投影坐标转弧度
        var radianLog = this.webMercatorXToRadianLog(x);
        //弧度转角度
        return THREE.Math.radToDeg(radianLog);
    };
    /**
     * 将投影坐标y转换为以角度表示的纬度
     * @param y 投影坐标y
     * @return {*} 返回的纬度信息以角度表示
     */
    MathUtils.webMercatorYToDegreeLat = function(y) {
        var radianLat = this.webMercatorYToRadianLat(y);
        return THREE.Math.radToDeg(radianLat);
    };

    /**
     * 将投影坐标x、y转换成以角度表示的经纬度
     * @param x 投影坐标x
     * @param y 投影坐标y
     * @return {Array} 返回的经纬度信息以角度表示
     */
    MathUtils.webMercatorToDegreeGeographic = function(x, y) {
        var degreeLog = this.webMercatorXToDegreeLog(x);
        var degreeLat = this.webMercatorYToDegreeLat(y);
        return [degreeLog, degreeLat];
    };

    //根据切片的level、row、column计算该切片所覆盖的经纬度区域的范围,以经纬度表示返回结果
    MathUtils.getTileGeographicEnvelopByGrid = function(level, row, column) {
        //根据切片的level、row、column计算该切片所覆盖的投影区域的范围(以米为单位)
        var Eproj = this.getTileWebMercatorEnvelopeByGrid(level, row, column);
        //将投影坐标转换为以角度表示的经纬度(这个结果就是经纬度)
        var pMin = this.webMercatorToDegreeGeographic(Eproj.minX, Eproj.minY);
        var pMax = this.webMercatorToDegreeGeographic(Eproj.maxX, Eproj.maxY);

        return {
            "minLon": pMin[0],
            "minLat": pMin[1],
            "maxLon": pMax[0],
            "maxLat": pMax[1]
        };
    };

    /**将经纬度转换为笛卡尔空间直角坐标系中的x、y、z（这里使用了球坐标系）
     * @lon 经度(角度单位)
     * @lat 纬度(角度单位)
     * @r optional 可选的地球半径
     * @p 笛卡尔坐标系中的坐标
     */
    MathUtils.geographicToCartesianCoord = function(lon, lat, r) {

        r = r || Constant.EARTH_RADIUS;
        //degToRad : 角度转弧度
        var radianLon = THREE.Math.degToRad(lon);
        var radianLat = THREE.Math.degToRad(lat);
        var sin1 = Math.sin(radianLon);
        var cos1 = Math.cos(radianLon);
        var sin2 = Math.sin(radianLat);
        var cos2 = Math.cos(radianLat);
        var x = r * sin1 * cos2;
        var y = r * sin2;
        var z = r * cos1 * cos2;
        return new THREE.Vector3(x, y, z);
    };

    /**
     * 根据层级计算出摄像机应该放置到距离地球表面的距离
     * @param level
     * @return {*}
     */
    MathUtils.getLengthFromCamera2EarthSurface = function(level) {
        //14198820 - 6378137 = 7820683
        return 7820683 / Math.pow(2, level);
    };

    //根据当前camera的坐标，计算当前所处的缩放层级
    MathUtils.getLevelFromCamera2EarthSurface = (function () {
            var maxLevel = Constant.MAX_LEVEL;

            //当处于最大level时，与地球表面的最大距离
            var baseLen = MathUtils.getLengthFromCamera2EarthSurface(maxLevel);

            return function getLevelFromCamera2EarthSurface(pos) {
                //视点到表面的距离
                var toSurface = pos.length()-Constant.EARTH_RADIUS;
                //console.log(Constant.globe.controls);

                for(var i=0; i<=maxLevel; i++){

                    var step = baseLen * Math.pow(2, maxLevel - i);

                    if(toSurface - step>=0){
                        return maxLevel-i;
                    }


                    //console.log(baseLen, i, Math.pow(baseLen, i))

                    //if(7820683/toSurface-Math.pow(2, i) < 0) return i
                    //if(toSurface - baseLen * Math.pow(2, i) < 0) return i-1;
                }
                return maxLevel
            }

        }
    )();

    //获取在某一level周边position的切片(地形缓冲)
    MathUtils.getTileGridByBrother = function(brotherLevel, brotherRow, brotherColumn, position, options) {

        options = options || {};
        var result = new TileGrid(brotherLevel, brotherRow, brotherColumn);
        var maxSize;

        //maxSize :在当前level层级下，row、column的最大数量
        if (position === this.LEFT) {
            if (brotherColumn === 0) {
                //Math.pow(x, y):返回x的y次幂
                maxSize = options.maxSize || Math.pow(2, brotherLevel);
                result.column = maxSize - 1;
            } else {
                result.column = brotherColumn - 1;
            }
        } else if (position === this.RIGHT) {
            maxSize = options.maxSize || Math.pow(2, brotherLevel);
            if (brotherColumn === maxSize - 1) {
                result.column = 0;
            } else {
                result.column = brotherColumn + 1;
            }
        } else if (position === this.TOP) {
            if (brotherRow === 0) {
                maxSize = options.maxSize || Math.pow(2, brotherLevel);
                result.row = maxSize - 1;
            } else {
                result.row = brotherRow - 1;
            }
        } else if (position === this.BOTTOM) {
            maxSize = options.maxSize || Math.pow(2, brotherLevel);
            if (brotherRow === maxSize - 1) {
                result.row = 0;
            } else {
                result.row = brotherRow + 1;
            }
        } else {
            throw "invalid position";
        }
        return result;
    };


    /**
     * 获取切片的祖先切片，
     * @param ancestorLevel 祖先切片的level
     * @param level 当前切片level
     * @param row 当前切片row
     * @param column 当前切片column
     * @returns {null}
     */
    MathUtils.getTileGridAncestor = function(ancestorLevel, level, row, column) {
        var result = null;
        if (ancestorLevel < level) {
            //获取当前级别与祖先级别的差值
            var deltaLevel = level - ancestorLevel;
            //ancestor能够包含a*a个当前切片
            var a = Math.pow(2, deltaLevel);
            var ancestorRow = Math.floor(row / a);
            var ancestorColumn = Math.floor(column / a);
            result = new TileGrid(ancestorLevel, ancestorRow, ancestorColumn);
        } else if (ancestorLevel === level) {
            result = new TileGrid(level, row, column);
        }
        return result;
    };


    //根据经纬度和层级获取当前瓦片的索引(返回层级和行列号)
    MathUtils.getTileGridByGeo = function(lon, lat, level) {

        //将以角度表示的经纬度转换为投影坐标
        var coordWebMercator = this.degreeGeographicToWebMercator(lon, lat);//degreeGeographicToWebMercator:将以角度表示的经纬度转换为投影坐标
        var x = coordWebMercator[0];
        var y = coordWebMercator[1];

        var horX = x + Constant.MAX_PROJECTED_COORD;
        var verY = Constant.MAX_PROJECTED_COORD - y;
        //获取在level层级下，每个瓦片边长所代表的的实际投影长度（当投影到球上时存在误差）
        var size = 2 * Constant.MAX_PROJECTED_COORD / Math.pow(2, level);
        var row = Math.floor(verY / size);
        var column = Math.floor(horX / size);
        return new TileGrid(level, row, column);
    };

    /**
     * 将以角度表示的经纬度转换为投影坐标
     * @param degreeLog 以角度表示的经度
     * @param degreeLat 以角度表示的纬度
     * @return {Array}
     */
    MathUtils.degreeGeographicToWebMercator = function(degreeLog, degreeLat) {
        var x = this.degreeLogToWebMercatorX(degreeLog);
        var y = this.degreeLatToWebMercatorY(degreeLat);
        return [x, y];
    };

    /**
     * 将以角度表示的纬度转换为投影坐标y
     * @param degreeLog 以角度表示的经度
     * @return {*} 投影坐标x
     */
    MathUtils.degreeLogToWebMercatorX = function(degreeLog) {
        var radianLog = THREE.Math.degToRad(degreeLog);
        return this.radianLogToWebMercatorX(radianLog);
    };

    /**
     * 墨卡托正投影公式X
     * 将以弧度表示的经度转换为投影坐标x
     * @param radianLog 以弧度表示的经度
     * @return {*} 投影坐标x
     */
    MathUtils.radianLogToWebMercatorX = function(radianLog) {
        return Constant.EARTH_RADIUS * radianLog;
    };


    /**
     * 角度纬度 --> 投影坐标Y
     * @param degreeLat 以角度表示的纬度
     * @return {Number} 投影坐标y
     */
    MathUtils.degreeLatToWebMercatorY = function(degreeLat) {

        var radianLat = THREE.Math.degToRad(degreeLat);
        return this.radianLatToWebMercatorY(radianLat);
    };

    /**
     * 墨卡托正投影公式Y
     * 弧度纬度 -->  投影坐标Y
     * @param radianLat 以弧度表示的纬度
     * @return {Number} 投影坐标y
     */
    MathUtils.radianLatToWebMercatorY = function(radianLat) {
        var a = Math.PI / 4 + radianLat / 2;
        var b = Math.tan(a);
        var c = Math.log(b);
        return Constant.EARTH_RADIUS * c;
    };

    /**
     * 将笛卡尔空间直角坐标系中的坐标转换为经纬度，以角度表示
     * @param vertice
     * @return {Array}
     */
    MathUtils.cartesianCoordToGeographic = function(vertice) {

        var verticeCopy = new THREE.Vector3().copy(vertice);
        var x = verticeCopy.x;
        var y = verticeCopy.y;
        var z = verticeCopy.z;
        var sin2 = y / Constant.EARTH_RADIUS;
        if (sin2 > 1) {
            sin2 = 1;
        } else if (sin2 < -1) {
            sin2 = -1;
        }
        var radianLat = Math.asin(sin2);
        var cos2 = Math.cos(radianLat);
        var sin1 = x / (Constant.EARTH_RADIUS * cos2);
        if (sin1 > 1) {
            sin1 = 1;
        } else if (sin1 < -1) {
            sin1 = -1;
        }
        var cos1 = z / (Constant.EARTH_RADIUS * cos2);
        if (cos1 > 1) {
            cos1 = 1;
        } else if (cos1 < -1) {
            cos1 = -1;
        }
        var radianLog = Math.asin(sin1);
        if (sin1 >= 0) {
            if(cos1<0) radianLog = Math.PI - radianLog;

        } else if(cos1 < 0){
                //经度在[-π,-π/2]之间
                radianLog = -radianLog - Math.PI;
        }

        var degreeLat = THREE.Math.radToDeg(radianLat);
        var degreeLog = THREE.Math.radToDeg(radianLog);
        return [degreeLog, degreeLat];
    };

    return MathUtils
});