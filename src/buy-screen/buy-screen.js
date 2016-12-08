import React from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import Balance from './balance';
import SignUpForm from './sign-up-form';
import TopUpForm from './top-up-form';
import ChosenProduct from './chosen-product';
import BuyButton from './buy-button';
import ErrorMessage from './error-message';
import mockApi from '../mock-api';

class BuyScreen extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isSignedUp: false,
      balance: 0,
      emailAddress: '',
      showModal: false
    };

    this.handleSignUpFormSubmit = this.handleSignUpFormSubmit.bind(this);
    this.handleTopUpFormSubmit = this.handleTopUpFormSubmit.bind(this);
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
  }

  handleSignUpFormSubmit(emailAddress) {
    // TODO magic links etc
    // TODO handle failure - use promises like we do with the top up submit 
    const isRegistered = mockApi.isEmailAddressRegistered(emailAddress);
    if (!isRegistered) {
      mockApi.createAccount(emailAddress);
    }
    const balance = mockApi.getBalance(emailAddress);

    this.setState({
      isSignedUp: true,
      balance: balance,
      emailAddress: emailAddress,
      showModal: false
    });
  }

  handleTopUpFormSubmit(topUpAmount, cardDetails) {
    mockApi.topUpAccount(topUpAmount, cardDetails).then((result) => {
      this.setState({
        isSignedUp: this.state.isSignedUp,
        balance: this.state.balance + topUpAmount,
        emailAddress: this.state.emailAddress,
        showModal: false
      });
    }, (err) => {
      this.open();
    });
  }

  isBuyButtonActive(isSignedUp, balance, productPrice) {
    return isSignedUp && balance >= productPrice;
  }

  open() {
    this.setState({
      isSignedUp: false,
      balance: 0,
      emailAddress: '',
      showModal: true
    });
  }

  close() {
    this.setState({
      isSignedUp: false,
      balance: 0,
      emailAddress: '',
      showModal: false
    })
  }

  render() {
    const isSignedUp = this.state.isSignedUp;
    const chosenProductID = Number(this.props.params.productId);
    const chosenProduct = mockApi.getProduct(chosenProductID);
    const isBuyButtonActive = this.isBuyButtonActive(this.state.isSignedUp, this.state.balance, chosenProduct.price);
    const topUpErrorTitle = 'Top Up Failed';
    const topUpErrorMessage = 'Sorry, there was a problem topping up your account. Please try again.';

    return (
      <div>
        <Grid>

          <Row>
            <Col xs={12}>
              {isSignedUp
                ? <Balance balance={this.state.balance} emailAddress={this.state.emailAddress}/>
                : <SignUpForm handleEmailAddressSubmit={this.handleSignUpFormSubmit}/>
              }
            </Col>
          </Row>

          {isSignedUp &&
            <Row>
              <Col xs={12}>
                <TopUpForm handleTopUpFormSubmit={this.handleTopUpFormSubmit} />
              </Col>
            </Row>
          }

          <Row>
            <Col xs={12}>
              <ChosenProduct product={chosenProduct}/>
            </Col>
          </Row>

          <Row>
            <Col xs={12}>
              <BuyButton active={isBuyButtonActive}/>
            </Col>
          </Row>

        </Grid>

        <ErrorMessage show={this.state.showModal} onClose={this.close} title={topUpErrorTitle} message={topUpErrorMessage}/>
      </div>
    );
  }
}

export default BuyScreen;
