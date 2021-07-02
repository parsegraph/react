import {Caret, Node, DefaultNodeType} from "parsegraph-node";

export default function RenderParsegraph(content:JSX.Element):Node<DefaultNodeType> {
  if (typeof content.type === "function") {
    return RenderParsegraph(content.type(content.props || {}));
  }
  console.log(content);
  const caret = new Caret(content.type);
  if (content.props && content.props.label != null) {
    caret.label(content.props.label);
  }
  if (content.props && content.props.children) {
    let lastDir = content.props.connect || "f";
    let add = (child:JSX.Element|Array<JSX.Element>)=>{
      if (Array.isArray(child)) {
        child.forEach((trueChild:JSX.Element)=>{
          add(trueChild);
        });
        return;
      }
      if (child.props && child.props.dir) {
        lastDir = child.props.dir;
      }
      caret.push();
      while (caret.has(lastDir)) {
        caret.move(lastDir);
      }
      caret.connect(lastDir, RenderParsegraph(child));
      if (content.props && content.props.pull) {
        caret.pull(content.props.pull);
      }
      caret.pop();
    };
    if(content.props.children.forEach) {
      content.props.children.forEach(add);
    } else {
      add(content.props.children);
    }
  }
  if (content.props && content.props.pull) {
    caret.pull(content.props.pull);
  }
  return caret.root();
}
