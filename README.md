graph-explorer
==============

A dynamic graph explorer written in Javascript. Uses JQuery and the JQuery debounce addon. 
It was written for <a href='http://sage-search.appspot.com'>SAGE Search</a>,
a visual search engine for rapid discovery of academic papers.

This graph explorer allows navigation around a graph that is dynamically loaded - thus, for large graphs, you do not have to know the
entire structure beforehand. Its navigational design involves the idea of focusing on one central node, and seeing the relationships
between its neighbors. 

A simple sample client is [will be] provided in sample/

Known issues:
- Still under (inactive) development - use at your own risk!

- Displays best in Chrome and Safari. Firefox has antialiasing bugs that make the edges appear rectangular, but otherwise functions correctly. No IE support. Untested on Opera.

- Currently, the graph explorer only supports displaying immediate neighbors of the central node. Displaying more layers will
be implemented in the future. 

- Each edge and node is an individual element; prolonged exploration of a large graph results in an explosion of DOM elements, slowing down the browser. 
