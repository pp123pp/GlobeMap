require.config({
    paths:{
        "three":"lib/three",
        "OrbitControls":"lib/OrbitControls",
        "Projector":"lib/Projector",
        "Tween":"lib/Tween"
    },
    shim:{
        "three":{exports:"THREE"},
        "OrbitControls":{
            deps:["three"],
            exports:"OrbitControls"
        },
        "Projector":{
            deps:["three"],
            exports:"Projector"
        },
        "Tween":{
            exports:"TWEEN"
        }
    }
});

require([
        "three",
        "js/earth/Globe",
        "js/BingTiledLayer"

    ],
    function(
        THREE,
        Globe,
        BingTiledLayer
    ){

        Main();
        function Main(){
            var container = document.createElement('div');
            document.body.appendChild(container);
            window.globe = new Globe(container, {
                bg:true
            });
            window.globe.setTiledLayer( new BingTiledLayer());

        }
    }
);