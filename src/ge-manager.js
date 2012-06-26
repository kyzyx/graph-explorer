GE = function() {
    var nodes = {};
    var fromedges = {};
    var toedges = {};
    var layout = null;
    var oldcenter = null;

    // layout object needs: resize methods, init method, update, and getOrder

    var screen = {width:-1, height:-1, l:0, t:0, ewidth:-1, eheight:-1,
        padding:[0,0,0,0]};

    var toNode = function(n,create) {
        if (typeof(n) == 'string') {
            if (n in nodes) return nodes[n];
            if (create) {
                nodes[n] = {id:n};
                fromedges[n] = {};
                toedges[n] = {};
                return nodes[n];
            }
            return null;
        }
        return n;
    };
    var that = {
        setLayout:function(l) {
            if (layout) $(window).unbind('resize', layout.resize);
            layout = l;
            $(window).resize($.debounce(250,layout.resize));
            layout.init(that);
        },
        getLayout:function(l) {
            return layout;
        },
        screenSize:function(w,h) {
             screen.width = w;
             screen.height = h;
             screen.ewidth = w - screen.padding[2] - screen.padding[3];
             screen.eheight = h - screen.padding[0] - screen.padding[1];
        },
        screenOffset:function(l,t) {
             screen.l = l;
             screen.t = t;
        },
        screenPadding:function(v,h) {
            if (typeof(v)=='object') {
                screen.padding = v;
            }
            else {
                screen.padding[0] = v;
                screen.padding[1] = v;
                screen.padding[2] = h;
                screen.padding[3] = h;
            }
             screen.ewidth = screen.width - screen.padding[2] - screen.padding[3];
             screen.eheight = screen.height - screen.padding[0] - screen.padding[1];
        },
        eachNode:function(f) {
            for (n in nodes) {
                f(nodes[n]);
            }
        },
        eachEdge:function(f) {
            for (n in fromedges) {
                for (m in fromedges[n]) {
                    f(fromedges[n][m], nodes[n], nodes[m]);
                }
            }
        },
        pruneNode:function(n) {
            n = toNode(n);
            if (!n) return;
            // Remove node and all incident edges
            for (m in fromedges[n.id]) {
                delete toedges[m][n.id];
            }
            for (m in toedges[n.id]) {
                delete fromedges[m][n.id];
            }
            delete toedges[n.id];
            delete fromedges[n.id];
            delete nodes[n.id];
        },
        pruneEdge:function(e) {
            if (typeof(e) != 'object') return;
            if (from in e && to in e) {
                delete fromedges[e.from][e.to];
                delete toedges[e.to][e.from];
            }
        },
        addNode:function(s, d) {
            if (typeof(s) != 'string') return null;
            if (s in nodes) return nodes[s];
            nodes[s] = {id:s, data:d};
            fromedges[s] = {};
            toedges[s] = {};
            return nodes[s];
        },
        addEdge:function(s1, s2, d) {
            s1 = toNode(s1,1);
            s2 = toNode(s2,1);
            if (!d) d = {};
            fromedges[s1.id][s2.id] = {from:s1, to:s2, data:d};
            toedges[s2.id][s1.id] = fromedges[s1.id][s2.id];
        },
        getNode:function(n) {
            if (typeof(n) != 'string') return null;
            if (n in nodes) return nodes[n];
            return null;
        },
        getAllNodeIds:function() {
            var ret = [];
            for (n in nodes) {
                ret.push(nodes[n].id);
            }
            return ret;
        },
        getEdges:function(n,which,verts) {
            n = toNode(n);
            var ret = [];
            if (n) { 
                if (!which || (which&1)) {
                    for (m in fromedges[n.id]) {
                        if (verts) ret.push(nodes[m]);
                        else ret.push(fromedges[n.id][m]);
                    }
                }
                if (!which || (which&2)) {
                    for (m in toedges[n.id]) {
                        if (verts) ret.push(nodes[m]);
                        else ret.push(toedges[n.id][m]);
                    }
                }
            }
            return ret;
        },
        getEdgesTo:function(n) {
            return that.getEdges(n, 2);
        },
        getEdgesFrom:function(n) {
            return that.getEdges(n, 1);
        },
        getNeighbors:function(n) {
            return that.getEdges(n,0,1);
        },
        getNeighborsOut:function(n) {
            return that.getEdges(n,1,1);
        },
        getNeighborsIn:function(n) {
            return that.getEdges(n,2,1);
        },
        isNeighbor:function(n1, n2) {
            n1 = toNode(n1);
            if (!n1) return false;
            n2 = toNode(n2);
            if (!n2) return false;
            return toedges[n1.id][n2.id] || fromedges[n1.id][n2.id];
        },
        getCenter:function() {
            return oldcenter;
        },
        center:function(n) {
            if (!layout) return;
            if (!n) n = oldcenter;
            else {
                n = toNode(n);
                if (!n) return;
            }
            if (!n) return;
            oldcenter = n;
            n.realx = 0;
            n.realy = 0;
            sc = that.toScreen(n.realx, n.realy);
            n.x = sc.x;
            n.y = sc.y;
            // Determine polar ordering of adjacent edges
            that.eachNode(function(node) {
                node.show = 0;
            });
            n.show = 1;

            // TODO: Currently only displays one "layer" of direct neighbors
            order = layout.getOrder(n, that.getNeighbors(n));
            var r1 = screen.ewidth/2;
            var r2 = screen.eheight/2;
            var r = (r1*r1 + r2*r2)/(2*r2);
            var startangle = Math.acos(r1/r);
            for (var i = 0; i < order.length; ++i) {
                var angle;
                if (i < order.length/2) {
                    var delta = (Math.PI - 2*startangle)/(order.length/2);
                    angle = Math.PI + i*delta + startangle;
                    if (order.length % 2 == 0) angle += delta*0.35; 
                    if (i == order.length/2 - 1) angle -= delta*0.35/2;
                    order[i].realx = Math.cos(angle)*r;
                    order[i].realy = Math.sin(angle)*r + r - r2;
                } else {
                    angle = (i-order.length/2)/(order.length - order.length/2)*(Math.PI - 2*startangle) + startangle;
                    order[i].realx = Math.cos(angle)*r;
                    order[i].realy = Math.sin(angle)*r - r + r2;
                }
                sc = that.toScreen(order[i].realx, order[i].realy);
                order[i].x = sc.x;
                order[i].y = sc.y;
                order[i].show = 1;
            }
            layout.update();
        },
        toScreen:function(x,y) {
            if (typeof(x) == 'object') {
                tmp = x
                x = x.x;
                y = tmp.y;
            }
            return {x:x + screen.ewidth/2  + screen.padding[0] + screen.l,
                    y:y + screen.eheight/2 + screen.padding[2] + screen.t};
        },
        toReal:function(x,y) {
            if (typeof(x) == 'object') {
                tmp = x;
                x = x.x;
                y = tmp.y;
            }
            return {x:x - screen.ewidth/2  - screen.padding[0] - screen.l,
                    y:y - screen.eheight/2 - screen.padding[2] - screen.t};
        },
        getOffscreen:function(x,y) {
            if (typeof(x) == 'object') {
                tmp = x;
                x = x.x;
                y = tmp.y;
            }
            return {x:x*4, y:y*4};
        }
    };
    return that;
};
