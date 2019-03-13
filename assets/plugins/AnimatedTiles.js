(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("AnimatedTiles", [], factory);
	else if(typeof exports === 'object')
		exports["AnimatedTiles"] = factory();
	else
		root["AnimatedTiles"] = factory();
})(typeof self !== 'undefined' ? self : this, function() {
return  (function(modules) {

 	var installedModules = {};

 	function __webpack_require__(moduleId) {

 		if(installedModules[moduleId]) {
 			return installedModules[moduleId].exports;
 		}

 		var module = installedModules[moduleId] = {
			i: moduleId,
			l: false,
 			exports: {}
 		};

 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

 		module.l = true;

 		return module.exports;
 	}

 	__webpack_require__.m = modules;

 	__webpack_require__.c = installedModules;

 	__webpack_require__.d = function(exports, name, getter) {
 		if(!__webpack_require__.o(exports, name)) {
 			Object.defineProperty(exports, name, {
 				configurable: false,
 				enumerable: true,
 				get: getter
 			});
 		}
 	};

	__webpack_require__.n = function(module) {
 		var getter = module && module.__esModule ?
			function getDefault() { return module['default']; } :
			function getModuleExports() { return module; };
 		__webpack_require__.d(getter, 'a', getter);
 		return getter;
 	};

	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };

	__webpack_require__.p = "";

 	return __webpack_require__(__webpack_require__.s = 0);
 })

 ([

 (function(module, exports, __webpack_require__) {

"use strict";



var AnimatedTiles = function AnimatedTiles(scene) {

    this.scene = scene;

    this.systems = scene.sys;

    this.map = null;

    this.animatedTiles = [];

    this.rate = 1;

    this.active = false;

    this.activeLayer = [];

    this.followTimeScale = true;

    if (!scene.sys.settings.isBooted) {
        scene.sys.events.once('boot', this.boot, this);
    }
};


AnimatedTiles.register = function (PluginManager) {
    PluginManager.register('AnimatedTiles', AnimatedTiles, 'animatedTiles');
};

AnimatedTiles.prototype = {

    boot: function boot() {
        var eventEmitter = this.systems.events;
        eventEmitter.on('postupdate', this.postUpdate, this);
        eventEmitter.on('shutdown', this.shutdown, this);
        eventEmitter.on('destroy', this.destroy, this);
    },

    init: function init(map) {
        var _this = this;

        var mapAnimData = this.getAnimatedTiles(map);
        var animatedTiles = {
            map: map,
            animatedTiles: mapAnimData,
            active: true,
            rate: 1,
            activeLayer: []
        };
        var i = 0;
        map.layers.forEach(function () {
            return animatedTiles.activeLayer.push(true);
        });
        this.animatedTiles.push(animatedTiles);
        if (this.animatedTiles.length === 1) {
            this.active = true; 
        }
        this.animatedTiles[this.animatedTiles.length - 1].animatedTiles.forEach(function (animatedTile) {
            animatedTile.tiles.forEach(function (layer) {
                _this.updateLayer(animatedTile, layer);
            });
        });
    },

    setRate: function setRate(rate) {
        var gid = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
        var map = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

        if (gid === null) {
            if (map === null) {
                this.rate = rate;
            } else {
                this.animatedTiles[map].rate = rate;
            }
        } else {
            var loopThrough = function loopThrough(animatedTiles) {
                animatedTiles.forEach(function (animatedTile) {
                    if (animatedTile.index === gid) {
                        animatedTile.rate = rate;
                    }
                });
            };
            if (map === null) {
                this.animatedTiles.forEach(function (animatedTiles) {
                    loopThrough(animatedTiles.animatedTiles);
                });
            } else {
                loopThrough(this.animatedTiles[map].animatedTiles);
            }
        }
    },


    resetRates: function resetRates() {
        var mapIndex = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

        if (mapIndex === null) {
            this.rate = 1;
            this.animatedTiles.forEach(function (mapAnimData) {
                mapAnimData.rate = 1;
                mapAnimData.animatedTiles.forEach(function (tileAnimData) {
                    tileAnimData.rate = 1;
                });
            });
        } else {
            this.animatedTiles[mapIndex].rate = 1;
            this.animatedTiles[mapIndex].animatedTiles.forEach(function (tileAnimData) {
                tileAnimData.rate = 1;
            });
        }
    },

    resume: function resume() {
        var _this2 = this;

        var layerIndex = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
        var mapIndex = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

        var scope = mapIndex === null ? this : this.animatedTiles[mapIndex];
        if (layerIndex === null) {
            scope.active = true;
        } else {
            scope.activeLayer[layerIndex] = true;
            scope.animatedTiles.forEach(function (animatedTile) {
                _this2.updateLayer(animatedTile, animatedTile.tiles[layerIndex]);
            });
        }
    },

    pause: function pause() {
        var layerIndex = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
        var mapIndex = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

        var scope = mapIndex === null ? this : this.animatedTiles[mapIndex];
        if (layerIndex === null) {
            scope.active = false;
        } else {
            scope.activeLayer[layerIndex] = false;
        }
    },

    postUpdate: function postUpdate(time, delta) {
        var _this3 = this;

        if (!this.active) {
            return;
        }
        var globalElapsedTime = delta * this.rate * (this.followTimeScale ? this.scene.time.timeScale : 1);
        this.animatedTiles.forEach(function (mapAnimData) {
            if (!mapAnimData.active) {
                return;
            }

            var elapsedTime = globalElapsedTime * mapAnimData.rate;
            mapAnimData.animatedTiles.forEach(function (animatedTile) {

                animatedTile.next -= elapsedTime * animatedTile.rate;

                if (animatedTile.next < 0) {
                    var currentIndex = animatedTile.currentFrame;
                    var oldTileId = animatedTile.frames[currentIndex].tileid;
                    var newIndex = currentIndex + 1;
                    if (newIndex > animatedTile.frames.length - 1) {
                        newIndex = 0;
                    }
                    animatedTile.next = animatedTile.frames[newIndex].duration;
                    animatedTile.currentFrame = newIndex;
                    animatedTile.tiles.forEach(function (layer, layerIndex) {
                        if (!mapAnimData.activeLayer[layerIndex]) {
                            return;
                        }
                        _this3.updateLayer(animatedTile, layer, oldTileId);
                    });
                }
            }); 
        }); 
    },

    updateLayer: function updateLayer(animatedTile, layer) {
        var oldTileId = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : -1;

        var tilesToRemove = [];
        var tileId = animatedTile.frames[animatedTile.currentFrame].tileid;
        layer.forEach(function (tile) {

            if (oldTileId > -1 && (tile === null || tile.index !== oldTileId)) {
                tilesToRemove.push(tile);
            } else {

                tile.index = tileId;
            }
        });
        tilesToRemove.forEach(function (tile) {
            var pos = layer.indexOf(tile);
            if (pos > -1) {
                layer.splice(pos, 1);
            } else {
                console.error("Error");
            }
        });
    },

    shutdown: function shutdown() {},

    destroy: function destroy() {
        this.shutdown();
        this.scene = undefined;
    },

    getAnimatedTiles: function getAnimatedTiles(map) {
        var _this4 = this;
        var animatedTiles = [];
        map.tilesets.forEach(
        function (tileset) {
            var tileData = tileset.tileData;
            Object.keys(tileData).forEach(function (index) {
                index = parseInt(index);
                if (tileData[index].hasOwnProperty("animation")) {
                    console.log("gid:",index, tileset.firstgid);
                    var animatedTileData = {
                        index: index + tileset.firstgid, 
                        frames: [], 
                        currentFrame: 0,
                        tiles: [], 
                        rate: 1 
                    };
                    tileData[index].animation.forEach(function (frameData) {
                        let frame = {
                            duration: frameData.duration,
                            tileid: frameData.tileid+tileset.firstgid
                        };
                        animatedTileData.frames.push(frame);
                    });
                    animatedTileData.next = animatedTileData.frames[0].duration;
                    map.layers.forEach(function (layer) {
                        if (layer.tilemapLayer.type === "StaticTilemapLayer") {
                            animatedTileData.tiles.push([]);
                            return;
                        }
                        var tiles = [];
                        layer.data.forEach(function (tileRow) {
                            tileRow.forEach(function (tile) {                                                  
                                if (tile.index - tileset.firstgid === index) {
                                    tiles.push(tile);
                                    console.log(tile,animatedTileData);
                                }
                            });
                        });
                        animatedTileData.tiles.push(tiles);
                    });
                    animatedTiles.push(animatedTileData);
                }
            });
        });
        map.layers.forEach(function (layer, layerIndex) {
            _this4.activeLayer[layerIndex] = true;
        });

        return animatedTiles;
    },

    putTileAt: function putTileAt(layer, tile, x, y) {
    },
    updateAnimatedTiles: function updateAnimatedTiles() {
        var x = null,
            y = null,
            w = null,
            h = null,
            container = null;
        if (container === null) {
            container = [];
            this.animatedTiles.forEach(function (mapAnimData) {
                container.push(mapAnimData);
            });
        }
        container.forEach(function (mapAnimData) {
            var chkX = x !== null ? x : 0;
            var chkY = y !== null ? y : 0;
            var chkW = w !== null ? mapAnimData.map.width : 10;
            var chkH = h !== null ? mapAnimData.map.height : 10;

            mapAnimData.animatedTiles.forEach(function (tileAnimData) {
                tileAnimData.tiles.forEach(function (tiles, layerIndex) {
                    var layer = mapAnimData.map.layers[layerIndex];
                    if (layer.type === "StaticTilemapLayer") {
                        return;
                    }
                    for (var _x9 = chkX; _x9 < chkX + chkW; _x9++) {
                        for (var _y = chkY; _y < chkY + chkH; _y++) {
                            var tile = mapAnimData.map.layers[layerIndex].data[_x9][_y];

                            if (tile.index == tileAnimData.index) {

                                if (tiles.indexOf(tile) === -1) {
                                    tiles.push(tile);
                                }
                                tile.index = tileAnimData.frames[tileAnimData.currentFrame].tileid;
                            }
                        }
                    }
                });
            });
        });
    }
};

AnimatedTiles.prototype.constructor = AnimatedTiles;

module.exports = AnimatedTiles;

 })
]);
});