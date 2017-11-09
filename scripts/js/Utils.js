define(function () {
    var Utils = {

        isFunction : function (func) {
            return typeof v === "function";
        },


        //根据瓦片信息，判断该瓦片是否可见
        checkIsVisible : function (visibleInfo) {
            //只有当当前切片的面积大于5000时并且切片的·四个点顶点为顺时针方向
            if (visibleInfo.area >= 5000 && visibleInfo.clockwise) {
                //切片中至少有一个顶点可见
                if (visibleInfo.visibleCount >= 1) {
                    return true;
                }
            }
            return false;
        },
        
        isVisibleInCanvasFromNDC : function (verticeInNDC) {
            //NDC坐标范围均为[-1, 1]，在这个范围内则可见，否则不可见
            if(verticeInNDC.x >=-1 && verticeInNDC.x<=1 && verticeInNDC.y>=-1 && verticeInNDC.y<=1){
                return true
            } else {
                return false
            }
        }

    };
    return Utils
})



