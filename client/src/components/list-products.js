import axios from "axios";
import React, { Component } from "react";

class ListProduct extends Component {
    state = {
        productsData : [],
    }

  componentWillMount = async () => {
    await this.listAllProducts();
  };

  listAllProducts = async () => {
    axios
      .get("http://127.0.0.1:8000/api/stores/")
      .then((response) => {
        this.setState({ productsData: response.data });
        console.log(this.state.productsData);
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  render() {
    
    return (
      <div>
        <center className="market-title">Marketplace</center>
        
        <div className="shop-space">
        <button type="button" className="btn btn-primary bcbtn mt-3 mb-4" data-toggle="modal" data-target="#exampleModalLong">
                    <i className="fas fa-plus mr-1"></i> Add Product
                </button>
                <div className="modal fade bc-modal" id="exampleModalLong" tabIndex="-1" role="dialog" aria-labelledby="exampleModalLongTitle" aria-hidden="true">
                    <div className="modal-dialog" role="document">
                    <div className="modal-content">
                    <form onSubmit={(event) => {
                            event.preventDefault()
                            const name = this.productName.value
                            const price = this.productPrice.value
                            this.props.createProduct(name, price)
                        }}>
                        <div className="modal-header">
                        <h5 className="modal-title" id="exampleModalLongTitle">Create new product</h5>
                        <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group mr-sm-2">
                            <label>Name</label>
                            <input
                                id="productName"
                                type="text"
                                ref={(input) => { this.productName = input }}
                                className="form-control"
                                placeholder="Product Name"
                                required />
                            </div>
                            <div className="form-group mr-sm-2">
                            <label>Price</label>
                            <input
                                id="productPrice"
                                type="text"
                                ref={(input) => { this.productPrice = input }}
                                className="form-control"
                                placeholder="Product Price"
                                required />
                            </div>
                        </div>
                        <div className="modal-footer">
                        <button type="submit" className="btn btn-primary bcbtn">Add Product</button>
                        </div>
                        </form>
                    </div>
                    </div>
                </div>
          <div className="row">
            {this.state.productsData.map((product, index) => {
              return (
                <div className="col-md-3" key={product.id}>
                  <div className="product-item">
                    <div className="product-item__thumb">
                      <img src="./assets/placeholder.png" />
                    </div>
                    <div className="product-item__meta">
                      <div className="product-item__title">{product.name}</div>
                      <div className="product-item__address">
                        {product.product_address}
                      </div>
                      <div className="product-item__footer">
                        <div className="product-item__price">
                          <strong>{product.price}</strong>
                          TOKEN
                        </div>
                        <div className="product-item__buy">
                          {!product.is_purchase ? (
                            <div>
                            <button
                              name={parseInt(product.product_id)}
                              db_id={parseInt(product.id)}
                              value={product.price}
                              onClick={(event) => {
                                this.props.purchaseProductByToken(
                                  event.target.name,
                                  product.id,
                                  event.target.value,
                                  product.product_owner
                                );
                              }}
                              className="purchase ml-2"
                            >
                              <i className="fas fa-shopping-cart mr-1"></i> Buy
                            </button>
                          </div>
                            
                          ) : (
                            <button className="purchase sold-out">
                              Sold Out
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
}

export default ListProduct;
