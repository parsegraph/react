import React, {useState} from 'react';
import Parsegraph from '../Parsegraph';
import ReactDOM from 'react-dom';

interface ListProps {
    children:any;
}

function List({children}:ListProps) {
    return <bud dir="downward" connect="downward" align="center" pull="downward">{children.map((child:any, i:number)=>{
        if (i > 0) {
            return <bud key={i} dir="forward" connect="downward" pull="downward">{child}</bud>;
        }
        return child;
    })}</bud>
}

interface PageProps {
    url:string;
    setUrl:(url:string)=>void;
    name:string;
    width:number;
    height:number;
}

function Page({url, setUrl, name, width, height}:PageProps) {
    const [editing, setEditing] = useState(false);
    const click = ()=>{
        setEditing(!editing);
    };
    return <>
        {editing ?
            <element connect="downward" content={()=>
                <div>
                    <input type="text" defaultValue={url}/>
                    <button onClick={e=>{
                        console.log("IM clicked!");
                        setUrl(((e.target as HTMLElement).previousSibling as HTMLInputElement).value);
                        setEditing(false);
                        console.log("CLICK")}
                    }>Update</button>
                </div>
            }>
                <element content={()=>
                    <iframe style={{backgroundColor:"grey"}} src={url} width={width} height={height}></iframe>
                }/>
            </element>
            : <block connect="downward" pull="downward" label={name} onClick={click}>
                <element content={()=>
                    <iframe style={{backgroundColor:"grey"}} src={url} width={width} height={height}></iframe>
                }/>
            </block>}
    </>;
}

function ElementDemo() {
    const [pages, setPages] = useState([
        "https://en.wikipedia.org/wiki/Raymond_Pace_Alexander",
        "https://en.wikipedia.org"
        //"https://en.wikipedia.org/wiki/Egypt",
        //"https://en.wikipedia.org/wiki/Commander Keen"
    ]);
    const [label, setLabel] = useState("Pages");
    console.log("New label", label);
    return <div style={{width:"100vw", height:"100vh"}}>
      <Parsegraph>
        <bud>
            {pages.map((page, i)=>
                <Page key={i} name={page} url={page} setUrl={(url)=>{
                    const newPages = [...pages];
                    newPages[i] = url;
                    setPages(newPages);
                }} width={3*320} height={3*240}/>
            )}
        </bud>
      </Parsegraph>
    </div>
  }
  
  export default function build(container:Element) {
    return ReactDOM.render(<ElementDemo/>, container);
  }
  