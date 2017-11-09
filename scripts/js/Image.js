/**
 * Created by hdl on 2017/5/31.
 */
define(["three"], function (THREE) {
    var Image = {
        /**
         *
         * @param level   级别
         * @param row   行
         * @param column  列
         * @returns {string}
         */

        getImageUrl : function (level, row, column) {

            //https://mt1.google.cn/maps/vt?lyrs=y&hl=zh-CN&gl=CN&&x=0&y=0&z=0

            return "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/" + level +"/" + row + "/" + column;
            //return "https://mt1.google.cn/maps/vt?lyrs=y&hl=zh-CN&gl=CN&&x=" + level + "&y=" + row + "&z=" + column
        },
        
        setTexture:(function (url, isCrossOrigin) {
            var loader = new THREE.TextureLoader();

            isCrossOrigin = isCrossOrigin !== undefined ? isCrossOrigin : false;

            if(isCrossOrigin) loader.setCrossOrigin("anonymous");

            return function setTexture(url) {
                return loader.load(url)
            }
        })(),

        setCubeTexture:(function () {
            var loader = new THREE.CubeTextureLoader();

            return function setCubeTexture(url) {
                return loader.load(url)
            }
        })()
    };
     return Image;
});