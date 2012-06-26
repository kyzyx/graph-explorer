Renderer = function(){
    var sys;
    var w, h;
    var lastclicked = -1;

    var that = {
        init:function(system){
            sys = system;
            sys.screenOffset(0,0);
            sys.screenPadding([30,70,30,30]);
            that.resize();
        },
        resize:function(){
             var content = $('#content');
             w = content.width()*0.95;
             h = content.height()*0.95;
             sys.screenSize(w, h);
             sys.center();
         },
        getOrder:function(center, nodes){
            if (nodes.length == 0) return new Array();
            nodes = nodes.sort(function(a,b){
               return a.data.year - b.data.year;
            });
            var ret = new Array();
            ret[0] = nodes[0];
            var front = 1;
            var back = nodes.length - 1;
            for (var i = 1; i < nodes.length; ++i) {
                if (i%2) ret[front++] = nodes[i];
                else ret[back--] = nodes[i];
            }
            return ret;
        },
        // From http://monkeyandcrow.com/blog/drawing_lines_with_css3/
        moveLine:function(edge,x1, y1, x2, y2){
            var length = Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
            var angle  = Math.atan2(y2 - y1, x2 - x1);
            x1 -= 6*Math.sin(angle);
            x2 -= 6*Math.sin(angle);
            if (Math.abs(angle) > Math.PI/2) {
                y1 += 6*Math.cos(angle)*3;
                y2 += 6*Math.cos(angle)*3;
            }
            else {
                y1 -= 6*Math.cos(angle);
                y2 -= 6*Math.cos(angle);
            }
            angle *= 180 / Math.PI;
            var transform = 'rotate('+angle+'deg)';
            if (!edge.data.elt) 
                edge.data.elt = $('<div>').appendTo('#nodes').addClass('line');
            edge.data.elt.css({
                    'position': 'absolute',
                    'transform': transform,
                    '-webkit-transform': transform,
                    '-moz-transform': transform,
                    '-khtml-transform': transform,
                    '-o-transform': transform,
                    'border-left': length + 'px',
                    'border-style': 'solid',
                    'border-left-color': edge.data.color,
                })
            .width(length)
            .css({left: x1, top: y1});
        },
        makeDiv:function(n){
            var r = n.data.size;
            var tmp = sys.getOffscreen(n.realx, n.realy);
            var off = sys.toScreen(tmp);
            $("#nodes").append("<div id='" + n.id + "'></div>");
            elt = $("#"+n.id);
            elt.addClass('node');
            elt.css({top:off.y-r/2, left:off.x-r/2,
                    width:r, height:r});
            elt.css('line-height', r + "px");
            elt.css('border-radius', r/2 + "px");
            elt.css('-moz-border-radius', r/2 + "px");
            elt.css('-webkit-border-radius', r/2 + "px");
            elt.css('-o-border-radius', r/2 + "px");
            elt.css('background', n.data.color);

            n.data.elt = elt;
            $("#" + n.id).append("<div class='nodeborder'></div>");
        },
        addNodeHandlers:function(n, elt) {
            elt.bind('click', {id:n.id}, function(e) {
                e.stopPropagation();
                n.data.elt.mouseleave();
                if (n.id != lastclicked) {
                    // TODO: Get neighbors!
                    sys.center(n.id);
                    lastclicked = n.id;
                }
            });
            elt.bind('dblclick', {id:n.id}, function(e) {
            });
            elt.bind('mouseenter', {id:n.id}, function(e) {
                n.data.oldcolor = n.data.color;
                n.data.color = "#11e611";
                n.data.elt.css("background", n.data.color);
                var inedges = sys.getEdgesTo(n);
                for (var i = 0; i < inedges.length; ++i) {
                    inedges[i].data.oldcolor = inedges[i].data.color;
                    inedges[i].data.color = "#ff1111";
                    if (inedges[i].data.elt) {
                        inedges[i].data.elt.css('border-left-color', inedges[i].data.color);
                    }
                }
                var outedges = sys.getEdgesFrom(n);
                for (var i = 0; i < outedges.length; ++i) {
                    outedges[i].data.oldcolor = outedges[i].data.color;
                    outedges[i].data.color = "#1111ff";
                    if (outedges[i].data.elt) {
                        outedges[i].data.elt.css('border-left-color', outedges[i].data.color);
                    }
                }

            });
            elt.bind('mouseleave', {id:n.id}, function(e) {
                if (!n.data.oldcolor) return;
                n.data.color = n.data.oldcolor;
                n.data.oldcolor = null;
                n.data.elt.css("background", n.data.color);
                var inedges = sys.getEdgesTo(n);
                for (var i = 0; i < inedges.length; ++i) {
                    inedges[i].data.color = inedges[i].data.oldcolor;
                    if (inedges[i].data.elt) {
                        inedges[i].data.elt.css('border-left-color', inedges[i].data.oldcolor);
                    }
                }
                var outedges = sys.getEdgesFrom(n);
                for (var i = 0; i < outedges.length; ++i) {
                    outedges[i].data.color = outedges[i].data.oldcolor;
                    if (outedges[i].data.elt) {
                        outedges[i].data.elt.css('border-left-color', outedges[i].data.oldcolor);
                    }
                }
            });
        },
        update:function(){
           var t = 2000;
           sys.eachNode(function(n){
               if (n.show) {
                   if (!n.data.elt) {
                        that.makeDiv(n);
                    }
               }
           });
           sys.eachNode(function(n) {
               if (!n.data.elt) return;
               var onscreen = n.data.elt.css("opacity") == "1" && n.show;
               var r = n.data.size;
               var off = sys.toScreen(sys.getOffscreen(n.realx, n.realy));
               var coords = n.show?{top:n.y-r/2, left:n.x-r/2, opacity:1, background:n.data.color}:{top:off.y-r/2, left:off.x-r/2, opacity:0};
               n.data.elt.animate(coords, {
                       duration:n.show?t:t/2,
                       step:function(now,fx) {
                            if (fx.prop == 'left') return;
                            var edges = sys.getEdgesFrom(n);
                            for (var i = 0; i < edges.length; ++i) {
                                if (!edges[i].from.data.elt || !edges[i].to.data.elt) return;
                                that.moveLine(edges[i],
                                    parseFloat(edges[i].from.data.elt.css('left')) + edges[i].from.data.size/2,
                                    parseFloat(edges[i].from.data.elt.css('top')) + edges[i].from.data.size/2, 
                                    parseFloat(edges[i].to.data.elt.css('left')) + edges[i].to.data.size/2, 
                                    parseFloat(edges[i].to.data.elt.css('top')) + edges[i].to.data.size/2);
                                var o1 = parseFloat(edges[i].from.data.elt.css('opacity'));
                                var o2 = parseFloat(edges[i].to.data.elt.css('opacity'));
                                if (edges[i].from != sys.getCenter() &&
                                    edges[i].to   != sys.getCenter()) {
                                    o1 *= .5;
                                    o2 *= .5;
                                }
                                edges[i].data.elt.css('opacity', Math.min(o1,o2));
                            }
                       },
                       complete:function() {
                            var edges = sys.getEdgesFrom(n);
                            for (var i = 0; i < edges.length; ++i) {
                                if (!edges[i].from.data.elt || !edges[i].to.data.elt) return;
                                if (edges[i].from.data.elt.css('opacity') == '0' ||
                                    edges[i].to.data.elt.css('opacity')   == '0') {
                                    edges[i].data.elt.remove();
                                    edges[i].data.elt = null;
                                }
                            }
                            if (n.show && !onscreen) {
                                that.addNodeHandlers(n, n.data.elt);
                            }
                       }
               });
           });
       }
    };
    return that;
};
