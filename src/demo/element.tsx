import React, {useState} from 'react';
import Parsegraph from '../Parsegraph';
import ReactDOM from 'react-dom';

function ElementForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  return <div style={{background:"#ccf", padding:"1em", pointerEvents:"all"}}>
      <section style={{color:"red"}}>{error}</section>
      <section style={{display:"flex"}}>
        <label>Username:</label>
        <input style={{border:"3px solid black"}} value={username} onChange={e=>setUsername(e.target.value)}></input>
      </section>
      <section style={{display:"flex", marginTop:".5em"}}>
        <label>Password:</label>
        <input style={{border:"3px solid black"}} type="password" value={password} onChange={e=>setPassword(e.target.value)}></input>
      </section>
      <section style={{marginTop:".5em"}}>
        <button onClick={()=>{
          if (!username) {
            setError("Username must be given");
            return;
          }
          if (!password) {
            setError("Password must be given");
            return;
          }
          setError("");
        }}>Log in</button>
      </section>
  </div>;
}

function EmailForm() {
  return <div style={{background:"#ccf", padding:"1em", pointerEvents:"all", borderRadius:"12px"}}>
  <form>
  <div className="form-group">
    <label htmlFor="exampleInputEmail1">Email address</label>
    <input type="email" className="form-control" id="exampleInputEmail1" aria-describedby="emailHelp" placeholder="Enter email"/>
    <small id="emailHelp" className="form-text text-muted">We'll never share your email with anyone else.</small>
  </div>
  <div className="form-group">
    <label htmlFor="exampleInputPassword1">Password</label>
    <input type="password" className="form-control" id="exampleInputPassword1" placeholder="Password"/>
  </div>
  <div className="form-check">
    <input type="checkbox" className="form-check-input" id="exampleCheck1"/>
    <label className="form-check-label" htmlFor="exampleCheck1">Check me out</label>
  </div>
  <button type="submit" className="btn btn-primary">Submit</button>
</form>
</div>;
}

function ElementDemo() {
  return <div style={{width:"100vw", height:"100vh"}}>
    <Parsegraph>
      <block label="Element demo">
        <element dir="upward" content={()=>
          <ElementForm/>
        }/>
        <element dir="downward" content={()=>
            <iframe style={{backgroundColor:"white"}} src="http://localhost:3000/" width="800" height="600"></iframe>
          }>
          <block dir="downward" label="Element demo"/>
          <block dir="forward" label="Element demo"/>
          <block dir="backward" label="Element demo"/>
        </element>
        <element dir="backward" content={()=>
          <EmailForm/>
        }/>
        <element dir="forward" content={()=>
          <iframe src="http://localhost:3000/" width="800" height="600"></iframe>
        }/>
      </block>
    </Parsegraph>
  </div>
}

export default function build(container:Element) {
  return ReactDOM.render(<ElementDemo/>, container);
}
