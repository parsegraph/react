import React, {useState, useEffect, FormEvent, useRef} from 'react';
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

async function getAllLists() {
    const resp = await fetch('http://localhost:8080/');
    if (resp.status == 200) {
        return await resp.json();
    }
    throw await resp.text();
}

async function createNewList(name:string) {
    const resp = await fetch('http://localhost:8080/', {
        method: 'POST',
        body: name
    });
    if (resp.status == 200) {
        return;
    }
    throw await resp.text();
}

export function AllLists() {
    const [lists, setLists] = useState([]);
    const [newListName, setNewListName] = useState("");
    const [error, setError] = useState(null);

    const es = useRef(null)

    useEffect(()=>{
        getAllLists().then(setLists).catch(setError);

        if (!es.current) {
            var client = new EventSource("http://localhost:8081")
            es.current = client;
            client.onmessage = function (msg) {
                if (msg.data === "AllLists") {
                    getAllLists().then(setLists).catch(setError);
                }
                console.log(msg)
            };
        }
    }, []);

    const submit = (e:FormEvent)=>{
        setError(null);
        e.preventDefault();
        console.log("Submitting form!");
        createNewList(newListName)
            .then(getAllLists)
            .then(setLists)
        .catch(setError);
    };

    return <div>
        <h1>Lists</h1>
        {error && <div className="alert alert-danger fade show">
            <strong>Error creating list!</strong> {error}
        </div>}
        <form onSubmit={submit}>
            <div className="mb-3">
                <label htmlFor="new-list-name" className="form-label">New list name</label>
                <input type="text" className="form-control" id="new-list-name" value={newListName} onChange={e=>setNewListName(e.target.value)}/>
            </div>
            <button type="submit" className="btn btn-primary">Create new list</button>
        </form>
        <Parsegraph display="inline">
            <bud connect="downward" align="center">
                {lists.map(list=><block dir="forward" key={list} label={list}/>)}
            </bud>
        </Parsegraph>
    </div>
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
    return ReactDOM.render(<AllLists/>, container);
}
