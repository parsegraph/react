import React from 'react';
import {Caret, Window, World, addEventMethod, TimingBelt, Node, DefaultNodeType, Viewport} from 'parsegraph-node';
import { Alignment, readAlignment } from 'parsegraph-layout';

import Direction, {readDirection, nameDirection} from 'parsegraph-direction';
import ReactDOM from 'react-dom';
import Color from 'parsegraph-color';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      bud: any;
      block: any;
      element: any;
    }
  }
}

const NO_CONTEXT = {};

import Reconciler from 'react-reconciler';
import WindowNode from 'parsegraph-node/dist/WindowNode';

class RenderNode {
  node:Node<DefaultNodeType>|null;
  dir:Direction = Direction.NULL;
  pull:Direction = Direction.NULL;
  connect:Direction = Direction.NULL;
  align:Alignment = Alignment.NONE;
  nodeChildren:RenderNode[];

  constructor(node:Node<DefaultNodeType>|null) {
    this.node = node;
    this.nodeChildren = [];
  }

  getChildDirection(child:RenderNode) {
    let dir = child.dir;
    if (dir === Direction.NULL) {
      dir = this.connect;
    }
    if (dir === Direction.NULL) {
      dir = Direction.FORWARD;
    }
    return dir;
  }

  getLastChild() {
    for(let i = this.nodeChildren.length - 1; i >= 0; --i) {
      if (this.nodeChildren[i] && this.nodeChildren[i].node) {
        return this.nodeChildren[i];
      }
    }
    return null;
  }

  appendChild(child:RenderNode) {
    let dir = this.getChildDirection(child);
    console.log("appending", nameDirection(dir), child, " to ", this);

    let connectingSite:RenderNode = this.getLastChild() || this;
    if (child.node && connectingSite.node) {
      connectingSite.node.connectNode(dir, child.node);
      connectingSite.node.setNodeAlignmentMode(dir, child.align);
      if (connectingSite.pull) {
        new Caret(connectingSite.node).pull(connectingSite.pull);
      }
    }

    this.nodeChildren.push(child);
  }

  getChildIndex(child:RenderNode) {
    for(let i = 0; i < this.nodeChildren.length; ++i) {
      if (this.nodeChildren[i] === child) {
        return i;
      }
    }
    return -1;
  }


  insertBefore(child:RenderNode, refChild:RenderNode) {
    console.log("appending", child, " to ", this);

    const refIndex = this.getChildIndex(refChild);
    if (refIndex == 0) {
      // Adding to front
      refChild.node.disconnectNode();

      let dir = this.getChildDirection(child);
      this.node.connectNode(dir, child.node);
      this.node.setNodeAlignmentMode(dir, child.align);
      if (this.pull) {
        new Caret(this.node).pull(this.pull);
      }

      dir = this.getChildDirection(refChild);
      child.node.connectNode(dir, refChild.node);
      child.node.setNodeAlignmentMode(dir, refChild.align);
      if (child.pull) {
        new Caret(child.node).pull(child.pull);
      }

      this.nodeChildren.unshift(child);
      return;
    }

    const origParent = this.nodeChildren[refIndex - 1];
    refChild.node.disconnectNode();

    let dir = this.getChildDirection(child);
    origParent.node.connectNode(dir, child.node);
    origParent.node.setNodeAlignmentMode(dir, child.align);
    if (origParent.pull) {
      new Caret(origParent.node).pull(origParent.pull);
    }

    dir = this.getChildDirection(refChild);
    child.node.connectNode(dir, refChild.node);
    child.node.setNodeAlignmentMode(dir, refChild.align);
    if (child.pull) {
      new Caret(child.node).pull(child.pull);
    }

    this.nodeChildren.splice(refIndex, 0, child);
  }

  removeChild(child:RenderNode) {
    console.log("removeChild", arguments);
    let childIndex = this.getChildIndex(child);
    if (childIndex < this.nodeChildren.length - 1) {
      let nextChild = this.nodeChildren[childIndex + 1];
      let origParent = child.node.parentNode();
      child.node.disconnectNode();
      nextChild.node.disconnectNode();
      let dir = this.getChildDirection(nextChild);
      origParent.connectNode(dir, nextChild.node);
      origParent.setNodeAlignmentMode(dir, nextChild.align);
      // Get pull right here
    } else {
      child.node.disconnectNode();
    }
    child.node.forEachNode((n:WindowNode)=>n._windowElement.forEach(elem=>{
      elem.style.display = "none";
    }));

    this.nodeChildren.splice(childIndex, 1);
  }
};

function isParsegraphType(type:string) {
  return type === "element" || type === "block" || type === "bud";
}

const hostConfig = {
  supportsMutation: true,
  supportsHydration: false,
  supportsPersistence: false,

  createInstance(type:any, props:any, rootContainer:any, hostContext:any):RenderNode {
    console.log("createInstance", type, props, rootContainer, hostContext, arguments);
    const caret = new Caret(type);
    if(props.label != null) {
      caret.label(props.label);
    }

    if (!isParsegraphType(type)) {
      return new RenderNode(null);
    }

    const node = new RenderNode(caret.root());
    node.dir = props.dir !== undefined ? readDirection(props.dir) : Direction.NULL;
    node.connect = props.connect !== undefined ? readDirection(props.connect) : Direction.NULL;
    node.align = props.align !== undefined ? readAlignment(props.align) : Alignment.NONE;
    node.dir && console.log("Dir", props.dir, nameDirection(node.dir));
    node.connect && console.log("Connect", props.connect, nameDirection(node.connect));
    hostContext.caret = caret;
    if (props.pull !== undefined) {
      caret.pull(props.pull);
      node.pull = props.pull;
    }
    if (props.onClick !== undefined) {
      caret.onClick(props.onClick);
    }
    if (type === "element") {
      const contentFunc = props.content;
      const node = caret.node();
      caret.node().setElement(()=>{
        const container = document.createElement('div');
        ReactDOM.render(contentFunc(), container, ()=>{
          new ResizeObserver(()=>{
            console.log(rootContainer, hostContext);
            node.layoutHasChanged();
            rootContainer.scheduleRepaint();
          }).observe(container);
        });
        return container;
      });
    }

    return node;
  },

  createTextInstance() {//text, rootContainer, hostContext) {
    return new RenderNode(null);
  },

  shouldSetTextContent() {//type, props) {
    console.log("shouldSetTextContent", arguments);
    return false;
  },

  prepareUpdate(node:RenderNode, type:any, oldProps:any, newProps:any) {
    if (!node.node) {
      return false;
    }
    console.log("prepareUpdate", arguments);
    const diff = [];
    if (oldProps.onClick !== newProps.onClick) {
      diff.push("onClick");
    }
    if (oldProps.label !== newProps.label) {
      diff.push("label");
    }
    if (type === "element" && "content" in newProps) {
      diff.push("content");
    }
    return diff.length > 0 ? diff : undefined;
  },

  commitUpdate(node:RenderNode, updatePayload:Array<string>, type:any, oldProps:any, props:any) {
    console.log("commitUpdate", arguments);
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
      case "content":
        if (type === "element") {
          const contentFunc = props.content;
          node.node.setElement(()=>{
            const container = document.createElement('div');
            ReactDOM.render(contentFunc(), container, ()=>{
              new ResizeObserver(()=>{
                node.node.layoutHasChanged();
              }).observe(container);
            });
            return container;
          });
          /*node.node._windowElement.forEach(elem=>{
            elem.remove();
          });
          node.node._windowElement.clear();*/
          node.node.layoutHasChanged();
        }
        break;
      }
    });
  },

  appendChild(parentInstance:RenderNode, child:RenderNode) {
    console.log("appendChild", arguments);
    hostConfig.appendInitialChild(parentInstance, child);
  },

  insertBefore(parentInstance:RenderNode, child:RenderNode, beforeChild:RenderNode) {
    console.log("insertBefore", arguments);
    parentInstance.insertBefore(child, beforeChild);
  },

  appendInitialChild(parentInstance:RenderNode, child:RenderNode) {
    parentInstance.appendChild(child);
  },

  getRootHostContext():any {
    console.log("Roothostcontext", arguments);
    return {isElement:false};
  },

  finalizeInitialChildren(instance:RenderNode, type:string, props:any, rootContainer:any, hostContext:any) {
    console.log("finalizeInitialChildren", arguments);
    return true;
  },

  getChildHostContext(parentHostContext:any, type:string, rootContainer:any) {
    if (isParsegraphType(type)) {
      return {isElement:type==="element", parent:parentHostContext};
    }
    return parentHostContext;
  },

  getPublicInstance(instance:any):any {
    console.log("getPublicInstance", arguments);
    return instance;
  },

  prepareForCommit(containerInfo:any):any {
    console.log("prepareForCommit", arguments);
    return null;
  },

  commitTextUpdate(node:RenderNode, oldLabel:string, newLabel:string):any {
    console.log("CommitTextUpdate", arguments)
    node.node && node.node.setLabel(newLabel);
  },

  resetAfterCommit(viewport:Viewport) {
    console.log("resetAfterCommit");
    viewport.scheduleRepaint();
    viewport.world().scheduleRepaint();
  },

  preparePortalMount(containerInfo:any) {
    console.log("preparePortalMount", containerInfo);
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
    console.log("clearContainer");
    const roots = container.world()._worldRoots.concat([]);
    roots.forEach(root=>container.world().removePlot(root));
  },

  removeChild(parentNode:RenderNode, child:RenderNode) {
    parentNode.removeChild(child);
  },

  appendChildToContainer(container:Viewport, node:RenderNode) {
    console.log("appendChildToContainer", arguments);
    if (node.node) {
      container.world().plot(node.node);
      container.showInCamera(node.node);
    }
  },

  removeChildFromContainer(container:Viewport, node:RenderNode) {
    console.log("removeChildFromContainer", arguments);
    if (container && node && node.node) {
      container.world().removePlot(node.node);
    }
  },

  commitMount() {
    console.log("commitMount", arguments);
    //container.world().plot(node.node);
    //container.showInCamera(node.node);
  }
};

const ParsegraphRenderer = Reconciler(hostConfig);

interface ParsegraphProps {
  children:JSX.Element;
  display?:string;
}

export default class Parsegraph extends React.Component<ParsegraphProps> {
  _mainNode:any;
  _listener?:Function;
  _belt?:TimingBelt;
  _viewport?:Viewport;
  _container?:HTMLElement|null;
  _inline:Boolean;

  updateContainer(clear?:boolean) {
    ParsegraphRenderer.updateContainer(clear ? null : this.props.children, this._mainNode, this, ()=>{

    });
  }

  isInline():boolean {
    return this.props.display === "inline";
  }

  isFullscreen():boolean {
    return !this.isInline();
  }

  componentDidMount() {
    const window = new Window();
    const belt = new TimingBelt();
    belt.addWindow(window);
    this._belt = belt;

    const world = new World();
    const viewport = new Viewport(world);
    this._viewport = viewport;
    if (this.isInline()) {
      window.setBackground(new Color(0, 0, 0, 0));
      this._viewport.setSingleScreen(true);
    }
    window.addComponent(viewport);

    this._mainNode = ParsegraphRenderer.createContainer(viewport, 1, false, null);

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

  getContainerStyle() {
    if (this.isInline()) {
      return {};
    }
    return {width:"100%", height:"100%"};
  }

  render() {
    return <div style={this.getContainerStyle()} ref={(container)=>{
      this._container = container;
    }}/>;
  }
}
