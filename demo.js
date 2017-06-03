/**
 * A* Search
 * demo
 */

var WALL = 0,
    performance = window.performance;

$(function() {

    var $grid = $("#search_grid"),
        $selectWallFrequency = $("#selectWallFrequency"),
        $selectGridSize = $("#selectGridSize"),
        $checkDebug = $("#checkDebug"),
        $searchDiagonal = $("#searchDiagonal"),
        $checkClosest = $("#checkClosest");

    var opts = {
        wallFrequency: $selectWallFrequency.val(),
        gridSize: $selectGridSize.val(),
        debug: $checkDebug.is("checked"),
        diagonal: $searchDiagonal.is("checked"),
        closest: $checkClosest.is("checked")
    };

    var grid = new GraphSearch($grid, opts, astar.search);

    $("#btnGenerate").click(function() {
        grid.initialize();
    });

    $selectWallFrequency.change(function() {
        grid.setOption({wallFrequency: $(this).val()});
        grid.initialize();
    });

    $selectGridSize.change(function() {
        grid.setOption({gridSize: $(this).val()});
        grid.initialize();
    });

    $checkDebug.change(function() {
        grid.setOption({debug: $(this).is(":checked")});
    });

    $searchDiagonal.change(function() {
        var val = $(this).is(":checked");
        grid.setOption({diagonal: val});
        grid.graph.diagonal = val;
    });

    $checkClosest.change(function() {
        grid.setOption({closest: $(this).is(":checked")});
    });

    $("#generateWeights").click( function () {
        if ($("#generateWeights").prop("checked")) {
            $('#weightsKey').slideDown();
        } else {
            $('#weightsKey').slideUp();
        }
    });

    $("#runBtn").click(function() {
        grid.run();
    });
    $("#setStartBtn").click(function() {
        grid.setStartPos();
    });
    $("#setEndBtn").click(function() {
        grid.setEndPos();
    });
    $("#setWallBtn").click(function() {
        grid.setWallPos();
    });
});

var css = { start: "start", finish: "finish", wall: "wall", active: "active", selected: "selected"};

function GraphSearch($graph, options, implementation) {
    this.$graph = $graph;
    this.search = implementation;
    this.opts = $.extend({wallFrequency:0.1, debug:true, gridSize:10}, options);
    this.nodes = [];
    this.initialize();
}
GraphSearch.prototype.setOption = function(opt) {
    this.opts = $.extend(this.opts, opt);
    this.drawDebugInfo();
};
GraphSearch.prototype.initialize = function() {
    this.grid = [];
    var self = this,
        $graph = this.$graph;

    $graph.empty();

    var cellWidth = ($graph.width()/this.opts.gridSize)-2,  // -2 for border
        cellHeight = ($graph.height()/this.opts.gridSize)-2,
        $cellTemplate = $("<span />").addClass("grid_item").width(cellWidth).height(cellHeight);

    for(var x = 0; x < this.opts.gridSize; x++) {
        var $row = $("<div class='clear' />"),
            nodeRow = [],
            gridRow = [];

        for(var y = 0; y < this.opts.gridSize; y++) {
            var id = "cell_"+x+"_"+y,
                $cell = $cellTemplate.clone();
            $cell.attr("id", id).attr("x", x).attr("y", y);
            $row.append($cell);
            gridRow.push($cell);
            var isWall = Math.floor(Math.random()*(1/self.opts.wallFrequency));
            if(isWall === 0) {
                nodeRow.push(WALL);
                $cell.addClass(css.wall);
            }
            else  {
                var cell_weight = ($("#generateWeights").prop("checked") ? (Math.floor(Math.random() * 3)) * 2 + 1 : 1);
                nodeRow.push(cell_weight);
                $cell.addClass('weight' + cell_weight);
                if ($("#displayWeights").prop("checked")) {
                    $cell.html(cell_weight);
                }
            }
        }
        $graph.append($row);

        this.grid.push(gridRow);
        this.nodes.push(nodeRow);
    }

    this.graph = new Graph(this.nodes);

    // bind cell event, set start/wall positions
    this.$cells = $graph.find(".grid_item");
    this.$cells.click(function() {
        self.cellClicked($(this));
    });
};
GraphSearch.prototype.cellClicked = function($cell) {

    this.$cells.removeClass('active');
    this.$cells.removeClass('selected');
    $cell.addClass("selected");   
};
GraphSearch.prototype.setWallPos = function() {
    var $selected = this.$cells.filter("." + css.selected);
    if ($selected.length < 1) {
        alert("请选择位置");
        return false;
    }
    if ($selected.hasClass(css.start)) {
        alert("起点不能设置为障碍物");
        return false;
    }
    if ($selected.hasClass(css.finish)) {
        alert("终点不能设置为障碍物");
        return false;
    }
    if ($selected.hasClass(css.wall)) {
        this.nodes[$selected.attr('x')][$selected.attr('y')] = 1;
        this.graph = new Graph(this.nodes);
        $selected.removeClass(css.wall).addClass('weight1');
    } else {
        this.nodes[$selected.attr('x')][$selected.attr('y')] = 0;
        this.graph = new Graph(this.nodes);
        $selected.addClass(css.wall).removeClass('weight1');
    }
};
GraphSearch.prototype.setStartPos = function() {
    var $selected = this.$cells.filter("." + css.selected);
    if ($selected.length < 1) {
        alert("请选择位置");
        return false;
    }
    if ($selected.hasClass(css.wall)) {
        alert("起点不能是障碍物");
        return false;
    }
    if ($selected.hasClass(css.finish)) {
        alert("起点不能是终点");
        return false;
    }
    this.$cells.removeClass(css.start).html('');
    $selected.addClass(css.start).html('A');
    $end = this.$cells.filter("." + css.finish);
    if ($end.length > 0) {
        $end.html('B');
    }
    this.$cells.removeClass(css.selected);
};
GraphSearch.prototype.setEndPos = function() {
    var $selected = this.$cells.filter("." + css.selected);
    if ($selected.length < 1) {
        alert("请选择位置");
        return false;
    }
    if ($selected.hasClass(css.wall)) {
        alert("终点不能是障碍物");
        return false;
    }
    if ($selected.hasClass(css.start)) {
        alert("终点不能是起点");
        return false;
    }
    this.$cells.removeClass(css.finish).html('');
    $selected.addClass(css.finish).html('B');
    $start = this.$cells.filter("." + css.start);
    if ($start.length > 0) {
        $start.html('A');
    }
    this.$cells.removeClass(css.selected);
};
GraphSearch.prototype.run = function() {
    var $start = this.$cells.filter("." + css.start);
    var $end = this.$cells.filter("." + css.finish);
    if ($start.length < 1) {
        alert("请设置起点");
        return false;
    }
    if ($end.length < 1) {
        alert("请设置终点");
        return false;
    }
    this.$cells.removeClass(css.selected);
    var start = this.nodeFromElement($start);
    var end = this.nodeFromElement($end);

    var sTime = performance ? performance.now() : new Date().getTime();

    var path = this.search(this.graph, start, end, {
        closest: this.opts.closest
    });
    var fTime = performance ? performance.now() : new Date().getTime(),
        duration = (fTime-sTime).toFixed(2);

    if(path.length === 0) {
        $("#message").text("没有路径可达 (took:" + duration + "ms)");
        this.animateNoPath();
    }
    else {
        $("#message").text("took:" + duration + "ms.");
        this.drawDebugInfo();
        this.animatePath(path);
    }
};
GraphSearch.prototype.drawDebugInfo = function() {
    this.$cells.html(" ");
    var that = this;
    if(this.opts.debug) {
        that.$cells.each(function() {
            var node = that.nodeFromElement($(this)),
                debug = false;
            if (node.visited) {
                debug = "F: " + node.f + "<br />G: " + node.g + "<br />H: " + node.h;
            }

            if (debug) {
                $(this).html(debug);
            }
        });
    }
};
GraphSearch.prototype.nodeFromElement = function($cell) {
    return this.graph.grid[parseInt($cell.attr("x"))][parseInt($cell.attr("y"))];
};
GraphSearch.prototype.animateNoPath = function() {
    var $graph = this.$graph;
    var jiggle = function(lim, i) {
        if(i>=lim) { $graph.css("top", 0).css("left", 0); return; }
        if(!i) i=0;
        i++;
        $graph.css("top", Math.random()*6).css("left", Math.random()*6);
        setTimeout(function() {
            jiggle(lim, i);
        }, 5);
    };
    jiggle(15);
};
GraphSearch.prototype.animatePath = function(path) {
    var grid = this.grid,
        timeout = 1000 / grid.length,
        elementFromNode = function(node) {
        return grid[node.x][node.y];
    };

    var self = this;
    // will add start class if final
    var removeClass = function(path, i) {
        if(i >= path.length) { // finished removing path, set start positions
            return setStartClass(path, i);
        }
        elementFromNode(path[i]).removeClass(css.active);
        setTimeout(function() {
            removeClass(path, i+1);
        }, timeout*path[i].getCost());
    };
    var setStartClass = function(path, i) {
        if(i === path.length) {
            self.$graph.find("." + css.start).removeClass(css.start);
            elementFromNode(path[i-1]).addClass(css.start);
        }
    };
    var addClass = function(path, i) {
        if(i >= path.length) { // Finished showing path, now remove
            //return removeClass(path, 0);
            return;
        }
        elementFromNode(path[i]).addClass(css.active);
        
        setTimeout(function() {
            addClass(path, i+1);
        }, timeout*path[i].getCost());
        
    };

    addClass(path, 0);
    this.$graph.find("." + css.start).addClass(css.active).html('A');
    this.$graph.find("." + css.finish).addClass(css.active).html('B');
    //this.$graph.find("." + css.finish).removeClass(css.finish).addClass(css.start);
};
