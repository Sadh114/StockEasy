import React from "react";

function Footer() {
  return (
    <footer style={{ backgroundColor: "rgb(250, 250, 250)" }}>
      <div className="container border-top mt-5">
        <div className="row mt-5">
          <div className="col">
            <img src="media/images/logo.png" style={{ width: "50%" }} />
            <p>
              &copy; 2025 - 2026, StockEasy Broking Ltd. All rights reserved.
            </p>
          </div>
          <div className="col">
            <p>Company</p>
            <a href="" style={{ textDecoration: "none" }}>About</a>
            <br />
            <a href="" style={{ textDecoration: "none" }}>Products</a>
            <br />
            <a href="" style={{ textDecoration: "none" }}>Pricing</a>
            <br />
            <a href="" style={{ textDecoration: "none" }}>Referral programme</a>
            <br />
            <a href="" style={{ textDecoration: "none" }}>Careers</a>
            <br />
            <a href="" style={{ textDecoration: "none" }}>StockEasy.tech</a>
            <br />
            <a href="" style={{ textDecoration: "none" }}>Press & media</a>
            <br />
            <a href="" style={{ textDecoration: "none" }}>StockEasy cares (CSR)</a>
            <br />
          </div>
          <div className="col">
            <p>Support</p>
            <a href="" style={{ textDecoration: "none" }}>Contact</a>
            <br />
            <a href="" style={{ textDecoration: "none" }}>Support portal</a>
            <br />
            <a href="" style={{ textDecoration: "none" }}>S-Connect blog</a>
            <br />
            <a href="" style={{ textDecoration: "none" }}>List of charges</a>
            <br />
            <a href="" style={{ textDecoration: "none" }}>Downloads & resources</a>
            <br />
          </div>
          <div className="col">
            <p>Account</p>
            <a href="" style={{ textDecoration: "none" }}>Open an account</a>
            <br />
            <a href="" style={{ textDecoration: "none" }}>Fund transfer</a>
            <br />
            <a href="" style={{ textDecoration: "none" }}>60 day challenge</a>
            <br />
          </div>
        </div>
        <div className="mt-5 text-muted" style={{ fontSize: "14px" }}>
          <p>
            StockEasy Broking Ltd.: Member of NSE​ &​ BSE – SEBI Registration no.:
            INZ000031633 CDSL: Depository services through StockEasy Securities
            Pvt. Ltd. – SEBI Registration no.: IN-DP-100-2015 Commodity Trading
            through StockEasy Commodities Pvt. Ltd. MCX: 46025 – SEBI Registration
            no.: INZ000038238 Registered Address: StockEasy Broking Ltd.,
            #153/154, 4th Cross, Dollars Colony, Opp. Clarence Public School,
            J.P Nagar 4th Phase, Pune - 411001, Maharshtra, India. For any
            complaints pertaining to securities broking please write to
            complaints@StockEasy.com, for DP related to dp@StockEasy.com. Please
            ensure you carefully read the Risk Disclosure Document as prescribed
            by SEBI | ICF
          </p>

          <p>
            Procedure to file a complaint on SEBI SCORES: Register on SCORES
            portal. Mandatory details for filing complaints on SCORES: Name,
            PAN, Address, Mobile Number, E-mail ID. Benefits: Effective
            Communication, Speedy redressal of the grievances
          </p>

          <p>
            Investments in securities market are subject to market risks; read
            all the related documents carefully before investing.
          </p>

          <p>
            "Prevent unauthorised transactions in your account. Update your
            mobile numbers/email IDs with your stock brokers. Receive
            information of your transactions directly from Exchange on your
            mobile/email at the end of the day. Issued in the interest of
            investors. KYC is one time exercise while dealing in securities
            markets - once KYC is done through a SEBI registered intermediary
            (broker, DP, Mutual Fund etc.), you need not undergo the same
            process again when you approach another intermediary." Dear
            Investor, if you are subscribing to an IPO, there is no need to
            issue a cheque. Please write the Bank account number and sign the
            IPO application form to authorize your bank to make payment in case
            of allotment. In case of non allotment the funds will remain in your
            bank account. As a business we don't give stock tips, and have not
            authorized anyone to trade on behalf of others. If you find anyone
            claiming to be part of StockEasy and offering such services, please
            create a ticket here.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;