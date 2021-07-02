import React from 'react';
import {Caret, Window, World, addEventMethod, TimingBelt, Node, DefaultNodeType, Viewport} from 'parsegraph-node';

import Direction, {readDirection, nameDirection} from 'parsegraph-direction';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      bud: any;
      block: any;
    }
  }
}

import Reconciler from 'react-reconciler';

class RenderNode {
  node:Node<DefaultNodeType>|null;
  dir:Direction = Direction.NULL;
  pull:Direction = Direction.NULL;
  connect:Direction = Direction.NULL;

  constructor(node:Node<DefaultNodeType>|null) {
    this.node = node;
  }
};

const hostConfig = {
  supportsMutation: true,
  supportsHydration: false,
  supportsPersistence: false,

  createInstance(type:any, props:any, rootContainer:any, hostContext:any):RenderNode {
    //console.log("createInstance", type, props, rootContainer, hostContext, arguments);
    const caret = new Caret(type);
    if(props.label != null) {
      caret.label(props.label);
    }

    const node = new RenderNode(caret.root());
    node.dir = props.dir !== undefined ? readDirection(props.dir) : Direction.NULL;
    node.connect = props.connect !== undefined ? readDirection(props.connect) : Direction.NULL;
    node.dir && console.log("Dir", props.dir, nameDirection(node.dir));
    node.connect && console.log("Connect", props.connect, nameDirection(node.connect));
    if (props.pull !== undefined) {
      caret.pull(props.pull);
    }
    if (props.onClick !== undefined) {
      caret.onClick(props.onClick);
    } else {
      caret.node().setLabel("Edit me");
      caret.node().realLabel().setEditable(true);
    }

    return node;
  },

  createTextInstance() {//text, rootContainer, hostContext) {
    return new RenderNode(null);
  },

  shouldSetTextContent() {//type, props) {
    //console.log("shouldSetTextContent", type, props);
    return false;
  },

  prepareUpdate(node:RenderNode, type:any, oldProps:any, newProps:any) {
    //console.log("prepareUpdate", arguments);
    const diff = [];
    if (oldProps.onClick !== newProps.onClick) {
      diff.push("onClick");
    }
    if (oldProps.label !== newProps.label) {
      diff.push("label");
    }
    return diff.length > 0 ? diff : undefined;
  },

  commitUpdate(node:RenderNode, updatePayload:Array<string>, type:any, oldProps:any, props:any) {
    //console.log("commitUpdate", arguments);
    if (!node.node || !updatePayload) {
      return;
    }
    const n = node.node;
    updatePayload.forEach(prop=>{
      switch(prop) {
      case "onClick":
        n.setClickListener(props.onClick);
        break;
      case "label":
        n.setLabel(props.label);
        break;
      }
    });
  },

  appendChild(parentInstance:RenderNode, child:RenderNode) {
    //console.log("appendChild", arguments);
    hostConfig.appendInitialChild(parentInstance, child);
  },

  insertBefore(parentInstance:RenderNode, child:RenderNode) {
    //console.log("insertBefore", arguments);
    hostConfig.appendInitialChild(parentInstance, child);
  },

  appendInitialChild(parentInstance:RenderNode, child:RenderNode) {
    try {
      //console.log("appendInitialChild", arguments);
      let dir = child.dir;
      if (dir === Direction.NULL) {
        dir = parentInstance.connect;
      }
      if (dir === Direction.NULL) {
        dir = Direction.FORWARD;
      }
      let trueParent = parentInstance.node;
      if (trueParent && child.node) {
        while(trueParent.hasNode(dir)) {
          trueParent = trueParent.nodeAt(dir);
        }
        trueParent.connectNode(dir, child.node);
      }
    } catch (ex) {
      //console.log(ex);
    }
  },

  getRootHostContext(rootHostContext:any):any {
    return rootHostContext;
  },

  finalizeInitialChildren(instance:RenderNode, type:string, props:any, rootContainer:any, hostContext:any) {
    //console.log("finalizeInitialChildren", arguments);
    return true;
  },

  getChildHostContext(parentHostContext:any, type:string, rootContainer:any) {
    //console.log("getChildHostContext", arguments);
    return {};
  },

  getPublicInstance(instance:any):any {
    console.log("getPublicInstance", instance);
    return instance;
  },

  prepareForCommit(containerInfo:any):any {
    //console.log("prepareForCommit", arguments);
    return null;
  },

  resetAfterCommit(viewport:Viewport) {
    //console.log("resetAfterCommit");
    viewport.scheduleRepaint();
    viewport.world().scheduleRepaint();
  },

  preparePortalMount(containerInfo:any) {
    //console.log("preparePortalMount", containerInfo);
  },

  now() {
    return Date.now();
  },

  scheduleTimeout(fn:any) {
    //console.log("scheduleTimeout", fn);
  },

  cancelTimeout(id:any) {
    //console.log("cancelTimeout", id);
  },

  queueMicrotask(fn:any) {
    //console.log("queueMicrotask", fn);
  },

  isPrimaryRenderer:false,

  noTimeout:false,

  clearContainer(container:Viewport) {
    const roots = container.world()._worldRoots.concat([]);
    roots.forEach(root=>container.world().removePlot(root));
  },

  removeChild(parent:RenderNode, child:RenderNode) {
    console.log("removeChild", arguments);
    child.node && child.node.disconnectNode();
  },

  appendChildToContainer(container:Viewport, node:RenderNode) {
    //console.log("appendChildToContainer", arguments);
    if (node.node) {
      container.world().plot(node.node);
      container.showInCamera(node.node);
    }
  },

  removeChildFromContainer(container:Viewport, node:RenderNode) {
    //console.log("removeChildFromContainer", arguments);
    if (container && node && node.node) {
      container.world().removePlot(node.node);
    }
  },

  commitMount() {
    //console.log("commitMount", arguments);
    //container.world().plot(node.node);
    //container.showInCamera(node.node);
  }
};

const ParsegraphRenderer = Reconciler(hostConfig);

interface ParsegraphProps {
  children:JSX.Element;
}

export default class Parsegraph extends React.Component {
  _mainNode:any;
  _listener?:Function;
  _belt?:TimingBelt;
  _viewport?:Viewport;
  _container?:HTMLElement|null;

  updateContainer(clear?:boolean) {
    ParsegraphRenderer.updateContainer(clear ? null : this.props.children, this._mainNode, this, ()=>{

    });
  }

  componentDidMount() {
    var window = new Window();
    var belt = new TimingBelt();
    belt.addWindow(window);
    this._belt = belt;

    var world = new World();
    var viewport = new Viewport(window, world);
    this._viewport = viewport;
    window.addComponent(viewport.component());

    this._mainNode = ParsegraphRenderer.createContainer(viewport, 1, false, null);

    if (this._belt) {
      this._listener = addEventMethod(
        top.window,
        "resize",
        this._belt.scheduleUpdate,
        this._belt
      );
    }
    this.updateContainer();
    if (this._container && this._viewport) {
      console.log("ADD mount");
      this._container.appendChild(this._viewport.window().container());
    }
  }

  componentDidUpdate() {
    this.updateContainer();
  }

  componentWillUnmount() {
    this.updateContainer(true);
    if (this._listener) {
      this._listener();
      this._listener = undefined;
    }
    if (this._container && this._viewport) {
      console.log("REMOVE unmount");
      this._container.removeChild(this._viewport.window().container());
    }
  }

  render() {
    return <div className="parsegraph_Window" ref={(container)=>{
      this._container = container;
    }}/>;
  }
}
