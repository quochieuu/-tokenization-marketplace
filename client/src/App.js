import React, { Component } from "react";
import MyToken from "./contracts/MyToken.json";
import MyTokenSale from "./contracts/MyTokenSale.json";
import KycContract from "./contracts/KycContract.json";
import Marketplace from "./contracts/Marketplace.json";

import getWeb3 from "./getWeb3";

import "./App.css";
import axios from "axios";
import ListProduct from "./components/list-products";
import { BrowserRouter as Router, Switch, Route} from "react-router-dom";

class App extends Component {
  state = {
    loaded: false,
    kycAddress: "",
    tokenSaleAddress: null,
    userTokens: 0,
  };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      this.web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      this.accounts = await this.web3.eth.getAccounts();
      this.setState({ account: this.accounts[0] });

      // Get the contract instance.
      this.networkId = await this.web3.eth.net.getId();
      const networkData = Marketplace.networks[this.networkId];
      this.state.address = networkData.address;

      this.tokenInstance = new this.web3.eth.Contract(
        MyToken.abi,
        MyToken.networks[this.networkId] &&
          MyToken.networks[this.networkId].address
      );
      this.tokenSaleInstance = new this.web3.eth.Contract(
        MyTokenSale.abi,
        MyTokenSale.networks[this.networkId] &&
          MyTokenSale.networks[this.networkId].address
      );
      this.kycInstance = new this.web3.eth.Contract(
        KycContract.abi,
        KycContract.networks[this.networkId] &&
          KycContract.networks[this.networkId].address
      );
      this.marketplace = new this.web3.eth.Contract(
        Marketplace.abi,
        Marketplace.networks[this.networkId] &&
          Marketplace.networks[this.networkId].address
      );
      const productCount = this.marketplace.methods.productCount().call()
      // Load products
      for (var i = 1; i <= productCount; i++) {
        const product = this.marketplace.methods.products(i).call()
        this.setState({
          products: [...this.state.products, product]
        })
      }
      this.setState({ productCount })
      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.listenUserTokenTransfer();
      this.setState(
        {
          loaded: true,
          tokenSaleAddress: MyTokenSale.networks[this.networkId].address,
          // marketplaceAddress: Marketplace.networks[this.networkId].address
        },
        this.updateUserTokens
      );
      //this.setState({loaded:true,tokenSaleAddress:MyTokenSale.networks[this.networkId].address},this.updateUserTokens);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.error(error);
    }
  };

  updateUserTokens = async () => {
    let userTokens = await this.tokenInstance.methods
      .balanceOf(this.accounts[0])
      .call();
    this.setState({ userTokens: userTokens });
  };


  listenUserTokenTransfer = () => {
    this.tokenInstance.events
      .Transfer({ to: this.accounts[0] })
      .on("data", this.updateUserTokens);
  };


  handleBuyTokens = async () => {
    await this.tokenSaleInstance.methods
      .buyTokens(this.accounts[0])
      .send({
        from: this.accounts[0],
        value: this.web3.utils.toWei("1", "Wei"),
      });
  };


  handleInputChange = (event) => {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value,
    });
  };


  handleKycWhitelisting = async () => {
    if (this.state.kycAddress === "") {
      alert("Address shouldn't be null");
    } else {
      await this.kycInstance.methods
        .setKycCompleted(this.state.kycAddress)
        .send({ from: this.accounts[0] });
      alert("KYC for" + this.state.kycAddress + " is completed");
    }
  };

  constructor(props) {
    super(props);
    this.state = {
      account: "",
      productCount: 0,
      productsData: [],
      loading: true,
      idProduct: "",
      roles: "",
      isActive: false,
      token: 0,
    };
    this.createProduct = this.createProduct.bind(this)
    this.purchaseProduct = this.purchaseProduct.bind(this);
  }

  createProduct(name, price) {
    this.setState({ loading: false })
    let contract  = this.marketplace;
    const owner = this.accounts[0];
    this.marketplace.methods.createProduct(name, parseInt(price)).send({ from: this.accounts[0]})
    .on('transactionHash', function(hash){
      contract.events.ProductCreated({
          filter: {myIndexedParam: [20,23], myOtherIndexedParam: hash},
          fromBlock: 0
      }, function(error, event){ 
        if(event!== null) {
          console.log(event);
          if(event.transactionHash == hash) {
            var data = { 
              name: name, 
              price: parseInt(price), 
              product_id: parseInt(event.returnValues[0]),
              product_address:  String(event.returnValues[5]),
              product_owner: owner,
              image: null,
              purchased: false
            };
            
            axios.post("http://127.0.0.1:8000/api/stores/", data)
            .then(function(res) { 
                console.log(res.data);
                window.location.reload()
              }
            );
          }
        }
      })
    })
    .on('receipt', function(receipt){
      
    })
    .on('confirmation', function(confirmationNumber, receipt){
        
    });
  }

  purchaseProductByToken = (id, db_id, price, sendAddress) => {
    console.log(id);
    console.log(db_id);
    console.log(price);
    console.log(sendAddress);
    
    this.tokenInstance.methods.transfer(sendAddress, price).send({ from: this.accounts[0] })
      .once("transactionHash", (transactionHash) => {
        axios
          .patch("http://127.0.0.1:8000/api/stores/" + db_id, {
            id: db_id,
            is_purchase: true,
          })
          .then(function (response) {
            console.log(response);
          })
          .catch(function (error) {
            console.log(error);
          });
        this.marketplace.methods
          .purchaseProductbyToken(id)
          .send({ from: this.accounts[0]  })
          .once("receipt", (receipt) => {
            this.setState({ loading: false });
          })
          .once("transactionHash", (transactionHash) => {
            window.location.assign("/");
          });
      });
  }

  purchaseProduct(id, price, db_id) {
    this.setState({ loading: false })
    console.log(id);
    console.log(db_id);
    console.log(parseInt(price));
    console.log(typeof(this.accounts[0]));
    this.marketplace.methods.purchaseProduct(parseInt(id))
    .send({ 
      from: this.accounts[0], 
      value: parseInt(price)
    })
    .on('transactionHash', function(hash){
      var data = { 
        id: db_id,
        is_purchase: true,
      };
      axios.patch("http://127.0.0.1:8000/api/stores/" + db_id, data)
        .then(function(res) { 
          console.log(res.data);
          window.location.reload()
        }
      );
    })
    .on('confirmation', function(confirmationNumber, receipt){
     
    });
  }

  purchaseProductByToken(id, db_id, price, sendAddress) {    
    this.tokenInstance.methods.transfer(sendAddress, price).send({ from: this.accounts[0] })
      .once("transactionHash", (transactionHash) => {
        axios
          .patch("http://127.0.0.1:8000/api/stores/" + db_id, {
            id: db_id,
            is_purchase: true,
          })
          .then(function (response) {
            console.log(response);
          })
          .catch(function (error) {
            console.log(error);
          });
        this.marketplace.methods
          .purchaseProductbyToken(id)
          .send({ from: this.accounts[0]  })
          .once("receipt", (receipt) => {
            this.setState({ loading: false });
          })
          .once("transactionHash", (transactionHash) => {
            window.location.assign("/");
          });
      });
  }

  render() {
    if (!this.state.loaded) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="wrapper">
        <div className="wrap">
          <div className="container">
            <div className="row">
              <div className="col-md-8 col-12">
                <div className="center-inner-left">
                  <div className="inner-left">
                    <h1 className="banner-title">CAPPU TOKEN SALE</h1>
                    <div class="content">
                      <h3>KYC Whitelist</h3>
                      <div className="p-ralative">
                        <input
                          type="text"
                          className="form-control"
                          name="kycAddress"
                          placeholder="Address to allow"
                          value={this.state.kycAddress}
                          onChange={this.handleInputChange}
                        />
                        <button
                          className="btn btn-primary btn-atw"
                          onClick={this.handleKycWhitelisting}
                        >
                          Add to whitelist
                        </button>
                      </div>
                      <div className="buy-token mt-3">
                        <p className="balance">
                          {" "}
                          Your currently have: {" "}
                          <span>{this.state.userTokens} Token </span>
                        </p>
                        <button class="btn btn-primary bmt-btn" onClick={this.handleBuyTokens}>Buy More Token</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4 col-12"></div>
            </div>
          </div>
          <div className="footer-sign">
            <img src="../hieu.png" className="hiu" />
            <img src="../chi.png" className="chi" />
          </div>
        </div>
        <Router>
        <Switch>
          <Route>
          <ListProduct
            exact path='/'
            products={this.state.products}
            createProduct={this.createProduct}
            purchaseProduct={this.purchaseProduct}
            purchaseProductByToken={this.purchaseProductByToken}
          />
          </Route>
          </Switch>
        </Router>
        
      </div>
    );
  }
}

export default App;
