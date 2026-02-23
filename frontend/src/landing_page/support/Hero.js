import React from "react";

function Hero() {
  return (
    <section className="container-fluid" id="supportHero">
      <div className="p-5 " id="supportWrapper">
        <h4>Support Portal</h4>
        <a href="">Track Tickets</a>
      </div>
      <div className="row p-5 m-3">
        <div className="col-6 p-3" >
          <h1 className="fs-3" align="left">
            Search for an answer or browse help topics to create a ticket
          </h1>
          <br/>
          <input placeholder="Eg. how do I activate F&O" />
          <br/>
          <br />
          <div style={{ display: "flex", gap: "16px" }}>
          <a href="" style={{ textDecoration: "none"}}>Track account opening   </a>
          <a href="" style={{ textDecoration: "none"}}>  Track segment activation   </a>
          <a href="" style={{ textDecoration: "none"}}>  Intraday margins   </a>
          <a href="" style={{ textDecoration: "none"}}>  Kite user manual   </a>
          </div>
        </div>
        <div className="col-6 p-3 text-center">
          <h1 className="fs-3">Featured</h1>
          
              <p><a href=""  style={{ textDecoration: "none"}}>Current Takeovers and Delisting - January 2024</a></p>
            
              <p><a href="" style={{ textDecoration: "none"}}>Latest Intraday leverages - MIS & CO</a></p>
            
        </div>
      </div>
    </section>
  );
}

export default Hero;